import { Box, Flex, Text, Heading, Wrap, Badge, Avatar, Skeleton, SkeletonCircle } from "@chakra-ui/react";
import { IItem } from "@components/dashboard/itemList/Item";
import { ListingImage } from "@components/shared/ListingImage";
import { getMediaUrl } from "@libs/helpers/media";
import { dayjs } from "@config/dayjs";
import Link from "next/link";
import { FC } from "react";

export const ItemCard: FC<IItem> = (props) => (
	<Link href={"/items/" + props.id} passHref>
		<Flex as="a" _hover={{ boxShadow: "xl", transform: "translateY(-2px)" }} transition="all 180ms ease" direction={{ base: "column", md: "row" }} bg="white" border="1px solid" borderColor="gray.100" boxShadow="sm" borderRadius="2xl" my="5" overflow="hidden" cursor="pointer" textDecoration="none" _focusVisible={{ outline: "3px solid", outlineColor: "orange.300" }}>
			<Flex flexShrink={0} w={{ base: "full", md: "260px" }} h={{ base: "220px", md: "auto" }} minH={{ md: "260px" }}>
				<ListingImage alt={props.title} src={props.photoURL} itemType={props.itemType} w="full" h="full" borderTopRadius={{ base: "2xl", md: 0 }} borderLeftRadius={{ md: "2xl" }} />
			</Flex>
			<Flex direction="column" flex="1" p={{ base: 5, md: 7 }}>
				<Flex alignItems="flex-start" justifyContent="space-between" gap="4">
					<Box><Heading fontSize="xl" color="maingray">{props.title}</Heading><Text color="gray.500" fontSize="sm" mt="1">Posted {dayjs(props.date).fromNow()}</Text></Box>
					{props.featured && <Badge colorScheme="orange" borderRadius="full" px="3" py="1">Featured</Badge>}
				</Flex>
				<Wrap my="6" spacing="3">
					<Badge colorScheme="red" variant="subtle" borderRadius="md" px="3" py="2" fontSize="sm">{Intl.NumberFormat("en-US").format(Number(props.price) || 0)} ETB</Badge>
					<Badge colorScheme="blue" variant="subtle" borderRadius="md" px="3" py="2" fontSize="sm">{props.itemType}</Badge>
					{props.status && <Badge colorScheme="green" variant="subtle" borderRadius="md" px="3" py="2" fontSize="sm">{props.status}</Badge>}
				</Wrap>
				<Flex alignItems="center" mt="auto" pt="4" borderTop="1px solid" borderColor="gray.100">
					<Avatar name={props.ownerName} size="sm" src={getMediaUrl(props.ownerPhoto, "profile")} />
					<Flex ml="3" direction="column"><Text color="gray.500" fontSize="xs">Listed by</Text><Text fontSize="sm" fontWeight="semibold" color="maingray">{props.ownerName || "Habesha Brokers seller"}</Text></Flex>
				</Flex>
			</Flex>
		</Flex>
	</Link>
);

export const ItemLoader = () => (
	<Flex minH="260px" my="5" borderRadius="2xl" boxShadow="sm" overflow="hidden" bg="white">
		<Skeleton w={{ base: "35%", md: "260px" }} />
		<Flex flex={1} p="8" direction="column"><Skeleton height="5" mb="3" /><Skeleton height="3" w="45%" mb="7" /><Wrap mb="8" flex="1"><Skeleton w="24" height="8" /><Skeleton w="24" height="8" /><Skeleton w="24" height="8" /></Wrap><Flex alignItems="center" gap="3"><SkeletonCircle /><Skeleton w="40%" height="4" /></Flex></Flex>
	</Flex>
);
