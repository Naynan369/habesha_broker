import { Box, Flex, Heading, Text } from "@chakra-ui/react";
import { FC, ReactNode } from "react";
import { useRouter } from "next/router";
import { am } from "@locales/am";
import { en } from "@locales/en";
import { MdHandshake, MdLocationOn, MdOutlineVerifiedUser } from "react-icons/md";

export const WhyChooseSection = () => {
	const { locale } = useRouter();
	const lang = locale === "am" ? am : en;
	return (
		<Flex as="section" bg="#f5f2ea" px={{ base: 6, md: 12, xl: 16 }} py={{ base: 16, md: 24 }} direction="column">
			<Flex maxW="1440px" mx="auto" w="full" direction={{ base: "column", lg: "row" }} align={{ base: "stretch", lg: "flex-end" }} justify="space-between" gap="8">
				<Box maxW="720px">
					<Text color="mainred" textTransform="uppercase" letterSpacing=".18em" fontWeight="bold" fontSize="xs">{lang.home.benefits_kicker}</Text>
					<Heading color="maingray" fontSize={{ base: "3xl", md: "5xl" }} mt="3" letterSpacing="-.04em" lineHeight="1.12">{lang.home.benefits_title}</Heading>
				</Box>
				<Text maxW="440px" color="gray.600" fontSize={{ base: "md", md: "lg" }} lineHeight="1.8">{lang.home.benefits_description}</Text>
			</Flex>
			<Flex maxW="1440px" mx="auto" mt={{ base: 9, md: 14 }} w="full" flexWrap="wrap" gap="5">
				<WhyCard number="01" title={lang.home.benefit_local_title} icon={<MdLocationOn size={26} />} desc={lang.home.benefit_local_description} />
				<WhyCard number="02" title={lang.home.benefit_clear_title} icon={<MdOutlineVerifiedUser size={26} />} desc={lang.home.benefit_clear_description} />
				<WhyCard number="03" title={lang.home.benefit_direct_title} icon={<MdHandshake size={26} />} desc={lang.home.benefit_direct_description} />
			</Flex>
		</Flex>
	);
};

interface IWhyCard { number: string; title: string; icon: ReactNode; desc: string; }
const WhyCard: FC<IWhyCard> = ({ number, title, icon, desc }) => (
	<Flex bg="white" border="1px solid" borderColor="blackAlpha.100" borderRadius="2xl" flex="1" minW={{ base: "100%", md: "260px" }} direction="column" align="flex-start" p={{ base: 6, md: 8 }} color="maingray" boxShadow="0 8px 28px rgba(23, 39, 34, .045)">
		<Flex w="full" align="center" justify="space-between"><Box p="3" color="mainred" bg="#fbf0e9" borderRadius="xl">{icon}</Box><Text fontSize="xs" color="gray.400" fontWeight="bold" letterSpacing=".16em">{number}</Text></Flex>
		<Heading mt="7" mb="3" color="maingray" fontSize="xl">{title}</Heading>
		<Text color="gray.600" lineHeight="1.8">{desc}</Text>
	</Flex>
);
