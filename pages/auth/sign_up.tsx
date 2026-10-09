import { Flex, Heading } from "@chakra-ui/react";
import { SignUpForm } from "@components/auth/SignUpForm";
import { withSessionSsr } from "@config/cookie/cookie";
import { useLang } from "@libs/hooks/useLang";
import styles from "@styles/Auth.module.scss";
import Head from "next/head";

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

export default function SignUp() {
	const lang = useLang();

	return (
		<>
			<Head>
				<title>{lang.auth.sign_title}</title>
			</Head>
			<Flex
				height={{ base: "auto", md: "100vh" }}
				minHeight="100vh"
				direction={{ base: "column", md: "row" }}
				color="maingray"
			>
				<Flex
					flex={5}
					direction="column"
					alignItems={"center"}
					justifyContent={"center"}
					p="5"
				>
					<Heading mb="16" fontSize={"5xl"}>
						{lang.auth.signUp}
					</Heading>
					<SignUpForm />
				</Flex>
				<Flex
					boxShadow={"dark-lg"}
					flex={2}
					className={styles.lgbg}
				></Flex>
			</Flex>
		</>
	);
}
