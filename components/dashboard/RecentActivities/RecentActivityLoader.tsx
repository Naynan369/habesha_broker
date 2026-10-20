import { Badge, Flex, Text, SkeletonCircle, SkeletonText, useColorModeValue } from "@chakra-ui/react";
import { dayjs } from "@config/dayjs";
import { FC } from "react";
import {
	MdCarRental,
	MdHouse,
	MdStorefront,
	MdMiscellaneousServices,
} from "react-icons/md";

interface IRecentActivity {
	labels: Record<string, string>;
	locale: string;
	title: string;
	action: string;
	type: "CAR" | "HOUSE" | "BUSINESS_SPACE" | "SERVICE";
	date: string;
	status: "PENDING" | "APPROVED" | "DECLINED" | "SOLD" | "CLOSED";
}

export const RecentActivity: FC<IRecentActivity> = ({
	title,
	action,
	type,
	date,
	status,
	labels,
	locale,
}: IRecentActivity) => {
	const muted = useColorModeValue("gray.600", "gray.400");
	const iconBg = useColorModeValue("orange.50", "rgba(233,183,92,.14)");
	const iconColor = useColorModeValue("orange.700", "orange.200");
	const icon = type === "CAR" ? <MdCarRental fontSize="1.6em" /> : type === "BUSINESS_SPACE" ? <MdStorefront fontSize="1.6em" /> : type === "SERVICE" ? <MdMiscellaneousServices fontSize="1.6em" /> : <MdHouse fontSize="1.6em" />;
	const statusLabel = status === "APPROVED" ? labels.statusApproved : status === "DECLINED" ? labels.statusDeclined : status === "SOLD" ? labels.statusSold : status === "CLOSED" ? labels.statusClosed : labels.statusPending;
	const statusColor = status === "APPROVED" ? "green" : status === "DECLINED" ? "red" : status === "SOLD" ? "purple" : status === "CLOSED" ? "gray" : "orange";
	const actionLabel = action === "ADDED" ? labels.actionAdded : action === "SAVED" ? labels.actionSaved : action === "APPROVED" ? labels.actionApproved : action.replace(/_/g, " ").toLowerCase();

	return (
		<Flex
			alignItems="center"
			gap={{ base: 3, md: 4 }}
			py="3"
			borderBottom="1px solid"
			borderColor={useColorModeValue("gray.100", "whiteAlpha.100")}
		>
			<Flex
				w="11"
				h="11"
				flexShrink={0}
				borderRadius="xl"
				alignItems="center"
				justifyContent={"center"}
				background={iconBg}
				color={iconColor}
			>
				{icon}
			</Flex>
			<Flex direction="column" flex="1" minW="0">
				<Text noOfLines={1} fontSize="sm" fontWeight="semibold">{title}</Text>
				<Text noOfLines={1} fontSize="xs" color={muted} mt="1">
					{actionLabel} · {dayjs(date).locale(locale).fromNow()}
				</Text>
			</Flex>
			<Badge flexShrink={0} colorScheme={statusColor} variant="subtle" borderRadius="full" px="2.5" py="1" fontSize="xs">{statusLabel}</Badge>
		</Flex>
	);
};

export const RecentActivityLoader = () => {
	return (
		<Flex
			alignItems={"center"}
			gap="4"
			py="3"
			borderBottom="1px solid"
			borderColor={useColorModeValue("gray.100", "whiteAlpha.100")}
		>
			<SkeletonCircle size="11"></SkeletonCircle>
			<Flex direction={"column"} flex={"1"}>
				<SkeletonText
					height={"5"}
					width={"50%"}
					noOfLines={1}
				></SkeletonText>
				<SkeletonText noOfLines={1} width="20%"></SkeletonText>
			</Flex>
			<SkeletonText noOfLines={1} w="16" />
		</Flex>
	);
};
