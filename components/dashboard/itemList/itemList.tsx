import { Alert, AlertDescription, AlertIcon, AlertTitle, Box, Button, Flex, Grid, Heading, Text, useColorModeValue } from "@chakra-ui/react";
import { useFetch } from "@libs/hooks/useFetch";
import { IUser } from "@libs/types/user";
import axios from "axios";
import { FC } from "react";
import Link from "next/link";
import { MdAdd } from "react-icons/md";
import { Item } from "./Item";
import { ItemLoader } from "./ItemLoader";

interface IItemsList {
	user: IUser;
	filters: string[];
	keyword: string;
	orderBy: any;
}

export const ItemList: FC<IItemsList> = ({ user, filters, keyword = "", orderBy }) => {
	const muted = useColorModeValue("gray.500", "gray.400");
	const surface = useColorModeValue("white", "#17262b");
	const border = useColorModeValue("gray.200", "whiteAlpha.200");
	const heading = useColorModeValue("maingray", "gray.100");
	const emptyIconBg = useColorModeValue("orange.50", "rgba(233,183,92,.14)");
	const emptyIconColor = useColorModeValue("orange.700", "orange.200");
	const [data, loading, error] = useFetch({
		fetchFunction: () => axios.post("/api/items/", {
			orderBy,
			title: { contains: keyword },
			userId: user.id,
			itemType: { in: filters },
		}),
		dependencies: [...filters, orderBy, keyword],
	});

	if (error) {
		return (
			<Alert status="error" p="10" flexDirection="column" borderRadius="xl">
				<AlertIcon boxSize="40px" />
				<AlertTitle mt="5" mb="2">Problem loading your listings</AlertTitle>
				<AlertDescription>Check your connection and try again.</AlertDescription>
			</Alert>
		);
	}

	return (
		<Grid justifyContent="center" columnGap={{ base: 4, md: 6 }} rowGap={{ base: 4, md: 6 }} templateColumns={{ base: "minmax(0, 1fr)", sm: "repeat(auto-fill, minmax(18rem, 1fr))" }} w="full">
			{loading || !data ? (
				[...Array(6)].map((_, index) => <ItemLoader key={index} />)
			) : data.length ? (
				data.map((item) => (
					<Item
						key={item.id}
						id={item.id}
						title={item.title}
						date={item.createdAt}
						photoURL={item.images?.[0]}
						ownerName={user.firstName + " " + user.lastName}
						ownerPhoto={user.profile_url}
						price={item.price}
						itemType={item.itemType}
						priceFrequency={item.BusinessSpace?.priceFrequency}
						serviceCategory={item.Service?.category}
						featured={item.featured}
						status={item.status}
						paymentStatus={item.paymentStatus}
					/>
				))
			) : (
				<Flex gridColumn="1 / -1" minH="300px" align="center" justify="center" direction="column" textAlign="center" px="6" py="12" bg={surface} border="1px solid" borderColor={border} borderRadius="2xl" boxShadow="0 6px 22px rgba(21,42,44,.04)">
					<Box w="14" h="14" display="grid" placeItems="center" borderRadius="full" bg={emptyIconBg} color={emptyIconColor}>
						<MdAdd size="22" />
					</Box>
					<Heading mt="5" size="md" color={heading}>
						{keyword ? "No matching listings" : filters.length ? "Your listings will appear here" : "Choose a category"}
					</Heading>
					<Text mt="2" maxW="sm" color={muted}>
						{keyword
							? "Try another search term or clear the search field."
							: filters.length
								? "Create a listing to start managing its details and publication status here."
								: "Select at least one category above to view your listings."}
					</Text>
					{!keyword && filters.length > 0 && (
						<Link href="/dashboard/add-item" passHref>
							<Button as="a" mt="6" colorScheme="orange" borderRadius="xl" leftIcon={<MdAdd />}>Create listing</Button>
						</Link>
					)}
				</Flex>
			)}
		</Grid>
	);
};
