import { Box, Heading, Text, useColorModeValue } from "@chakra-ui/react";
import { SignUpForm } from "@components/auth/SignUpForm";
import { AuthPageLayout } from "@components/auth/AuthPageLayout";
import { withSessionSsr } from "@config/cookie/cookie";
import { useLang } from "@libs/hooks/useLang";
import Head from "next/head";

export const getServerSideProps = withSessionSsr(async ({ req, locale }) => {
	const user = req.session.user;
	if (user) {
		return {
			redirect: {
				destination: (locale === "am" ? "/am" : "") + (user.role === "ADMIN" ? "/admin" : "/dashboard"),
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
	const headingColor = useColorModeValue("#143A45", "#e7eff0");
	const mutedColor = useColorModeValue("gray.600", "gray.300");

	return (
		<>
			<Head>
				<title>{lang.auth.sign_title}</title>
				<meta name="description" content={lang.auth.signup_description} />
			</Head>
			<AuthPageLayout>
				<Box mb="7">
					<Heading fontSize={{ base: "3xl", md: "4xl" }} color={headingColor} letterSpacing="-0.035em">
						{lang.auth.signUp}
					</Heading>
					<Text mt="3" color={mutedColor} lineHeight="1.7">
						{lang.auth.signup_description}
					</Text>
				</Box>
				<SignUpForm />
			</AuthPageLayout>
		</>
	);
}
