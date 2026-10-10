import { Box, Button, Flex, Heading, Image, Text } from "@chakra-ui/react";
import { useFilter } from "@libs/store";
import { useRouter } from "next/router";
import { am } from "@locales/am";
import { en } from "@locales/en";
import { MdArrowForward, MdStorefront } from "react-icons/md";

export const CategoriesSection = () => {
	const { locale } = useRouter();
	const lang = locale === "am" ? am : en;
	return (
		<Flex id="categories" as="section" direction="column" maxW="1440px" mx="auto" px={{ base: 6, md: 12, xl: 16 }} py={{ base: 16, md: 24 }}>
			<Text color="mainred" textTransform="uppercase" letterSpacing=".18em" fontWeight="bold" fontSize="xs">{lang.home.category_kicker}</Text>
			<Flex align={{ base: "flex-start", md: "flex-end" }} justify="space-between" gap="6" mt="3" direction={{ base: "column", md: "row" }}>
				<Box>
					<Heading fontSize={{ base: "3xl", md: "5xl" }} color="maingray" letterSpacing="-.04em">{lang.home.category_title}</Heading>
					<Text mt="4" color="gray.600" maxW="620px" fontSize={{ base: "md", md: "lg" }} lineHeight="1.75">{lang.home.category_description}</Text>
				</Box>
				<Text color="gray.500" fontSize="sm" fontWeight="medium">{lang.home.category_hint}</Text>
			</Flex>
			<Flex gap={{ base: 5, md: 7 }} align="stretch" mt={{ base: 9, md: 12 }} flexWrap="wrap">
				<Category title={lang.home.homes_title} itemType="HOUSE" image="/assets/images/homes-addis.jpg" description={lang.home.homes_description} number="01" action={lang.home.browse_homes} />
				<Category title={lang.home.vehicles_title} itemType="CAR" image="/assets/images/vehicles-addis.jpg" description={lang.home.vehicles_description} number="02" action={lang.home.browse_vehicles} />
				<Category title={lang.home.business_spaces_title} itemType="BUSINESS_SPACE" icon={<MdStorefront size="54" />} description={lang.home.business_spaces_description} number="03" action={lang.home.browse_business_spaces} />
			</Flex>
		</Flex>
	);
};

const Category = ({ title, itemType, image = "", icon = null, description, number, action }) => {
	const setField = useFilter((state) => state.setField);
	const router = useRouter();
	return (
		<Button
			onClick={() => { setField("itemType", itemType); router.push("/explore"); }}
			aria-label={`${action}: ${title}`}
			role="group"
			position="relative"
			display="flex"
			flex="1"
			minW={{ base: "100%", md: "320px" }}
			minH={{ base: "350px", md: "420px" }}
			p="0"
			alignItems="stretch"
			justifyContent="stretch"
			whiteSpace="normal"
			textAlign="left"
			color="white"
			bg="maingray"
			borderRadius="2xl"
			overflow="hidden"
			boxShadow="0 16px 40px rgba(18, 35, 31, .15)"
			_hover={{ transform: "translateY(-5px)", boxShadow: "0 24px 50px rgba(18,35,31,.24)" }}
			_active={{ transform: "translateY(-1px)" }}
			_focusVisible={{ outline: "3px solid", outlineColor: "mainyellow", outlineOffset: "3px" }}
			transition="all 220ms ease"
		>
			<Box position="absolute" inset="0" bg={image ? "maingray" : "linear-gradient(135deg, #263f43, #45615d 55%, #ad6348)"}>{image ? <Image src={image} alt="" aria-hidden="true" position="absolute" inset="0" w="full" h="full" objectFit="cover" transition="transform 500ms ease" _groupHover={{ transform: "scale(1.04)" }} /> : <Flex h="full" align="center" justify="center" color="whiteAlpha.300"><Box transition="transform 500ms ease" _groupHover={{ transform: "scale(1.08)" }}>{icon}</Box></Flex>}</Box>
			<Box position="absolute" inset="0" bgGradient="linear(to-t, rgba(8,25,25,.92) 0%, rgba(8,25,25,.48) 46%, rgba(8,25,25,.08) 100%)" />
			<Flex position="relative" zIndex="1" direction="column" justify="space-between" align="stretch" w="full" minH={{ base: "350px", md: "420px" }} p={{ base: 6, md: 9 }}>
				<Text color="whiteAlpha.800" fontSize="xs" fontWeight="bold" letterSpacing=".18em">{number} / {itemType === "HOUSE" ? "PROPERTY" : itemType === "CAR" ? "MOTORING" : "BUSINESS"}</Text>
				<Box>
					<Heading fontSize={{ base: "3xl", md: "4xl" }} letterSpacing="-.03em">{title}</Heading>
					<Text mt="3" maxW="420px" color="whiteAlpha.800" fontSize={{ base: "sm", md: "md" }} lineHeight="1.7" fontWeight="normal">{description}</Text>
					<Flex mt="6" align="center" gap="2" color="mainyellow" fontSize="sm" fontWeight="bold">{action}<MdArrowForward /></Flex>
				</Box>
			</Flex>
		</Button>
	);
};
