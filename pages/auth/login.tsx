import { Box, Button, Flex, Heading, Text, useColorModeValue } from "@chakra-ui/react";
import Head from "next/head";
import Link from "next/link";
import { useLang } from "@libs/hooks/useLang";
import { LoginForm } from "@components/auth/AuthForms";
import { AuthPageLayout } from "@components/auth/AuthPageLayout";
import { withSessionSsr } from "@config/cookie/cookie";

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

export default function Login() {
	const lang = useLang();
	const headingColor = useColorModeValue("#193539", "#f0f3f1");
	const mutedColor = useColorModeValue("#617276", "#a6b5b7");
	const borderColor = useColorModeValue("#dce3e0", "#344044");
	const linkColor = useColorModeValue("#a4532c", "#e1b57c");

	return (
		<>
			<Head>
				<title>{lang.auth.login_title}</title>
				<meta name="description" content={lang.auth.login_description} />
			</Head>
			<AuthPageLayout>
				<Box mb="8">
					<Text mb="3" color={linkColor} fontSize="xs" fontWeight="800" letterSpacing=".16em" textTransform="uppercase">{lang.auth.login_eyebrow}</Text>
					<Heading as="h1" fontSize={{ base: "2.35rem", sm: "3rem", xl: "3.4rem" }} color={headingColor} lineHeight="1.08" letterSpacing="-.055em">
						{lang.auth.login_heading}
					</Heading>
					<Text mt="4" color={mutedColor} lineHeight="1.7" fontSize={{ base: "sm", sm: "md" }}>
						{lang.auth.login_description}
					</Text>
				</Box>
				<LoginForm />
				<Flex mt="8" pt="6" borderTop="1px solid" borderColor={borderColor} align="center" justify="center" wrap="wrap" gap="2" fontSize="sm" color={mutedColor}>
					<Text>{lang.auth.new_to}</Text>
					<Link legacyBehavior href="/auth/sign_up" passHref>
						<Button as="a" size="sm" variant="link" color={linkColor} fontWeight="700" _hover={{ color: linkColor, textDecoration: "underline" }}>
							{lang.auth.create}
						</Button>
					</Link>
				</Flex>
			</AuthPageLayout>
		</>
	);
}
