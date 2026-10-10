import { Avatar, Badge, Box, Flex, Heading, Skeleton, SkeletonCircle, Text } from "@chakra-ui/react";
import { IItem } from "@components/dashboard/itemList/Item";
import { ListingImage } from "@components/shared/ListingImage";
import { getMediaUrl } from "@libs/helpers/media";
import { dayjs } from "@config/dayjs";
import Link from "next/link";
import { FC } from "react";
import { useRouter } from "next/router";
import { useLang } from "@libs/hooks/useLang";
import { MdArrowForward } from "react-icons/md";

export const ItemCard: FC<IItem> = (props) => {
	const router = useRouter();
	const lang = useLang();
	const card = lang.explore.card;
	const postedTime = dayjs(props.date).locale(router.locale === "am" ? "am" : "en").fromNow();
	return (
	<Link href={`/items/${props.id}`} passHref>
		<Flex as="a" direction="column" minW="0" bg="white" border="1px solid" borderColor="gray.200" borderRadius="2xl" overflow="hidden" cursor="pointer" textDecoration="none" transition="all 180ms ease" _hover={{ boxShadow: "0 18px 40px rgba(20,40,35,.12)", transform: "translateY(-3px)", borderColor: "gray.300" }} _focusVisible={{ outline: "3px solid", outlineColor: "orange.300" }}>
			<Box position="relative" h={{ base: "205px", md: "235px" }} bg="gray.100">
				<ListingImage alt={props.title} src={props.photoURL} itemType={props.itemType} w="full" h="full" />
				{props.featured && <Badge position="absolute" top="4" left="4" colorScheme="orange" borderRadius="full" px="3" py="1">{card.featured}</Badge>}
			</Box>
			<Flex direction="column" flex="1" p={{ base: 5, md: 6 }}>
				<Flex align="flex-start" justify="space-between" gap="3">
					<Box minW="0"><Heading noOfLines={2} fontSize="lg" lineHeight="1.35" color="maingray">{props.title}</Heading><Text color="gray.500" fontSize="xs" mt="2">{card.posted} {postedTime}</Text></Box>
					<Badge flexShrink={0} colorScheme="teal" variant="subtle" borderRadius="full" px="2.5" py="1">{props.itemType === "HOUSE" ? card.home : props.itemType === "CAR" ? card.vehicle : card.businessSpace}</Badge>
				</Flex>
				<Flex align="baseline" gap="2" mt="5"><Heading fontSize="2xl" color="maingray" letterSpacing="-.03em">{Intl.NumberFormat("en-US").format(Number(props.price) || 0)}</Heading>{props.itemType === "BUSINESS_SPACE" && props.priceFrequency && <Text fontSize="xs" color="gray.500">{lang.businessListing.frequencies[props.priceFrequency]}</Text>}<Text fontSize="sm" color="gray.600" fontWeight="semibold">{card.currency}</Text></Flex>
				<Flex align="center" justify="space-between" mt="5" pt="4" borderTop="1px solid" borderColor="gray.100" gap="3">
					<Flex align="center" minW="0"><Avatar size="sm" name={props.ownerName || card.sellerFallback} src={getMediaUrl(props.ownerPhoto, "profile")} /><Box ml="3" minW="0"><Text color="gray.500" fontSize="xs">{card.listedBy}</Text><Text noOfLines={1} fontSize="sm" fontWeight="semibold" color="maingray">{props.ownerName || card.sellerFallback}</Text></Box></Flex>
					<Flex align="center" gap="2" color="mainred" flexShrink={0}><Text fontSize="sm" fontWeight="bold">{card.view}</Text><MdArrowForward /></Flex>
				</Flex>
			</Flex>
		</Flex>
	</Link>
	);
};

export const ItemLoader = () => (
	<Flex minH="405px" direction="column" borderRadius="2xl" border="1px solid" borderColor="gray.200" overflow="hidden" bg="white">
		<Skeleton h="220px" />
		<Flex flex="1" p="6" direction="column"><Skeleton height="5" mb="3" /><Skeleton height="3" w="45%" mb="6" /><Skeleton height="7" w="55%" mb="7" /><Flex mt="auto" align="center" gap="3"><SkeletonCircle /><Skeleton w="40%" height="4" /></Flex></Flex>
	</Flex>
);
