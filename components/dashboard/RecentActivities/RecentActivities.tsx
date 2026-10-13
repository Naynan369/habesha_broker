import {
	Alert,
	AlertDescription,
	AlertIcon,
	AlertTitle,
	Box,
	Text,
	Flex,
	Heading,
	useColorModeValue,
} from "@chakra-ui/react";
import { useFetch } from "@libs/hooks/useFetch";
import axios from "axios";
import { useRouter } from "next/router";
import { useLang } from "@libs/hooks/useLang";
import { RecentActivity, RecentActivityLoader } from "./RecentActivityLoader";

export const RecentActivities = () => {
	const dashboardText = useLang().dashboardPage;
	const { locale } = useRouter();
	const surface = useColorModeValue("white", "#0c0c0c");
	const border = useColorModeValue("gray.200", "whiteAlpha.200");
	const muted = useColorModeValue("gray.600", "gray.400");
	const [data, loading, error] = useFetch({
		fetchFunction: () => axios.get("/api/recentActions/"),
	});

	return (
		<Flex
			background={surface}
			border="1px solid"
			borderColor={border}
			boxShadow="0 8px 28px rgba(21,42,44,.06)"
			borderRadius="2xl"
			direction="column"
			flex="1"
			h="full"
			p={{ base: 5, md: 6 }}
		>
			<Heading mb="5" fontSize="lg" letterSpacing="-.02em">
				{dashboardText.recentActivities}
			</Heading>
			<Flex direction="column" flex="1">
				{loading && (
					<>
						<RecentActivityLoader />
						<RecentActivityLoader />
						<RecentActivityLoader />
						<RecentActivityLoader />
					</>
				)}

				{error && (
					<Alert status="error" p="8" borderRadius="xl" flexDirection="column" textAlign="center">
						<AlertIcon boxSize="36px" />{" "}
						<AlertTitle mt="4" mb="2">
							{dashboardText.activityErrorTitle}
						</AlertTitle>
						<AlertDescription>
							{dashboardText.activityErrorDescription}
						</AlertDescription>
					</Alert>
				)}

				{data && data.length > 0 &&
					data.map((activity) => (
						<RecentActivity
							key={activity.id}
							title={activity.item.title}
							action={activity.actionType}
							date={activity.actionTime}
							type={activity.item.itemType}
							status={activity.item.status}
							labels={dashboardText}
							locale={locale || "en"}
						/>
					))}
				{data && data.length === 0 && !loading && !error && (
					<Box flex="1" display="grid" placeItems="center" minH="180px" textAlign="center" px="4">
						<Box>
							<Text fontWeight="semibold">{dashboardText.noActivity}</Text>
							<Text mt="1" fontSize="sm" color={muted}>{dashboardText.noActivityDescription}</Text>
						</Box>
					</Box>
				)}
			</Flex>
		</Flex>
	);
};
