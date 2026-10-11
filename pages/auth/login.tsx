import { Box, Button, Flex, Heading, Text, useColorModeValue } from "@chakra-ui/react";
import Head from "next/head";
import Link from "next/link";
import { useLang } from "@libs/hooks/useLang";
import { LoginForm } from "@components/auth/LoginForm";
import { AuthPageLayout } from "@components/auth/AuthPageLayout";
import { withSessionSsr } from "@config/cookie/cookie";

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
	const headingColor = useColorModeValue("#143A45", "#e7eff0");
	const mutedColor = useColorModeValue("gray.600", "gray.300");

	return (
		<>
			<Head>
				<title>{lang.auth.login_title}</title>
				<meta name="description" content={lang.auth.login_description} />
			</Head>
			<AuthPageLayout>
				<Box mb="8">
					<Heading fontSize={{ base: "3xl", md: "4xl" }} color={headingColor} letterSpacing="-0.035em">
						{lang.auth.login}
					</Heading>
					<Text mt="3" color={mutedColor} lineHeight="1.7">
						{lang.auth.login_description}
					</Text>
				</Box>
				<LoginForm />
				<Flex mt="8" align="center" gap="2" fontSize="sm" color={mutedColor}>
					<Text>{lang.auth.new_to}</Text>
					<Link href="/auth/sign_up" passHref>
						<Button as="a" size="sm" variant="link" color="mainorange" fontWeight="700">
							{lang.auth.create}
						</Button>
					</Link>
				</Flex>
			</AuthPageLayout>
		</>
	);
}
