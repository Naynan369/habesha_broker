import { Box, Heading, Text } from "@chakra-ui/react";
import { SignUpForm } from "@components/auth/SignUpForm";
import { AuthPageLayout } from "@components/auth/AuthPageLayout";
import { withSessionSsr } from "@config/cookie/cookie";
import { useLang } from "@libs/hooks/useLang";
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
				<meta name="description" content={lang.auth.signup_description} />
			</Head>
			<AuthPageLayout>
				<Box mb="7">
					<Heading fontSize={{ base: "3xl", md: "4xl" }} color="maingray" letterSpacing="-0.035em">
						{lang.auth.signUp}
					</Heading>
					<Text mt="3" color="gray.600" lineHeight="1.7">
						{lang.auth.signup_description}
					</Text>
				</Box>
				<SignUpForm />
			</AuthPageLayout>
		</>
	);
}
