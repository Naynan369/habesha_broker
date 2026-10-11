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

export const getServerSideProps = withSessionSsr(async ({ req, locale }) => {
	const user = req.session.user;
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
	const pageBg = useColorModeValue("#f5f5f1", "#10191d");
	const surface = useColorModeValue("white", "#17262b");
	const border = useColorModeValue("gray.200", "whiteAlpha.200");
	const muted = useColorModeValue("gray.600", "gray.400");
	const emptyBg = useColorModeValue("white", "#17262b");
	const emptyBorder = useColorModeValue("gray.200", "whiteAlpha.200");
	const emptyIconBg = useColorModeValue("orange.50", "rgba(233,183,92,.14)");
	const emptyIconColor = useColorModeValue("orange.700", "orange.200");
	const [data, loading, error] = useFetch({
		fetchFunction: () => axios.get("/api/items/save"),
	});

	return (
		<>
			<Head>
				<title>Saved Items - Habesha Brokers</title>
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
						mr="5"
						boxSize="40px"
						aria-label="Back"
						onClick={() => router.back()}
					>
						<ArrowBackIcon />
					</IconButton>
						<Heading size="md">Saved listings</Heading>
					<Box flex="1" />
					<ColorModeToggle />
				</Flex>
				<Flex
					flex="1"
					py={{ base: 7, md: 10 }}
					px={MyTheme.paddings.pagePadding}
					direction="column"
				>
					<Text mb="6" color={muted} fontSize="sm">The homes, vehicles, spaces, and services you save are collected here.</Text>
					<Grid templateColumns={{ base: "minmax(0, 1fr)", sm: "repeat(auto-fill, minmax(18rem, 1fr))" }} justifyContent="center" alignItems="stretch" gap={{ base: 5, md: 6 }}>
						{error ? (
							<Alert status="error" gridColumn="1 / -1" p="8" borderRadius="xl">Could not load saved listings. Please refresh and try again.</Alert>
						) : loading || !data ? (
							[...Array(6)].map((_, index) => <ItemLoader key={index} />)
						) : data.length ? (
							data.map((savedItem) => (
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
								<Heading mt="5" fontSize="lg">Your shortlist starts here</Heading>
								<Text mt="2" maxW="sm" color={muted}>Save listings you like and come back to compare them whenever you are ready.</Text>
								<Link href="/explore" passHref><Button as="a" mt="6" colorScheme="orange" rightIcon={<MdArrowForward />}>Explore listings</Button></Link>
							</Flex>
						)}
					</Grid>
				</Flex>
			</Flex>
		</>
	);
}
