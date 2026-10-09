import {
	Alert,
	AlertDescription,
	AlertIcon,
	AlertTitle,
	Flex,
	Heading,
} from "@chakra-ui/react";
import { useFetch } from "@libs/hooks/useFetch";
import axios from "axios";
import { RecentActivity, RecentActivityLoader } from "./RecentActivityLoader";

export const RecentActivities = () => {
	const [data, loading, error] = useFetch({
		fetchFunction: () => axios.get("/api/recentActions/"),
	});

	return (
		<Flex
			background={"white"}
			boxShadow="md"
			borderRadius={"md"}
			direction="column"
			flex={"1"}
			p="5"
			mx={{ base: "0", md: "5" }}
			my={{ base: "5", md: "0" }}
		>
			<Heading mb="5" textTransform={"uppercase"} fontSize="xl">
				Recent Activities
			</Heading>
			<Flex direction={"column"}>
				{loading && (
					<>
						<RecentActivityLoader />
						<RecentActivityLoader />
						<RecentActivityLoader />
						<RecentActivityLoader />
						<RecentActivityLoader />
						<RecentActivityLoader />
						<RecentActivityLoader />
						<RecentActivityLoader />
					</>
				)}

				{error && (
					<Alert status="error" p="16" flexDirection={"column"}>
						<AlertIcon boxSize={"48px"} />{" "}
						<AlertTitle mt="8" mb="2">
							Problem Loading Recent Activities
						</AlertTitle>
						<AlertDescription>
							Check your internet connection, and try refreshing
							the page
						</AlertDescription>
					</Alert>
				)}

				{data &&
					data.map((activity) => (
						<RecentActivity
							key={activity.id}
							title={activity.item.title}
							action={activity.actionType}
							date={activity.actionTime}
							type={activity.item.itemType}
							iconColor="mainred"
							status={activity.item.status}
						/>
					))}
			</Flex>
		</Flex>
	);
};
