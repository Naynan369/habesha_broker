import { Box, Flex, Heading, ButtonGroup, Button, IconButton, Text } from "@chakra-ui/react";
import { useRouter } from "next/router";
import { MyTheme } from "@config/theme/MyTheme";
import { useLang } from "@libs/hooks/useLang";
import Link from "next/link";
import { MdLogout } from "react-icons/md";
import { ColorModeToggle } from "@components/shared/ColorModeToggle";

export function NavBar({ logout }) {
    const lang = useLang();
    const router = useRouter();
    const dashboardText = lang.dashboardPage;
    const changeLocale = (locale: "en" | "am") => {
        void router.push(router.asPath, router.asPath, { locale });
    };
    return (
        <Flex
            position="sticky"
            top="0"
            zIndex="30"
            boxShadow="0 8px 28px rgba(8, 24, 30, .14)"
            minH={MyTheme.size.navbarHeight}
            alignItems="center"
            color="white"
            background="#143A45"
            px={{ base: 4, md: 8, xl: 14 }}
            py="3"
        >
            <Flex align="center" gap="3" minW="0">
                <Box flexShrink={0} w="10" h="10" borderRadius="xl" bg="mainyellow" color="maingray" display="grid" placeItems="center" fontWeight="black">HB</Box>
                <Flex direction="column" minW="0">
                    <Heading fontSize="sm" noOfLines={1}>{lang.title}</Heading>
                    <Text color="whiteAlpha.700" fontSize="xs" letterSpacing=".1em" textTransform="uppercase">{dashboardText.workspace}</Text>
                </Flex>
            </Flex>
            <Box flex="1" />
            <ButtonGroup spacing={{ base: 1, md: 3 }} alignItems="center">
                <ColorModeToggle />
                <ButtonGroup isAttached size="sm" spacing="0" aria-label={lang.common.language}>
                    <Button px={{ base: 2, md: 3 }} aria-label={lang.common.english} aria-pressed={router.locale === "en"} bg={router.locale === "en" ? "whiteAlpha.300" : "transparent"} color="white" _hover={{ bg: "whiteAlpha.200" }} onClick={() => changeLocale("en")}>EN</Button>
                    <Button px={{ base: 2, md: 3 }} aria-label={lang.common.amharic} aria-pressed={router.locale === "am"} bg={router.locale === "am" ? "whiteAlpha.300" : "transparent"} color="white" _hover={{ bg: "whiteAlpha.200" }} onClick={() => changeLocale("am")}>አማ</Button>
                </ButtonGroup>
                <Link href="/" passHref><Button as="a" display={{ base: "none", sm: "inline-flex" }} color="whiteAlpha.900" _hover={{ background: "whiteAlpha.200" }} variant="ghost">{dashboardText.home}</Button></Link>
                <Link href="/explore" passHref><Button as="a" display={{ base: "none", sm: "inline-flex" }} color="whiteAlpha.900" _hover={{ background: "whiteAlpha.200" }} variant="ghost">{dashboardText.explore}</Button></Link>
                <IconButton display={{ base: "inline-flex", sm: "none" }} onClick={logout} aria-label={dashboardText.logout} icon={<MdLogout />} color="white" _hover={{ background: "whiteAlpha.200" }} variant="ghost" />
                <Button display={{ base: "none", sm: "inline-flex" }} rightIcon={<MdLogout />} variant="ghost" color="white" _hover={{ background: "whiteAlpha.200" }} onClick={logout}>{dashboardText.logout}</Button>
            </ButtonGroup>
        </Flex>
    );
}
