import { Alert, AlertDescription, AlertIcon, AlertTitle, Box, Button, Flex, Grid, Heading, Text, useColorModeValue } from "@chakra-ui/react";
import { useFetch } from "@libs/hooks/useFetch";
import { IUser } from "@libs/types/user";
import axios from "axios";
import { FC, useEffect, useState } from "react";
import Link from "next/link";
import { MdAdd } from "react-icons/md";
import { useLang } from "@libs/hooks/useLang";
import { Item } from "./Item";
import { ItemLoader } from "./ItemLoader";

interface IItemsList {
	user: IUser;
	paymentFee: number;
	paymentEnabled: boolean;
	filters: string[];
	keyword: string;
	orderBy: any;
	copy: any;
}

export const ItemList: FC<IItemsList> = ({ user, paymentFee, paymentEnabled, filters, keyword = "", orderBy, copy }) => {
	const [page, setPage] = useState(0);
	const pageText = useLang().explore;
	const filterKey = filters.join("|");
	const sortKey = JSON.stringify(orderBy);
	const muted = useColorModeValue("gray.500", "gray.400");
	const surface = useColorModeValue("white", "#0c0c0c");
	const border = useColorModeValue("gray.200", "whiteAlpha.200");
	const heading = useColorModeValue("maingray", "gray.100");
	const emptyIconBg = useColorModeValue("orange.50", "rgba(233,183,92,.14)");
	const emptyIconColor = useColorModeValue("orange.700", "orange.200");
	useEffect(() => setPage(0), [filterKey, keyword, sortKey]);
	const [data, loading, error] = useFetch({
		fetchFunction: () => axios.post(`/api/items?page=${page}`, {
			orderBy,
			keyword,
			userId: user.id,
			itemType: { in: filters },
		}),
		dependencies: [...filters, orderBy, keyword, page],
	});

	if (error) {
		return (
			<Alert status="error" p={{ base: 6, md: 10 }} flexDirection="column" borderRadius="2xl" border="1px solid" borderColor="red.200" boxShadow="0 12px 30px rgba(137,46,38,.08)">
				<AlertIcon boxSize="40px" />
				<AlertTitle mt="5" mb="2">Problem loading your listings</AlertTitle>
				<AlertDescription>Check your connection and try again.</AlertDescription>
			</Alert>
		);
	}

	return (
		<Grid className="dashboard-listings-grid" justifyContent="center" columnGap={{ base: 4, md: 6 }} rowGap={{ base: 4, md: 6 }} templateColumns={{ base: "minmax(0, 1fr)", sm: "repeat(auto-fill, minmax(18rem, 1fr))" }} w="full">
			{loading || !data ? (
				[...Array(6)].map((_, index) => <ItemLoader key={index} />)
			) : data.items?.length ? (
				data.items.map((item) => (
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
						listingIntent={item.House?.type || item.BusinessSpace?.type}
						serviceCategory={item.Service?.category}
						featured={item.featured}
						status={item.status}
						paymentStatus={item.paymentStatus}
						paymentFee={paymentFee}
						paymentEnabled={paymentEnabled}
						listingPayment={item.ListingPayments?.[0]}
					/>
				))
			) : (
				<Flex gridColumn="1 / -1" minH={{ base: "280px", md: "340px" }} align="center" justify="center" direction="column" textAlign="center" px="6" py="12" bg={surface} border="1px dashed" borderColor={border} borderRadius="2xl" boxShadow="inset 0 0 0 6px rgba(128,145,145,.025)">
					<Box w="16" h="16" display="grid" placeItems="center" borderRadius="2xl" bg={emptyIconBg} color={emptyIconColor} boxShadow="0 10px 24px rgba(198,107,54,.10)">
						<MdAdd size="22" />
					</Box>
					<Heading mt="5" size="md" color={heading}>
						{keyword ? copy.noMatchTitle : filters.length ? copy.noListingsTitle : copy.chooseCategoryTitle}
					</Heading>
					<Text mt="2" maxW="sm" color={muted}>
						{keyword
							? copy.noMatchDescription
							: filters.length
								? copy.noListingsDescription
								: copy.chooseCategoryDescription}
					</Text>
					{!keyword && filters.length > 0 && (
						<Link legacyBehavior href="/dashboard/add-item" passHref>
							<Button as="a" mt="6" colorScheme="orange" borderRadius="xl" leftIcon={<MdAdd />}>{copy.createListing}</Button>
						</Link>
					)}
				</Flex>
			)}
			{!loading && data?.total > 30 && <Flex gridColumn="1 / -1" align="center" justify="space-between" gap="3" mt="2">
				<Button size="sm" variant="outline" isDisabled={page === 0} onClick={() => setPage((current) => Math.max(0, current - 1))}>{pageText.previousPage}</Button>
				<Text color={muted} fontSize="sm">{pageText.pageCounter.replace("{page}", String(page + 1)).replace("{pages}", String(Math.ceil(data.total / 30)))}</Text>
				<Button size="sm" colorScheme="orange" isDisabled={(page + 1) * 30 >= data.total} onClick={() => setPage((current) => current + 1)}>{pageText.nextPage}</Button>
			</Flex>}
		</Grid>
	);
};
