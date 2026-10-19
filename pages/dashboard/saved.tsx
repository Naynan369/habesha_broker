import { ArrowBackIcon } from "@chakra-ui/icons";
import { Alert, Box, Button, Flex, Grid, Heading, IconButton, Text, useColorModeValue } from "@chakra-ui/react";
import { Item } from "@components/dashboard/itemList/Item";
import { ItemLoader } from "@components/dashboard/itemList/ItemLoader";
import { ColorModeToggle } from "@components/shared/ColorModeToggle";
import { withSessionSsr } from "@config/cookie/cookie";
import { MyTheme } from "@config/theme/MyTheme";
import { useFetch } from "@libs/hooks/useFetch";
import { useUser } from "@libs/store";
import axios from "axios";
import Head from "next/head";
import { useRouter } from "next/router";
import React from "react";
import Link from "next/link";
import { MdArrowForward, MdFavoriteBorder } from "react-icons/md";
import { useLang } from "@libs/hooks/useLang";

export const getServerSideProps = withSessionSsr(async ({ req, locale }) => {
	const user = req.user;
	if (!user) {
		return {
			redirect: {
				destination: locale === "am" ? "/am/auth/login/" : "/auth/login/",
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

export default function SavedItems({ user }) {
	const router = useRouter();
	const copy = useLang().savedPage;
	const [page, setPage] = React.useState(0);
	const pageText = useLang().explore;
	const pageBg = useColorModeValue("#f5f5f1", "#000000");
	const surface = useColorModeValue("white", "#0c0c0c");
	const border = useColorModeValue("gray.200", "whiteAlpha.200");
	const muted = useColorModeValue("gray.600", "gray.400");
	const emptyBg = useColorModeValue("white", "#0c0c0c");
	const emptyBorder = useColorModeValue("gray.200", "whiteAlpha.200");
	const emptyIconBg = useColorModeValue("orange.50", "rgba(233,183,92,.14)");
	const emptyIconColor = useColorModeValue("orange.700", "orange.200");
	const [data, loading, error] = useFetch({
		fetchFunction: () => axios.get(`/api/items/save?page=${page}`),
		dependencies: [page],
	});

	return (
		<>
			<Head>
				<title>{copy.pageTitle}</title>
			</Head>
			<Flex minH="100vh" bg={pageBg} direction="column">
				<Flex
					px={MyTheme.paddings.pagePadding}
					height={MyTheme.size.navbarHeightCompact}
					alignItems="center"
					boxShadow="sm"
					bg={surface}
					borderBottom="1px solid"
					borderColor={border}
				>
					<IconButton
						mr={{ base: 2, sm: 5 }}
						boxSize="40px"
						aria-label={copy.back}
						onClick={() => router.back()}
					>
						<ArrowBackIcon />
					</IconButton>
						<Heading minW="0" noOfLines={1} fontSize={{ base: "sm", sm: "md" }}>{copy.heading}</Heading>
					<Box flex="1" />
					<ColorModeToggle />
				</Flex>
				<Flex
					flex="1"
					py={{ base: 7, md: 10 }}
					px={MyTheme.paddings.pagePadding}
					direction="column"
				>
					<Text mb="6" color={muted} fontSize="sm">{copy.description}</Text>
					<Grid templateColumns={{ base: "minmax(0, 1fr)", sm: "repeat(auto-fill, minmax(18rem, 1fr))" }} justifyContent="center" alignItems="stretch" gap={{ base: 5, md: 6 }}>
						{error ? (
							<Alert status="error" gridColumn="1 / -1" p="8" borderRadius="xl">{copy.loadError}</Alert>
						) : loading || !data ? (
							[...Array(6)].map((_, index) => <ItemLoader key={index} />)
						) : data.items?.length ? (
							data.items.map((savedItem) => (
								<Item
									key={savedItem.id}
									id={savedItem.item.id}
									title={savedItem.item.title}
									status={savedItem.item.status}
									date={savedItem.item.createdAt}
									itemType={savedItem.item.itemType}
									featured={savedItem.item.featured}
									ownerPhoto={savedItem.item.user.profile_url}
									ownerName={savedItem.item.user.firstName + " " + savedItem.item.user.lastName}
									photoURL={savedItem.item.images?.[0]}
									price={savedItem.item.price}
									priceFrequency={savedItem.item.BusinessSpace?.priceFrequency}
									serviceCategory={savedItem.item.Service?.category}
								/>
							))
						) : (
							<Flex gridColumn="1 / -1" minH="300px" align="center" justify="center" direction="column" textAlign="center" px="6" py="12" bg={emptyBg} border="1px solid" borderColor={emptyBorder} borderRadius="2xl" boxShadow="0 6px 22px rgba(21,42,44,.04)">
								<Box w="14" h="14" display="grid" placeItems="center" borderRadius="full" bg={emptyIconBg} color={emptyIconColor}><MdFavoriteBorder size="22" /></Box>
								<Heading mt="5" fontSize="lg">{copy.emptyTitle}</Heading>
								<Text mt="2" maxW="sm" color={muted}>{copy.emptyDescription}</Text>
								<Link legacyBehavior href="/explore" passHref><Button as="a" mt="6" colorScheme="orange" rightIcon={<MdArrowForward />}>{copy.exploreListings}</Button></Link>
							</Flex>
						)}
					</Grid>
					{!loading && data?.total > 30 && <Flex align="center" justify="space-between" direction={{ base: "column", sm: "row" }} gap="3" mt="5" px="2">
						<Button w={{ base: "full", sm: "auto" }} size="sm" variant="outline" isDisabled={page === 0} onClick={() => setPage((current) => Math.max(0, current - 1))}>{pageText.previousPage}</Button>
						<Text color={muted} fontSize="sm">{pageText.pageCounter.replace("{page}", String(page + 1)).replace("{pages}", String(Math.ceil(data.total / 30)))}</Text>
						<Button w={{ base: "full", sm: "auto" }} size="sm" colorScheme="orange" isDisabled={(page + 1) * 30 >= data.total} onClick={() => setPage((current) => current + 1)}>{pageText.nextPage}</Button>
					</Flex>}
				</Flex>
			</Flex>
		</>
	);
}
