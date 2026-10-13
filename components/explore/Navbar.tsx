import { HamburgerIcon } from "@chakra-ui/icons";
import {
	useDisclosure, Flex, Box, HStack, Button, IconButton,
	Drawer, DrawerOverlay, DrawerContent, DrawerCloseButton, DrawerHeader,
	DrawerBody, VStack, Avatar, Text, Menu, MenuButton, MenuItem, MenuList,
	useColorModeValue,
} from "@chakra-ui/react";
import { MyTheme } from "@config/theme/MyTheme";
import { useLang } from "@libs/hooks/useLang";
import { getMediaUrl } from "@libs/helpers/media";
import { ColorModeToggle } from "@components/shared/ColorModeToggle";
import { BrandLogo } from "@components/shared/BrandLogo";
import { useRouter } from "next/router";
import Link from "next/link";
import { MdArrowForward, MdBusinessCenter, MdExplore, MdHomeWork, MdLanguage, MdOutlineContactSupport } from "react-icons/md";

export function Navbar({ user }) {
	const lang = useLang();
	const router = useRouter();
	const { isOpen, onOpen, onClose } = useDisclosure();
	const surface = useColorModeValue("white", "#0d0d0d");
	const textColor = useColorModeValue("#143A45", "#e7eff0");
	const borderColor = useColorModeValue("gray.200", "whiteAlpha.200");
	const drawerSurface = useColorModeValue("#fbfaf7", "#0d0d0d");
	const controlSurface = useColorModeValue("#f5f3ee", "whiteAlpha.100");
	const controlHover = useColorModeValue("#eee8dd", "whiteAlpha.200");
	const drawerGroup = useColorModeValue("#f3efe7", "#161616");
	const languageSurface = useColorModeValue("white", "#101010");
	const languageBorder = useColorModeValue("#e7e1d5", "whiteAlpha.200");
	const mutedText = useColorModeValue("#536467", "gray.300");
	const inactiveHover = useColorModeValue("#f5f3ee", "whiteAlpha.100");
	const changeLocale = (locale: "en" | "am") => {
		void router.push(router.asPath, router.asPath, { locale });
		onClose();
	};

	return (
		<Flex position="sticky" top="0" zIndex="20" bg={surface} color={textColor} alignItems="center" px={MyTheme.paddings.pagePadding} height={MyTheme.size.navbarHeight} boxShadow="0 4px 18px rgba(21, 42, 44, .06)" borderBottom="1px solid" borderColor={borderColor}>
			<Link legacyBehavior href="/" passHref>
				<Flex as="a" alignItems="center" gap="3" aria-label={lang.title}>
					<BrandLogo />
				</Flex>
			</Link>
			<Box flex="1" />
			<Box display={{ base: "none", md: "block" }} mr="2"><ColorModeToggle /></Box>
			<HStack display={{ base: "none", md: "flex" }} spacing="2">
				<Link legacyBehavior href="/" passHref><Button as="a" variant="ghost">{lang.nav.home}</Button></Link>
				<Link legacyBehavior href="/explore" passHref><Button as="a" variant="solid" bg="#21383e" color="white" _hover={{ bg: "#142a30" }} aria-current="page">{lang.nav.explore}</Button></Link>
				<Link legacyBehavior href="/#Contact" passHref><Button as="a" variant="ghost">{lang.nav.contact}</Button></Link>
				<Menu>
					<MenuButton as={Button} variant="ghost" aria-label={lang.common.language}>{router.locale === "am" ? lang.common.amharic : lang.common.english}</MenuButton>
					<MenuList color={textColor} bg={surface} borderColor={borderColor}>
						<MenuItem onClick={() => changeLocale("en")}>English</MenuItem>
						<MenuItem onClick={() => changeLocale("am")}>አማርኛ</MenuItem>
					</MenuList>
				</Menu>
				{!user ? (
					<Link legacyBehavior href="/auth/login" passHref><Button as="a" bg="#c66b36" color="white" _hover={{ bg: "#ad582a" }} borderRadius="full" px="7">{lang.common.signIn}</Button></Link>
				) : (
					<Link legacyBehavior href={user.role === "ADMIN" ? "/admin" : "/dashboard"} passHref>
						<Flex as="a" alignItems="center" gap="3" bg="maingray" color="white" borderRadius="full" px="2" py="2" pr="4" cursor="pointer" boxShadow="sm">
							<Avatar name={`${user.firstName} ${user.lastName}`} src={getMediaUrl(user.profile_url, "profile")} size="sm" />
							<Text textTransform="uppercase" fontSize="xs" fontWeight="bold">{lang.common.dashboard}</Text>
						</Flex>
					</Link>
				)}
			</HStack>
			{user && (
				<Link legacyBehavior href={user.role === "ADMIN" ? "/admin" : "/dashboard"} passHref>
					<IconButton as="a" display={{ base: "flex", md: "none" }} aria-label={lang.common.dashboard} mr="2" icon={<Avatar name={`${user.firstName} ${user.lastName}`} src={getMediaUrl(user.profile_url, "profile")} size="sm" />} />
				</Link>
			)}
			<IconButton ml="2" display={{ base: "flex", md: "none" }} onClick={onOpen} aria-label={lang.common.menu} variant="ghost" color={textColor} bg={controlSurface} borderRadius="xl" _hover={{ bg: controlHover, color: "#b85f36" }} _focus={{ outline: "none", boxShadow: "0 0 0 3px rgba(242,182,78,.48)" }} _focusVisible={{ outline: "2px solid #f2b64e", outlineOffset: "2px", boxShadow: "0 0 0 3px rgba(242,182,78,.35)" }} icon={<HamburgerIcon boxSize="5" />} />
			<Drawer isOpen={isOpen} closeOnOverlayClick onClose={onClose} placement="right" size="sm">
				<DrawerOverlay bg="rgba(17, 36, 39, .58)" backdropFilter="blur(3px)" />
					<DrawerContent maxW={{ base: "min(90vw, 390px)", sm: "390px" }} bg={drawerSurface} color={textColor} boxShadow="-20px 0 60px rgba(12, 28, 31, .2)">
					<Flex position="absolute" top="5" right="16" align="center" gap="2"><ColorModeToggle /></Flex>
					<DrawerCloseButton top="5" right="5" w="10" h="10" borderRadius="full" bg={controlSurface} color={textColor} _hover={{ bg: controlHover }} _focus={{ outline: "none", boxShadow: "0 0 0 3px rgba(242,182,78,.48)" }} _focusVisible={{ outline: "2px solid #f2b64e", outlineOffset: "2px", boxShadow: "0 0 0 3px rgba(242,182,78,.35)" }} aria-label={lang.common.close} />
						<DrawerHeader px="6" pt="7" pb="6" borderBottom="1px solid" borderColor={borderColor} fontWeight="normal">
						<Flex align="center" gap="3" pr="10"><BrandLogo /></Flex>
					</DrawerHeader>
					<DrawerBody px="6" py="6" display="flex" flexDirection="column">
						<VStack w="full" align="stretch" spacing="2">
							<Link legacyBehavior href="/" passHref><Button as="a" justifyContent="flex-start" h="12" px="4" gap="3" bg="transparent" color={mutedText} fontWeight="semibold" borderRadius="xl" _hover={{ bg: controlSurface, color: "#b85f36" }} leftIcon={<MdHomeWork size="19" />} onClick={onClose}>{lang.nav.home}</Button></Link>
							<Link legacyBehavior href="/explore" passHref><Button as="a" justifyContent="flex-start" h="12" px="4" gap="3" bg="#21383e" color="white" fontWeight="semibold" borderRadius="xl" boxShadow="0 8px 18px rgba(33,56,62,.14)" _hover={{ bg: "#142a30" }} leftIcon={<MdExplore size="19" />} rightIcon={<MdArrowForward size="18" />} aria-current="page" onClick={onClose}>{lang.nav.explore}</Button></Link>
							<Link legacyBehavior href="/#Contact" passHref><Button as="a" justifyContent="flex-start" h="12" px="4" gap="3" bg="transparent" color={mutedText} fontWeight="semibold" borderRadius="xl" _hover={{ bg: controlSurface, color: "#b85f36" }} leftIcon={<MdOutlineContactSupport size="19" />} onClick={onClose}>{lang.nav.contact}</Button></Link>
						</VStack>
						<Box mt="auto" pt="6">
							<Box mb="5" p="4" bg={drawerGroup} border="1px solid" borderColor={borderColor} borderRadius="2xl">
								<Flex align="center" gap="2" color="#ad6348" mb="3"><MdLanguage size="17" /><Text color={mutedText} fontSize="xs" fontWeight="bold" textTransform="uppercase" letterSpacing=".1em">{lang.common.language}</Text></Flex>
								<Flex p="1" bg={languageSurface} border="1px solid" borderColor={languageBorder} borderRadius="xl" gap="1">
									<Button flex="1" h="10" variant={router.locale === "en" ? "solid" : "ghost"} bg={router.locale === "en" ? "#21383e" : "transparent"} color={router.locale === "en" ? "white" : mutedText} _hover={{ bg: router.locale === "en" ? "#142a30" : inactiveHover }} borderRadius="lg" onClick={() => changeLocale("en")}>{lang.common.english}</Button>
									<Button flex="1" h="10" variant={router.locale === "am" ? "solid" : "ghost"} bg={router.locale === "am" ? "#21383e" : "transparent"} color={router.locale === "am" ? "white" : mutedText} _hover={{ bg: router.locale === "am" ? "#142a30" : inactiveHover }} borderRadius="lg" onClick={() => changeLocale("am")}>{lang.common.amharic}</Button>
								</Flex>
							</Box>
							{user ? (
									<Link legacyBehavior href={user.role === "ADMIN" ? "/admin" : "/dashboard"} passHref><Button as="a" w="full" h="12" color="white" bg="#c96f3d" _hover={{ bg: "#b65e31" }} borderRadius="xl" leftIcon={<MdBusinessCenter size="19" />} onClick={onClose}>{lang.common.dashboard}</Button></Link>
							) : (
							<Link legacyBehavior href="/auth/login" passHref><Button as="a" w="full" h="12" color="white" bg="#c96f3d" _hover={{ bg: "#b65e31" }} borderRadius="xl" leftIcon={<MdBusinessCenter size="19" />} onClick={onClose}>{lang.common.signIn}</Button></Link>
							)}
						</Box>
					</DrawerBody>
				</DrawerContent>
			</Drawer>
		</Flex>
	);
}
