import { ArrowBackIcon } from "@chakra-ui/icons";
import { Alert, Flex, Grid, Heading, IconButton, Text } from "@chakra-ui/react";
import { Item } from "@components/dashboard/itemList/Item";
import { ItemLoader } from "@components/dashboard/itemList/ItemLoader";
import { withSessionSsr } from "@config/cookie/cookie";
import { MyTheme } from "@config/theme/MyTheme";
import { useFetch } from "@libs/hooks/useFetch";
import { useUser } from "@libs/store";
import axios from "axios";
import Head from "next/head";
import { useRouter } from "next/router";
import React from "react";

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

export default function SavedItems({ user }) {
	const router = useRouter();
	const [data, loading, error] = useFetch({
		fetchFunction: () => axios.get("/api/items/save"),
	});

	return (
		<>
			<Head>
				<title>Saved Items - Habesha Brokers</title>
			</Head>
			<Flex direction="column">
				<Flex
					px={MyTheme.paddings.pagePadding}
					height={MyTheme.size.navbarHeightCompact}
					alignItems="center"
					boxShadow="md"
				>
					<IconButton
						mr="5"
						boxSize="40px"
						aria-label="Back"
						onClick={() => router.back()}
					>
						<ArrowBackIcon />
					</IconButton>
					<Heading size="md">Saved Items</Heading>
				</Flex>
				<Flex
					py="5"
					mt="5"
					px={MyTheme.paddings.pagePadding}
					direction="column"
				>
					<Grid templateColumns="repeat(auto-fill, minmax(18rem, 1fr))" justifyContent="center" gap="8">
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
								/>
							))
						) : (
							<Text gridColumn="1 / -1" py="14" textAlign="center" color="gray.500">You have not saved any listings yet.</Text>
						)}
					</Grid>
				</Flex>
			</Flex>
		</>
	);
}
