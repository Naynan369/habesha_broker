import { Box, Button, Flex, Heading, Image, SimpleGrid, Text } from "@chakra-ui/react";
import { useRouter } from "next/router";
import { am } from "@locales/am";
import { en } from "@locales/en";
import { MdArrowForward } from "react-icons/md";

const serviceCategoryImage = "https://images.unsplash.com/photo-1741388222137-c0d3007ec173?auto=format&fit=crop&crop=faces&w=1200&h=800&q=80";
const businessSpacesImage = "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1200&h=800&q=85";

export const CategoriesSection = () => {
	const { locale } = useRouter();
	const lang = locale === "am" ? am : en;

	return (
		<Box id="categories" as="section" scrollMarginTop="96px" bg="#f5f3ee" px={{ base: 5, md: 10, xl: 14 }} py={{ base: 14, md: 20 }}>
			<Box maxW="1440px" mx="auto">
				<Text color="#a84c3d" textTransform="uppercase" letterSpacing=".18em" fontWeight="bold" fontSize="xs">
					{lang.home.category_kicker}
				</Text>
				<Flex align={{ base: "flex-start", lg: "flex-end" }} justify="space-between" gap="6" mt="3" direction={{ base: "column", lg: "row" }}>
					<Box>
						<Heading color="#20383d" fontSize={{ base: "3xl", md: "4xl" }} letterSpacing="-.045em" lineHeight="1.1" maxW="760px">
							{lang.home.category_title}
						</Heading>
						<Text mt="4" color="gray.600" maxW="680px" fontSize={{ base: "sm", md: "md" }} lineHeight="1.75">
							{lang.home.category_description}
						</Text>
					</Box>
					<Flex align="center" gap="3" bg="white" border="1px solid" borderColor="gray.200" borderRadius="full" px="4" py="2.5" color="#536266" fontSize="sm" fontWeight="medium" boxShadow="0 5px 18px rgba(27,47,48,.05)">
						<Box w="2" h="2" borderRadius="full" bg="#bd6748" />
						{lang.home.category_hint}
					</Flex>
				</Flex>

				<SimpleGrid columns={{ base: 1, sm: 2, xl: 4 }} spacing={{ base: 4, md: 5 }} mt={{ base: 8, md: 10 }}>
					<Category title={lang.home.homes_title} categoryLabel={lang.home.category_labels.homes} image="/assets/images/homes-addis.jpg" description={lang.home.homes_description} action={lang.home.browse_homes} href="/explore?itemType=HOUSE" />
					<Category title={lang.home.vehicles_title} categoryLabel={lang.home.category_labels.vehicles} image="/assets/images/vehicles-addis.jpg" description={lang.home.vehicles_description} action={lang.home.browse_vehicles} href="/explore?itemType=CAR" />
					<Category title={lang.home.business_spaces_title} categoryLabel={lang.home.category_labels.businessSpaces} image={businessSpacesImage} description={lang.home.business_spaces_description} action={lang.home.browse_business_spaces} href="/explore?itemType=BUSINESS_SPACE" />
					<Category title={lang.home.services_txt} categoryLabel={lang.home.category_labels.services} image={serviceCategoryImage} description={lang.home.services_category_description} action={lang.home.browse_services} href="/explore?itemType=SERVICE" />
				</SimpleGrid>
			</Box>
		</Box>
	);
};

const Category = ({ title, categoryLabel, image, description, action, href }) => {
	const router = useRouter();
	const handleSelect = () => void router.push(href);

	return (
		<Button
			onClick={handleSelect}
			aria-label={`${action}: ${title}`}
			role="group"
			position="relative"
			display="flex"
			minW="0"
			minH={{ base: "300px", md: "340px" }}
			p="0"
			alignItems="stretch"
			justifyContent="stretch"
			whiteSpace="normal"
			textAlign="left"
			color="white"
			bg="#183238"
			border="1px solid"
			borderColor="whiteAlpha.400"
			borderRadius="2xl"
			overflow="hidden"
			boxShadow="0 12px 30px rgba(22, 42, 43, .12)"
			_hover={{ transform: "translateY(-4px)", boxShadow: "0 20px 42px rgba(22,42,43,.2)" }}
			_active={{ transform: "translateY(-1px)" }}
			_focusVisible={{ outline: "3px solid", outlineColor: "#d69254", outlineOffset: "3px" }}
			transition="transform 220ms ease, box-shadow 220ms ease"
		>
			<Box position="absolute" inset="0" bg="#183238">
				<Image
					src={image}
					alt=""
					aria-hidden="true"
					position="absolute"
					inset="0"
					w="full"
					h="full"
					objectFit="cover"
					loading="lazy"
					transition="transform 650ms cubic-bezier(.2,.7,.2,1)"
					_groupHover={{ transform: "scale(1.045)" }}
				/>
			</Box>
			<Box position="absolute" inset="0" bgGradient="linear(to-t, rgba(8,25,29,.96) 0%, rgba(8,25,29,.65) 43%, rgba(8,25,29,.12) 100%)" />
			<Flex position="relative" zIndex="1" direction="column" justify="space-between" align="stretch" w="full" minH={{ base: "300px", md: "340px" }} p={{ base: 5, md: 6 }}>
				<Flex align="center" justify="space-between" gap="3">
					<Text bg="whiteAlpha.200" border="1px solid" borderColor="whiteAlpha.300" backdropFilter="blur(10px)" color="whiteAlpha.900" borderRadius="full" px="3" py="1.5" fontSize="10px" fontWeight="bold" letterSpacing=".13em">
						{categoryLabel}
					</Text>
					<Flex align="center" justify="center" flexShrink={0} w="9" h="9" border="1px solid" borderColor="whiteAlpha.500" borderRadius="full" color="white" bg="blackAlpha.200" transition="all 180ms ease" _groupHover={{ bg: "#d7783f", borderColor: "#d7783f", transform: "translateX(2px)" }}>
						<MdArrowForward size="18" />
					</Flex>
				</Flex>
				<Box>
					<Heading as="h3" noOfLines={2} fontSize={{ base: "2xl", md: "2xl" }} letterSpacing="-.035em" lineHeight="1.1">
						{title}
					</Heading>
					<Text mt="3" noOfLines={3} color="whiteAlpha.800" fontSize="sm" lineHeight="1.65" fontWeight="normal">
						{description}
					</Text>
					<Flex mt="5" pt="4" align="center" gap="2" borderTop="1px solid" borderColor="whiteAlpha.300" color="#f3c278" fontSize="sm" fontWeight="bold">
						{action}
					</Flex>
				</Box>
			</Flex>
		</Button>
	);
};
