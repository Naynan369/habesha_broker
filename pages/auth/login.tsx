import { Button, Flex, Heading, Text } from "@chakra-ui/react";
import Head from "next/head";
import Link from "next/link";
import styles from "@styles/Auth.module.scss";
import { useLang } from "@libs/hooks/useLang";
import { LoginForm } from "@components/auth/LoginForm";
import { withSessionSsr } from "@config/cookie/cookie";
import { ArrowLeftIcon } from "@chakra-ui/icons";

export const getServerSideProps = withSessionSsr(async ({ req }) => {
	const user = req.session.user;
	if (user) {
		return {
			redirect: {
				destination: user.role === "ADMIN" ? "/admin" : "/dashboard",
			},
			props: {},
		};
	}
	return {
		props: {},
	};
});

export default function Login() {
	const lang = useLang();

	return (
		<>
			<Head>
				<title>{lang.auth.login_title} </title>
			</Head>
			<Flex
				height={{ base: "auto", md: "100vh" }}
				minHeight="100vh"
				width={"100%"}
				direction={{ base: "column", md: "row" }}
				color={"maingray"}
			>
				<Flex
					className={styles.lgbg}
					boxShadow={"dark-lg"}
					flex={2}
				></Flex>
				<Flex
					p={{ base: "3", md: "0" }}
					pb="0"
					flex={4}
					direction={"column"}
					alignItems={"center"}
					justifyContent={"center"}
				>
					<Heading my="5" fontSize={"5xl"}>
						{lang.auth.login}
					</Heading>
					<LoginForm />
					<Link href={"/auth/sign_up"} passHref>
						<Button as="a" size="sm" variant="ghost" borderBottom="1px solid" borderColor="gray.300" color="maingray" mt="10" fontSize="sm">
							{lang.auth.create}
						</Button>
					</Link>
					<Flex
						mt={"10"}
						w="full"
						alignItems={"center"}
						justifyContent="center"
					>
						<Link href={"/"} passHref>
							<Button as="a" size="sm" leftIcon={<ArrowLeftIcon />} variant="ghost" color="mainorange" textTransform="uppercase" fontSize="sm">
								{lang.auth.home}
							</Button>
						</Link>
					</Flex>
				</Flex>
			</Flex>
		</>
	);
}
