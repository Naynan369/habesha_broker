import { Box, Button, Flex, IconButton, Menu, MenuButton, MenuItem, MenuList, Text, useColorModeValue } from "@chakra-ui/react";
import { ChevronDownIcon, CloseIcon, HamburgerIcon } from "@chakra-ui/icons";
import { MyTheme } from "@config/theme/MyTheme";
import Link from "next/link";
import { FC, ReactNode } from "react";
import styles from "@styles/Home.module.scss";
import { ColorModeToggle } from "@components/shared/ColorModeToggle";
import { BrandLogo } from "@components/shared/BrandLogo";
import { useWindowPosition } from "@libs/hooks/useWindowPosition";
import { useRouter } from "next/router";
import { en } from "@locales/en";
import { am } from "@locales/am";
import { MdAccountBox, MdBusinessCenter, MdDashboard, MdExplore, MdHomeWork, MdLanguage, MdLogin, MdOutlineContactSupport } from "react-icons/md";

interface INavbar { background: string; openFunc: () => void; blurred?: boolean; user?: any; }
interface INavItem { title: string; href: string; onClick?: () => void; icon?: ReactNode; active?: boolean; }

export const HomeNavbar: FC<INavbar> = ({ background, openFunc, user }) => {
	const scrollPos = useWindowPosition();
	const router = useRouter();
	const { locale, asPath } = router;
	const lang = locale === "am" ? am : en;
	const menuSurface = useColorModeValue("white", "#111111");
	const scrolledBackground = useColorModeValue("rgba(12, 43, 52, .96)", "rgba(0, 0, 0, .94)");
	const menuText = useColorModeValue("gray.800", "gray.100");
	const menuBorder = useColorModeValue("gray.200", "whiteAlpha.200");
	const changeLocale = (nextLocale: string) => router.push(asPath, asPath, { locale: nextLocale });
	const isScrolled = scrollPos > 60;

	return (
		<Flex height={MyTheme.size.navbarHeight} position="fixed" top="0" right="0" width="100%" align="center" px={{ base: 5, md: 10, xl: 14 }} color="white" zIndex="1001" boxShadow={isScrolled ? "0 8px 28px rgba(5,22,27,.16)" : "none"} backgroundColor={isScrolled ? scrolledBackground : background} backdropFilter="blur(14px)" transition="all 200ms ease">
			<Link legacyBehavior href="/" passHref><Flex as="a" align="center" gap="3" aria-label={lang.title}>
				<BrandLogo />
			</Flex></Link>
			<Box flex="1" />
			<Box mr="2"><ColorModeToggle /></Box>
			<IconButton onClick={openFunc} display={{ base: "flex", lg: "none" }} color="white" bg="whiteAlpha.200" _hover={{ bg: "whiteAlpha.300" }} aria-label={lang.common.menu} icon={<HamburgerIcon />} />
			<Flex display={{ base: "none", lg: "flex" }} align="center">
				<LinkItem title={lang.nav.home} href="#home" />
				<LinkItem title={lang.nav.explore} href="/explore" />
				<LinkItem title={lang.nav.contact} href="#Contact" />
				<Menu>
					<MenuButton as={Text} className={styles.navLink} mx="5" fontSize="sm" fontWeight="semibold" userSelect="none" cursor="pointer" color="whiteAlpha.900">{lang.common.language} <ChevronDownIcon /></MenuButton>
					<MenuList color={menuText} bg={menuSurface} borderColor={menuBorder}><MenuItem onClick={() => changeLocale("en")}>{lang.common.english}</MenuItem><MenuItem onClick={() => changeLocale("am")}>{lang.common.amharic}</MenuItem></MenuList>
				</Menu>
				{user ? (
					<Link legacyBehavior href={user.role === "ADMIN" ? "/admin" : "/dashboard"} passHref><Button as="a" leftIcon={<MdDashboard />} bg="mainyellow" color="maingray" borderRadius="full" px="5" _hover={{ bg: "#f0c875", transform: "translateY(-1px)" }}>{lang.common.dashboard}</Button></Link>
				) : (
					<Link legacyBehavior href="/auth/login" passHref><Button as="a" leftIcon={<MdLogin />} bg="white" color="maingray" borderRadius="full" px="5" _hover={{ bg: "mainyellow", transform: "translateY(-1px)" }}>{lang.common.signIn}</Button></Link>
				)}
			</Flex>
			{user ? (
				<Link legacyBehavior href={user.role === "ADMIN" ? "/admin" : "/dashboard"} passHref><IconButton as="a" display={{ base: "flex", lg: "none" }} color="maingray" bg="mainyellow" _hover={{ bg: "#f0c875" }} ml="2" aria-label={lang.common.dashboard} icon={<MdDashboard />} /></Link>
			) : (
				<Link legacyBehavior href="/auth/login" passHref><IconButton as="a" display={{ base: "flex", lg: "none" }} color="white" bg="whiteAlpha.200" _hover={{ bg: "whiteAlpha.300" }} ml="2" aria-label={lang.common.signIn} icon={<MdAccountBox />} /></Link>
			)}
		</Flex>
	);
};

interface IMobMenu { open: boolean; closeFunc: () => void; user?: any; }
export const MobileMenu: FC<IMobMenu> = ({ open, closeFunc, user }) => {
	const router = useRouter();
	const { locale, asPath } = router;
	const lang = locale === "am" ? am : en;
	const panelBg = useColorModeValue("#fbfaf7", "#0d0d0d");
	const panelText = useColorModeValue("#21383e", "#e7eff0");
	const panelBorder = useColorModeValue("#ece8df", "whiteAlpha.200");
	const closeBg = useColorModeValue("#f0ece3", "whiteAlpha.100");
	const closeHover = useColorModeValue("#e8dfd2", "whiteAlpha.200");
	const secondarySurface = useColorModeValue("#f3efe7", "#161616");
	const mutedColor = useColorModeValue("#536467", "gray.300");
	const languageSurface = useColorModeValue("white", "#101010");
	const languageBorder = useColorModeValue("#e7e1d5", "whiteAlpha.200");
	const inactiveHover = useColorModeValue("#f5f3ee", "whiteAlpha.100");
	const changeLocale = (nextLocale: string) => { router.push(asPath, asPath, { locale: nextLocale }); closeFunc(); };
	return (
		<>
			<Box position="fixed" inset="0" bg="rgba(17, 36, 39, .58)" backdropFilter="blur(3px)" zIndex="1002" opacity={open ? 1 : 0} visibility={open ? "visible" : "hidden"} pointerEvents={open ? "auto" : "none"} transition="all 220ms ease" onClick={closeFunc} aria-hidden="true" />
			<Flex role="dialog" aria-modal={open || undefined} aria-label={lang.common.menu} position="fixed" right={open ? "0" : "-100%"} top="0" height="100vh" boxShadow="-20px 0 60px rgba(12, 28, 31, .2)" bg={panelBg} color={panelText} direction="column" w={{ base: "90vw", sm: "390px" }} maxW="390px" zIndex="1003" p="0 24px 24px" transition="right 280ms cubic-bezier(.2,.7,.2,1)" visibility={open ? "visible" : "hidden"} pointerEvents={open ? "auto" : "none"} aria-hidden={!open}>
				<Flex align="center" justify="space-between" gap="4" py="6" borderBottom="1px solid" borderColor={panelBorder}>
					<BrandLogo />
					<Flex align="center" gap="2"><ColorModeToggle /><IconButton flexShrink={0} color={panelText} bg={closeBg} _hover={{ bg: closeHover }} _focus={{ outline: "none", boxShadow: "0 0 0 3px rgba(242,182,78,.48)" }} _focusVisible={{ outline: "2px solid #f2b64e", outlineOffset: "2px", boxShadow: "0 0 0 3px rgba(242,182,78,.35)" }} aria-label={lang.common.close} icon={<CloseIcon />} onClick={closeFunc} borderRadius="full" /></Flex>
				</Flex>
				<Flex direction="column" gap="2" pt="6">
					<MobMenuItem title={lang.nav.home} href="/#home" icon={<MdHomeWork size="19" />} active onClick={closeFunc} />
					<MobMenuItem title={lang.nav.explore} href="/explore" icon={<MdExplore size="19" />} onClick={closeFunc} />
					<MobMenuItem title={lang.nav.contact} href="/#Contact" icon={<MdOutlineContactSupport size="19" />} onClick={closeFunc} />
				</Flex>
				<Box mt="auto" pt="6">
					<Box mb="5" p="4" bg={secondarySurface} border="1px solid" borderColor={panelBorder} borderRadius="2xl">
						<Flex align="center" gap="2" color="#ad6348" mb="3"><MdLanguage size="17" /><Text color={mutedColor} fontSize="xs" fontWeight="bold" textTransform="uppercase" letterSpacing=".1em">{lang.common.language}</Text></Flex>
						<Flex p="1" bg={languageSurface} border="1px solid" borderColor={languageBorder} borderRadius="xl" gap="1">
							<Button flex="1" h="10" variant={locale === "en" ? "solid" : "ghost"} bg={locale === "en" ? "#21383e" : "transparent"} color={locale === "en" ? "white" : mutedColor} _hover={{ bg: locale === "en" ? "#142a30" : inactiveHover }} borderRadius="lg" onClick={() => changeLocale("en")}>{lang.common.english}</Button>
							<Button flex="1" h="10" variant={locale === "am" ? "solid" : "ghost"} bg={locale === "am" ? "#21383e" : "transparent"} color={locale === "am" ? "white" : mutedColor} _hover={{ bg: locale === "am" ? "#142a30" : inactiveHover }} borderRadius="lg" onClick={() => changeLocale("am")}>{lang.common.amharic}</Button>
						</Flex>
					</Box>
					{user ? (
						<Link legacyBehavior href={user.role === "ADMIN" ? "/admin" : "/dashboard"} passHref><Button as="a" w="full" h="12" color="maingray" bg="mainyellow" _hover={{ bg: "#f0c875" }} borderRadius="xl" leftIcon={<MdDashboard size="19" />} onClick={closeFunc}>{lang.common.dashboard}</Button></Link>
					) : (
						<Link legacyBehavior href="/auth/login" passHref><Button as="a" w="full" h="12" color="white" bg="#c96f3d" _hover={{ bg: "#b65e31" }} borderRadius="xl" leftIcon={<MdBusinessCenter size="19" />} onClick={closeFunc}>{lang.common.signIn}</Button></Link>
					)}
				</Box>
			</Flex>
		</>
	);
};

export const LinkItem: FC<INavItem> = ({ title, href }) => <Link legacyBehavior href={href} passHref><Text as="a" className={styles.navLink} mx="5" fontSize="sm" fontWeight="semibold" userSelect="none" cursor="pointer" color="whiteAlpha.900" _hover={{ color: "white" }}>{title}</Text></Link>;
export const MobMenuItem: FC<INavItem> = ({ title, href, onClick, icon, active }) => {
	const inactiveColor = useColorModeValue("#31494c", "gray.200");
	const inactiveBg = useColorModeValue("#f0ece3", "whiteAlpha.100");
	return <Link legacyBehavior href={href} passHref><Button as="a" justifyContent="flex-start" h="12" px="4" gap="3" bg={active ? "#21383e" : "transparent"} color={active ? "white" : inactiveColor} fontWeight="semibold" borderRadius="xl" boxShadow={active ? "0 8px 18px rgba(33,56,62,.14)" : "none"} _hover={{ bg: active ? "#142a30" : inactiveBg, color: active ? "white" : "#b85f36" }} leftIcon={icon as any} aria-current={active ? "page" : undefined} onClick={onClick}>{title}</Button></Link>;
};
