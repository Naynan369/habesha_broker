import { Box, Flex, Heading, Text } from "@chakra-ui/react";
import { MyTheme } from "@config/theme/MyTheme";
import { FC, ReactNode } from "react";
import { MdHandshake, MdLocationOn, MdOutlineVerifiedUser } from "react-icons/md";

export const WhyChooseSection = () => (
	<Flex
		minHeight={{ base: "auto", lg: "78vh" }}
		background="maingray"
		px={MyTheme.paddings.pagePadding}
		py={{ base: 16, md: 24 }}
		direction="column"
		alignItems="center"
		color="white"
	>
		<Text color="mainyellow" textTransform="uppercase" letterSpacing="0.16em" fontWeight="bold" fontSize="sm">A simpler experience</Text>
		<Heading fontSize={{ base: "3xl", md: "5xl" }} textAlign="center" mt="3" mb="4" letterSpacing="-0.03em">Built around the way you search</Heading>
		<Text maxW="640px" textAlign="center" color="whiteAlpha.700" fontSize="lg">Compare the essentials, discover local options, and reach out to sellers with confidence.</Text>
		<Flex justifyContent="center" flexWrap="wrap" mt={{ base: 10, md: 14 }} width="100%" gap={{ base: 5, md: 8 }}>
			<WhyCard title="Local listings" icon={<MdLocationOn size={32} />} desc="Explore homes and vehicles listed for the Ethiopian market, with location and key details easy to find." />
			<WhyCard title="Clear details" icon={<MdOutlineVerifiedUser size={32} />} desc="Review price, condition, specifications, and seller information before you make contact." />
			<WhyCard title="Direct connection" icon={<MdHandshake size={32} />} desc="Save listings you like and connect with sellers when you are ready to learn more." />
		</Flex>
	</Flex>
);

interface IWhyCard { title: string; icon: ReactNode; desc: string; }
const WhyCard: FC<IWhyCard> = ({ title, icon, desc }) => (
	<Flex
		bg="white"
		borderRadius="2xl"
		boxShadow="xl"
		flex="1"
		minW={{ base: "100%", md: "260px" }}
		maxW="390px"
		direction="column"
		alignItems="flex-start"
		p={{ base: 6, md: 8 }}
		color="maingray"
	>
		<Box p="4" color="mainred" bg="red.50" borderRadius="xl">{icon}</Box>
		<Heading mt="7" mb="3" color="maingray" fontSize="xl">{title}</Heading>
		<Text color="gray.600" lineHeight="1.8">{desc}</Text>
	</Flex>
);
