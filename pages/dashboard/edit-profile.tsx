import { ArrowBackIcon } from "@chakra-ui/icons";
import { Box, Flex, Heading, IconButton, SimpleGrid } from "@chakra-ui/react";
import { ChangePassword } from "@components/dashboard/editProfile/ChangePassword";
import { ContactInfoEdit } from "@components/dashboard/editProfile/ContactInfoEdit";
import { PersonalInfoUpdate } from "@components/dashboard/editProfile/ProfileInfoUpdate";
import { ProfileUpdate } from "@components/dashboard/editProfile/ProfileUpdate";
import { withSessionSsr } from "@config/cookie/cookie";
import { MyTheme } from "@config/theme/MyTheme";
import Head from "next/head";
import { useRouter } from "next/router";

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

export default function EditProfilePage({ user }) {
	const router = useRouter();

	return (
		<>
			<Head>
				<title>Edit Profile - Habesha Brokers</title>
			</Head>
			<Flex
				height={MyTheme.size.navbarHeightCompact}
				alignItems="center"
				boxShadow="md"
				px={MyTheme.paddings.pagePadding}
				color="maingray"
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
			</Flex>
			<SimpleGrid
				px={MyTheme.paddings.pagePadding}
				py="10"
				columns={[1, 2]}
			>
				<ProfileUpdate user={user} />
				<Box>
					<PersonalInfoUpdate user={user} />
					<ChangePassword user={user} />
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
