import { Box, Flex, Skeleton, SkeletonCircle, SkeletonText, useColorModeValue } from "@chakra-ui/react";

export const ItemLoader = () => (
	<Flex direction="column" h="full" minH="390px" border="1px solid" borderColor={useColorModeValue("gray.200", "whiteAlpha.200")} borderRadius="2xl" overflow="hidden" bg={useColorModeValue("white", "#0c0c0c")}>
		<Skeleton h={{ base: "190px", md: "215px" }} borderRadius="0" />
		<Flex p={{ base: 4, md: 5 }} direction="column" flex="1">
			<SkeletonText noOfLines={2} mb="3" />
			<SkeletonText noOfLines={1} w="40%" mb="6" />
			<Skeleton h="7" w="55%" mb="6" />
			<Box mt="auto" pt="4" borderTop="1px solid" borderColor={useColorModeValue("gray.100", "whiteAlpha.200")}>
				<Flex align="center" gap="3"><SkeletonCircle size="9" /><SkeletonText noOfLines={2} w="50%" /></Flex>
				</Box>
		</Flex>
	</Flex>
);
