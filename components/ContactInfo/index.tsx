import { VStack, Button, Skeleton } from "@chakra-ui/react";
import { useFetch } from "@libs/hooks/useFetch";
import type { ContactType } from "@prisma/client";
import axios from "axios";
import { FC } from "react";
import {
	FaTelegram,
	FaFacebook,
	FaInstagram,
	FaPhone,
	FaMailBulk,
	FaLocationArrow,
	FaMapMarkerAlt,
} from "react-icons/fa";

export interface ContactInfo {
	id: string;
	contactType: ContactType;
	value: string;
}

interface IContactInfo {
	userID: string;
	size?: any;
}

export const CONTACTTYPE = {
	TELEGRAM: { color: "telegram", icon: <FaTelegram /> },
	FACEBOOK: { color: "facebook", icon: <FaFacebook /> },
	INSTAGRAM: { color: "orange", icon: <FaInstagram /> },
	PHONE_NUMBER: { color: "blue", icon: <FaPhone /> },
	EMAIL: { color: "red", icon: <FaMailBulk /> },
	ADDRESS: {
		color: "green",
		icon: <FaLocationArrow />,
	},
};

export const ContactInfo: FC<IContactInfo> = ({ userID, size }) => {
	const [infos, loading, error] = useFetch({
		fetchFunction: () =>
			axios.get<ContactInfo[]>(`/api/user/contactInfo/${userID}`),
	});

	return (
		<VStack spacing="2" width={"full"}>
			{loading
				? [...Array(4)].map((v, i) => (
						<Skeleton
							key={i}
							height={"8"}
							width="full"
							borderRadius="md"
						/>
				  ))
				: infos &&
				  infos.map((info, index) => (
						<Button
							as="a"
							key={info.id}
							href={
								info.contactType === "PHONE_NUMBER"
									? "tel:" + info.value
									: info.contactType === "EMAIL"
									? "mailto:" + info.value
									: info.contactType === "TELEGRAM"
									? "http://t.me/" + info.value
									: info.value
							}
								size={size && size}
								variant={"solid"}
								width={"full"}
								colorScheme={
									CONTACTTYPE[info.contactType].color
								}
								leftIcon={CONTACTTYPE[info.contactType].icon}
							>
								{info.contactType === "TELEGRAM" ||
								info.contactType === "INSTAGRAM"
									? "@" + info.value
									: info.contactType === "FACEBOOK"
									? "Facebook Account"
									: info.value}
						</Button>
				  ))}
		</VStack>
	);
};
