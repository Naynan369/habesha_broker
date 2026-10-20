import { Box, Button, Flex, Heading, SimpleGrid, Text, useColorModeValue } from "@chakra-ui/react";
import { ItemCard } from "@components/explore/ItemCard";
import { useLang } from "@libs/hooks/useLang";
import Link from "next/link";
import type { CSSProperties, PointerEvent as ReactPointerEvent } from "react";

interface FeaturedListing {
	id: string;
	title: string;
	date: string;
	photoURL: string;
	ownerName: string;
	ownerPhoto?: string;
	price: string;
	itemType: string;
	priceFrequency?: string;
	serviceCategory?: string;
	featured: boolean;
}

export const FeaturedListings = ({ items = [] }: { items?: FeaturedListing[] }) => {
	const lang = useLang();
	const copy = lang.home;
	const background = useColorModeValue("#f5f5f1", "#050505");
	const heading = useColorModeValue("#143a45", "#edf2f2");
	const muted = useColorModeValue("gray.600", "gray.400");
	const moveCard = (event: ReactPointerEvent<HTMLDivElement>) => {
		if (event.pointerType !== "mouse") return;
		const bounds = event.currentTarget.getBoundingClientRect();
		const x = (event.clientX - bounds.left) / bounds.width;
		const y = (event.clientY - bounds.top) / bounds.height;
		event.currentTarget.style.setProperty("--card-tilt-x", ((0.5 - y) * 3).toFixed(2) + "deg");
		event.currentTarget.style.setProperty("--card-tilt-y", ((x - 0.5) * 3).toFixed(2) + "deg");
	};
	const clearCard = (event: ReactPointerEvent<HTMLDivElement>) => {
		event.currentTarget.style.removeProperty("--card-tilt-x");
		event.currentTarget.style.removeProperty("--card-tilt-y");
	};

	if (!items.length) return null;

	return (
		<Box id="featured-listings" as="section" aria-labelledby="featured-listings-heading" bg={background} px={{ base: 5, md: 10, xl: 14 }} py={{ base: 12, md: 16 }}>
			<Box maxW="1440px" mx="auto">
				<Flex align={{ base: "flex-start", sm: "flex-end" }} justify="space-between" gap="5" mb={{ base: 6, md: 8 }} direction={{ base: "column", sm: "row" }}>
					<Box>
						<Text color="mainorange" textTransform="uppercase" letterSpacing=".16em" fontWeight="bold" fontSize="xs">{copy.featured_kicker}</Text>
						<Heading id="featured-listings-heading" as="h2" mt="2" color={heading} fontSize={{ base: "2xl", md: "4xl" }} letterSpacing="-.04em">{copy.featured_title}</Heading>
						<Text mt="2" color={muted} maxW="2xl" fontSize={{ base: "sm", md: "md" }} lineHeight="1.7">{copy.featured_description}</Text>
					</Box>
					<Link href="/explore" legacyBehavior passHref>
						<Button as="a" flexShrink={0} variant="outline" colorScheme="orange" borderRadius="xl">{copy.featured_browse}</Button>
					</Link>
				</Flex>
				<SimpleGrid columns={{ base: 1, sm: 2, xl: 3 }} spacing={{ base: 4, md: 6 }}>
					{items.map((item, index) => (
						<Box key={item.id} className="home-featured-card" data-home-stagger position="relative" borderRadius="2xl" style={{ "--home-stagger-delay": Math.min(index, 4) * 260 + "ms" } as CSSProperties} onPointerMove={moveCard} onPointerLeave={clearCard}>
							<ItemCard {...item} />
						</Box>
					))}
				</SimpleGrid>
			</Box>
		</Box>
	);
};
