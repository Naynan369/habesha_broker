import { Box, Button, ButtonGroup, Flex, IconButton, Text, useColorModeValue, Drawer, DrawerOverlay, DrawerContent, DrawerCloseButton, DrawerHeader, DrawerBody, VStack, useDisclosure } from "@chakra-ui/react";
import { useRouter } from "next/router";
import { MyTheme } from "@config/theme/MyTheme";
import { useLang } from "@libs/hooks/useLang";
import Link from "next/link";
import { MdExplore, MdHome, MdLogout, MdMenu, MdLanguage } from "react-icons/md";
import { ColorModeToggle } from "@components/shared/ColorModeToggle";
import { BrandLogo } from "@components/shared/BrandLogo";

export function NavBar({ logout }) {
    const lang = useLang();
    const router = useRouter();
    const { isOpen, onOpen, onClose } = useDisclosure();
    const dashboardText = lang.dashboardPage;
    const navBackground = useColorModeValue("#143A45", "#000000");
    const menuSurface = useColorModeValue("#fbfaf7", "#0d0d0d");
    const menuText = useColorModeValue("#21383e", "#e7eff0");
    const borderColor = useColorModeValue("gray.200", "whiteAlpha.200");
    const mutedText = useColorModeValue("#536467", "gray.300");
    const controlSurface = useColorModeValue("#f3efe7", "whiteAlpha.100");
    const changeLocale = (locale: "en" | "am") => {
        void router.push(router.asPath, router.asPath, { locale });
        onClose();
    };

    return (
        <>
            <Flex
                position="sticky"
                top="0"
                zIndex="30"
                boxShadow="0 8px 28px rgba(8, 24, 30, .14)"
                minH={MyTheme.size.navbarHeight}
                alignItems="center"
                justify="space-between"
                gap={{ base: 3, sm: 5 }}
                color="white"
                background={navBackground}
                px={{ base: 4, sm: 6, md: 8, xl: 14 }}
                py="3"
            >
                <Flex align="center" gap="3" minW="0">
                    <Flex direction="column" minW="0" gap="1">
                        <BrandLogo compact />
                        <Text display={{ base: "none", sm: "block" }} color="whiteAlpha.700" fontSize="9px" letterSpacing=".1em" textTransform="uppercase">{dashboardText.workspace}</Text>
                    </Flex>
                </Flex>
                <ButtonGroup spacing={{ base: 1, md: 3 }} alignItems="center" flexShrink={0}>
                    <ColorModeToggle />
                    <ButtonGroup display={{ base: "none", md: "flex" }} isAttached size="sm" spacing="0" aria-label={lang.common.language}>
                        <Button px={{ base: 2, md: 3 }} aria-label={lang.common.english} aria-pressed={router.locale === "en"} bg={router.locale === "en" ? "whiteAlpha.300" : "transparent"} color="white" _hover={{ bg: "whiteAlpha.200" }} onClick={() => changeLocale("en")}>EN</Button>
                        <Button px={{ base: 2, md: 3 }} aria-label={lang.common.amharic} aria-pressed={router.locale === "am"} bg={router.locale === "am" ? "whiteAlpha.300" : "transparent"} color="white" _hover={{ bg: "whiteAlpha.200" }} onClick={() => changeLocale("am")}>አማ</Button>
                    </ButtonGroup>
                    <Link legacyBehavior href="/" passHref><Button as="a" display={{ base: "none", md: "inline-flex" }} color="whiteAlpha.900" _hover={{ background: "whiteAlpha.200" }} variant="ghost">{dashboardText.home}</Button></Link>
                    <Link legacyBehavior href="/explore" passHref><Button as="a" display={{ base: "none", md: "inline-flex" }} color="whiteAlpha.900" _hover={{ background: "whiteAlpha.200" }} variant="ghost">{dashboardText.explore}</Button></Link>
                    <Button display={{ base: "none", md: "inline-flex" }} rightIcon={<MdLogout />} variant="ghost" color="white" _hover={{ background: "whiteAlpha.200" }} onClick={logout}>{dashboardText.logout}</Button>
                    <IconButton
                        display={{ base: "inline-flex", md: "none" }}
                        aria-label={lang.common.menu}
                        icon={<MdMenu />}
                        color="white"
                        variant="ghost"
                        borderRadius="xl"
                        _hover={{ background: "whiteAlpha.200" }}
                        onClick={onOpen}
                    />
                </ButtonGroup>
            </Flex>

            <Drawer isOpen={isOpen} onClose={onClose} placement="right" size="xs">
                <DrawerOverlay bg="rgba(17, 36, 39, .58)" backdropFilter="blur(3px)" />
                <DrawerContent
                    h="100dvh"
                    minH="100dvh"
                    maxH="100dvh"
                    maxW="min(90vw, 360px)"
                    display="flex"
                    flexDirection="column"
                    bg={menuSurface}
                    color={menuText}
                >
                    <DrawerCloseButton top="calc(env(safe-area-inset-top) + 1rem)" right="4" w="10" h="10" borderRadius="full" bg={controlSurface} aria-label={lang.common.close} />
                    <DrawerHeader flexShrink={0} px="6" pt="calc(env(safe-area-inset-top) + 1.5rem)" pb="5" borderBottom="1px solid" borderColor={borderColor}>
                        <BrandLogo compact />
                    </DrawerHeader>
                    <DrawerBody flex="1" minH="0" overflowY="auto" px="5" pt="5" pb="calc(env(safe-area-inset-bottom) + 1.25rem)" display="flex" flexDirection="column">
                        <VStack align="stretch" spacing="2">
                            <Link legacyBehavior href="/" passHref><Button as="a" justifyContent="flex-start" h="12" px="4" gap="3" variant="ghost" color={mutedText} leftIcon={<MdHome />} onClick={onClose}>{dashboardText.home}</Button></Link>
                            <Link legacyBehavior href="/explore" passHref><Button as="a" justifyContent="flex-start" h="12" px="4" gap="3" variant="ghost" color={mutedText} leftIcon={<MdExplore />} onClick={onClose}>{dashboardText.explore}</Button></Link>
                        </VStack>
                        <Box mt="auto" pt="6">
                            <Box mb="4" p="4" bg={controlSurface} border="1px solid" borderColor={borderColor} borderRadius="2xl">
                                <Flex align="center" gap="2" color="mainorange" mb="3"><MdLanguage size="17" /><Text color={mutedText} fontSize="xs" fontWeight="bold" textTransform="uppercase" letterSpacing=".1em">{lang.common.language}</Text></Flex>
                                <Flex p="1" bg={menuSurface} border="1px solid" borderColor={borderColor} borderRadius="xl" gap="1">
                                    <Button flex="1" minW="0" h="10" variant={router.locale === "en" ? "solid" : "ghost"} bg={router.locale === "en" ? "#21383e" : "transparent"} color={router.locale === "en" ? "white" : mutedText} borderRadius="lg" onClick={() => changeLocale("en")}>{lang.common.english}</Button>
                                    <Button flex="1" minW="0" h="10" variant={router.locale === "am" ? "solid" : "ghost"} bg={router.locale === "am" ? "#21383e" : "transparent"} color={router.locale === "am" ? "white" : mutedText} borderRadius="lg" onClick={() => changeLocale("am")}>{lang.common.amharic}</Button>
                                </Flex>
                            </Box>
                            <Button w="full" h="12" variant="outline" borderColor={borderColor} color={menuText} borderRadius="xl" leftIcon={<MdLogout />} onClick={() => { onClose(); void logout(); }}>{dashboardText.logout}</Button>
                        </Box>
                    </DrawerBody>
                </DrawerContent>
            </Drawer>
        </>
    );
}
