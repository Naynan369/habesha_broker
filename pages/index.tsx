import { Box, useColorModeValue } from "@chakra-ui/react";
import { CategoriesSection } from "@components/home/CategoriesSection";
import { HomeContact } from "@components/home/Contact";
import { HomeFooter } from "@components/home/Footer";
import { HomeHero } from "@components/home/Hero";
import { HomeNavbar, MobileMenu } from "@components/home/Navbar";
import { ServicesSection } from "@components/home/ServicesSection";
import { WhyChooseSection } from "@components/home/WhyChooseSection";
import { withSessionSsr } from "@config/cookie/cookie";
import React, { useState } from "react";

export const getServerSideProps = withSessionSsr(async ({ req }) => ({
	props: { user: req.user || null },
}));

export default function Home({ user }) {
	const [mobMenu, setMobMenu] = useState(false);
	const canvas = useColorModeValue("#f5f5f1", "#000000");
	const toggleMenu = () => setMobMenu((open) => !open);

	return (
		<Box id="pageContainer" minH="100dvh" overflowX="hidden" bg={canvas}>
			<HomeNavbar user={user} openFunc={toggleMenu} background="transparent" />
			<MobileMenu user={user} open={mobMenu} closeFunc={toggleMenu} />
			<main>
				<HomeHero />
				<CategoriesSection />
				<ServicesSection />
				<WhyChooseSection />
				<HomeContact />
			</main>
			<HomeFooter />
		</Box>
	);
}
