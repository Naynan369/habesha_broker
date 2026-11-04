import { Box, Heading, Text, useColorModeValue } from "@chakra-ui/react";
import { SignUpForm } from "@components/auth/AuthForms";
import { AuthPageLayout } from "@components/auth/AuthPageLayout";
import { withSessionSsr } from "@config/cookie/cookie";
import { useLang } from "@libs/hooks/useLang";
import Head from "next/head";

export const getServerSideProps = withSessionSsr(async ({ req, locale }) => {
	const user = req.user;
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
	const headingColor = useColorModeValue("#193539", "#f0f3f1");
	const mutedColor = useColorModeValue("#617276", "#a6b5b7");
	const accentColor = useColorModeValue("#a4532c", "#e1b57c");

	return (
		<>
			<Head>
				<title>{lang.auth.sign_title}</title>
				<meta name="description" content={lang.auth.signup_description} />
			</Head>
			<AuthPageLayout>
				<Box mb="8">
					<Text mb="3" color={accentColor} fontSize="xs" fontWeight="800" letterSpacing=".16em" textTransform="uppercase">{lang.auth.signup_eyebrow}</Text>
					<Heading as="h1" fontSize={{ base: "2.35rem", sm: "3rem", xl: "3.4rem" }} color={headingColor} lineHeight="1.08" letterSpacing="-.055em">
						{lang.auth.signup_heading}
					</Heading>
					<Text mt="4" color={mutedColor} lineHeight="1.7" fontSize={{ base: "sm", sm: "md" }}>
						{lang.auth.signup_description}
					</Text>
				</Box>
				<SignUpForm />
			</AuthPageLayout>
		</>
	);
}
