import { ArrowBackIcon } from "@chakra-ui/icons";
import { Alert, Box, Button, Container, Flex, Grid, Heading, IconButton, Text, useColorModeValue } from "@chakra-ui/react";
import { Item } from "@components/dashboard/itemList/Item";
import { ItemLoader } from "@components/dashboard/itemList/ItemLoader";
import { BrandLogo } from "@components/shared/BrandLogo";
import { ColorModeToggle } from "@components/shared/ColorModeToggle";
import { withSessionSsr } from "@config/cookie/cookie";
import { MyTheme } from "@config/theme/MyTheme";
import { useFetch } from "@libs/hooks/useFetch";
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
	const pageBg = useColorModeValue("#f4f5f2", "#050707");
	const muted = useColorModeValue("#637278", "#a5b1b4");
	const emptyBg = useColorModeValue("#ffffff", "#101415");
	const emptyBorder = useColorModeValue("#dce3e1", "whiteAlpha.200");
	const emptyIconBg = useColorModeValue("#fbf1df", "rgba(233,183,92,.12)");
	const emptyIconColor = useColorModeValue("#9b6522", "#f0c978");
	const [data, loading, error] = useFetch({
		fetchFunction: () => axios.get(`/api/items/save?page=${page}`),
		dependencies: [page],
	});

	return (
		<>
			<Head>
				<title>{copy.pageTitle}</title>
			</Head>
			<Flex className="dashboard-page-enter" minH="100dvh" bg={pageBg} direction="column">
				<Flex
					position="sticky"
					top="0"
					zIndex="20"
					height={MyTheme.size.navbarHeightCompact}
					px={{ base: 4, md: 8, xl: 12 }}
					alignItems="center"
					boxShadow="0 12px 34px rgba(4,16,19,.18)"
					bg="#102f37"
					color="white"
					borderBottom="1px solid"
					borderColor="whiteAlpha.200"
				>
					<Container maxW="1500px" px="0">
						<Flex align="center" w="full">
							<IconButton mr={{ base: 3, md: 5 }} boxSize="40px" colorScheme="whiteAlpha" borderRadius="xl" aria-label={copy.back} onClick={() => router.back()} _hover={{ bg: "whiteAlpha.200", transform: "translateX(-2px)" }}>
								<ArrowBackIcon />
							</IconButton>
							<Box minW="0"><BrandLogo compact /></Box>
							<Box flex="1" />
							<ColorModeToggle />
						</Flex>
					</Container>
				</Flex>
				<Container flex="1" maxW="1500px" py={{ base: 6, md: 10, xl: 12 }} px={{ base: 4, md: 8, xl: 12 }}>
					<Flex className="dashboard-saved-hero" position="relative" overflow="hidden" align={{ base: "flex-start", md: "center" }} justify="space-between" gap="5" mb={{ base: 5, md: 7 }} p={{ base: 6, sm: 8, lg: 10 }} border="1px solid" borderColor="whiteAlpha.200" borderRadius={{ base: "2xl", md: "3xl" }} color="white" bgImage="radial-gradient(circle at 82% 10%, rgba(233,183,92,.22), transparent 27%), linear-gradient(125deg, #102f37 0%, #163d46 58%, #1b4449 100%)" boxShadow="0 26px 70px rgba(9,31,35,.18)">
						<Box position="relative" zIndex="1" maxW="3xl">
							<Heading as="h1" fontSize={{ base: "2xl", md: "4xl" }} letterSpacing="-.045em" lineHeight="1.1">{copy.heading}</Heading>
							<Text mt="3" color="whiteAlpha.800" fontSize={{ base: "sm", md: "md" }} lineHeight="1.7">{copy.description}</Text>
						</Box>
						<Flex aria-hidden="true" display={{ base: "none", sm: "flex" }} position="relative" align="center" justify="center" flexShrink={0} w="112px" h="112px" border="1px solid" borderColor="whiteAlpha.200" borderRadius="full" bg="whiteAlpha.50" boxShadow="inset 0 0 0 9px rgba(255,255,255,.025)">
							<Box w="58px" h="58px" display="grid" placeItems="center" borderRadius="xl" bg="rgba(233,183,92,.16)" color="#f0c978"><MdFavoriteBorder size="27" /></Box>
						</Flex>
						<Box aria-hidden="true" position="absolute" w="240px" h="240px" right={{ base: "-180px", md: "15%" }} bottom="-190px" border="1px solid" borderColor="whiteAlpha.100" borderRadius="full" boxShadow="0 0 0 28px rgba(255,255,255,.025), 0 0 0 58px rgba(255,255,255,.02)" />
					</Flex>
					<Grid className="dashboard-listings-grid" templateColumns={{ base: "minmax(0, 1fr)", sm: "repeat(auto-fill, minmax(18rem, 1fr))" }} justifyContent="center" alignItems="stretch" gap={{ base: 4, md: 6 }}>
						{error ? (
							<Alert status="error" gridColumn="1 / -1" p={{ base: 6, md: 8 }} borderRadius="2xl" border="1px solid" borderColor="red.200" boxShadow="0 12px 30px rgba(137,46,38,.08)">{copy.loadError}</Alert>
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
									listingIntent={savedItem.item.House?.type || savedItem.item.BusinessSpace?.type}
									serviceCategory={savedItem.item.Service?.category}
								/>
							))
						) : (
							<Flex gridColumn="1 / -1" minH={{ base: "280px", md: "340px" }} align="center" justify="center" direction="column" textAlign="center" px="6" py="12" bg={emptyBg} border="1px dashed" borderColor={emptyBorder} borderRadius="2xl" boxShadow="inset 0 0 0 6px rgba(128,145,145,.025)">
								<Box w="16" h="16" display="grid" placeItems="center" borderRadius="2xl" bg={emptyIconBg} color={emptyIconColor} boxShadow="0 10px 24px rgba(198,107,54,.10)"><MdFavoriteBorder size="24" /></Box>
								<Heading mt="5" fontSize="lg">{copy.emptyTitle}</Heading>
								<Text mt="2" maxW="sm" color={muted}>{copy.emptyDescription}</Text>
								<Link legacyBehavior href="/explore" passHref><Button as="a" mt="6" colorScheme="orange" rightIcon={<MdArrowForward />}>{copy.exploreListings}</Button></Link>
							</Flex>
						)}
					</Grid>
					{!loading && data?.total > 30 && <Flex align="center" justify="space-between" direction={{ base: "column", sm: "row" }} gap="3" mt="5" px="2">
						<Button w={{ base: "full", sm: "auto" }} size="sm" h="11" px="5" borderRadius="xl" variant="outline" isDisabled={page === 0} onClick={() => setPage((current) => Math.max(0, current - 1))}>{pageText.previousPage}</Button>
						<Text color={muted} fontSize="sm">{pageText.pageCounter.replace("{page}", String(page + 1)).replace("{pages}", String(Math.ceil(data.total / 30)))}</Text>
						<Button w={{ base: "full", sm: "auto" }} size="sm" h="11" px="5" borderRadius="xl" colorScheme="orange" isDisabled={(page + 1) * 30 >= data.total} onClick={() => setPage((current) => current + 1)}>{pageText.nextPage}</Button>
					</Flex>}
				</Container>
			</Flex>
		</>
	);
}
