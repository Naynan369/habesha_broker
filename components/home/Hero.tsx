import { Box, Button, Flex, Heading, Input, Text } from "@chakra-ui/react";
import { SearchIcon } from "@chakra-ui/icons";
import { am } from "@locales/am";
import { en } from "@locales/en";
import { useRouter } from "next/router";
import Link from "next/link";
import { useState } from "react";

export const HomeHero = () => {
	const [search, setSearch] = useState("");
	const { locale, push } = useRouter();
	const lang = locale === "am" ? am : en;
	const submitSearch = () => {
		const keyword = search.trim();
		push(keyword ? `/explore/${encodeURIComponent(keyword)}` : "/explore");
	};

	return (
		<Flex
			id="home"
			position="relative"
			minHeight="min(850px, 100vh)"
			px={{ base: 6, md: "10%" }}
			pt={{ base: "28", md: "32" }}
			py="20"
			direction="column"
			justifyContent="center"
			color="white"
			backgroundImage="linear-gradient(90deg, rgba(7, 27, 39, .91) 0%, rgba(9, 37, 50, .76) 48%, rgba(9, 37, 50, .18) 100%), url('/assets/images/hero.svg')"
			backgroundSize="cover"
			backgroundPosition="center"
			overflow="hidden"
		>
			<Box maxW="720px" position="relative" zIndex={1}>
				<Flex alignItems="center" gap="3" mb="6">
					<Box h="1px" w="10" bg="mainyellow" />
					<Text color="mainyellow" fontSize="sm" fontWeight="bold" letterSpacing="0.18em" textTransform="uppercase">
						Habesha Brokers · Ethiopia
					</Text>
				</Flex>
				<Heading
					as="h1"
					fontSize={{ base: "4xl", sm: "5xl", md: "6xl" }}
					lineHeight="1.08"
					letterSpacing="-0.035em"
					fontWeight="800"
					maxW="700px"
				>
					{lang.home.hero_msg}
				</Heading>
				<Text mt="6" maxW="560px" color="whiteAlpha.800" fontSize={{ base: "md", md: "lg" }} lineHeight="1.8">
					Find a home or vehicle that fits your next move. Browse trusted local listings and connect directly with sellers.
				</Text>
				<Flex
					mt="9"
					bg="white"
					borderRadius="xl"
					boxShadow="2xl"
					maxW="620px"
					w="full"
					p="2"
					gap="2"
					alignItems="center"
					flexDirection={{ base: "column", sm: "row" }}
				>
					<Input
						aria-label={lang.home.search_placeholder}
						variant="unstyled"
						px="4"
						py={{ base: 3, sm: 2 }}
						color="gray.800"
						placeholder={lang.home.search_placeholder}
						value={search}
						onChange={(event) => setSearch(event.target.value)}
						onKeyDown={(event) => event.key === "Enter" && submitSearch()}
					/>
					<Button
						flexShrink={0}
						width={{ base: "full", sm: "auto" }}
						leftIcon={<SearchIcon />}
						colorScheme="red"
						borderRadius="lg"
						px="6"
						onClick={submitSearch}
					>
						{lang.home.search_btn}
					</Button>
				</Flex>
				<Flex mt="6" alignItems="center" gap="4" flexWrap="wrap">
					<Link href="/explore" passHref><Text as="a" color="white" fontWeight="semibold" _hover={{ color: "mainyellow" }}>Explore listings →</Text></Link>
					<Text color="whiteAlpha.700">•</Text>
					<Link href="/auth/login" passHref><Text as="a" color="whiteAlpha.900" _hover={{ color: "mainyellow" }}>{lang.home.work_btn}</Text></Link>
				</Flex>
			</Box>
			<Box position="absolute" bottom="8" right={{ base: 6, md: "10%" }} display={{ base: "none", md: "block" }} color="whiteAlpha.700" fontSize="xs" letterSpacing="0.2em" textTransform="uppercase">
				A better way to find your next place
			</Box>
		</Flex>
	);
};
