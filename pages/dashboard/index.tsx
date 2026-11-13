import { Box, Container, Flex, Heading, SimpleGrid, Text, useColorModeValue } from "@chakra-ui/react";
import { SiteNavbar } from "@components/shared/SiteNavbar";
import { Profile } from "@components/dashboard/Profile";
import { RecentActivities } from "@components/dashboard/RecentActivities";
import { withSessionSsr } from "@config/cookie/cookie";
import axios from "axios";
import { useUser } from "@libs/store";
import { useLang } from "@libs/hooks/useLang";
import Link from "next/link";
import Head from "next/head";
import { useRouter } from "next/router";
import { FC, ReactNode } from "react";
import { MdAddShoppingCart, MdArrowForward, MdCheckCircle, MdEventAvailable, MdListAlt, MdSave } from "react-icons/md";

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
            <Flex lang={router.locale === "am" ? "am" : "en"} minH="100dvh" direction="column" bg={pageBg}>
                <SiteNavbar mode="dashboard" onLogout={handleLogout} user={user} />
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
                    <SimpleGrid className="dashboard-overview-actions" as="section" aria-label={dashboardText.listingShortcuts} columns={{ base: 1, sm: 2, xl: 4 }} spacing={{ base: 4, md: 5 }}>
                        {user.verfied ? (
                            <>
                                <ActionButton href="add-item" text={dashboardText.createListing} description={dashboardText.createListingDescription} icon={<MdAddShoppingCart size="23" />} />
                                <ActionButton href="list-my-items" text={dashboardText.manageListings} description={dashboardText.manageListingsDescription} icon={<MdListAlt size="23" />} />
                            </>
                        ) : (
                            <ActionButton href="verify-account" text={dashboardText.verifyAccount} description={dashboardText.verifyAccountDescription} icon={<MdCheckCircle size="23" />} />
                        )}
                        <ActionButton href="saved" text={dashboardText.savedListings} description={dashboardText.savedListingsDescription} icon={<MdSave size="23" />} />
                        <ActionButton href="service-requests" text={dashboardText.serviceRequests} description={dashboardText.serviceRequestsDescription} icon={<MdEventAvailable size="23" />} />
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
    return (
        <Link legacyBehavior href={`/dashboard/${href}`} passHref>
            <Flex as="a" role="link" data-action={href} className="dashboard-overview-action" position="relative" isolation="isolate" minW="0" minH={{ base: "205px", md: "246px" }} h="full" direction="column" justify="space-between" overflow="hidden" p={{ base: 5, md: 6 }} bg="linear-gradient(145deg, #6c4c37 0%, #3d2b21 56%, #211710 100%)" border="1px solid" borderColor="rgba(240,201,120,.2)" borderRadius="3xl" color="white" boxShadow="0 18px 44px rgba(34,22,15,.14)" transition="transform 360ms cubic-bezier(.2,.8,.2,1), border-color 360ms ease, box-shadow 360ms ease" _hover={{ transform: "perspective(1000px) translateY(-8px) rotateX(2deg) scale(1.018)", borderColor: "var(--action-accent)", boxShadow: "0 30px 62px rgba(34,22,15,.28)" }} _focusVisible={{ outline: "3px solid #E9B75C", outlineOffset: "3px" }}>
                <Flex className="dashboard-overview-action-top" position="relative" zIndex="1" align="center" justify="space-between" gap="4">
                    <Flex className="dashboard-overview-action-icon" w={{ base: "16", md: "18" }} h={{ base: "16", md: "18" }} flexShrink={0} align="center" justify="center" borderRadius={{ base: "2xl", md: "3xl" }} bg="rgba(255,255,255,.07)" color="var(--action-accent)" border="1px solid" borderColor="rgba(255,255,255,.14)" boxShadow="inset 0 1px 0 rgba(255,255,255,.12), 0 12px 28px rgba(0,0,0,.15)">{icon}</Flex>
                    <Flex className="dashboard-overview-action-arrow" w="11" h="11" flexShrink={0} align="center" justify="center" borderRadius="full" bg="rgba(255,255,255,.08)" border="1px solid" borderColor="rgba(255,255,255,.13)" color="whiteAlpha.900"><MdArrowForward size="19" /></Flex>
                </Flex>
                <Box position="relative" zIndex="1" mt="8">
                    <Heading as="h2" fontSize={{ base: "lg", md: "xl" }} letterSpacing="-.035em" lineHeight="1.2">{text}</Heading>
                    <Text color="whiteAlpha.800" fontSize="sm" mt="2.5" lineHeight="1.65" maxW="36ch">{description}</Text>
                    <Box className="dashboard-overview-action-rule" mt="5" w="14" h="1px" borderRadius="full" bg="var(--action-accent)" />
                </Box>
                <Box aria-hidden="true" className="dashboard-overview-action-orbit" position="absolute" right="-100px" top="-110px" w="250px" h="250px" borderRadius="full" pointerEvents="none" />
            </Flex>
        </Link>
    );
};
