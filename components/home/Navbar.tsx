import {
	Box, Button, Flex, Heading, IconButton, Menu, MenuButton, MenuItem, MenuList, Text,
} from "@chakra-ui/react";
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

	return (
		<Flex
			height={MyTheme.size.navbarHeight}
			position="fixed"
			top="0"
			right="0"
			width="100%"
			alignItems="center"
			px={{ base: 5, md: 10 }}
			color="white"
			zIndex="1001"
			boxShadow={scrollPos > 60 ? "lg" : ""}
			backgroundColor={scrollPos > 60 ? "rgba(7, 27, 39, .96)" : background}
			backdropFilter="blur(12px)"
			transition="all 200ms ease"
		>
			<Link href="/" passHref>
				<Flex as="a" alignItems="center" gap="3" aria-label="Habesha Brokers home">
					<Box w="10" h="10" borderRadius="xl" bg="whiteAlpha.200" color="mainyellow" display="grid" placeItems="center" fontWeight="black">HB</Box>
					<Heading fontSize={{ base: "sm", md: "md" }} letterSpacing=".04em">{lang.title}</Heading>
				</Flex>
			</Link>
			<Box flex="1" />
			<IconButton
				onClick={openFunc}
				display={{ base: "flex", lg: "none" }}
				colorScheme="whiteAlpha"
				aria-label="Open menu"
				icon={<HamburgerIcon />}
			/>
			<Flex display={{ base: "none", lg: "flex" }} alignItems="center">
				<LinkItem title={lang.nav.home} href="#home" />
				<LinkItem title={lang.nav.explore} href="/explore" />
				<LinkItem title={lang.nav.contact} href="#Contact" />
				<Menu>
					<MenuButton as={Text} className={styles.navLink} mx="5" fontWeight="bold" userSelect="none" cursor="pointer">
						Language <ChevronDownIcon />
					</MenuButton>
					<MenuList color="gray.800">
						<MenuItem onClick={() => changeLocale("en")}>English</MenuItem>
						<MenuItem onClick={() => changeLocale("am")}>Amharic</MenuItem>
					</MenuList>
				</Menu>
				<Link href="/auth/login" passHref>
					<Button as="a" leftIcon={<MdLogin />} bg="white" color="maingray" borderRadius="full" _hover={{ bg: "mainyellow" }}>Sign in</Button>
				</Link>
			</Flex>
			<Link href="/auth/login" passHref>
				<IconButton as="a" display={{ base: "flex", lg: "none" }} colorScheme="whiteAlpha" ml="2" aria-label="Sign in" icon={<MdAccountBox />} />
			</Link>
		</Flex>
	);
};

interface IMobMenu { open: boolean; closeFunc: () => void; }

export const MobileMenu: FC<IMobMenu> = ({ open, closeFunc }) => {
	const router = useRouter();
	const { locale, asPath } = router;
	const lang = locale === "am" ? am : en;
	const changeLocale = (nextLocale: string) => {
		router.push(asPath, asPath, { locale: nextLocale });
		closeFunc();
	};
	return (
		<Flex
			position="fixed"
			right={!open ? "-100%" : "0"}
			top="0"
			height="100vh"
			boxShadow="dark-lg"
			background="#071b27"
			color="white"
			direction="column"
			width={{ base: "84%", sm: "55%", md: "40%", lg: "20%" }}
			zIndex="1002"
			p="6"
			transition="all 280ms ease-in-out"
			aria-hidden={!open}
		>
			<IconButton colorScheme="whiteAlpha" alignSelf="flex-end" aria-label="Close menu" icon={<ArrowBackIcon />} mb="5" onClick={closeFunc} />
			<Flex direction="column" gap="4">
				<MobMenuItem title={lang.nav.home} href="/#home" onClick={closeFunc} />
				<MobMenuItem title={lang.nav.explore} href="/explore" onClick={closeFunc} />
				<MobMenuItem title={lang.nav.contact} href="/#Contact" onClick={closeFunc} />
			</Flex>
			<Flex mt="10" gap="3">
				<Button onClick={() => changeLocale("am")} colorScheme={locale === "am" ? "red" : "whiteAlpha"}>AM</Button>
				<Button onClick={() => changeLocale("en")} colorScheme={locale === "en" ? "blue" : "whiteAlpha"}>EN</Button>
			</Flex>
			<Link href="/auth/login" passHref>
				<Button as="a" mt="auto" size="lg" colorScheme="red" onClick={closeFunc}>Sign in</Button>
			</Link>
		</Flex>
	);
};

export const LinkItem: FC<INavItem> = ({ title, href }) => (
	<Link href={href} passHref><Text as="a" className={styles.navLink} mx="5" fontWeight="bold" userSelect="none" cursor="pointer">{title}</Text></Link>
);

export const MobMenuItem: FC<INavItem> = ({ title, href, onClick }) => (
	<Link href={href} passHref><Text as="a" className={styles.navLink} fontSize="lg" py="1" userSelect="none" cursor="pointer" onClick={onClick}>{title}</Text></Link>
);
