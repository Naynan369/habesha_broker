import { Button, Box, Flex, Heading, Text, useColorModeValue } from "@chakra-ui/react";
import { am } from "@locales/am";
import { en } from "@locales/en";
import { useRouter } from "next/router";
import Link from "next/link";
import { MdArrowForward, MdCheckCircle } from "react-icons/md";

export const PricingSection = () => {
	const { locale } = useRouter();
	const lang = locale === "am" ? am : en;
	const headingColor = useColorModeValue("#143A45", "#e7eff0");
	const bodyColor = useColorModeValue("gray.600", "gray.300");
	const kickerColor = useColorModeValue("mainred", "#e6a17c");
	const checkColor = useColorModeValue("#42705d", "#8fd0a3");
	return (
		<Flex as="section" maxW="1440px" mx="auto" w="full" px={{ base: 6, md: 12, xl: 16 }} py={{ base: 16, md: 24 }} direction={{ base: "column", lg: "row" }} align="center" justify="space-between" gap={{ base: 10, lg: 16 }}>
			<Box maxW="620px">
				<Text color={kickerColor} textTransform="uppercase" letterSpacing=".18em" fontWeight="bold" fontSize="xs">{lang.home.pricing_kicker}</Text>
				<Heading color={headingColor} fontSize={{ base: "3xl", md: "5xl" }} mt="3" letterSpacing="-.04em" lineHeight="1.1">{lang.home.pricing_title}</Heading>
				<Text mt="5" color={bodyColor} fontSize={{ base: "md", md: "lg" }} lineHeight="1.8">{lang.home.pricing_description}</Text>
				<Flex mt="7" align="flex-start" gap="3" color={headingColor}><MdCheckCircle color={checkColor} size={22} /><Text fontWeight="semibold">{lang.home.pricing_benefit}</Text></Flex>
			</Box>
			<Flex direction="column" flexShrink={0} w={{ base: "full", lg: "440px" }} bg="maingray" color="white" borderRadius="3xl" p={{ base: 7, md: 10 }} boxShadow="0 24px 55px rgba(12, 37, 43, .18)">
				<Text color="mainyellow" fontWeight="bold" fontSize="xs" textTransform="uppercase" letterSpacing=".18em">{lang.home.pricing_label}</Text>
				<Flex align="baseline" gap="3" mt="4"><Heading fontSize={{ base: "5xl", md: "6xl" }} letterSpacing="-.05em">500</Heading><Text color="whiteAlpha.800" fontSize="lg" fontWeight="semibold">ETB</Text></Flex>
				<Text mt="4" color="whiteAlpha.800" lineHeight="1.8">{lang.home.pricing_note}</Text>
				<Link href="/auth/sign_up" passHref><Button as="a" mt="8" bg="mainyellow" color="maingray" borderRadius="xl" h="52px" rightIcon={<MdArrowForward />} _hover={{ bg: "#f0c875", transform: "translateY(-1px)" }}>{lang.home.pricing_cta}</Button></Link>
			</Flex>
		</Flex>
	);
};
