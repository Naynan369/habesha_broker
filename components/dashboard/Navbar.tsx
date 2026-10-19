import { Box, Flex, ButtonGroup, Button, IconButton, Text, useColorModeValue, Menu, MenuButton, MenuItem, MenuList } from "@chakra-ui/react";
import { useRouter } from "next/router";
import { MyTheme } from "@config/theme/MyTheme";
import { useLang } from "@libs/hooks/useLang";
import Link from "next/link";
import { MdExplore, MdHome, MdLogout, MdMenu } from "react-icons/md";
import { ColorModeToggle } from "@components/shared/ColorModeToggle";
import { BrandLogo } from "@components/shared/BrandLogo";

export function NavBar({ logout }) {
    const lang = useLang();
    const router = useRouter();
    const dashboardText = lang.dashboardPage;
    const navBackground = useColorModeValue("#143A45", "#000000");
    const menuSurface = useColorModeValue("white", "#111111");
    const menuText = useColorModeValue("gray.800", "gray.100");
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
            background={navBackground}
            px={{ base: 4, md: 8, xl: 14 }}
            py="3"
        >
            <Flex align="center" gap="3" minW="0">
                <Flex direction="column" minW="0" gap="1">
                    <BrandLogo compact />
                    <Text display={{ base: "none", sm: "block" }} color="whiteAlpha.700" fontSize="9px" letterSpacing=".1em" textTransform="uppercase">{dashboardText.workspace}</Text>
                </Flex>
            </Flex>
            <Box flex="1" />
            <ButtonGroup spacing={{ base: 1, md: 3 }} alignItems="center">
                <ColorModeToggle />
                <ButtonGroup display={{ base: "none", sm: "flex" }} isAttached size="sm" spacing="0" aria-label={lang.common.language}>
                    <Button px={{ base: 2, md: 3 }} aria-label={lang.common.english} aria-pressed={router.locale === "en"} bg={router.locale === "en" ? "whiteAlpha.300" : "transparent"} color="white" _hover={{ bg: "whiteAlpha.200" }} onClick={() => changeLocale("en")}>EN</Button>
                    <Button px={{ base: 2, md: 3 }} aria-label={lang.common.amharic} aria-pressed={router.locale === "am"} bg={router.locale === "am" ? "whiteAlpha.300" : "transparent"} color="white" _hover={{ bg: "whiteAlpha.200" }} onClick={() => changeLocale("am")}>አማ</Button>
                </ButtonGroup>
                <Link legacyBehavior href="/" passHref><Button as="a" display={{ base: "none", sm: "inline-flex" }} color="whiteAlpha.900" _hover={{ background: "whiteAlpha.200" }} variant="ghost">{dashboardText.home}</Button></Link>
                <Link legacyBehavior href="/explore" passHref><Button as="a" display={{ base: "none", sm: "inline-flex" }} color="whiteAlpha.900" _hover={{ background: "whiteAlpha.200" }} variant="ghost">{dashboardText.explore}</Button></Link>
                <Button display={{ base: "none", sm: "inline-flex" }} rightIcon={<MdLogout />} variant="ghost" color="white" _hover={{ background: "whiteAlpha.200" }} onClick={logout}>{dashboardText.logout}</Button>
                <Menu>
                    <MenuButton as={IconButton} display={{ base: "inline-flex", sm: "none" }} aria-label={lang.common.menu} icon={<MdMenu />} color="white" _hover={{ background: "whiteAlpha.200" }} variant="ghost" />
                    <MenuList bg={menuSurface} color={menuText}>
                        <MenuItem icon={<MdHome />} onClick={() => void router.push("/", undefined, { locale: router.locale })}>{dashboardText.home}</MenuItem>
                        <MenuItem icon={<MdExplore />} onClick={() => void router.push("/explore", undefined, { locale: router.locale })}>{dashboardText.explore}</MenuItem>
                        <MenuItem onClick={() => changeLocale("en")}>{lang.common.english}</MenuItem>
                        <MenuItem onClick={() => changeLocale("am")}>{lang.common.amharic}</MenuItem>
                        <MenuItem icon={<MdLogout />} onClick={logout}>{dashboardText.logout}</MenuItem>
                    </MenuList>
                </Menu>
            </ButtonGroup>
        </Flex>
    );
}
