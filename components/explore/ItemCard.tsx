import { Box, Flex, Heading, Skeleton, useColorModeValue } from "@chakra-ui/react";
import type { IItem } from "@components/dashboard/Listings";
import { ListingImage } from "@components/shared/ListingImage";
import { useLang } from "@libs/hooks/useLang";
import Link from "next/link";
import { FC } from "react";

type SearchableItemCardProps = Pick<IItem, "id" | "title" | "photoURL" | "itemType" | "status"> & { searchTerm?: string };

const highlightMatch = (text: string, term: string, background: string, color: string) => {
	const start = text.toLocaleLowerCase().indexOf(term.toLocaleLowerCase());
	if (!term || start < 0) return text;
	const end = start + term.length;
	return <>{text.slice(0, start)}<Box as="mark" display="inline" px="1" borderRadius="sm" bg={background} color={color}>{text.slice(start, end)}</Box>{text.slice(end)}</>;
};

export const ItemCard: FC<SearchableItemCardProps> = (props) => {
	const lang = useLang();
	const labels = lang.listingManagementPage;
	const surface = useColorModeValue("#fffdfa", "#111111");
	const textColor = useColorModeValue("#292725", "#f5f0ea");
	const borderColor = useColorModeValue("#d8d0c6", "whiteAlpha.200");
	const imageFallback = useColorModeValue("#e9e2d8", "#101010");
	const matchHighlightBg = useColorModeValue("#f4c9df", "#63334f");
	const matchHighlightColor = useColorModeValue("#5a2142", "#ffe8f3");
	const statusLabel = props.status === "SOLD" ? labels.sold
		: props.status === "RENTED" ? labels.rented
		: props.status === "CLOSED" ? labels.closed
		: props.status === "DECLINED" ? labels.declined
		: props.status === "PENDING" ? labels.pending
		: labels.available;
	const statusColor = props.status === "SOLD" || props.status === "RENTED" ? "#cdb0ea"
		: props.status === "CLOSED" ? "#aeb7b9"
		: props.status === "DECLINED" ? "#efaca5"
		: props.status === "PENDING" ? "#f0c58a"
		: "#a4e0b6";

	return (
		<Link legacyBehavior href={`/items/${props.id}`} passHref>
			<Flex as="a" className="listing-card" direction="column" minW="0" bg={surface} border="1px solid" borderColor={borderColor} borderRadius="2xl" overflow="hidden" cursor="pointer" textDecoration="none" transition="all 180ms ease" _hover={{ boxShadow: "0 18px 40px rgba(34,25,25,.16)", transform: "translateY(-3px)", borderColor: "#b86b4d" }} _focusVisible={{ outline: "3px solid", outlineColor: "orange.300" }}>
				<Box className="listing-card-media" position="relative" h={{ base: "205px", md: "235px" }} bg={imageFallback}>
					<ListingImage alt={props.title} src={props.photoURL} itemType={props.itemType} w="full" h="full" />
					<Flex className="listing-card-status" position="absolute" top="4" left="4" align="center" gap="2" maxW="calc(100% - 2rem)" px="3" py="1.5" bg="rgba(14,22,24,.84)" color="#fff" border="1px solid" borderColor="whiteAlpha.300" borderRadius="full" boxShadow="0 6px 18px rgba(0,0,0,.2)" fontSize="xs" fontWeight="bold" lineHeight="1.2">
						<Box as="span" flexShrink={0} w="2" h="2" bg={statusColor} borderRadius="full" />
						{statusLabel}
					</Flex>
				</Box>
				<Box className="listing-card-content" p={{ base: 4, md: 5 }}>
					<Heading className="listing-card-title" noOfLines={2} fontSize={{ base: "md", md: "lg" }} lineHeight="1.35" color={textColor}>{highlightMatch(props.title, props.searchTerm?.trim() || "", matchHighlightBg, matchHighlightColor)}</Heading>
				</Box>
			</Flex>
		</Link>
	);
};

export const ItemLoader = () => {
	const surface = useColorModeValue("#fffdfa", "#111111");
	const border = useColorModeValue("#d8d0c6", "whiteAlpha.200");
	return (
		<Flex minH="300px" direction="column" borderRadius="2xl" border="1px solid" borderColor={border} overflow="hidden" bg={surface}>
			<Skeleton h="220px" />
			<Box p="5"><Skeleton height="5" w="70%" /></Box>
		</Flex>
	);
};
