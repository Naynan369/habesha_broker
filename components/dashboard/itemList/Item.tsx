import { Flex } from "@chakra-ui/layout";
import { Heading, Text, Avatar, Wrap } from "@chakra-ui/react";
import { ListingImage } from "@components/shared/ListingImage";
import { getMediaUrl } from "@libs/helpers/media";
import { dayjs } from "@config/dayjs";
import Link from "next/link";
import { FC } from "react";

export interface IItem {
	id: string;
	title: string;
	price: string;
	photoURL: string;
	date: string;
	ownerPhoto?: string;
	status?: string;
	itemType: string;
	ownerName: string;
	featured?: boolean;
}

export const Item: FC<IItem> = ({ id, title, price, photoURL, date, ownerPhoto, ownerName, itemType, featured, status }) => (
	<Link href={"/items/" + id} passHref>
		<Flex as="a" borderRadius="2xl" boxShadow="lg" direction="column" position="relative" w="full" minH="360px" overflow="hidden" bg="maingray" cursor="pointer" _hover={{ boxShadow: "2xl", transform: "translateY(-3px)" }} transition="all 180ms ease" textDecoration="none">
			<ListingImage src={photoURL} alt={title} itemType={itemType} fill />
			{featured && <Flex alignItems="center" justifyContent="center" top="5" left="0" boxShadow="md" color="white" py="2" px="4" position="absolute" zIndex={2} bg="mainred" fontWeight="bold" fontSize="xs" borderRightRadius="full">FEATURED</Flex>}
			<Flex borderRadius="2xl" zIndex={1} flex="1" direction="column" background="linear-gradient(0deg, rgba(5, 22, 32, .96), rgba(5, 22, 32, .08) 80%)" justifyContent="flex-end" p={{ base: 5, md: 7 }} color="white">
				<Heading size="md" color="white" noOfLines={2}>{title}</Heading>
				<Text color="whiteAlpha.800" fontSize="xs" mt="1">Posted {dayjs(date).fromNow()}</Text>
				<Wrap mt="5" spacing="5">
					<Flex direction="column"><Heading fontSize="x-small" textTransform="uppercase" fontWeight="medium" color="whiteAlpha.700">Price</Heading><Heading fontSize="sm">{Intl.NumberFormat("en-US").format(Number(price) || 0)} ETB</Heading></Flex>
					{status && <Flex direction="column"><Heading fontSize="x-small" textTransform="uppercase" fontWeight="medium" color="whiteAlpha.700">Status</Heading><Heading fontSize="sm">{status}</Heading></Flex>}
					<Flex direction="column"><Heading fontSize="x-small" textTransform="uppercase" fontWeight="medium" color="whiteAlpha.700">Type</Heading><Heading fontSize="sm">{itemType}</Heading></Flex>
				</Wrap>
				<Flex mt="5" alignItems="center" gap="3">
					<Avatar size="sm" name={ownerName} src={getMediaUrl(ownerPhoto, "profile")} />
					<Flex direction="column"><Heading fontSize="x-small" textTransform="uppercase" fontWeight="medium" color="whiteAlpha.700">Posted by</Heading><Heading fontSize="sm">{ownerName || "Habesha Brokers seller"}</Heading></Flex>
				</Flex>
			</Flex>
		</Flex>
	</Link>
);
