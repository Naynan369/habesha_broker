import {
	Box,
	Button,
	Flex,
	FormControl,
	Heading,
	SimpleGrid,
} from "@chakra-ui/react";
import { AddCar } from "@components/dashboard/forms/AddCar";
import { HouseAddForm } from "@components/dashboard/forms/AddHouse";
import { AddBusinessSpace } from "@components/dashboard/forms/AddBusinessSpace";
import { AddService } from "@components/dashboard/forms/AddService";
import { useLang } from "@libs/hooks/useLang";
import { withSessionSsr } from "@config/cookie/cookie";
import { MyTheme } from "@config/theme/MyTheme";
import Head from "next/head";
import { useRouter } from "next/router";
import { FC, ReactNode, useState } from "react";
import { FaCar } from "react-icons/fa";
import { MdHomeWork, MdMiscellaneousServices, MdStorefront } from "react-icons/md";

type FormTypes = "HOUSE" | "CAR" | "BUSINESS_SPACE" | "SERVICE";

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
	if (!user.verfied) {
		return {
			redirect: {
				destination: "/dashboard/verify-account",
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

export default function AddItem({ user }) {
	const router = useRouter();
	const lang = useLang();
	const text = lang.businessListing;
	const [type, setType] = useState("" as FormTypes);

	const changeType = (type: FormTypes) => setType(type);

	return (
		<>
			<Head>
				<title>Add Item - Habesha Brokers</title>
			</Head>
			<Flex direction={"column"}>
				<Flex
					height={[
						MyTheme.size.navbarHeightCompact,
						null,
						MyTheme.size.navbarHeight,
					]}
					px={MyTheme.paddings.pagePadding}
					boxShadow="md"
					background={"maingray"}
					color="white"
					alignItems={"center"}
				>
					<Flex direction={"column"}>
						<Heading fontSize={"md"}>Habesha Brokers</Heading>
						<Heading
							color="mainyellow"
							textTransform={"uppercase"}
							fontSize={"xl"}
						>
							{text.addListing}
						</Heading>
					</Flex>
					<Box flex="1"></Box>
					<Button
						onClick={() => router.push("/dashboard")}
						colorScheme={"whiteAlpha"}
					>
						Cancel
					</Button>
				</Flex>
				<Flex
					color={"maingray"}
					py="10"
					px={MyTheme.paddings.pagePadding}
					direction={"column"}
				>
					<FormControl mb="10">
						<SimpleGrid columns={{ base: 2, md: 4 }} spacing="4" maxW="1100px" mx="auto" w="full">
							<ItemButton icon={<MdHomeWork size="22" />} text={text.homeCategory} type="HOUSE" changeType={changeType} selected={type === "HOUSE"} />
							<ItemButton icon={<FaCar size="22" />} text={text.carCategory} type="CAR" changeType={changeType} selected={type === "CAR"} />
							<ItemButton icon={<MdStorefront size="22" />} text={text.category} type="BUSINESS_SPACE" changeType={changeType} selected={type === "BUSINESS_SPACE"} />
							<ItemButton icon={<MdMiscellaneousServices size="22" />} text={lang.serviceListing.chooseCategory} type="SERVICE" changeType={changeType} selected={type === "SERVICE"} />
						</SimpleGrid>
					</FormControl>

					{type == "HOUSE" ? (
						<HouseAddForm user={user} />
					) : type == "CAR" ? (
						<AddCar user={user} />
					) : type === "BUSINESS_SPACE" ? (
						<AddBusinessSpace />
					) : type === "SERVICE" ? (
						<AddService />
					) : null}
				</Flex>
			</Flex>
		</>
	);
}
interface ItemButtonProps {
	icon: ReactNode;
	text: string;
	type: FormTypes;
	changeType: (type: FormTypes) => void;
	selected: boolean;
}
const ItemButton: FC<ItemButtonProps> = ({
	icon,
	text,
	type,
	changeType,
	selected,
}: ItemButtonProps) => (
	<Button
		type="button"
		aria-pressed={selected}
		onClick={() => changeType(type)}
		display="flex"
		flexDirection="column"
		gap="3"
		minW={{ base: "130px", md: "200px" }}
		minH={{ base: "120px", md: "150px" }}
		mx="0"
		py="6"
		bg={selected ? "maingray" : "white"}
		color={selected ? "mainyellow" : "maingray"}
		border="1px solid"
		borderColor={selected ? "mainorange" : "gray.200"}
		boxShadow={selected ? "lg" : "sm"}
		_hover={{ bg: "maingray", color: "mainyellow", borderColor: "mainorange", transform: "translateY(-2px)" }}
	>
		{icon}
		{text}
	</Button>
);
