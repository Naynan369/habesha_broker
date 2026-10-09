import { Box, Button, Flex, Heading, IconButton, Menu, MenuButton, MenuItem, MenuList, Text } from "@chakra-ui/react";
import { ArrowBackIcon, ChevronDownIcon, HamburgerIcon } from "@chakra-ui/icons";
import { MyTheme } from "@config/theme/MyTheme";
import Link from "next/link";
import { FC } from "react";
import styles from "@styles/Home.module.scss";
import { useWindowPosition } from "@libs/hooks/useWindowPosition";
import { useRouter } from "next/router";
import { en } from "@locales/en";
import { am } from "@locales/am";
import { MdAccountBox, MdLogin } from "react-icons/md";

interface INavbar { background: string; openFunc: () => void; blurred?: boolean; }
interface INavItem { title: string; href: string; onClick?: () => void; }

export const HomeNavbar: FC<INavbar> = ({ background, openFunc }) => {
	const scrollPos = useWindowPosition();
	const router = useRouter();
	const { locale, asPath } = router;
	const lang = locale === "am" ? am : en;
	const changeLocale = (nextLocale: string) => router.push(asPath, asPath, { locale: nextLocale });
	const isScrolled = scrollPos > 60;

	return (
		<Flex height={MyTheme.size.navbarHeight} position="fixed" top="0" right="0" width="100%" align="center" px={{ base: 5, md: 10, xl: 14 }} color="white" zIndex="1001" boxShadow={isScrolled ? "0 8px 28px rgba(5,22,27,.16)" : "none"} backgroundColor={isScrolled ? "rgba(12, 43, 52, .96)" : background} backdropFilter="blur(14px)" transition="all 200ms ease">
			<Link href="/" passHref><Flex as="a" align="center" gap="3" aria-label={lang.title}>
				<Box w="10" h="10" borderRadius="xl" bg="mainyellow" color="maingray" display="grid" placeItems="center" fontWeight="black" letterSpacing="-.08em">HB</Box>
				<Flex direction="column"><Heading fontSize={{ base: "xs", md: "sm" }} letterSpacing=".1em" textTransform="uppercase">{lang.title}</Heading><Text display={{ base: "none", sm: "block" }} fontSize="10px" mt=".5" color="whiteAlpha.700" letterSpacing=".1em" textTransform="uppercase">{lang.common.homesVehicles}</Text></Flex>
			</Flex></Link>
			<Box flex="1" />
			<IconButton onClick={openFunc} display={{ base: "flex", lg: "none" }} color="white" bg="whiteAlpha.200" _hover={{ bg: "whiteAlpha.300" }} aria-label={lang.common.menu} icon={<HamburgerIcon />} />
			<Flex display={{ base: "none", lg: "flex" }} align="center">
				<LinkItem title={lang.nav.home} href="#home" />
				<LinkItem title={lang.nav.explore} href="/explore" />
				<LinkItem title={lang.nav.contact} href="#Contact" />
				<Menu>
					<MenuButton as={Text} className={styles.navLink} mx="5" fontSize="sm" fontWeight="semibold" userSelect="none" cursor="pointer" color="whiteAlpha.900">{lang.common.language} <ChevronDownIcon /></MenuButton>
					<MenuList color="gray.800"><MenuItem onClick={() => changeLocale("en")}>{lang.common.english}</MenuItem><MenuItem onClick={() => changeLocale("am")}>{lang.common.amharic}</MenuItem></MenuList>
				</Menu>
				<Link href="/auth/login" passHref><Button as="a" leftIcon={<MdLogin />} bg="white" color="maingray" borderRadius="full" px="5" _hover={{ bg: "mainyellow", transform: "translateY(-1px)" }}>{lang.common.signIn}</Button></Link>
			</Flex>
			<Link href="/auth/login" passHref><IconButton as="a" display={{ base: "flex", lg: "none" }} color="white" bg="whiteAlpha.200" _hover={{ bg: "whiteAlpha.300" }} ml="2" aria-label={lang.common.signIn} icon={<MdAccountBox />} /></Link>
		</Flex>
	);
};

interface IMobMenu { open: boolean; closeFunc: () => void; }
export const MobileMenu: FC<IMobMenu> = ({ open, closeFunc }) => {
	const router = useRouter();
	const { locale, asPath } = router;
	const lang = locale === "am" ? am : en;
	const changeLocale = (nextLocale: string) => { router.push(asPath, asPath, { locale: nextLocale }); closeFunc(); };
	return (
		<>
			<Box position="fixed" inset="0" bg="blackAlpha.600" zIndex="1002" opacity={open ? 1 : 0} visibility={open ? "visible" : "hidden"} pointerEvents={open ? "auto" : "none"} transition="all 220ms ease" onClick={closeFunc} aria-hidden="true" />
			<Flex position="fixed" right={open ? "0" : "-100%"} top="0" height="100vh" boxShadow="dark-lg" bg="#102f39" color="white" direction="column" w={{ base: "84%", sm: "55%", md: "40%", lg: "20%" }} maxW="420px" zIndex="1003" p="6" transition="right 280ms ease-in-out" aria-hidden={!open}>
				<IconButton color="white" bg="whiteAlpha.200" _hover={{ bg: "whiteAlpha.300" }} alignSelf="flex-end" aria-label={lang.common.close} icon={<ArrowBackIcon />} mb="7" onClick={closeFunc} />
				<Flex direction="column" gap="5"><MobMenuItem title={lang.nav.home} href="/#home" onClick={closeFunc} /><MobMenuItem title={lang.nav.explore} href="/explore" onClick={closeFunc} /><MobMenuItem title={lang.nav.contact} href="/#Contact" onClick={closeFunc} /></Flex>
				<Flex mt="9" gap="3"><Button onClick={() => changeLocale("am")} colorScheme={locale === "am" ? "orange" : "whiteAlpha"} variant={locale === "am" ? "solid" : "outline"} aria-label={lang.common.amharic}>{lang.common.amharic}</Button><Button onClick={() => changeLocale("en")} colorScheme={locale === "en" ? "orange" : "whiteAlpha"} variant={locale === "en" ? "solid" : "outline"} aria-label={lang.common.english}>{lang.common.english}</Button></Flex>
				<Link href="/auth/login" passHref><Button as="a" mt="auto" size="lg" bg="mainyellow" color="maingray" onClick={closeFunc}>{lang.common.signIn}</Button></Link>
			</Flex>
		</>
	);
};

export const LinkItem: FC<INavItem> = ({ title, href }) => <Link href={href} passHref><Text as="a" className={styles.navLink} mx="5" fontSize="sm" fontWeight="semibold" userSelect="none" cursor="pointer" color="whiteAlpha.900" _hover={{ color: "white" }}>{title}</Text></Link>;
export const MobMenuItem: FC<INavItem> = ({ title, href, onClick }) => <Link href={href} passHref><Text as="a" className={styles.navLink} fontSize="lg" py="1" userSelect="none" cursor="pointer" color="whiteAlpha.900" onClick={onClick}>{title}</Text></Link>;
