import {
	Alert,
	AlertDescription,
	AlertIcon,
	AlertTitle,
	Badge,
	Box,
	SkeletonCircle,
	SkeletonText,
	Text,
	Flex,
	Heading,
	useColorModeValue,
} from "@chakra-ui/react";
import { useFetch } from "@libs/hooks/useFetch";
import axios from "axios";
import { useRouter } from "next/router";
import { useLang } from "@libs/hooks/useLang";
import { dayjs } from "@config/dayjs";
import { FC } from "react";
import { MdCarRental, MdHouse, MdStorefront, MdMiscellaneousServices } from "react-icons/md";

export const RecentActivities = () => {
	const dashboardText = useLang().dashboardPage;
	const { locale } = useRouter();
	const surface = useColorModeValue("white", "#0c0c0c");
	const border = useColorModeValue("gray.200", "whiteAlpha.200");
	const muted = useColorModeValue("gray.600", "gray.400");
	const [data, loading, error] = useFetch({
		fetchFunction: () => axios.get("/api/recentActions/"),
	});
	const activities = Array.isArray(data) ? data.filter((activity) => activity.actionType !== "APPROVED") : [];

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

				{activities.length > 0 &&
					activities.map((activity) => (
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
				{data && activities.length === 0 && !loading && !error && (
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

interface IRecentActivity {
	labels: Record<string, string>;
	locale: string;
	title: string;
	action: string;
	type: "CAR" | "HOUSE" | "BUSINESS_SPACE" | "SERVICE";
	date: string;
	status: "PENDING" | "APPROVED" | "DECLINED" | "SOLD" | "CLOSED" | "RENTED";
}

const RecentActivity: FC<IRecentActivity> = ({ title, action, type, date, status, labels, locale }) => {
	const muted = useColorModeValue("gray.600", "gray.400");
	const iconBg = useColorModeValue("orange.50", "rgba(233,183,92,.14)");
	const iconColor = useColorModeValue("orange.700", "orange.200");
	const icon = type === "CAR" ? <MdCarRental fontSize="1.6em" /> : type === "BUSINESS_SPACE" ? <MdStorefront fontSize="1.6em" /> : type === "SERVICE" ? <MdMiscellaneousServices fontSize="1.6em" /> : <MdHouse fontSize="1.6em" />;
	const statusLabel = status === "DECLINED" ? labels.statusDeclined : status === "SOLD" ? labels.statusSold : status === "RENTED" ? labels.statusRented : status === "CLOSED" ? labels.statusClosed : labels.statusPending;
	const statusColor = status === "DECLINED" ? "red" : status === "SOLD" || status === "RENTED" ? "purple" : status === "CLOSED" ? "gray" : "orange";
	const actionLabel = action === "ADDED" ? labels.actionAdded : action === "SAVED" ? labels.actionSaved : action.replace(/_/g, " ").toLowerCase();

	return (
		<Flex alignItems="center" gap={{ base: 3, md: 4 }} py="3" borderBottom="1px solid" borderColor={useColorModeValue("gray.100", "whiteAlpha.100")}>
			<Flex w="11" h="11" flexShrink={0} borderRadius="xl" alignItems="center" justifyContent="center" background={iconBg} color={iconColor}>{icon}</Flex>
			<Flex direction="column" flex="1" minW="0">
				<Text noOfLines={1} fontSize="sm" fontWeight="semibold">{title}</Text>
				<Text noOfLines={1} fontSize="xs" color={muted} mt="1">{actionLabel} · {dayjs(date).locale(locale).fromNow()}</Text>
			</Flex>
			{status !== "APPROVED" && <Badge flexShrink={0} colorScheme={statusColor} variant="subtle" borderRadius="full" px="2.5" py="1" fontSize="xs">{statusLabel}</Badge>}
		</Flex>
	);
};

const RecentActivityLoader = () => (
	<Flex alignItems="center" gap="4" py="3" borderBottom="1px solid" borderColor={useColorModeValue("gray.100", "whiteAlpha.100")}>
		<SkeletonCircle size="11" />
		<Flex direction="column" flex="1">
			<SkeletonText height="5" width="50%" noOfLines={1} />
			<SkeletonText noOfLines={1} width="20%" />
		</Flex>
		<SkeletonText noOfLines={1} w="16" />
	</Flex>
);
