import { Box, Button, Flex, IconButton, Menu, MenuButton, MenuItem, MenuList, Text, useColorModeValue } from "@chakra-ui/react";
import { ChevronDownIcon, CloseIcon, HamburgerIcon } from "@chakra-ui/icons";
import Link from "next/link";
import { FC, ReactNode } from "react";
import { ColorModeToggle } from "@components/shared/ColorModeToggle";
import { BrandLogo } from "@components/shared/BrandLogo";
import { useWindowPosition } from "@libs/hooks/useWindowPosition";
import { useRouter } from "next/router";
import { en } from "@locales/en";
import { am } from "@locales/am";
import { MdBusinessCenter, MdDashboard, MdExplore, MdHomeWork, MdLanguage, MdLogin, MdOutlineContactSupport } from "react-icons/md";

interface INavbar { background: string; openFunc: () => void; blurred?: boolean; user?: any; }
interface INavItem { title: string; href: string; onClick?: () => void; icon?: ReactNode; active?: boolean; }

export const HomeNavbar: FC<INavbar> = ({ background, openFunc, user }) => {
	const scrollPos = useWindowPosition();
	const router = useRouter();
	const { locale, asPath } = router;
	const lang = locale === "am" ? am : en;
	const menuSurface = useColorModeValue("white", "#111111");
	const menuText = useColorModeValue("gray.800", "gray.100");
	const menuBorder = useColorModeValue("gray.200", "whiteAlpha.200");
	const isScrolled = scrollPos > 60;
	const accountHref = user?.role === "ADMIN" ? "/admin" : "/dashboard";
	const currentHome = router.pathname === "/" && !asPath.includes("#Contact");
	const currentContact = router.pathname === "/" && asPath.includes("#Contact");
	const changeLocale = (nextLocale: string) => { void router.push(asPath, asPath, { locale: nextLocale }); };

	return (
		<Flex height={{ base: "70px", lg: "78px" }} position="fixed" top="0" right="0" width="100%" align="center" px={{ base: 4, md: 8, xl: 12 }} color="white" zIndex="1001" boxShadow={isScrolled ? "0 10px 30px rgba(5,22,27,.18)" : "none"} backgroundColor={isScrolled ? "rgba(8, 27, 31, .94)" : background} backdropFilter="blur(16px)" borderBottom="1px solid" borderColor={isScrolled ? "whiteAlpha.200" : "whiteAlpha.100"} transition="all 220ms ease">
			<Flex w="full" maxW="1480px" mx="auto" align="center" gap={{ base: 3, lg: 6 }}>
				<Link legacyBehavior href="/" passHref><Flex as="a" align="center" flexShrink={0} aria-label={lang.title} _focusVisible={{ outline: "2px solid #E9B75C", outlineOffset: "5px", borderRadius: "md" }}><BrandLogo compact /></Flex></Link>
				<Box flex="1" display={{ base: "block", lg: "none" }} />
				<Flex display={{ base: "none", lg: "flex" }} align="center" p="1" border="1px solid" borderColor="whiteAlpha.200" borderRadius="full" bg="whiteAlpha.100" gap="1">
					<LinkItem title={lang.nav.home} href="#home" active={currentHome} />
					<LinkItem title={lang.nav.explore} href="/explore" active={router.pathname.startsWith("/explore")} />
					<LinkItem title={lang.nav.contact} href="#Contact" active={currentContact} />
				</Flex>
				<Box flex="1" display={{ base: "none", lg: "block" }} />
				<Flex align="center" gap={{ base: 2, lg: 3 }}>
					<Flex display={{ base: "none", lg: "flex" }} align="center" gap="1" p="1" border="1px solid" borderColor="whiteAlpha.200" borderRadius="full" bg="whiteAlpha.100">
						<ColorModeToggle />
						<Menu>
							<MenuButton as={Button} size="sm" variant="ghost" color="white" borderRadius="full" leftIcon={<MdLanguage />} rightIcon={<ChevronDownIcon />} _hover={{ bg: "whiteAlpha.200" }} aria-label={lang.common.language}>
								{locale === "am" ? lang.common.amharic : lang.common.english}
							</MenuButton>
							<MenuList color={menuText} bg={menuSurface} borderColor={menuBorder} borderRadius="xl" boxShadow="0 16px 36px rgba(0,0,0,.2)" p="2">
								<MenuItem borderRadius="lg" onClick={() => changeLocale("en")}>{lang.common.english}</MenuItem>
								<MenuItem borderRadius="lg" onClick={() => changeLocale("am")}>{lang.common.amharic}</MenuItem>
							</MenuList>
						</Menu>
					</Flex>
					<Button display={{ base: "none", lg: "inline-flex" }} as={Link} href={user ? accountHref : "/auth/login"} leftIcon={user ? <MdDashboard /> : <MdLogin />} bg="mainyellow" color="maingray" border="1px solid" borderColor="whiteAlpha.300" borderRadius="full" px="5" boxShadow="0 6px 16px rgba(0,0,0,.14)" _hover={{ bg: "#f0c875", transform: "translateY(-1px)" }} transition="all 160ms ease">
						{user ? lang.common.dashboard : lang.common.signIn}
					</Button>
					<Box display={{ base: "flex", lg: "none" }}><ColorModeToggle /></Box>
					<IconButton onClick={openFunc} display={{ base: "flex", lg: "none" }} color="white" bg="whiteAlpha.150" border="1px solid" borderColor="whiteAlpha.300" _hover={{ bg: "whiteAlpha.250" }} borderRadius="xl" aria-label={lang.common.menu} icon={<HamburgerIcon />} />
				</Flex>
			</Flex>
		</Flex>
	);
};

interface IMobMenu { open: boolean; closeFunc: () => void; user?: any; }
export const MobileMenu: FC<IMobMenu> = ({ open, closeFunc, user }) => {
	const router = useRouter();
	const { locale, asPath } = router;
	const lang = locale === "am" ? am : en;
	const panelBg = useColorModeValue("#ffffff", "#0b0b0b");
	const panelText = useColorModeValue("#21383e", "#e7eff0");
	const panelBorder = useColorModeValue("gray.200", "whiteAlpha.200");
	const secondarySurface = useColorModeValue("#f5f5f1", "#141414");
	const mutedColor = useColorModeValue("gray.600", "gray.300");
	const languageSurface = useColorModeValue("white", "#090909");
	const inactiveHover = useColorModeValue("gray.100", "whiteAlpha.100");
	const changeLocale = (nextLocale: string) => { void router.push(asPath, asPath, { locale: nextLocale }); closeFunc(); };
	const isHome = router.pathname === "/" && !asPath.includes("#Contact");
	const isExplore = router.pathname.startsWith("/explore");
	const isContact = router.pathname === "/" && asPath.includes("#Contact");
	const accountHref = user?.role === "ADMIN" ? "/admin" : "/dashboard";

	return (
		<>
			<Box position="fixed" inset="0" bg="rgba(7, 19, 22, .62)" backdropFilter="blur(5px)" zIndex="1002" opacity={open ? 1 : 0} visibility={open ? "visible" : "hidden"} pointerEvents={open ? "auto" : "none"} transition="all 220ms ease" onClick={closeFunc} aria-hidden="true" />
			<Flex role="dialog" aria-modal={open || undefined} aria-label={lang.common.menu} position="fixed" right={open ? "0" : "-100%"} top="0" height="100dvh" minH="100dvh" maxH="100dvh" boxShadow="-24px 0 70px rgba(0,0,0,.24)" bg={panelBg} color={panelText} direction="column" w={{ base: "min(88vw, 360px)", sm: "360px" }} maxW="360px" zIndex="1003" px={{ base: 5, sm: 6 }} pt="env(safe-area-inset-top)" pb="calc(env(safe-area-inset-bottom) + 22px)" overflowY="auto" transition="right 280ms cubic-bezier(.2,.7,.2,1)" visibility={open ? "visible" : "hidden"} pointerEvents={open ? "auto" : "none"} aria-hidden={!open}>
				<Flex align="center" justify="space-between" gap="4" py="5" borderBottom="1px solid" borderColor={panelBorder}>
					<Box><Text color="mainorange" fontSize="10px" fontWeight="bold" letterSpacing=".16em" textTransform="uppercase">{lang.common.menu}</Text><Box mt="2"><BrandLogo compact /></Box></Box>
					<Flex align="center" gap="2"><ColorModeToggle /><IconButton flexShrink={0} color={panelText} bg={secondarySurface} border="1px solid" borderColor={panelBorder} _hover={{ bg: inactiveHover }} aria-label={lang.common.close} icon={<CloseIcon />} onClick={closeFunc} borderRadius="full" /></Flex>
				</Flex>
				<Text mt="6" mb="3" color={mutedColor} fontSize="xs" fontWeight="bold" letterSpacing=".12em" textTransform="uppercase">{lang.common.navigation}</Text>
				<Flex direction="column" gap="2">
					<MobMenuItem title={lang.nav.home} href="/#home" icon={<MdHomeWork size="19" />} active={isHome} onClick={closeFunc} />
					<MobMenuItem title={lang.nav.explore} href="/explore" icon={<MdExplore size="19" />} active={isExplore} onClick={closeFunc} />
					<MobMenuItem title={lang.nav.contact} href="/#Contact" icon={<MdOutlineContactSupport size="19" />} active={isContact} onClick={closeFunc} />
				</Flex>
				<Box mt="auto" pt="7">
					<Box mb="4" p="4" bg={secondarySurface} border="1px solid" borderColor={panelBorder} borderRadius="2xl">
						<Flex align="center" gap="2" color="mainorange" mb="3"><MdLanguage size="17" /><Text color={mutedColor} fontSize="xs" fontWeight="bold" textTransform="uppercase" letterSpacing=".1em">{lang.common.language}</Text></Flex>
						<Flex p="1" bg={languageSurface} border="1px solid" borderColor={panelBorder} borderRadius="xl" gap="1">
							<Button flex="1" h="10" variant={locale === "en" ? "solid" : "ghost"} bg={locale === "en" ? "#21383e" : "transparent"} color={locale === "en" ? "white" : mutedColor} _hover={{ bg: locale === "en" ? "#142a30" : inactiveHover }} borderRadius="lg" onClick={() => changeLocale("en")}>{lang.common.english}</Button>
							<Button flex="1" h="10" variant={locale === "am" ? "solid" : "ghost"} bg={locale === "am" ? "#21383e" : "transparent"} color={locale === "am" ? "white" : mutedColor} _hover={{ bg: locale === "am" ? "#142a30" : inactiveHover }} borderRadius="lg" onClick={() => changeLocale("am")}>{lang.common.amharic}</Button>
						</Flex>
					</Box>
					<Link legacyBehavior href={user ? accountHref : "/auth/login"} passHref><Button as="a" w="full" h="12" color="maingray" bg="mainyellow" _hover={{ bg: "#f0c875", transform: "translateY(-1px)" }} borderRadius="xl" boxShadow="0 8px 20px rgba(20,58,69,.12)" leftIcon={user ? <MdDashboard size="19" /> : <MdBusinessCenter size="19" />} onClick={closeFunc}>{user ? lang.common.dashboard : lang.common.signIn}</Button></Link>
				</Box>
			</Flex>
		</>
	);
};

export const LinkItem: FC<INavItem> = ({ title, href, active }) => (
	<Link legacyBehavior href={href} passHref><Button as="a" size="sm" variant={active ? "solid" : "ghost"} bg={active ? "whiteAlpha.200" : "transparent"} color="white" borderRadius="full" px="4" fontWeight={active ? "bold" : "semibold"} _hover={{ bg: "whiteAlpha.200", color: "white" }} aria-current={active ? "page" : undefined} _focusVisible={{ outline: "2px solid #E9B75C", outlineOffset: "2px" }}>{title}</Button></Link>
);

export const MobMenuItem: FC<INavItem> = ({ title, href, onClick, icon, active }) => {
	const inactiveColor = useColorModeValue("#31494c", "gray.200");
	const inactiveBg = useColorModeValue("gray.100", "whiteAlpha.100");
	return <Link legacyBehavior href={href} passHref><Button as="a" justifyContent="flex-start" h="12" px="4" gap="3" bg={active ? "#21383e" : "transparent"} color={active ? "white" : inactiveColor} fontWeight="semibold" borderRadius="xl" boxShadow={active ? "0 8px 20px rgba(33,56,62,.16)" : "none"} _hover={{ bg: active ? "#142a30" : inactiveBg, color: active ? "white" : "#b85f36" }} _focusVisible={{ outline: "2px solid #E9B75C", outlineOffset: "2px" }} leftIcon={icon as any} aria-current={active ? "page" : undefined} onClick={onClick}>{title}</Button></Link>;
};
