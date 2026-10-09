import {
	Alert,
	AlertDescription,
	AlertIcon,
	Button,
	Flex,
	Input,
		Text,
} from "@chakra-ui/react";
import { MyTheme } from "@config/theme/MyTheme";
import { useFetch } from "@libs/hooks/useFetch";
import { useFilter } from "@libs/store";
import { organizeFilters } from "@libs/store/useFilter";
import axios from "axios";
import Head from "next/head";
import { useRouter } from "next/router";
import { useRef, useState } from "react";
import { MdSearch } from "react-icons/md";
import { FilterNav } from "@components/explore/FilterNav";
import { Navbar } from "@components/explore/Navbar";
import { ItemCard, ItemLoader } from "@components/explore/ItemCard";
import { withSessionSsr } from "@config/cookie/cookie";

export const getServerSideProps = withSessionSsr(async ({ req, params }) => {
	const user = req.session.user;
	let keyword = params?.keyword ? params.keyword[0] : "";
	if (!user) {
		return {
			props: {
				user: null,
				keyword,
			},
		};
	}
	return {
		props: {
			user,
			keyword,
		},
	};
});

export default function ExplorePage({ user, keyword }) {
	const [search, setSearch] = useState(keyword);
	const [currentFilters, setCurrentFilters] = useState(null as any);
	const inputRef = useRef(null);
	const filter = useFilter();
	const router = useRouter();

	const [data, loading, error] = useFetch({
		fetchFunction: () =>
			axios.post("/api/items", {
				title: {
					startsWith: search,
				},
				...organizeFilters(filter),
			}),
		dependencies: [search, currentFilters],
	});

	const applyFilters = () => {
		setCurrentFilters(filter);
	};

	return (
		<>
			<Head>
				<title>Explore - Habesha Brokers</title>
			</Head>
			<div>
				<Navbar user={user} />
				<Flex
					direction={["column", null, "row"]}
					px={MyTheme.paddings.pagePadding}
					py="10"
					gap={"5%"}
				>
					<FilterNav applyFilters={applyFilters} />

					<Flex direction="column" flex={"3"}>
						<Flex gap={"2"}>
							<Input
								ref={inputRef}
								variant={"filled"}
								placeholder="Search keyword"
								defaultValue={keyword}
							/>
							<Button
								onClick={() => {
									const term = (inputRef.current?.value || "").trim();
									setSearch(term);
									router.push(term ? "/explore/" + encodeURIComponent(term) : "/explore");
								}}
								leftIcon={<MdSearch size="20px" />}
								colorScheme="blue"
							>
								Search
							</Button>
						</Flex>
						<Text
							my={"4"}
							color="gray.500"
							fontWeight={"bold"}
							textTransform="uppercase"
						>
							{data?.length || 0} ITEMS FOUND
						</Text>
						<Flex as="main" direction="column">
							{error ? (
								<Alert status="error" borderRadius="lg">
									<AlertIcon />
									<AlertDescription>Could not load listings. Please refresh and try again.</AlertDescription>
								</Alert>
							) : loading || !data ? (
								[...Array(3)].map((_, index) => <ItemLoader key={index} />)
							) : data.length ? (
								data.map((item) => (
									<ItemCard
										key={item.id}
										id={item.id}
										title={item.title}
										date={item.createdAt}
										photoURL={item.images?.[0]}
										ownerName={item.user.firstName + " " + item.user.lastName}
										ownerPhoto={item?.user?.profile_url}
										price={item.price}
										itemType={item.itemType}
										featured={item.featured}
										status={item.status}
									/>
								))
							) : (
								<Flex align="center" justify="center" direction="column" bg="white" borderRadius="2xl" border="1px solid" borderColor="gray.100" p={{ base: 8, md: 12 }} mt="6">
									<Text fontWeight="bold" color="maingray" fontSize="lg">No listings found</Text>
									<Text color="gray.500" mt="2" textAlign="center">Try a different keyword or adjust your filters.</Text>
								</Flex>
							)}
						</Flex>
					</Flex>
				</Flex>
			</div>
		</>
	);
}
