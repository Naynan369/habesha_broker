import { Box, Button, Flex, Heading, Text, useColorModeValue } from "@chakra-ui/react";
import { ColorModeToggle } from "@components/shared/ColorModeToggle";
import Link from "next/link";
import { BrandLogo } from "@components/shared/BrandLogo";

export default function ItemsPage() {
	const canvas = useColorModeValue("#f5f5f1", "#000000");
	const surface = useColorModeValue("white", "#111111");
	const textColor = useColorModeValue("#143A45", "#e7eff0");
	const mutedColor = useColorModeValue("gray.600", "gray.300");
	const borderColor = useColorModeValue("gray.200", "whiteAlpha.200");
	return (
		<Flex minH="100vh" direction="column" bg={canvas}>
			<Flex as="header" align="center" minH="72px" px={{ base: 5, md: 10 }} bg={surface} color={textColor} borderBottom="1px solid" borderColor={borderColor}>
				<BrandLogo />
				<Box flex="1" />
				<ColorModeToggle />
			</Flex>
			<Flex flex="1" align="center" justify="center" px="5" py="16">
				<Box maxW="xl" textAlign="center" p={{ base: 7, md: 10 }} bg={surface} color={textColor} border="1px solid" borderColor={borderColor} borderRadius="3xl" boxShadow="0 16px 48px rgba(21,42,44,.08)">
					<Text color="mainorange" fontSize="xs" fontWeight="bold" textTransform="uppercase" letterSpacing=".16em">Habesha Brokers marketplace</Text>
					<Heading mt="3" fontSize={{ base: "2xl", md: "3xl" }} letterSpacing="-.04em">Explore local listings</Heading>
					<Text mt="4" color={mutedColor} lineHeight="1.7">Browse homes, vehicles, business spaces, and practical local services across Ethiopia.</Text>
					<Link legacyBehavior href="/explore" passHref><Button as="a" mt="7" bg="mainorange" color="white" borderRadius="xl" h="12" px="6" _hover={{ bg: "#ad582a" }}>Browse listings</Button></Link>
				</Box>
			</Flex>
		</Flex>
	);
}
