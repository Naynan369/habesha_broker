import { Box, Flex, Heading, Image, Text, useColorModeValue } from "@chakra-ui/react";
import { keyframes } from "@emotion/react";
import { am } from "@locales/am";
import { en } from "@locales/en";
import { useRouter } from "next/router";

const serviceCategories = ["BROKER_SUPPORT", "PROPERTY_PHOTOGRAPHY", "MOVING", "CLEANING", "REPAIRS", "PROPERTY_MANAGEMENT"];
const serviceCarouselScroll = keyframes`
	from { transform: translate3d(0, 0, 0); }
	to { transform: translate3d(-50%, 0, 0); }
`;

const servicePhotos = [
	"https://images.unsplash.com/photo-1770199105692-9e52ff137cad?auto=format&fit=crop&crop=faces&w=1200&h=800&q=80",
	"https://images.unsplash.com/photo-1780191751680-cdd89eef7b27?auto=format&fit=crop&crop=faces&w=1200&h=800&q=80",
	"https://images.unsplash.com/photo-1758523670991-ee93bc48d81d?auto=format&fit=crop&crop=faces&w=1200&h=800&q=80",
	"https://images.unsplash.com/photo-1686178827149-6d55c72d81df?auto=format&fit=crop&crop=faces&w=1200&h=800&q=80",
	"https://images.unsplash.com/photo-1741388222137-c0d3007ec173?auto=format&fit=crop&crop=faces&w=1200&h=800&q=80",
	"https://images.unsplash.com/photo-1741156386380-0236c72eb6f9?auto=format&fit=crop&crop=faces&w=1200&h=800&q=80",
];

export const ServicesSection = () => {
	const { locale } = useRouter();
	const lang = locale === "am" ? am : en;
	const cards = lang.home.service_cards;
	const sectionBackground = useColorModeValue("#282427", "#000000");
	const imageFallback = useColorModeValue("#3a3432", "#0c0c0c");

	const renderCards = (isDuplicate: boolean) => cards.map((card, index) => {
		const photo = servicePhotos[index];
		const category = serviceCategories[index];
		const exploreHref = `${locale === "am" ? "/am" : ""}/explore?itemType=SERVICE&serviceCategory=${category}`;
		if (!photo || !category) return null;

		return (
			<Flex
				key={`${isDuplicate ? "duplicate-" : ""}${category}`}
				as="a"
				href={exploreHref}
				tabIndex={isDuplicate ? -1 : undefined}
				direction="column"
				align="center"
				justify="flex-start"
				flex="0 0 auto"
				w={{ base: "144px", sm: "164px" }}
				minH={{ base: "150px", sm: "166px" }}
				textDecoration="none"
				transition="transform 220ms ease"
				_hover={{ transform: "translateY(-4px)" }}
				_focusVisible={{ outline: "3px solid", outlineColor: "mainyellow", outlineOffset: "3px" }}
				aria-hidden={isDuplicate ? true : undefined}
			>
				<Box
					position="relative"
					flexShrink={0}
					w={{ base: "104px", sm: "120px" }}
					h={{ base: "104px", sm: "120px" }}
					border="2px solid"
					borderColor="whiteAlpha.500"
					borderRadius="full"
					overflow="hidden"
					bg={imageFallback}
					boxShadow="0 12px 28px rgba(0, 0, 0, .22)"
					transition="border-color 220ms ease, box-shadow 220ms ease"
					_hover={{ borderColor: "mainyellow", boxShadow: "0 14px 32px rgba(0, 0, 0, .3)" }}
				>
					<Image
						src={photo}
						alt=""
						aria-hidden="true"
						position="absolute"
						inset="0"
						w="full"
						h="full"
						objectFit="cover"
						loading="lazy"
						transition="transform 700ms cubic-bezier(.2,.7,.2,1)"
					/>
					<Box position="absolute" inset="0" pointerEvents="none" bgGradient="linear(to-t, rgba(23,19,20,.34), transparent 72%)" />
				</Box>
				<Heading as="h3" noOfLines={2} textAlign="center" w="full" mt="3" color="white" fontSize={{ base: "xs", sm: "sm" }} fontWeight="semibold" lineHeight="1.3" letterSpacing="-.01em">
						{card.title}
					</Heading>
			</Flex>
		);
	});

	return (
		<Box id="services" as="section" scrollMarginTop="96px" bg={sectionBackground} px={{ base: 5, md: 10, xl: 14 }} py={{ base: 12, md: 16 }}>
			<Box maxW="1440px" mx="auto">
				<Flex align="center" justify="space-between" gap="5" mb={{ base: 5, md: 7 }}>
					<Box>
						<Text color="mainyellow" textTransform="uppercase" letterSpacing=".18em" fontWeight="bold" fontSize="xs">
							{lang.home.services_kicker}
						</Text>
						<Heading as="h2" color="white" fontSize={{ base: "2xl", md: "4xl" }} letterSpacing="-.04em" mt="2" lineHeight="1.12">
							{lang.home.services_title}
						</Heading>
						<Text color="whiteAlpha.800" maxW="680px" fontSize={{ base: "sm", md: "md" }} lineHeight="1.65" mt="2">
							{lang.home.services_description}
						</Text>
					</Box>
				</Flex>

				<Box
					className="services-carousel-viewport"
					role="region"
					aria-label={lang.home.services_title}
					tabIndex={0}
					overflowX="auto"
					overflowY="hidden"
					pb="2"
					css={{ scrollbarWidth: "none", "&::-webkit-scrollbar": { display: "none" } }}
				>
					<Flex
						align="stretch"
						w="max-content"
						sx={{
							animation: `${serviceCarouselScroll} 48s linear infinite`,
							willChange: "transform",
							"@media (prefers-reduced-motion: reduce)": { animation: "none" },
						}}
					>
						<Flex className="services-carousel-group" align="stretch" flex="0 0 auto" gap="4" pr="4">
							{renderCards(false)}
						</Flex>
						<Flex className="services-carousel-group" align="stretch" flex="0 0 auto" gap="4" pr="4" aria-hidden="true">
							{renderCards(true)}
						</Flex>
					</Flex>
				</Box>
			</Box>
		</Box>
	);
};
