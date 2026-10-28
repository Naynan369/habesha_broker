import { Avatar, Badge, Box, Flex, Heading, Skeleton, SkeletonCircle, Text, useColorModeValue } from "@chakra-ui/react";
import { IItem } from "@components/dashboard/itemList/Item";
import { ListingImage } from "@components/shared/ListingImage";
import { getMediaUrl } from "@libs/helpers/media";
import { dayjs } from "@config/dayjs";
import Link from "next/link";
import { FC } from "react";
import { useRouter } from "next/router";
import { useLang } from "@libs/hooks/useLang";
import { MdArrowForward } from "react-icons/md";

export type SearchMatchField = "title" | "manufacturer" | "model" | "location" | "serviceArea";

type SearchableItemCardProps = IItem & {
	searchTerm?: string;
	matchedFields?: SearchMatchField[];
};

const highlightMatch = (text: string, term: string, background: string, color: string) => {
	const start = text.toLocaleLowerCase().indexOf(term.toLocaleLowerCase());
	if (!term || start < 0) return text;
	const end = start + term.length;
	return <>{text.slice(0, start)}<Box as="mark" display="inline" px="1" borderRadius="sm" bg={background} color={color}>{text.slice(start, end)}</Box>{text.slice(end)}</>;
};

export const ItemCard: FC<SearchableItemCardProps> = (props) => {
	const router = useRouter();
	const lang = useLang();
	const card = lang.explore.card;
	const serviceText = lang.serviceListing;
	const surface = useColorModeValue("white", "#111111");
	const textColor = useColorModeValue("#143A45", "#e7eff0");
	const matchHighlightBg = useColorModeValue("#f4c9df", "#63334f");
	const matchHighlightColor = useColorModeValue("#5a2142", "#ffe8f3");
	const matchBadgeBg = useColorModeValue("#f5e3ed", "rgba(206, 112, 164, .2)");
	const matchBadgeColor = useColorModeValue("#713450", "#f0b9d2");
	const mutedColor = useColorModeValue("gray.500", "gray.300");
	const borderColor = useColorModeValue("gray.200", "whiteAlpha.200");
	const dividerColor = useColorModeValue("gray.100", "whiteAlpha.200");
	const imageFallback = useColorModeValue("gray.100", "#101010");
	const categoryLabel = props.itemType === "SERVICE" ? serviceText.categories[props.serviceCategory] || card.service : props.itemType === "HOUSE" ? card.home : props.itemType === "CAR" ? card.vehicle : card.businessSpace;
	const postedTime = dayjs(props.date).locale(router.locale === "am" ? "am" : "en").fromNow();
	const visibleMatchFields = props.matchedFields?.filter((field) => field !== "title") || [];
	return (
	<Link legacyBehavior href={`/items/${props.id}`} passHref>
		<Flex as="a" className="listing-card" direction="column" minW="0" bg={surface} border="1px solid" borderColor={borderColor} borderRadius="2xl" overflow="hidden" cursor="pointer" textDecoration="none" transition="all 180ms ease" _hover={{ boxShadow: "0 18px 40px rgba(20,40,35,.18)", transform: "translateY(-3px)", borderColor: "mainorange" }} _focusVisible={{ outline: "3px solid", outlineColor: "orange.300" }}>
			<Box className="listing-card-media" position="relative" h={{ base: "205px", md: "235px" }} bg={imageFallback}>
				<ListingImage alt={props.title} src={props.photoURL} itemType={props.itemType} w="full" h="full" />
				{props.featured && <Badge className="listing-card-featured-badge" position="absolute" top="4" left="4" colorScheme="orange" borderRadius="full" px="3" py="1">{card.featured}</Badge>}
				{props.status === "APPROVED" && ["HOUSE", "BUSINESS_SPACE"].includes(props.itemType) && props.listingIntent === "RENT" && <Badge position="absolute" top="4" right="4" colorScheme="green" borderRadius="full" px="3" py="1">{lang.listingManagementPage.available}</Badge>}
			</Box>
			<Flex className="listing-card-content" direction="column" flex="1" p={{ base: 5, md: 6 }}>
				<Flex align="flex-start" justify="space-between" gap="3">
					<Box minW="0"><Heading className="listing-card-title" noOfLines={2} fontSize="lg" lineHeight="1.35" color={textColor}>{highlightMatch(props.title, props.searchTerm?.trim() || "", matchHighlightBg, matchHighlightColor)}</Heading><Text className="listing-card-date" color={mutedColor} fontSize="xs" mt="2">{card.posted} {postedTime}</Text></Box>
					<Badge className="listing-card-category" flexShrink={0} colorScheme="teal" variant="subtle" borderRadius="full" px="2.5" py="1">{categoryLabel}</Badge>
				</Flex>
				{props.searchTerm?.trim() && visibleMatchFields.length > 0 && <Flex align="center" gap="1.5" mt="3" wrap="wrap" aria-label={lang.explore.searchMatchLabel}>
					<Text color={mutedColor} fontSize="xs">{lang.explore.searchMatchLabel}</Text>
					{visibleMatchFields.map((field) => <Badge key={field} bg={matchBadgeBg} color={matchBadgeColor} borderRadius="full" px="2" py=".5" fontSize="10px">{lang.explore.searchMatchFields[field]}</Badge>)}
				</Flex>}
				<Flex className="listing-card-price" align="baseline" gap="2" mt="5"><Heading fontSize="2xl" color={textColor} letterSpacing="-.03em">{Intl.NumberFormat("en-US").format(Number(props.price) || 0)}</Heading>{props.itemType === "BUSINESS_SPACE" && props.priceFrequency && <Text fontSize="xs" color={mutedColor}>{lang.businessListing.frequencies[props.priceFrequency]}</Text>}<Text fontSize="sm" color={mutedColor} fontWeight="semibold">{card.currency}</Text></Flex>
				<Flex className="listing-card-owner" align="center" justify="space-between" mt="5" pt="4" borderTop="1px solid" borderColor={dividerColor} gap="3">
					<Flex align="center" minW="0"><Avatar size="sm" name={props.ownerName || card.sellerFallback} src={getMediaUrl(props.ownerPhoto, "profile")} /><Box ml="3" minW="0"><Text color={mutedColor} fontSize="xs">{card.listedBy}</Text><Text noOfLines={1} fontSize="sm" fontWeight="semibold" color={textColor}>{props.ownerName || card.sellerFallback}</Text></Box></Flex>
					<Flex align="center" gap="2" color="mainred" flexShrink={0}><Text fontSize="sm" fontWeight="bold">{card.view}</Text><MdArrowForward /></Flex>
				</Flex>
			</Flex>
		</Flex>
	</Link>
	);
};

export const ItemLoader = () => {
	const surface = useColorModeValue("white", "#111111");
	const border = useColorModeValue("gray.200", "whiteAlpha.200");
	return (
		<Flex minH="405px" direction="column" borderRadius="2xl" border="1px solid" borderColor={border} overflow="hidden" bg={surface}>
			<Skeleton h="220px" />
			<Flex flex="1" p="6" direction="column"><Skeleton height="5" mb="3" /><Skeleton height="3" w="45%" mb="6" /><Skeleton height="7" w="55%" mb="7" /><Flex mt="auto" align="center" gap="3"><SkeletonCircle /><Skeleton w="40%" height="4" /></Flex></Flex>
		</Flex>
	);
};
