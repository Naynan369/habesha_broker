import { Box, Button, Flex, Heading, Input, Text, useColorModeValue } from "@chakra-ui/react";
import { SearchIcon } from "@chakra-ui/icons";
import { am } from "@locales/am";
import { en } from "@locales/en";
import { useRouter } from "next/router";
import Link from "next/link";
import { useState } from "react";
import { MdArrowForward, MdLocationOn, MdVerified } from "react-icons/md";

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
		<Box id="home" as="section" position="relative" minH={{ base: "760px", md: "min(860px, 100dvh)" }} color="white" overflow="hidden" bg="#000000">
			<Box
				aria-hidden="true"
				position="absolute"
				inset="0"
				backgroundImage="url('/assets/images/hero-addis.jpg')"
				backgroundSize="cover"
				backgroundPosition={{ base: "58% center", lg: "center 55%" }}
				transform="scale(1.015)"
			/>
			<Box position="absolute" inset="0" bgGradient="linear(to-r, rgba(7, 24, 23, .92) 0%, rgba(9, 31, 28, .76) 42%, rgba(9, 31, 28, .25) 100%)" />
			<Box position="absolute" inset="0" bgGradient="linear(to-t, rgba(8, 24, 23, .55) 0%, transparent 42%)" />
			<Flex
				position="relative"
				zIndex="1"
				maxW="1440px"
				minH={{ base: "760px", md: "min(860px, 100dvh)" }}
				mx="auto"
				px={{ base: 6, md: 12, xl: 16 }}
				pt={{ base: "112px", md: "136px" }}
				pb={{ base: 16, md: 24 }}
				direction="column"
				justifyContent="center"
			>
				<Box maxW="700px">
					<Flex align="center" gap="3" mb="6">
						<Box w="9" h="1px" bg="mainyellow" />
						<Text color="mainyellow" fontSize="xs" fontWeight="bold" letterSpacing=".2em" textTransform="uppercase">
							{lang.home.hero_kicker}
						</Text>
					</Flex>
					<Heading as="h1" fontSize={{ base: "4xl", sm: "5xl", md: "6xl", xl: "7xl" }} lineHeight="1.04" letterSpacing="-.045em" fontWeight="800" maxW="700px">
						{lang.home.hero_msg}
					</Heading>
					<Text mt="6" maxW="570px" color="whiteAlpha.800" fontSize={{ base: "md", md: "lg" }} lineHeight="1.8">
						{lang.home.hero_description}
					</Text>
					<form onSubmit={(event) => { event.preventDefault(); submitSearch(); }}>
					<Flex
						mt={{ base: 8, md: 10 }}
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
							<Input
								aria-label={lang.home.search_placeholder}
								variant="unstyled"
								px="3"
								py="3"
								color={searchText}
								placeholder={lang.home.search_placeholder}
								value={search}
								onChange={(event) => setSearch(event.target.value)}
							/>
						</Flex>
						<Button type="submit" flexShrink={0} w={{ base: "full", sm: "auto" }} leftIcon={<SearchIcon />} bg="mainyellow" color="maingray" borderRadius="xl" px="6" h="52px" _hover={{ bg: "#f0c875", transform: "translateY(-1px)" }}>
							{lang.home.search_btn}
						</Button>
					</Flex>
					</form>
					<Flex mt="6" align="center" gap={{ base: 4, md: 6 }} flexWrap="wrap">
						<Flex align="center" gap="2" color="whiteAlpha.800"><MdLocationOn color="#E9B75C" /><Text fontSize="sm">{lang.home.hero_note_local}</Text></Flex>
						<Flex align="center" gap="2" color="whiteAlpha.800"><MdVerified color="#E9B75C" /><Text fontSize="sm">{lang.home.hero_note_direct}</Text></Flex>
					</Flex>
				</Box>
				<Flex mt={{ base: 14, md: "auto" }} align="center" justify="space-between" gap="4" flexWrap="wrap" borderTop="1px solid" borderColor="whiteAlpha.300" pt="5">
					<Text color="whiteAlpha.700" fontSize="xs" letterSpacing=".16em" textTransform="uppercase">{lang.home.hero_bottomline}</Text>
					<Link legacyBehavior href="/explore" passHref><Flex as="a" align="center" gap="2" color="white" fontWeight="semibold" fontSize="sm" _hover={{ color: "mainyellow" }}>{lang.home.browse_action}<MdArrowForward /></Flex></Link>
				</Flex>
			</Flex>
		</Box>
	);
};
