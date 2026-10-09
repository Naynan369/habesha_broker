import { Box, Button, Flex, Heading, Text } from "@chakra-ui/react";
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

	return (
		<>
			<Head>
				<title>{lang.auth.login_title}</title>
				<meta name="description" content={lang.auth.login_description} />
			</Head>
			<AuthPageLayout>
				<Box mb="8">
					<Heading fontSize={{ base: "3xl", md: "4xl" }} color="maingray" letterSpacing="-0.035em">
						{lang.auth.login}
					</Heading>
					<Text mt="3" color="gray.600" lineHeight="1.7">
						{lang.auth.login_description}
					</Text>
				</Box>
				<LoginForm />
				<Flex mt="8" align="center" gap="2" fontSize="sm" color="gray.600">
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
