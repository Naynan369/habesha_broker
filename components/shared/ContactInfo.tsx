import { VStack, Button, Skeleton, Text, useColorModeValue } from "@chakra-ui/react";
import { useFetch } from "@libs/hooks/useFetch";
import type { ContactType } from "@prisma/client";
import axios from "axios";
import { FC } from "react";
import { useLang } from "@libs/hooks/useLang";
import {
	FaTelegram,
	FaFacebook,
	FaInstagram,
	FaPhone,
	FaMailBulk,
	FaLocationArrow,
	FaWhatsapp,
} from "react-icons/fa";

export interface ContactInfo {
	id: string;
	contactType: ContactType;
	value: string;
}

interface IContactInfo {
	userID: string;
	size?: any;
	appearance?: "brand" | "subtle";
}

export const CONTACTTYPE = {
	TELEGRAM: { color: "telegram", icon: <FaTelegram /> },
	WHATSAPP: { color: "green", icon: <FaWhatsapp /> },
	FACEBOOK: { color: "facebook", icon: <FaFacebook /> },
	INSTAGRAM: { color: "orange", icon: <FaInstagram /> },
	PHONE_NUMBER: { color: "blue", icon: <FaPhone /> },
	EMAIL: { color: "red", icon: <FaMailBulk /> },
	ADDRESS: {
		color: "green",
		icon: <FaLocationArrow />,
	},
};

function getContactHref(info: ContactInfo) {
	const value = info.value.trim();
	if (info.contactType === "PHONE_NUMBER") return "tel:" + value;
	if (info.contactType === "EMAIL") return "mailto:" + value;
	if (info.contactType === "WHATSAPP") return "https://wa.me/" + value.replace(/\D/g, "");
	if (info.contactType === "TELEGRAM") {
		const username = value.match(/(?:https?:\/\/)?(?:www\.)?t\.me\/([A-Za-z0-9_]{5,32})\/?$/i)?.[1] || value.replace(/^@/, "");
		return "https://t.me/" + encodeURIComponent(username);
	}
	if (info.contactType === "INSTAGRAM" || info.contactType === "FACEBOOK") {
		const domain = info.contactType === "INSTAGRAM" ? "instagram.com" : "facebook.com";
		try {
			const parsed = new URL(value);
			if (parsed.protocol === "https:" && (parsed.hostname === domain || parsed.hostname === "www." + domain)) return parsed.toString();
		} catch (_error) {}
		return "https://" + domain + "/" + encodeURIComponent(value.replace(/^@/, ""));
	}
	if (info.contactType === "ADDRESS") return "https://www.google.com/maps/search/?api=1&query=" + encodeURIComponent(value);
	return value;
}

function getContactLabel(info: ContactInfo, dashboardText: any) {
	if (info.contactType === "TELEGRAM") {
		const username = info.value.match(/(?:https?:\/\/)?(?:www\.)?t\.me\/([A-Za-z0-9_]{5,32})\/?$/i)?.[1] || info.value.replace(/^@/, "");
		return "@" + username;
	}
	if (info.contactType === "INSTAGRAM") {
		const handle = info.value.match(/instagram\.com\/([^/?#]+)/i)?.[1] || info.value.replace(/^@/, "");
		return "@" + handle;
	}
	if (info.contactType === "WHATSAPP") return dashboardText.whatsappAccount + ": " + info.value;
	if (info.contactType === "PHONE_NUMBER") return dashboardText.phoneAccount + ": " + info.value;
	if (info.contactType === "FACEBOOK") return dashboardText.facebookAccount;
	return info.value;
}

export const ContactInfo: FC<IContactInfo> = ({ userID, size, appearance = "brand" }) => {
	const dashboardText = useLang().dashboardPage;
	const subtleText = useColorModeValue("gray.700", "gray.200");
	const subtleBorder = useColorModeValue("gray.200", "whiteAlpha.300");
	const [infos, loading] = useFetch({
		fetchFunction: () =>
			axios.get<ContactInfo[]>(`/api/user/contactInfo/${userID}`),
		dependencies: [userID],
	});

	return (
		<VStack spacing="2" width={"full"}>
			{loading
				? Array.from({ length: 4 }, (_, i) => (
						<Skeleton
							key={i}
							height={"8"}
							width="full"
							borderRadius="md"
						/>
				  ))
			: infos && infos.length ?
				  infos.map((info) => (
						<Button
							as="a"
							key={info.id}
							href={getContactHref(info)}
							target={["PHONE_NUMBER", "EMAIL"].includes(info.contactType) ? undefined : "_blank"}
							rel={["PHONE_NUMBER", "EMAIL"].includes(info.contactType) ? undefined : "noopener noreferrer"}
								size={size || "md"}
								variant={appearance === "subtle" ? "outline" : "solid"}
								color={appearance === "subtle" ? subtleText : undefined}
								borderColor={appearance === "subtle" ? subtleBorder : undefined}
								fontWeight="medium"
								fontSize={size === "sm" ? "xs" : undefined}
								whiteSpace="normal"
								textAlign="left"
								justifyContent="flex-start"
								width={"full"}
								colorScheme={
									appearance === "subtle" ? "gray" : CONTACTTYPE[info.contactType].color
								}
								leftIcon={CONTACTTYPE[info.contactType].icon}
							>
							{getContactLabel(info, dashboardText)}
						</Button>
			  )) : <Text fontSize="sm" color={subtleText}>{dashboardText.noSellerContact}</Text>}
		</VStack>
	);
};
