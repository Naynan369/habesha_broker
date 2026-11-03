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

	const submitSearch = () => {
		const keyword = search.trim();
		push(keyword ? `/explore/${encodeURIComponent(keyword)}` : "/explore");
	};

	return (
		<Box
			id="home"
			as="section"
			position="relative"
			minH={{ base: "820px", lg: "min(900px, 100dvh)" }}
			color="white"
			overflow="hidden"
			bg="#1d1b1c"
		>
			<Box aria-hidden="true" pointerEvents="none" position="absolute" inset="0" bgGradient="linear(120deg, #1d1b1c 0%, #2b2828 48%, #55483f 100%)" />
			<Box aria-hidden="true" pointerEvents="none" position="absolute" top="-22%" right="-12%" w={{ base: "100%", md: "75%" }} h="110%" bg="radial-gradient(ellipse, rgba(251,205,139,.36) 0%, rgba(194,128,88,.15) 40%, transparent 72%)" />
			<Box aria-hidden="true" pointerEvents="none" position="absolute" bottom="-62%" left="-18%" w="85%" h="110%" bg="radial-gradient(ellipse, rgba(128,82,66,.25), transparent 68%)" />
			<Box aria-hidden="true" pointerEvents="none" position="absolute" top="20%" right="-10%" w="50%" h="82%" bg="radial-gradient(ellipse, rgba(187,137,92,.18), transparent 70%)" />
			<Box position="absolute" inset="0" zIndex="1" pointerEvents="none" aria-hidden="true">
				<HeroThreeScene />
			</Box>
			<Flex
				position="relative"
				zIndex="3"
				pointerEvents="none"
				maxW="1440px"
				minH={{ base: "820px", lg: "min(900px, 100dvh)" }}
				mx="auto"
				px={{ base: 5, sm: 7, md: 10, xl: 14 }}
				pt={{ base: "365px", md: "160px", lg: "138px" }}
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
					<Button type="submit" flexShrink={0} w={{ base: "full", sm: "auto" }} leftIcon={<SearchIcon />} bg="#861657" color="white" borderRadius="xl" px="6" h="52px" boxShadow="0 10px 28px rgba(134,22,87,.34)" _hover={{ bg: "#9a1b66", boxShadow: "0 12px 32px rgba(154,27,102,.4)", transform: "translateY(-1px)" }} _active={{ bg: "#701246", transform: "translateY(1px)" }}>
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
