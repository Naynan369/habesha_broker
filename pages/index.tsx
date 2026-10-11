import { Box, useColorModeValue } from "@chakra-ui/react";
import { CategoriesSection } from "@components/home/CategoriesSection";
import { HomeContact } from "@components/home/Contact";
import { HomeFooter } from "@components/home/Footer";
import { HomeHero } from "@components/home/Hero";
import { HomeNavbar, MobileMenu } from "@components/home/Navbar";
import { PricingSection } from "@components/home/Pricing";
import { ServicesSection } from "@components/home/ServicesSection";
import { WhyChooseSection } from "@components/home/WhyChooseSection";
import { withSessionSsr } from "@config/cookie/cookie";
import React, { useState } from "react";

export const getServerSideProps = withSessionSsr(async ({ req }) => ({
	props: { user: req.session.user || null },
}));

export default function Home({ user }) {
	const [mobMenu, setMobMenu] = useState(false);
	const canvas = useColorModeValue("#f5f5f1", "#10191d");
	const toggleMenu = () => setMobMenu((open) => !open);

	return (
		<Box id="pageContainer" minH="100vh" overflowX="hidden" bg={canvas}>
			<HomeNavbar user={user} openFunc={toggleMenu} background="transparent" />
			<MobileMenu user={user} open={mobMenu} closeFunc={toggleMenu} />
			<main>
				<HomeHero />
				<CategoriesSection />
				<ServicesSection />
				<WhyChooseSection />
				<PricingSection />
				<HomeContact />
			</main>
			<HomeFooter />
		</Box>
	);
}
