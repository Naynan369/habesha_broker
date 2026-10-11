import { Box, Flex, Heading } from "@chakra-ui/layout";
import {
	Button,
	Checkbox,
	CheckboxGroup,
	filter,
	IconButton,
	Input,
	Menu,
	MenuButton,
	MenuItem,
	MenuList,
	Stack,
	VStack,
	useColorModeValue,
} from "@chakra-ui/react";
import { MyTheme } from "@config/theme/MyTheme";
import { Dispatch, SetStateAction, useState } from "react";
import { MdArrowDownward, MdSearch } from "react-icons/md";
import { ItemList } from "@components/dashboard/itemList/itemList";
import { withSessionSsr } from "@config/cookie/cookie";
import { useRouter } from "next/router";
import { ArrowBackIcon } from "@chakra-ui/icons";
import Head from "next/head";
import { ColorModeToggle } from "@components/shared/ColorModeToggle";

export const getServerSideProps = withSessionSsr(async ({ req }) => {
	const user = req.session.user;
	if (!user) {
		return {
			redirect: {
				destination: "/auth/login/",
			},
			props: {},
		};
	}
	return {
		props: {
			user,
		},
	};
});

export default function MyItemsList({ user }) {
	const [search, setSearch] = useState("");
	const [keyword, setKeyword] = useState("");
	const [filters, setFilters] = useState(["HOUSE", "CAR", "BUSINESS_SPACE", "SERVICE"]);
	const [orderBy, setOrderBy] = useState({
		createdAt: "desc",
	} as any);
	const router = useRouter();
	const pageBg = useColorModeValue("#f5f5f1", "#10191d");


	return (
		<>
			<Head>
				<title>List My Items - Habesha Brokers</title>
			</Head>
			<Flex minH="100vh" bg={pageBg} direction="column" justifyContent={"flex-start"}>
				{/* Navbar */}
				<Flex
					alignItems="center"
					minH={MyTheme.size.navbarHeight}
					px={MyTheme.paddings.pagePaddingArray}
					background={MyTheme.colors.maingray}
					color={"white"}
					mb="10"
				>
					<IconButton
						colorScheme={"whiteAlpha"}
						mr="5"
						aria-label="go-back"
						onClick={() => router.back()}
					>
						<ArrowBackIcon />
					</IconButton>
					<Flex direction={"column"}>
						<Heading fontSize={"lg"}>Habesha Brokers</Heading>
						<Heading
							fontSize={"xl"}
							color="mainyellow"
							textTransform="uppercase"
						>
							My Items
						</Heading>
					</Flex>
					<Box flex={1}></Box>
					<ColorModeToggle />
				</Flex>

				{/* Container */}
				<Flex
					flex="1"
					direction={"column"}
					justifyContent="flex-start"
					px={MyTheme.paddings.pagePadding}
				>
					<Flex direction={["column", null, "row"]} gap="3">
						<Input
							variant={"filled"}
							flex={[null, null, 1]}
							placeholder="Keyword to Search"
							value={search}
							onChange={(e) => setSearch(e.target.value)}
						></Input>
						<Button
							leftIcon={<MdSearch size="24px" />}
							colorScheme={"blue"}
							onClick={() => setKeyword(search)}
						>
							Search
						</Button>
					</Flex>

					{/* Filters */}
					<Flex
						alignItems={{ xs: "stretch", md: "center" }}
						my="8"
						direction={{ xs: "column", md: "row" }}
					>
						<Flex direction={"column"} flex={1}>
							<Stack direction={{ base: "column", sm: "row" }} wrap="wrap">
								<FilterButton
									setFilters={setFilters}
									filters={filters}
									value="HOUSE"
								/>
								<FilterButton
									setFilters={setFilters}
									filters={filters}
									value="CAR"
								/>
								<FilterButton
									setFilters={setFilters}
									filters={filters}
									value="BUSINESS_SPACE"
								/>
								<FilterButton
									setFilters={setFilters}
									filters={filters}
									value="SERVICE"
								/>
							</Stack>
						</Flex>
						<Menu>
							<MenuButton
								as={Button}
								size="sm"
								rightIcon={<MdArrowDownward />}
								variant="outline"
							>
								Order By
							</MenuButton>
							<MenuList>
								<MenuItem
									onClick={() =>
										setOrderBy({
											title: "asc",
										})
									}
								>
									A - Z
								</MenuItem>

								<MenuItem
									onClick={() =>
										setOrderBy({
											title: "desc",
										})
									}
								>
									Z - A
								</MenuItem>

								<MenuItem
									onClick={() =>
										setOrderBy({
											createdAt: "desc",
										})
									}
								>
									Newest
								</MenuItem>
								<MenuItem
									onClick={() =>
										setOrderBy({
											createdAt: "asc",
										})
									}
								>
									Oldest
								</MenuItem>
							</MenuList>
						</Menu>
					</Flex>

					<Flex my="10">
						<ItemList
							user={user}
							orderBy={orderBy}
							filters={filters}
							keyword={keyword}
						></ItemList>
					</Flex>
				</Flex>
			</Flex>
		</>
	);
}

interface IFilterButton {
	value: string;
	filters: string[];
	setFilter: Dispatch<SetStateAction<string[]>>;
}

function FilterButton({ filters, setFilters, value }) {
	const handleToggle = () => {
		if (filters.indexOf(value) !== -1) {
			setFilters(filters.filter((val: string) => val != value));
		} else {
			setFilters([...filters, value]);
		}
	};

	return (
		<Button
			colorScheme="blue"
			borderRadius={"50px"}
			size={"sm"}
			variant={filters.indexOf(value) !== -1 ? "solid" : "outline"}
			onClick={handleToggle}
		>
			{value === "BUSINESS_SPACE" ? "Business spaces" : value === "HOUSE" ? "Homes" : value === "SERVICE" ? "Services" : "Cars"}
		</Button>
	);
}
