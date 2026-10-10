import { Flex, Text, SkeletonCircle, SkeletonText } from "@chakra-ui/react";
import { dayjs } from "@config/dayjs";
import { FC, ReactNode } from "react";
import {
	MdCheck,
	MdTimelapse,
	MdSell,
	MdCarRental,
	MdHouse,
	MdStorefront,
	MdMiscellaneousServices,
} from "react-icons/md";

interface IRecentActivity {
	title: string;
	action: string;
	type: "CAR" | "HOUSE" | "BUSINESS_SPACE" | "SERVICE";
	iconColor: string;
	date: string;
	status: "PENDING" | "APPROVED" | "SOLD";
}

export const RecentActivity: FC<IRecentActivity> = ({
	title,
	action,
	type,
	iconColor,
	date,
	status,
}: IRecentActivity) => {
	const icon = type === "CAR" ? <MdCarRental fontSize="1.6em" /> : type === "BUSINESS_SPACE" ? <MdStorefront fontSize="1.6em" /> : type === "SERVICE" ? <MdMiscellaneousServices fontSize="1.6em" /> : <MdHouse fontSize="1.6em" />;

	return (
		<Flex
			alignItems={"center"}
			my="2"
			p="3"
			borderRadius={"md"}
			transition="all 300ms ease"
			_hover={{ background: "blackAlpha.100" }}
			cursor="pointer"
		>
			<Flex
				borderRadius={"full"}
				alignItems="center"
				justifyContent={"center"}
				background={iconColor}
				color={"white"}
				p="2"
				mr="5"
			>
				{icon}
			</Flex>
			<Flex direction={"column"} flex={"1"}>
				<Text fontSize={"lg"}>{title}</Text>
				<Text fontSize={"sm"} color="gray.600">
					{action} | {dayjs(date).fromNow()}
				</Text>
			</Flex>
			<Flex>
				{status == "APPROVED" && <MdCheck fontSize={"1.4em"}></MdCheck>}
				{status == "PENDING" && (
					<MdTimelapse fontSize={"1.4em"}></MdTimelapse>
				)}
				{status == "SOLD" && <MdSell fontSize={"1.4em"}></MdSell>}
			</Flex>
		</Flex>
	);
};

export const RecentActivityLoader = () => {
	return (
		<Flex
			alignItems={"center"}
			my="2"
			p="3"
			borderRadius={"md"}
			transition="all 300ms ease"
		>
			<SkeletonCircle size={"10"} mr="5"></SkeletonCircle>
			<Flex direction={"column"} flex={"1"}>
				<SkeletonText
					height={"5"}
					width={"50%"}
					noOfLines={1}
				></SkeletonText>
				<SkeletonText noOfLines={1} width="20%"></SkeletonText>
			</Flex>
			<Flex>
				<SkeletonCircle size={"5"}></SkeletonCircle>
			</Flex>
		</Flex>
	);
};
