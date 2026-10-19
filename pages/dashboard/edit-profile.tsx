import { ArrowBackIcon } from "@chakra-ui/icons";
import { Box, Flex, Heading, IconButton, SimpleGrid, useColorModeValue } from "@chakra-ui/react";
import { ChangePassword } from "@components/dashboard/editProfile/ChangePassword";
import { AccountManagement } from "@components/dashboard/editProfile/AccountManagement";
import { ContactInfoEdit } from "@components/dashboard/editProfile/ContactInfoEdit";
import { PersonalInfoUpdate } from "@components/dashboard/editProfile/ProfileInfoUpdate";
import { ProfileUpdate } from "@components/dashboard/editProfile/ProfileUpdate";
import { ColorModeToggle } from "@components/shared/ColorModeToggle";
import { withSessionSsr } from "@config/cookie/cookie";
import { MyTheme } from "@config/theme/MyTheme";
import Head from "next/head";
import { useRouter } from "next/router";

export const getServerSideProps = withSessionSsr(async ({ req, locale }) => {
	const user = req.user;
	if (!user) {
		return {
			redirect: {
				destination: locale === "am" ? "/am/auth/login/" : "/auth/login/",
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

export default function EditProfilePage({ user }) {
	const router = useRouter();
	const pageBg = useColorModeValue("#f5f5f1", "#000000");
	const surface = useColorModeValue("white", "#0c0c0c");
	const border = useColorModeValue("gray.200", "whiteAlpha.200");
	const textColor = useColorModeValue("maingray", "gray.100");

	return (
		<>
			<Head>
				<title>Edit Profile - Habesha Brokers</title>
			</Head>
			<Flex
				bg={surface}
				borderBottom="1px solid"
				borderColor={border}
				height={MyTheme.size.navbarHeightCompact}
				alignItems="center"
				boxShadow="md"
				px={MyTheme.paddings.pagePadding}
				color={textColor}
			>
				<IconButton
					boxSize="10"
					onClick={() => router.back()}
					aria-label="Back"
					mr="5"
				>
					<ArrowBackIcon />
				</IconButton>
				<Heading fontSize="xl">Edit Profile</Heading>
				<Box flex="1" />
				<ColorModeToggle />
			</Flex>
			<SimpleGrid
				w="full"
				maxW="7xl"
				minH="calc(100dvh - 70px)"
				mx="auto"
				bg={pageBg}
				px={MyTheme.paddings.pagePadding}
				py={{ base: 6, md: 10 }}
				gap={{ base: 6, lg: 8 }}
				columns={{ base: 1, lg: 2 }}
			>
				<ProfileUpdate user={user} />
				<Box>
					<PersonalInfoUpdate user={user} />
					<ChangePassword user={user} />
					<AccountManagement user={user} />
					<Box my="5">
						<Heading size="md" mb="5">
							Contact Information
						</Heading>
						<ContactInfoEdit user={user} />
					</Box>
				</Box>
			</SimpleGrid>
		</>
	);
}
