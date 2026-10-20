import { Box, useColorModeValue } from "@chakra-ui/react";
import { CategoriesSection } from "@components/home/CategoriesSection";
import { HomeContact } from "@components/home/Contact";
import { HomeFooter } from "@components/home/Footer";
import { HomeHero } from "@components/home/Hero";
import { SiteNavbar } from "@components/shared/SiteNavbar";
import { FeaturedListings } from "@components/home/FeaturedListings";
import { ServicesSection } from "@components/home/ServicesSection";
import { WhyChooseSection } from "@components/home/WhyChooseSection";
import { HomeMotionSystem, HomeReveal } from "@components/home/HomeMotion";
import { withSessionSsr } from "@config/cookie/cookie";
import { prisma } from "@config/prisma";

export const getServerSideProps = withSessionSsr(async ({ req }) => {
	let featuredListings = [];
	try {
		const items = await prisma.item.findMany({
			where: { status: "APPROVED", featured: true },
			include: {
				user: { select: { firstName: true, lastName: true, profile_url: true } },
				BusinessSpace: { select: { priceFrequency: true } },
				Service: { select: { category: true } },
			},
			orderBy: { createdAt: "desc" },
			take: 6,
		});
		featuredListings = items.map((item) => ({
			id: item.id,
			title: item.title,
			date: item.createdAt.toISOString(),
			photoURL: item.images[0] || "",
			ownerName: [item.user.firstName, item.user.lastName].filter(Boolean).join(" "),
			ownerPhoto: item.user.profile_url || undefined,
			price: String(item.price),
			itemType: item.itemType,
			priceFrequency: item.BusinessSpace?.priceFrequency || undefined,
			serviceCategory: item.Service?.category || undefined,
			featured: item.featured,
		}));
	} catch (error) {
		console.error("[home] Could not load featured listings", error);
	}
	return { props: { user: req.user || null, featuredListings } };
});

export default function Home({ user, featuredListings }) {
	const canvas = useColorModeValue("#f5f5f1", "#000000");

	return (
		<Box id="pageContainer" minH="100dvh" overflowX="hidden" bg={canvas}>
			<HomeMotionSystem />
			<SiteNavbar mode="public" user={user} />
			<main>
				<HomeHero />
				<HomeReveal><FeaturedListings items={featuredListings} /></HomeReveal>
				<HomeReveal><CategoriesSection /></HomeReveal>
				<HomeReveal><ServicesSection /></HomeReveal>
				<HomeReveal><WhyChooseSection /></HomeReveal>
				<HomeReveal><HomeContact /></HomeReveal>
			</main>
			<HomeReveal><HomeFooter /></HomeReveal>
		</Box>
	);
}
