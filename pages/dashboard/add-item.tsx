import {
	Box,
	Button,
	Flex,
	FormControl,
	Heading,
} from "@chakra-ui/react";
import { AddCar } from "@components/dashboard/forms/AddCar";
import { HouseAddForm } from "@components/dashboard/forms/AddHouse";
import { AddBusinessSpace } from "@components/dashboard/forms/AddBusinessSpace";
import { useLang } from "@libs/hooks/useLang";
import { withSessionSsr } from "@config/cookie/cookie";
import { MyTheme } from "@config/theme/MyTheme";
import Head from "next/head";
import { useRouter } from "next/router";
import { FC, ReactNode, useState } from "react";
import { FaCar, FaWarehouse } from "react-icons/fa";
import { MdStorefront } from "react-icons/md";

type FormTypes = "HOUSE" | "CAR" | "BUSINESS_SPACE";

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
	const text = useLang().businessListing;
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
						<Flex
							justifyContent={"center"}
							width={"full"}
							alignItems="center"
						>
							<ItemButton
								icon={<FaCar size={"18"} />}
								text={text.carCategory}
								type="CAR"
								changeType={changeType}
								selected={type == "CAR"}
							></ItemButton>
							<ItemButton
								icon={<FaWarehouse size={"18"} />}
								text={text.homeCategory}
								type="HOUSE"
								changeType={changeType}
								selected={type == "HOUSE"}
							></ItemButton>
						</Flex>
					</FormControl>

					{type == "HOUSE" ? (
						<HouseAddForm user={user} />
					) : type == "CAR" ? (
						<AddCar user={user} />
					) : type === "BUSINESS_SPACE" ? (
						<AddBusinessSpace />
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
