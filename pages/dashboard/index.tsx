import { Box, Container, Flex, Heading, SimpleGrid, Text, useColorModeValue } from "@chakra-ui/react";
import { NavBar } from "@components/dashboard/Navbar";
import { Profile } from "@components/dashboard/Profile";
import { RecentActivities } from "@components/dashboard/RecentActivities/RecentActivities";
import { withSessionSsr } from "@config/cookie/cookie";
import axios from "axios";
import { useUser } from "@libs/store";
import { useLang } from "@libs/hooks/useLang";
import Link from "next/link";
import Head from "next/head";
import { useRouter } from "next/router";
import React, { FC, ReactNode } from "react";
import { MdAddShoppingCart, MdArrowForward, MdCheckCircle, MdListAlt, MdSave } from "react-icons/md";

export const getServerSideProps = withSessionSsr(async ({ req, locale }) => {
    const user = req.user;
    if (!user) {
        return { redirect: { destination: locale === "am" ? "/am/auth/login/" : "/auth/login/" }, props: {} };
    }
    return { props: { user } };
});

export default function Dashboard({ user }) {
    const router = useRouter();
    const dashboardText = useLang().dashboardPage;
    const logout = useUser((state) => state.logout);
    const pageBg = useColorModeValue("#f5f5f1", "#000000");
    const muted = useColorModeValue("gray.600", "gray.400");
    const heroSurface = useColorModeValue("white", "#0c0c0c");
    const heroBorder = useColorModeValue("gray.200", "whiteAlpha.200");
    const verifiedBg = useColorModeValue("green.50", "rgba(72,187,120,.14)");
    const pendingBg = useColorModeValue("orange.50", "rgba(237,137,54,.14)");
    const verifiedText = useColorModeValue("green.700", "green.200");
    const pendingText = useColorModeValue("orange.700", "orange.200");
    const statusBg = user.verfied ? verifiedBg : pendingBg;
    const statusText = user.verfied ? verifiedText : pendingText;

    const handleLogout = async () => {
        logout();
        try {
            await axios.post("/api/user/logout");
        } finally {
            router.replace("/auth/login", undefined, { locale: router.locale });
        }
    };

    return (
        <>
            <Head><title>{dashboardText.pageTitle}</title></Head>
            <Flex minH="100dvh" direction="column" bg={pageBg}>
                <NavBar logout={handleLogout} />
                <Container maxW="7xl" flex="1" py={{ base: 8, md: 12 }} px={{ base: 5, md: 8 }}>
                    <Flex as="section" mb={{ base: 7, md: 9 }} p={{ base: 5, md: 8 }} bg={heroSurface} border="1px solid" borderColor={heroBorder} borderRadius="3xl" boxShadow="0 12px 36px rgba(21,42,44,.06)" align={{ base: "flex-start", md: "center" }} justify="space-between" gap="6" direction={{ base: "column", md: "row" }}>
                        <Box>
                            <Text color="mainorange" fontSize="xs" fontWeight="bold" letterSpacing=".14em" textTransform="uppercase" mb="3">{dashboardText.workspace}</Text>
                            <Heading as="h1" fontSize={{ base: "2xl", md: "4xl" }} letterSpacing="-.04em" lineHeight="1.1">{dashboardText.welcome}, {user.firstName}</Heading>
                            <Text mt="3" color={muted} maxW="2xl" lineHeight="1.7">{dashboardText.description}</Text>
                        </Box>
                        <Flex align="center" alignSelf={{ base: "flex-start", md: "auto" }} gap="2.5" px="4" py="3" maxW="full" borderRadius="full" bg={statusBg} color={statusText} fontSize="sm" fontWeight="semibold" whiteSpace={{ base: "normal", sm: "nowrap" }} lineHeight="1.35">
                            <MdCheckCircle size="18" />
                            {user.verfied ? dashboardText.verifiedAccount : dashboardText.verificationRequired}
                        </Flex>
                    </Flex>
                    <SimpleGrid as="section" aria-label={dashboardText.listingShortcuts} columns={{ base: 1, sm: 2, xl: 3 }} spacing={{ base: 4, md: 5 }}>
                        {user.verfied ? (
                            <>
                                <ActionButton href="add-item" text={dashboardText.createListing} description={dashboardText.createListingDescription} icon={<MdAddShoppingCart size="23" />} />
                                <ActionButton href="list-my-items" text={dashboardText.manageListings} description={dashboardText.manageListingsDescription} icon={<MdListAlt size="23" />} />
                            </>
                        ) : (
                            <ActionButton href="verify-account" text={dashboardText.verifyAccount} description={dashboardText.verifyAccountDescription} icon={<MdCheckCircle size="23" />} />
                        )}
                        <ActionButton href="saved" text={dashboardText.savedListings} description={dashboardText.savedListingsDescription} icon={<MdSave size="23" />} />
                    </SimpleGrid>
                    <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={{ base: 5, lg: 6 }} mt={{ base: 7, md: 9 }} alignItems="stretch">
                        <Profile user={user} />
                        <RecentActivities />
                    </SimpleGrid>
                </Container>
            </Flex>
        </>
    );
}

interface IActionButton { href: string; icon: ReactNode; text: string; description: string; }
const ActionButton: FC<IActionButton> = ({ href, icon, text, description }) => {
    const surface = useColorModeValue("white", "#0c0c0c");
    const border = useColorModeValue("gray.200", "whiteAlpha.200");
    const muted = useColorModeValue("gray.600", "gray.400");
    const accentBg = useColorModeValue("#fbf3e2", "rgba(233,183,92,.14)");
    const accentColor = useColorModeValue("#9b6522", "#f0c978");
    const arrowBg = useColorModeValue("gray.50", "whiteAlpha.100");
    return (
        <Link legacyBehavior href={`/dashboard/${href}`} passHref>
            <Flex as="a" role="link" minH={{ base: "156px", md: "176px" }} h="full" direction="column" justify="space-between" p={{ base: 5, md: 6 }} bg={surface} border="1px solid" borderColor={border} borderRadius="2xl" color="inherit" boxShadow="0 5px 18px rgba(21,42,44,.045)" transition="transform 180ms ease, border-color 180ms ease, box-shadow 180ms ease" _hover={{ transform: "translateY(-3px)", borderColor: "mainyellow", boxShadow: "0 14px 30px rgba(21,42,44,.11)" }} _focusVisible={{ outline: "3px solid #E9B75C", outlineOffset: "3px" }}>
                <Flex align="center" justify="space-between" gap="4">
                    <Flex w="12" h="12" flexShrink={0} align="center" justify="center" borderRadius="xl" bg={accentBg} color={accentColor}>{icon}</Flex>
                    <Flex w="9" h="9" flexShrink={0} align="center" justify="center" borderRadius="full" bg={arrowBg} color={muted}><MdArrowForward size="18" /></Flex>
                </Flex>
                <Box mt="5">
                    <Heading as="h2" fontSize="lg" letterSpacing="-.02em" lineHeight="1.25">{text}</Heading>
                    <Text color={muted} fontSize="sm" mt="2" lineHeight="1.55" maxW="36ch">{description}</Text>
                </Box>
            </Flex>
        </Link>
    );
};
