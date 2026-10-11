import { Box, Flex, Heading, SimpleGrid, Text, useColorModeValue } from "@chakra-ui/react";
import { FC, ReactNode } from "react";
import { useRouter } from "next/router";
import { am } from "@locales/am";
import { en } from "@locales/en";
import { MdHandshake, MdLocationOn, MdOutlineVerifiedUser } from "react-icons/md";

export const WhyChooseSection = () => {
	const { locale } = useRouter();
	const lang = locale === "am" ? am : en;
	const sectionBg = useColorModeValue("#f3f0e8", "#10191d");
	const headingColor = useColorModeValue("#143A45", "#e7eff0");
	const bodyColor = useColorModeValue("gray.600", "gray.300");
	const kickerColor = useColorModeValue("mainred", "#e6a17c");
	const divider = useColorModeValue("gray.300", "whiteAlpha.300");

	return (
		<Box as="section" bg={sectionBg} px={{ base: 5, md: 10, xl: 14 }} py={{ base: 14, md: 20 }}>
			<Box maxW="1440px" mx="auto">
				<Box h="1px" w="full" mb={{ base: 8, md: 11 }} bgGradient="linear(to-r, transparent, #bd6748, #e9b75c, transparent)" opacity=".8" />
				<Flex align={{ base: "flex-start", lg: "flex-end" }} justify="space-between" gap={{ base: 4, lg: 10 }} direction={{ base: "column", lg: "row" }}>
					<Box maxW="720px">
						<Text color={kickerColor} textTransform="uppercase" letterSpacing=".18em" fontWeight="bold" fontSize="xs">{lang.home.benefits_kicker}</Text>
						<Heading color={headingColor} fontSize={{ base: "3xl", md: "5xl" }} mt="3" letterSpacing="-.04em" lineHeight="1.12">{lang.home.benefits_title}</Heading>
					</Box>
					<Text maxW="470px" color={bodyColor} fontSize={{ base: "md", md: "lg" }} lineHeight="1.8" borderLeft={{ base: "none", lg: "2px solid" }} borderColor={divider} pl={{ base: 0, lg: 6 }}>
						{lang.home.benefits_description}
					</Text>
				</Flex>
				<SimpleGrid columns={{ base: 1, md: 3 }} spacing={{ base: 4, md: 5 }} mt={{ base: 8, md: 12 }}>
					<WhyCard number="01" title={lang.home.benefit_local_title} icon={<MdLocationOn size={27} />} desc={lang.home.benefit_local_description} />
					<WhyCard number="02" title={lang.home.benefit_clear_title} icon={<MdOutlineVerifiedUser size={27} />} desc={lang.home.benefit_clear_description} />
					<WhyCard number="03" title={lang.home.benefit_direct_title} icon={<MdHandshake size={27} />} desc={lang.home.benefit_direct_description} />
				</SimpleGrid>
			</Box>
		</Box>
	);
};

interface IWhyCard { number: string; title: string; icon: ReactNode; desc: string; }
const WhyCard: FC<IWhyCard> = ({ number, title, icon, desc }) => {
	const surface = useColorModeValue("white", "#17262b");
	const headingColor = useColorModeValue("#143A45", "#e7eff0");
	const bodyColor = useColorModeValue("gray.600", "gray.300");
	const iconSurface = useColorModeValue("#fbf0e9", "rgba(198,107,54,.18)");
	const border = useColorModeValue("gray.200", "whiteAlpha.200");
	const iconColor = useColorModeValue("mainred", "#e6a17c");
	const numberColor = useColorModeValue("gray.500", "gray.400");
	const shadow = useColorModeValue("0 12px 32px rgba(23,39,34,.075)", "0 16px 36px rgba(0,0,0,.25)");
	const hoverShadow = useColorModeValue("0 20px 42px rgba(21,42,44,.15)", "0 20px 42px rgba(0,0,0,.38)");
	return (
		<Box
			as="article"
			position="relative"
			overflow="hidden"
			minH={{ base: "230px", md: "290px" }}
			bg={surface}
			border="1px solid"
			borderColor={border}
			borderRadius="2xl"
			p={{ base: 6, md: 7 }}
			boxShadow={shadow}
			transition="transform 200ms ease, border-color 200ms ease, box-shadow 200ms ease"
			_hover={{ transform: "translateY(-4px)", borderColor: "mainorange", boxShadow: hoverShadow }}
		>
			<Box position="absolute" top="0" left="7" right="7" h="1px" bgGradient="linear(to-r, #bd6748, #e9b75c)" />
			<Flex align="center" justify="space-between" gap="4">
				<Flex w="14" h="14" flexShrink={0} align="center" justify="center" color={iconColor} bg={iconSurface} borderRadius="2xl">{icon}</Flex>
				<Text px="3" py="1.5" border="1px solid" borderColor={border} borderRadius="full" color={numberColor} fontSize="xs" fontWeight="bold" letterSpacing=".16em">{number}</Text>
			</Flex>
			<Heading mt={{ base: 6, md: 8 }} mb="3" color={headingColor} fontSize="xl" letterSpacing="-.02em">{title}</Heading>
			<Text color={bodyColor} lineHeight="1.8">{desc}</Text>
		</Box>
	);
};
