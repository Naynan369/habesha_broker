import { Alert, AlertDescription, AlertIcon, AlertTitle, Grid, Text } from "@chakra-ui/react";
import { useFetch } from "@libs/hooks/useFetch";
import { IUser } from "@libs/types/user";
import axios from "axios";
import { FC } from "react";
import { Item } from "./Item";
import { ItemLoader } from "./ItemLoader";

interface IItemsList {
	user: IUser;
	filters: string[];
	keyword: string;
	orderBy: any;
}

export const ItemList: FC<IItemsList> = ({ user, filters, keyword = "", orderBy }) => {
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
		<Grid justifyContent="center" columnGap="8" rowGap="8" templateColumns="repeat(auto-fill, minmax(18rem, 1fr))" w="full">
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
					/>
				))
			) : (
				<Text gridColumn="1 / -1" py="14" textAlign="center" color="gray.500">No listings match these filters yet.</Text>
			)}
		</Grid>
	);
};
