import { Box, Flex, Heading, SimpleGrid, Text, useColorModeValue } from "@chakra-ui/react";
import { FC, ReactNode } from "react";
import { useRouter } from "next/router";
import { am } from "@locales/am";
import { en } from "@locales/en";
import { MdHandshake, MdLocationOn, MdOutlineVerifiedUser } from "react-icons/md";
import type { CSSProperties } from "react";

export const WhyChooseSection = () => {
	const { locale } = useRouter();
	const lang = locale === "am" ? am : en;
	const sectionBg = useColorModeValue("#eee6de", "#000000");
	const headingColor = useColorModeValue("#292725", "#f5f0ea");
	const bodyColor = useColorModeValue("#655e58", "gray.300");
	const kickerColor = useColorModeValue("#a65d45", "#e6a17c");
	const divider = useColorModeValue("gray.300", "whiteAlpha.300");

	return (
		<Box as="section" bg={sectionBg} px={{ base: 5, md: 10, xl: 14 }} py={{ base: 12, md: 18 }}>
			<Box maxW="1440px" mx="auto">
				<Flex align="center" gap="3" mb="4">
					<Box w="9" h="1.5" borderRadius="full" bgGradient="linear(to-r, #bd6748, #e9b75c)" />
					<Text color={kickerColor} textTransform="uppercase" letterSpacing=".16em" fontWeight="bold" fontSize="xs">{lang.home.benefits_kicker}</Text>
				</Flex>
				<Flex align={{ base: "flex-start", lg: "flex-end" }} justify="space-between" gap={{ base: 4, lg: 10 }} direction={{ base: "column", lg: "row" }}>
					<Heading maxW="720px" color={headingColor} fontSize={{ base: "3xl", md: "5xl" }} letterSpacing="-.045em" lineHeight="1.08">{lang.home.benefits_title}</Heading>
					<Text maxW="470px" color={bodyColor} fontSize={{ base: "md", md: "lg" }} lineHeight="1.75" borderLeft={{ base: "none", lg: "2px solid" }} borderColor={divider} pl={{ base: 0, lg: 6 }}>
						{lang.home.benefits_description}
					</Text>
				</Flex>
				<SimpleGrid templateColumns={{ base: "1fr", sm: "repeat(auto-fit, minmax(190px, 1fr))" }} spacing={{ base: 3, md: 5 }} mt={{ base: 7, md: 10 }}>
					<WhyCard motionDelay={0} number="01" title={lang.home.benefit_local_title} icon={<MdLocationOn size={25} />} desc={lang.home.benefit_local_description} />
					<WhyCard motionDelay={90} number="02" title={lang.home.benefit_clear_title} icon={<MdOutlineVerifiedUser size={25} />} desc={lang.home.benefit_clear_description} />
					<WhyCard motionDelay={180} number="03" title={lang.home.benefit_direct_title} icon={<MdHandshake size={25} />} desc={lang.home.benefit_direct_description} />
				</SimpleGrid>
			</Box>
		</Box>
	);
};

interface IWhyCard { number: string; title: string; icon: ReactNode; desc: string; motionDelay: number; }
const WhyCard: FC<IWhyCard> = ({ number, title, icon, desc, motionDelay }) => {
	const headingColor = useColorModeValue("#292725", "#f5f0ea");
	const bodyColor = useColorModeValue("#655e58", "gray.300");
	const iconSurface = useColorModeValue("#292725", "rgba(233,183,92,.16)");
	const border = useColorModeValue("gray.300", "whiteAlpha.200");
	const iconColor = useColorModeValue("#f0c978", "#f0c978");
	const numberColor = useColorModeValue("gray.500", "gray.400");
	const shadow = useColorModeValue("0 10px 26px rgba(47,35,28,.08)", "0 14px 30px rgba(0,0,0,.24)");
	const hoverShadow = useColorModeValue("0 18px 34px rgba(47,35,28,.14)", "0 18px 36px rgba(0,0,0,.38)");
	const cardGradient = useColorModeValue("linear(to-br, #fffdfa, #f7f0e8)", "linear(to-br, #111111, #101010)");
	return (
		<Box
			as="article"
			data-home-stagger
			style={{ "--home-stagger-delay": motionDelay + "ms" } as CSSProperties}
			position="relative"
			overflow="hidden"
			minH={{ base: "auto", sm: "226px" }}
			bgGradient={cardGradient}
			border="1px solid"
			borderColor={border}
			borderRadius="2xl"
			p={{ base: 5, md: 6 }}
			boxShadow={shadow}
			transition="transform 200ms ease, border-color 200ms ease, box-shadow 200ms ease"
			_hover={{ transform: "translateY(-3px)", borderColor: "mainorange", boxShadow: hoverShadow }}
		>
			<Box position="absolute" top="0" left="6" right="6" h="1.5" borderBottomRadius="full" bgGradient="linear(to-r, #bd6748, #e9b75c)" />
			<Flex align="center" justify="space-between" gap="4">
				<Flex w="12" h="12" flexShrink={0} align="center" justify="center" color={iconColor} bg={iconSurface} borderRadius="xl">{icon}</Flex>
				<Text color={numberColor} fontSize="sm" fontWeight="bold" letterSpacing=".16em">{number}</Text>
			</Flex>
			<Heading mt="5" mb="2" color={headingColor} fontSize="lg" letterSpacing="-.02em" lineHeight="1.25">{title}</Heading>
			<Text color={bodyColor} fontSize="sm" lineHeight="1.7">{desc}</Text>
		</Box>
	);
};
