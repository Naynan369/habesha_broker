import {
	Avatar,
	Box,
	Flex,
	Heading,
	IconButton,
	Text,
	useColorModeValue,
} from "@chakra-ui/react";
import { ContactInfo } from "@components/ContactInfo";
import { IUser } from "@libs/types/user";
import { FC } from "react";
import { useLang } from "@libs/hooks/useLang";
import { getMediaUrl } from "@libs/helpers/media";
import Link from "next/link";
import { MdEdit } from "react-icons/md";

interface IProfile {
	user: IUser;
}
export const Profile: FC<IProfile> = ({ user }) => {
	const dashboardText = useLang().dashboardPage;
	const surface = useColorModeValue("white", "#0c0c0c");
	const border = useColorModeValue("gray.200", "whiteAlpha.200");
	const nameColor = useColorModeValue("#25383d", "#e8eff0");
	const muted = useColorModeValue("gray.600", "gray.400");
	const iconHoverBg = useColorModeValue("gray.100", "whiteAlpha.100");
	const iconHoverColor = useColorModeValue("#8d421e", "#f0b783");
	return (
		<Flex
			background={surface}
			border="1px solid"
			borderColor={border}
			boxShadow="0 8px 28px rgba(21,42,44,.06)"
			borderRadius="2xl"
			direction="column"
			p={{ base: 5, md: 6 }}
			h="full"
		>
			<Flex mb="5" align="center" justify="space-between" gap="3">
				<Heading fontSize="lg" letterSpacing="-.02em">
					{dashboardText.profile}
				</Heading>
				<Link legacyBehavior href={"/dashboard/edit-profile"} passHref>
					<IconButton as="a" variant="ghost" color={muted} _hover={{ bg: iconHoverBg, color: iconHoverColor }} _focusVisible={{ outline: "3px solid #E9B75C", outlineOffset: "2px" }} aria-label={dashboardText.editProfile}>
						<MdEdit />
					</IconButton>
				</Link>
			</Flex>
			<Flex alignItems="center" minW="0" gap="4">
				<Avatar flexShrink={0} size="lg" name={user.firstName + " " + user.lastName} src={getMediaUrl(user.profile_url, "profile")} />
				<Flex direction="column" minW="0">
					<Text noOfLines={1} fontSize="md" color={nameColor} fontWeight="semibold">
						{user.firstName + " " + user.lastName}
					</Text>
					<Text noOfLines={2} color={muted} fontSize="sm" mt="1" lineHeight="1.5">
						{user.bio || user.email}
					</Text>
				</Flex>
			</Flex>
			<Box mt="6" pt="5" borderTop="1px solid" borderColor={border}>
				<Text mb="3" fontSize="xs" fontWeight="bold" textTransform="uppercase" letterSpacing=".1em" color={muted}>{dashboardText.contactDetails}</Text>
				<ContactInfo size="sm" appearance="subtle" userID={user.id} />
			</Box>
		</Flex>
	);
};
