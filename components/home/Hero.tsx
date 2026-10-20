import { Box, Button, Flex, Heading, Input, Text, useColorModeValue } from "@chakra-ui/react";
import { SearchIcon } from "@chakra-ui/icons";
import { am } from "@locales/am";
import { en } from "@locales/en";
import { useRouter } from "next/router";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useState } from "react";
import { MdArrowForward, MdLocationOn, MdVerified } from "react-icons/md";

const HeroThreeScene = dynamic(() => import("./HeroThreeScene"), {
	ssr: false,
	loading: () => <div aria-hidden="true" style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at 76% 48%, rgba(233,183,92,.13), transparent 42%)" }} />,
});

export const HomeHero = () => {
	const [search, setSearch] = useState("");
	const { locale, push } = useRouter();
	const lang = locale === "am" ? am : en;
	const searchSurface = useColorModeValue("white", "#111111");
	const searchText = useColorModeValue("gray.800", "gray.100");
	const searchBorder = useColorModeValue("whiteAlpha.500", "whiteAlpha.300");
	const amharic = locale === "am";
	const sceneLabels = amharic ? {
		home: "ቤቶች",
		vehicle: "ተሽከርካሪዎች",
		day: "ቀን",
		night: "ሌሊት",
		interior: "ውስጡን ይመልከቱ",
		facade: "ውጫዊ እይታ",
		reset: "እንደገና አስጀምር",
		architecture: "ቤቶች እና አፓርታማዎች",
		vehicleDetail: "መኪናዎች",
		dragHint: "ለማዞር ይጎትቱ · ለማጉላት ያንሸራትቱ",
		browseHomes: "ቤቶችን ይመልከቱ",
		browseVehicles: "መኪናዎችን ይመልከቱ",
		localePrefix: "/am",
	} : {
		home: "Homes",
		vehicle: "Vehicles",
		day: "Day",
		night: "Night",
		interior: "Open interior",
		facade: "Show facade",
		reset: "Reset view",
		architecture: "Homes & apartments",
		vehicleDetail: "Vehicles",
		dragHint: "Drag to orbit · scroll to zoom",
		browseHomes: "Explore homes",
		browseVehicles: "Explore vehicles",
		localePrefix: "",
	};

	const submitSearch = () => {
		const keyword = search.trim();
		push(keyword ? `/explore/${encodeURIComponent(keyword)}` : "/explore");
	};

	return (
		<Box
			id="home"
			as="section"
			position="relative"
			minH={{ base: "1040px", sm: "980px", lg: "min(900px, 100dvh)" }}
			color="white"
			overflow="hidden"
			bg="#071918"
		>
			<Box aria-hidden="true" position="absolute" inset="0" bgGradient="linear(to-br, #0a2423 0%, #071918 48%, #102826 100%)" />
			<Box aria-hidden="true" position="absolute" top="-30%" right="-10%" w="70vw" h="85%" bg="radial-gradient(ellipse, rgba(226,178,100,.13), transparent 65%)" />
			<Box aria-hidden="true" position="absolute" bottom="-30%" left="-8%" w="55vw" h="70%" bg="radial-gradient(ellipse, rgba(73,127,119,.17), transparent 70%)" />
			<Box position="absolute" inset="0" zIndex="1" aria-label="Illustrated apartment and car background">
				<HeroThreeScene labels={sceneLabels} />
			</Box>
			<Flex
				position="relative"
				zIndex="3"
				pointerEvents="none"
				maxW="1440px"
				minH={{ base: "1040px", sm: "980px", lg: "min(900px, 100dvh)" }}
				mx="auto"
				px={{ base: 5, sm: 7, md: 10, xl: 14 }}
				pt={{ base: "126px", lg: "138px" }}
				pb={{ base: 8, md: 10 }}
				direction="column"
				justify="center"
			>
				<Flex direction="column" align="flex-start" justify="center" flex="1">
					<Box w="full" maxW="650px" position="relative" zIndex="3" py={{ base: 2, lg: 7 }} pointerEvents="auto">
						<Flex className="hero-enter hero-enter-1" align="center" gap="3" mb="6">
							<Box w="9" h="1px" bg="mainyellow" />
							<Text color="mainyellow" fontSize="xs" fontWeight="bold" letterSpacing=".2em" textTransform="uppercase">{lang.home.hero_kicker}</Text>
						</Flex>
						<Heading className="hero-enter hero-enter-2" as="h1" fontSize={{ base: "4xl", sm: "5xl", md: "6xl", xl: "7xl" }} lineHeight="1.04" letterSpacing="-.045em" fontWeight="800" maxW="650px">
							{lang.home.hero_msg}
						</Heading>
						<Text className="hero-enter hero-enter-3" mt="6" maxW="560px" color="whiteAlpha.800" fontSize={{ base: "md", md: "lg" }} lineHeight="1.8">
							{lang.home.hero_description}
						</Text>
						<form className="hero-enter hero-enter-4" onSubmit={(event) => { event.preventDefault(); submitSearch(); }}>
							<Flex
								mt={{ base: 7, md: 9 }}
								bg={searchSurface}
								border="1px solid"
								borderColor={searchBorder}
								borderRadius="2xl"
								boxShadow="0 20px 60px rgba(0,0,0,.24)"
								maxW="650px"
								w="full"
								p={{ base: 2, sm: 2.5 }}
								gap="2"
								align="center"
								flexDirection={{ base: "column", sm: "row" }}
							>
								<Flex flex="1" w="full" align="center" pl={{ base: 3, sm: 4 }}>
									<SearchIcon color="gray.400" />
									<Input aria-label={lang.home.search_placeholder} variant="unstyled" px="3" py="3" color={searchText} placeholder={lang.home.search_placeholder} value={search} onChange={(event) => setSearch(event.target.value)} />
								</Flex>
								<Button type="submit" flexShrink={0} w={{ base: "full", sm: "auto" }} leftIcon={<SearchIcon />} bg="mainyellow" color="maingray" borderRadius="xl" px="6" h="52px" _hover={{ bg: "#f0c875", transform: "translateY(-1px)" }}>
									{lang.home.search_btn}
								</Button>
							</Flex>
						</form>
						<Flex className="hero-enter hero-enter-5" mt="6" align="center" gap={{ base: 4, md: 6 }} flexWrap="wrap">
							<Flex align="center" gap="2" color="whiteAlpha.800"><MdLocationOn color="#E9B75C" /><Text fontSize="sm">{lang.home.hero_note_local}</Text></Flex>
							<Flex align="center" gap="2" color="whiteAlpha.800"><MdVerified color="#E9B75C" /><Text fontSize="sm">{lang.home.hero_note_direct}</Text></Flex>
						</Flex>
					</Box>
				</Flex>

				<Flex mt={{ base: 5, lg: 1 }} align="center" justify="space-between" gap="4" flexWrap="wrap" borderTop="1px solid" borderColor="whiteAlpha.300" pt="5" pointerEvents="none">
					<Text color="whiteAlpha.700" fontSize="xs" letterSpacing=".16em" textTransform="uppercase">{lang.home.hero_bottomline}</Text>
					<Link legacyBehavior href="/explore" passHref><Flex as="a" pointerEvents="auto" align="center" gap="2" color="white" fontWeight="semibold" fontSize="sm" _hover={{ color: "mainyellow" }}>{lang.home.browse_action}<MdArrowForward /></Flex></Link>
				</Flex>
			</Flex>
		</Box>
	);
};
