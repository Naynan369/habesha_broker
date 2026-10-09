import { Flex } from "@chakra-ui/layout";
import { Skeleton, SkeletonCircle, SkeletonText } from "@chakra-ui/react";

export const ItemLoader = () => (
	<Flex boxShadow={"md"} direction={"column"} width="72">
		<Skeleton height={"44"}></Skeleton>
		<Flex p="5" direction="column">
			<SkeletonText noOfLines={1} fontSize={"3xl"} mb="5"></SkeletonText>
			<SkeletonText noOfLines={2}></SkeletonText>

			<Flex mt="5">
				<SkeletonCircle></SkeletonCircle>
				<SkeletonText></SkeletonText>
			</Flex>
		</Flex>
	</Flex>
);
