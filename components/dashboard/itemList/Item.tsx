import { Avatar, Badge, Box, Flex, Heading, Text, useColorModeValue } from "@chakra-ui/react";
import { ListingImage } from "@components/shared/ListingImage";
import { getMediaUrl } from "@libs/helpers/media";
import { dayjs } from "@config/dayjs";
import Link from "next/link";
import { FC } from "react";
import { useRouter } from "next/router";
import { useLang } from "@libs/hooks/useLang";

export interface IItem {
	id: string;
	title: string;
	price: string;
	photoURL: string;
	date: string;
	ownerPhoto?: string;
	status?: string;
	paymentStatus?: string;
	itemType: string;
	ownerName: string;
	featured?: boolean;
	priceFrequency?: string;
	serviceCategory?: string;
}

export const Item: FC<IItem> = ({ id, title, price, photoURL, date, ownerPhoto, ownerName, itemType, featured, status, paymentStatus, priceFrequency, serviceCategory }) => {
	const { locale } = useRouter();
	const lang = useLang();
	const copy = lang.listingManagementPage;
	const surface = useColorModeValue("white", "#0c0c0c");
	const border = useColorModeValue("gray.200", "whiteAlpha.200");
	const headingColor = useColorModeValue("#25383d", "#e8eff0");
	const muted = useColorModeValue("gray.600", "gray.400");
	const imageFallback = useColorModeValue("gray.100", "#101010");
	const divider = useColorModeValue("gray.100", "whiteAlpha.200");
	const statusColor = paymentStatus === "DUE" ? "orange" : paymentStatus === "PROCESSING" ? "blue" : status === "APPROVED" ? "green" : status === "DECLINED" ? "red" : status === "SOLD" ? "purple" : "orange";
	const statusLabel = paymentStatus === "DUE" ? copy.paymentDue : paymentStatus === "PROCESSING" ? copy.paymentProcessing : paymentStatus === "PAID" && status === "PENDING" ? copy.paidPending : status === "APPROVED" ? copy.approved : status === "DECLINED" ? copy.declined : status === "SOLD" ? copy.sold : copy.pending;
	const itemTypeLabel = itemType === "SERVICE"
		? lang.serviceListing.categories[serviceCategory] || copy.categoryServices
		: itemType === "BUSINESS_SPACE" ? copy.categoryBusinessSpaces : itemType === "CAR" ? copy.categoryVehicles : copy.categoryHomes;

	return (
		<Link legacyBehavior href={`/items/${id}`} passHref>
			<Flex as="a" direction="column" h="full" minW="0" bg={surface} border="1px solid" borderColor={border} borderRadius="2xl" overflow="hidden" cursor="pointer" textDecoration="none" boxShadow="0 6px 22px rgba(21,42,44,.06)" transition="transform 180ms ease, box-shadow 180ms ease, border-color 180ms ease" _hover={{ boxShadow: "0 16px 34px rgba(21,42,44,.14)", transform: "translateY(-3px)", borderColor: "mainyellow" }} _focusVisible={{ outline: "3px solid #E9B75C", outlineOffset: "3px" }}>
				<Box position="relative" h={{ base: "190px", md: "215px" }} flexShrink={0} bg={imageFallback}>
					<ListingImage src={photoURL} alt={title} itemType={itemType} fill />
					{featured && <Badge position="absolute" top="4" left="4" zIndex="1" colorScheme="orange" borderRadius="full" px="3" py="1">{copy.featured}</Badge>}
					{status && <Badge position="absolute" top="4" right="4" zIndex="1" colorScheme={statusColor} variant="solid" borderRadius="full" px="3" py="1">{statusLabel}</Badge>}
				</Box>
				<Flex direction="column" flex="1" p={{ base: 4, md: 5 }}>
					<Flex align="flex-start" justify="space-between" gap="3">
						<Box minW="0">
							<Heading size="md" color={headingColor} noOfLines={2} lineHeight="1.35">{title}</Heading>
							<Text color={muted} fontSize="xs" mt="2">{copy.posted} {dayjs(date).locale(locale === "am" ? "am" : "en").fromNow()}</Text>
						</Box>
						<Badge flexShrink={0} colorScheme="teal" variant="subtle" borderRadius="full" px="2.5" py="1">{itemTypeLabel}</Badge>
					</Flex>
					<Flex align="baseline" gap="2" mt="5">
						<Heading fontSize="xl" color={headingColor} letterSpacing="-.02em">{Intl.NumberFormat("en-US").format(Number(price) || 0)}</Heading>
						<Text color={muted} fontSize="sm" fontWeight="semibold">ETB</Text>
						{itemType === "BUSINESS_SPACE" && priceFrequency && <Text color={muted} fontSize="xs">/ {lang.businessListing.frequencies[priceFrequency]}</Text>}
					</Flex>
					<Flex mt="5" pt="4" align="center" gap="3" borderTop="1px solid" borderColor={divider}>
						<Avatar size="sm" name={ownerName || "Habesha Brokers seller"} src={getMediaUrl(ownerPhoto, "profile")} />
						<Box minW="0"><Text fontSize="xs" color={muted}>{copy.listedBy}</Text><Text noOfLines={1} fontSize="sm" fontWeight="semibold" color={headingColor}>{ownerName || copy.seller}</Text></Box>
					</Flex>
				</Flex>
			</Flex>
		</Link>
	);
};
