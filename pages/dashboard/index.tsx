import { Box, Flex, Text } from "@chakra-ui/react";
import { NavBar } from "@components/dashboard/Navbar";
import { Profile } from "@components/dashboard/Profile";
import { RecentActivities } from "@components/dashboard/RecentActivities/RecentActivities";
import { withSessionSsr } from "@config/cookie/cookie";
import { MyTheme } from "@config/theme/MyTheme";
import Head from "next/head";
import axios from "axios";
import { useUser } from "@libs/store";
import Link from "next/link";
import { useRouter } from "next/router";
import React, { FC, ReactNode } from "react";
import {
	MdAddShoppingCart,
	MdCheckCircle,
	MdListAlt,
	MdSave,
} from "react-icons/md";

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
	return {
		props: {
			user,
		},
	};
});

export default function Dashboard({ user }) {
	const router = useRouter();
	const logout = useUser((state) => state.logout);

	const handleLogout = async () => {
		logout();
		try {
			await axios.post("/api/user/logout");
		} finally {
			router.replace("/auth/login");
		}
	};

	return (
		<>
			<Head>
				<title>Dashboard - Habesha Brokers</title>
			</Head>
			<Flex
				background={"red.50"}
				height={{ base: "auto", md: "100vh" }}
				direction="column"
				justifyContent={"center"}
			>
				<NavBar logout={handleLogout} />
				<Flex
					flex={1}
					direction={"column"}
					color="maingray"
					px={MyTheme.paddings.pagePadding}
					py="10"
					overflowY={"auto"}
				>
					<Flex justifyContent={"center"}>
						{user.verfied ? (
							<>
								<ActionButton
									href="add-item"
									text="add item"
									icon={<MdAddShoppingCart size="100%" />}
								></ActionButton>

								<ActionButton
									href="list-my-items"
									text="List My Items"
									icon={<MdListAlt size="100%" />}
								></ActionButton>
							</>
						) : (
							<ActionButton
								href="verify-account"
								text="Verify Email Address"
								icon={<MdCheckCircle size="100%" />}
							></ActionButton>
						)}
						<ActionButton
							href="saved"
							text="Saved Items"
							icon={<MdSave size="100%" />}
						></ActionButton>
					</Flex>
					<Flex
						alignItems={{
							base: "stretch",
							md: "flex-start",
						}}
						direction={{ base: "column", md: "row" }}
						mt="10"
					>
						<Profile user={user} />

						<RecentActivities />
					</Flex>
				</Flex>
			</Flex>
		</>
	);
}

interface IActionButton {
	href: string;
	icon: ReactNode;
	text: string;
}
const ActionButton: FC<IActionButton> = ({ href, icon, text }) => {
	return (
		<Link href={`/dashboard/${href}`} passHref>
			<Flex
				background={"white"}
				mx="3"
				cursor={"pointer"}
				direction={["row", "column"]}
				alignItems={"center"}
				justifyContent="center"
				boxShadow={"2xl"}
				borderRadius="lg"
				p={["3", "8"]}
				color={"maingray"}
				_hover={{
					background: MyTheme.colors.mainorange,
					color: "white",
				}}
				transition="all 300ms"
				transitionTimingFunction={"ease-in-out"}
			>
				<Box boxSize={"10"}>{icon}</Box>
				<Text
					mt={["0", "4"]}
					textAlign={"center"}
					textTransform={"uppercase"}
				>
					{text}
				</Text>
			</Flex>
		</Link>
	);
};
