import { ChevronDownIcon, HamburgerIcon } from "@chakra-ui/icons";
import {
	Avatar,
	Box,
	Button,
	Drawer,
	DrawerBody,
	DrawerCloseButton,
	DrawerContent,
	DrawerHeader,
	DrawerOverlay,
	Flex,
	IconButton,
	Menu,
	MenuButton,
	MenuItem,
	MenuList,
	Text,
	useColorModeValue,
	useDisclosure,
	VStack,
} from "@chakra-ui/react";
import { BrandLogo } from "@components/shared/BrandLogo";
import { ColorModeToggle } from "@components/shared/ColorModeToggle";
import { getMediaUrl } from "@libs/helpers/media";
import { useLang } from "@libs/hooks/useLang";
import Link from "next/link";
import { useRouter } from "next/router";
import { ReactNode } from "react";
import {
	MdDashboard,
	MdExplore,
	MdHomeWork,
	MdLanguage,
	MdLogin,
	MdLogout,
	MdOutlineContactSupport,
} from "react-icons/md";

type SiteNavbarMode = "public" | "dashboard" | "admin";

interface SiteNavbarProps {
	mode?: SiteNavbarMode;
	user?: any;
	onLogout?: () => void;
}

interface NavigationLinkProps {
	title: string;
	href: string;
	icon: ReactNode;
	active: boolean;
	onClick?: () => void;
}

export function SiteNavbar({ mode = "public", user, onLogout }: SiteNavbarProps) {
	const lang = useLang();
	const router = useRouter();
	const { locale, asPath } = router;
	const drawer = useDisclosure();
	const isHome = router.pathname === "/" && !asPath.includes("#Contact");
	const isExplore = router.pathname.startsWith("/explore");
	const isContact = router.pathname === "/" && asPath.includes("#Contact");
	const accountHref = user?.role === "ADMIN" ? "/admin" : "/dashboard";
	const isWorkspace = mode !== "public";
	const headerSurface = useColorModeValue("rgba(255,255,255,.94)", "rgba(0,0,0,.92)");
	const headerText = useColorModeValue("#143A45", "#e7eff0");
	const border = useColorModeValue("gray.200", "whiteAlpha.200");
	const controlSurface = useColorModeValue("#f5f3ee", "whiteAlpha.100");
	const controlHover = useColorModeValue("gray.100", "whiteAlpha.200");
	const drawerSurface = useColorModeValue("white", "#080808");
	const drawerMuted = useColorModeValue("gray.600", "gray.300");
	const languageSurface = useColorModeValue("#f5f5f1", "#111111");
	const logoutColor = useColorModeValue("red.700", "red.200");
	const logoutHover = useColorModeValue("red.50", "whiteAlpha.100");

	const changeLocale = (nextLocale: "en" | "am") => {
		drawer.onClose();
		if (nextLocale === locale) return;

		// Keep the current page and its query when changing languages. Using the
		// route object lets Next resolve the localized dashboard route reliably.
		void router.replace(
			{ pathname: router.pathname, query: router.query },
			asPath,
			{ locale: nextLocale, scroll: false },
		);
	};

	const accountLabel = mode === "admin" || user?.role === "ADMIN"
		? lang.common.adminConsole
		: user
			? lang.common.dashboard
			: lang.common.signIn;
	const accountIcon = user ? <MdDashboard /> : <MdLogin />;

	const renderNavLink = (title: string, href: string, active: boolean, onClick?: () => void) => (
		<Link key={title} legacyBehavior href={href} passHref>
			<Button
				as="a"
				size="sm"
				h="9"
				px="4"
				borderRadius="full"
				variant={active ? "solid" : "ghost"}
				bg={active ? "#21383e" : "transparent"}
				color={active ? "white" : headerText}
				fontWeight={active ? "bold" : "semibold"}
				aria-current={active ? "page" : undefined}
				_hover={{ bg: active ? "#142a30" : controlHover, color: active ? "white" : headerText }}
				_focusVisible={{ outline: "2px solid #E9B75C", outlineOffset: "2px" }}
				onClick={onClick}
			>
				{title}
			</Button>
		</Link>
	);

	const renderDrawerLink = ({ title, href, icon, active, onClick }: NavigationLinkProps) => (
		<Link key={title} legacyBehavior href={href} passHref>
			<Button
				as="a"
				w="full"
				justifyContent="flex-start"
				h="12"
				px="4"
				gap="3"
				bg={active ? "#21383e" : "transparent"}
				color={active ? "white" : drawerMuted}
				fontWeight="semibold"
				borderRadius="xl"
				boxShadow={active ? "0 8px 20px rgba(33,56,62,.16)" : "none"}
				_hover={{ bg: active ? "#142a30" : controlHover, color: active ? "white" : headerText }}
				_focusVisible={{ outline: "2px solid #E9B75C", outlineOffset: "2px" }}
				leftIcon={icon as any}
				aria-current={active ? "page" : undefined}
				onClick={onClick}
			>
				{title}
			</Button>
		</Link>
	);

	return (
		<>
			<Box
				as="header"
				position={router.pathname === "/" ? "fixed" : "sticky"}
				top="0"
				left="0"
				w="full"
				zIndex="1001"
				bg={headerSurface}
				color={headerText}
				backdropFilter="blur(18px)"
				borderBottom="1px solid"
				borderColor={border}
				boxShadow="0 8px 24px rgba(12,30,34,.07)"
			>
				<Flex
					w="full"
					maxW="1480px"
					h={{ base: "70px", lg: "78px" }}
					px={{ base: 4, md: 8, xl: 12 }}
					mx="auto"
					align="center"
					gap={{ base: 3, lg: 5 }}
				>
					<Link legacyBehavior href="/" passHref>
						<Flex as="a" align="center" flexShrink={0} aria-label={lang.title} _focusVisible={{ outline: "2px solid #E9B75C", outlineOffset: "5px", borderRadius: "md" }}>
							<BrandLogo compact />
						</Flex>
					</Link>
					<Box flex="1" display={{ base: "block", lg: "none" }} />
					<Flex display={{ base: "none", lg: "flex" }} align="center" gap="1" p="1" bg={controlSurface} border="1px solid" borderColor={border} borderRadius="full">
						{renderNavLink(lang.nav.home, "/#home", isHome)}
						{renderNavLink(lang.nav.explore, "/explore", isExplore)}
						{renderNavLink(lang.nav.contact, "/#Contact", isContact)}
					</Flex>
					<Box flex="1" display={{ base: "none", lg: "block" }} />
					<Flex align="center" gap={{ base: 2, lg: 3 }}>
						<Flex display={{ base: "none", lg: "flex" }} align="center" gap="1" p="1" bg={controlSurface} border="1px solid" borderColor={border} borderRadius="full">
							<ColorModeToggle />
							<Menu>
								<MenuButton as={Button} size="sm" h="9" variant="ghost" color={headerText} borderRadius="full" leftIcon={<MdLanguage />} rightIcon={<ChevronDownIcon />} _hover={{ bg: controlHover }} aria-label={lang.common.language}>
									{locale === "am" ? lang.common.amharic : lang.common.english}
								</MenuButton>
								<MenuList bg={drawerSurface} color={headerText} borderColor={border} borderRadius="xl" boxShadow="0 16px 36px rgba(0,0,0,.18)" p="2">
									<MenuItem borderRadius="lg" onClick={() => changeLocale("en")}>{lang.common.english}</MenuItem>
									<MenuItem borderRadius="lg" onClick={() => changeLocale("am")}>{lang.common.amharic}</MenuItem>
								</MenuList>
							</Menu>
						</Flex>
						{isWorkspace && user && (
							<Flex align="center" gap="2" p="1" bg={controlSurface} border="1px solid" borderColor={border} borderRadius="full">
								<Avatar size="sm" name={`${user.firstName} ${user.lastName}`} src={getMediaUrl(user.profile_url, "profile")} />
								<Button display={{ base: "none", sm: "inline-flex" }} as={Link} href={accountHref} size="sm" variant="ghost" color={headerText} borderRadius="full" _hover={{ bg: controlHover }}>{accountLabel}</Button>
								{onLogout && <IconButton display={{ base: "none", sm: "inline-flex" }} size="sm" aria-label={lang.dashboardPage.logout} icon={<MdLogout />} color={logoutColor} variant="ghost" borderRadius="full" _hover={{ bg: logoutHover }} onClick={onLogout} />}
							</Flex>
						)}
						{mode === "public" && (
							<Link legacyBehavior href={user ? accountHref : "/auth/login"} passHref>
								<Button as="a" display={{ base: "none", lg: "inline-flex" }} leftIcon={accountIcon} bg="mainyellow" color="maingray" borderRadius="full" px="5" boxShadow="0 6px 16px rgba(0,0,0,.12)" _hover={{ bg: "#f0c875", transform: "translateY(-1px)" }} transition="all 160ms ease">{accountLabel}</Button>
							</Link>
						)}
						<Box display={{ base: "flex", lg: "none" }}><ColorModeToggle /></Box>
						<IconButton
							display={{ base: "flex", lg: "none" }}
							aria-label={lang.common.menu}
							icon={<HamburgerIcon />}
							color={headerText}
							bg={controlSurface}
							border="1px solid"
							borderColor={border}
							borderRadius="xl"
							_hover={{ bg: controlHover }}
							onClick={drawer.onOpen}
						/>
					</Flex>
				</Flex>
			</Box>

			<Drawer isOpen={drawer.isOpen} onClose={drawer.onClose} placement="right" size="xs">
				<DrawerOverlay bg="rgba(7,19,22,.58)" backdropFilter="blur(4px)" />
				<DrawerContent bg={drawerSurface} color={headerText} maxW="360px" borderLeft="1px solid" borderColor={border}>
					<DrawerHeader position="relative" flexShrink={0} px="6" pt="calc(env(safe-area-inset-top) + 1.25rem)" pb="5" borderBottom="1px solid" borderColor={border}>
						<Text mb="2" color="mainorange" fontSize="10px" fontWeight="bold" letterSpacing=".16em" textTransform="uppercase">{lang.common.navigation}</Text>
						<BrandLogo compact />
						<DrawerCloseButton top="calc(env(safe-area-inset-top) + 1rem)" right="4" w="10" h="10" borderRadius="full" bg={controlSurface} aria-label={lang.common.close} />
					</DrawerHeader>
					<DrawerBody display="flex" flexDirection="column" px="5" pt="5" pb="calc(env(safe-area-inset-bottom) + 1.25rem)">
						<VStack align="stretch" spacing="2">
							{renderDrawerLink({ title: lang.nav.home, href: "/#home", icon: <MdHomeWork />, active: isHome, onClick: drawer.onClose })}
							{renderDrawerLink({ title: lang.nav.explore, href: "/explore", icon: <MdExplore />, active: isExplore, onClick: drawer.onClose })}
							{renderDrawerLink({ title: lang.nav.contact, href: "/#Contact", icon: <MdOutlineContactSupport />, active: isContact, onClick: drawer.onClose })}
						</VStack>
						<Box mt="auto" pt="6">
							<Box mb="4" p="4" bg={languageSurface} border="1px solid" borderColor={border} borderRadius="2xl">
								<Flex align="center" gap="2" color="mainorange" mb="3"><MdLanguage /><Text color={drawerMuted} fontSize="xs" fontWeight="bold" textTransform="uppercase" letterSpacing=".1em">{lang.common.language}</Text></Flex>
								<Flex p="1" bg={drawerSurface} border="1px solid" borderColor={border} borderRadius="xl" gap="1">
									<Button flex="1" h="10" variant={locale === "en" ? "solid" : "ghost"} bg={locale === "en" ? "#21383e" : "transparent"} color={locale === "en" ? "white" : drawerMuted} _hover={{ bg: locale === "en" ? "#142a30" : controlHover }} borderRadius="lg" onClick={() => changeLocale("en")}>{lang.common.english}</Button>
									<Button flex="1" h="10" variant={locale === "am" ? "solid" : "ghost"} bg={locale === "am" ? "#21383e" : "transparent"} color={locale === "am" ? "white" : drawerMuted} _hover={{ bg: locale === "am" ? "#142a30" : controlHover }} borderRadius="lg" onClick={() => changeLocale("am")}>{lang.common.amharic}</Button>
								</Flex>
							</Box>
							{mode === "public" ? (
								<Link legacyBehavior href={user ? accountHref : "/auth/login"} passHref>
									<Button as="a" w="full" h="12" leftIcon={accountIcon} color="maingray" bg="mainyellow" borderRadius="xl" _hover={{ bg: "#f0c875" }} onClick={drawer.onClose}>{accountLabel}</Button>
								</Link>
							) : (
								<Flex direction="column" gap="2">
									{user && <Flex align="center" gap="3" mb="2" p="3" bg={languageSurface} border="1px solid" borderColor={border} borderRadius="xl"><Avatar size="sm" name={`${user.firstName} ${user.lastName}`} src={getMediaUrl(user.profile_url, "profile")} /><Box minW="0"><Text noOfLines={1} fontSize="sm" fontWeight="semibold">{user.firstName} {user.lastName}</Text><Text noOfLines={1} fontSize="xs" color={drawerMuted}>{mode === "admin" || user.role === "ADMIN" ? lang.common.adminConsole : lang.common.dashboard}</Text></Box></Flex>}
									{user && <Link legacyBehavior href={accountHref} passHref><Button as="a" w="full" h="12" leftIcon={accountIcon} color="maingray" bg="mainyellow" borderRadius="xl" _hover={{ bg: "#f0c875" }} onClick={drawer.onClose}>{accountLabel}</Button></Link>}
									{onLogout && <Button w="full" h="12" leftIcon={<MdLogout />} variant="outline" color={logoutColor} borderColor={border} borderRadius="xl" _hover={{ bg: logoutHover }} onClick={() => { drawer.onClose(); onLogout(); }}>{lang.dashboardPage.logout}</Button>}
								</Flex>
							)}
						</Box>
					</DrawerBody>
				</DrawerContent>
			</Drawer>
		</>
	);
}
