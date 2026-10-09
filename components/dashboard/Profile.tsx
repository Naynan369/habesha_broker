import {
	Avatar,
	Flex,
	Heading,
	IconButton,
	Text,
} from "@chakra-ui/react";
import { ContactInfo } from "@components/ContactInfo";
import { IUser } from "@libs/types/user";
import { FC } from "react";
import { getMediaUrl } from "@libs/helpers/media";
import Link from "next/link";
import { MdEdit } from "react-icons/md";

interface IProfile {
	user: IUser;
}
export const Profile: FC<IProfile> = ({ user }) => {
	return (
		<Flex
			background={"white"}
			boxShadow="md"
			borderRadius={"md"}
			direction="column"
			p="5"
		>
			<Heading mb="5" textTransform={"uppercase"} fontSize="xl">
				Profile
				<Link href={"/dashboard/edit-profile"} passHref>
					<IconButton as="a" float={"right"} aria-label="edit profile">
						<MdEdit />
					</IconButton>
				</Link>
			</Heading>
			<Flex m="3" alignItems={"center"}>
				<Avatar name={user.firstName + " " + user.lastName} src={getMediaUrl(user.profile_url, "profile")} />
				<Flex direction={"column"} ml={"5"}>
					<Text fontSize={"lg"}>
						{user.firstName + " " + user.lastName}
					</Text>
					<Text color={"gray.500"} fontSize={"sm"}>
						{user.bio ? user.bio : user.email}
					</Text>
				</Flex>
			</Flex>
			<Flex mt="5">
				<ContactInfo size="sm" userID={user.id}></ContactInfo>
			</Flex>
		</Flex>
	);
};
