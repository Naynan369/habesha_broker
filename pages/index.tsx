import { Box } from "@chakra-ui/react";
import { CategoriesSection } from "@components/home/CategoriesSection";
import { HomeContact } from "@components/home/Contact";
import { HomeFooter } from "@components/home/Footer";
import { HomeHero } from "@components/home/Hero";
import { HomeNavbar, MobileMenu } from "@components/home/Navbar";
import { PricingSection } from "@components/home/Pricing";
import { WhyChooseSection } from "@components/home/WhyChooseSection";
import React, { useState } from "react";

export default function Home() {
	const [mobMenu, setMobMenu] = useState(false);
	const toggleMenu = () => setMobMenu((open) => !open);

	return (
		<Box id="pageContainer" minH="100vh" overflowX="hidden" bg="white">
			<HomeNavbar openFunc={toggleMenu} background="transparent" />
			<MobileMenu open={mobMenu} closeFunc={toggleMenu} />
			<main>
				<HomeHero />
				<CategoriesSection />
				<WhyChooseSection />
				<PricingSection />
				<HomeContact />
			</main>
			<HomeFooter />
		</Box>
	);
}
