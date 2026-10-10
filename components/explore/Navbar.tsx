import { HamburgerIcon } from "@chakra-ui/icons";
import {
	useDisclosure, Flex, Heading, Box, HStack, Button, IconButton,
	Drawer, DrawerOverlay, DrawerContent, DrawerCloseButton, DrawerHeader,
	DrawerBody, VStack, Avatar, Text, Menu, MenuButton, MenuItem, MenuList,
} from "@chakra-ui/react";
import { MyTheme } from "@config/theme/MyTheme";
import { useLang } from "@libs/hooks/useLang";
import { getMediaUrl } from "@libs/helpers/media";
import { useRouter } from "next/router";
import Link from "next/link";
import { MdArrowForward, MdBusinessCenter, MdExplore, MdHomeWork, MdLanguage, MdOutlineContactSupport } from "react-icons/md";

export function Navbar({ user }) {
	const lang = useLang();
	const router = useRouter();
	const { isOpen, onOpen, onClose } = useDisclosure();
	const changeLocale = (locale: "en" | "am") => {
		void router.push(router.asPath, router.asPath, { locale });
		onClose();
	};

	return (
		<Flex position="sticky" top="0" zIndex="20" bg="white" color="maingray" alignItems="center" px={MyTheme.paddings.pagePadding} height={MyTheme.size.navbarHeight} boxShadow="0 4px 18px rgba(21, 42, 44, .06)">
			<Link href="/" passHref>
				<Flex as="a" alignItems="center" gap="3" aria-label={lang.title}>
					<Box w="10" h="10" borderRadius="xl" bg="maingray" color="mainyellow" display="grid" placeItems="center" fontWeight="black">HB</Box>
					<Flex direction="column">
						<Heading textTransform="uppercase" fontSize="sm" letterSpacing=".08em">{lang.title}</Heading>
						<Text color="gray.500" fontSize="xs">{lang.common.homesVehicles}</Text>
					</Flex>
				</Flex>
			</Link>
			<Box flex="1" />
			<HStack display={{ base: "none", md: "flex" }} spacing="2">
				<Link href="/" passHref><Button as="a" variant="ghost">{lang.nav.home}</Button></Link>
				<Link href="/explore" passHref><Button as="a" variant="solid" bg="#21383e" color="white" _hover={{ bg: "#142a30" }} aria-current="page">{lang.nav.explore}</Button></Link>
				<Link href="/#Contact" passHref><Button as="a" variant="ghost">{lang.nav.contact}</Button></Link>
				<Menu>
					<MenuButton as={Button} variant="ghost" aria-label={lang.common.language}>{router.locale === "am" ? lang.common.amharic : lang.common.english}</MenuButton>
					<MenuList color="gray.800">
						<MenuItem onClick={() => changeLocale("en")}>English</MenuItem>
						<MenuItem onClick={() => changeLocale("am")}>አማርኛ</MenuItem>
					</MenuList>
				</Menu>
				{!user ? (
					<Link href="/auth/login" passHref><Button as="a" colorScheme="blue" borderRadius="full" px="7">{lang.common.signIn}</Button></Link>
				) : (
					<Link href="/dashboard" passHref>
						<Flex as="a" alignItems="center" gap="3" bg="maingray" color="white" borderRadius="full" px="2" py="2" pr="4" cursor="pointer" boxShadow="sm">
							<Avatar name={`${user.firstName} ${user.lastName}`} src={getMediaUrl(user.profile_url, "profile")} size="sm" />
							<Text textTransform="uppercase" fontSize="xs" fontWeight="bold">{lang.common.dashboard}</Text>
						</Flex>
					</Link>
				)}
			</HStack>
			{user && (
				<Link href="/dashboard" passHref>
					<IconButton as="a" display={{ base: "flex", md: "none" }} aria-label={lang.common.dashboard} mr="2" icon={<Avatar name={`${user.firstName} ${user.lastName}`} src={getMediaUrl(user.profile_url, "profile")} size="sm" />} />
				</Link>
			)}
			<IconButton ml="2" display={{ base: "flex", md: "none" }} onClick={onOpen} aria-label={lang.common.menu} variant="ghost" color="#21383e" bg="#f5f3ee" borderRadius="xl" _hover={{ bg: "#eee8dd", color: "#b85f36" }} _focus={{ outline: "none", boxShadow: "0 0 0 3px rgba(242,182,78,.48)" }} _focusVisible={{ outline: "2px solid #f2b64e", outlineOffset: "2px", boxShadow: "0 0 0 3px rgba(242,182,78,.35)" }} icon={<HamburgerIcon boxSize="5" />} />
			<Drawer isOpen={isOpen} closeOnOverlayClick onClose={onClose} placement="right" size="sm">
				<DrawerOverlay bg="rgba(17, 36, 39, .58)" backdropFilter="blur(3px)" />
				<DrawerContent maxW={{ base: "min(90vw, 390px)", sm: "390px" }} bg="#fbfaf7" color="#21383e" boxShadow="-20px 0 60px rgba(12, 28, 31, .2)">
					<DrawerCloseButton top="5" right="5" w="10" h="10" borderRadius="full" bg="#f0ece3" color="#21383e" _hover={{ bg: "#e8dfd2" }} _focus={{ outline: "none", boxShadow: "0 0 0 3px rgba(242,182,78,.48)" }} _focusVisible={{ outline: "2px solid #f2b64e", outlineOffset: "2px", boxShadow: "0 0 0 3px rgba(242,182,78,.35)" }} aria-label={lang.common.close} />
					<DrawerHeader px="6" pt="7" pb="6" borderBottom="1px solid" borderColor="#ece8df" fontWeight="normal">
						<Flex align="center" gap="3" pr="10">
							<Box flexShrink={0} w="12" h="12" borderRadius="2xl" bg="#21383e" color="#f2b64e" display="grid" placeItems="center" fontWeight="black" fontSize="lg" boxShadow="0 8px 18px rgba(33,56,62,.16)">HB</Box>
							<Box minW="0"><Heading fontSize="sm" textTransform="uppercase" letterSpacing=".08em">{lang.title}</Heading><Text color="gray.500" fontSize="xs" mt="1">{lang.common.homesVehicles}</Text></Box>
						</Flex>
					</DrawerHeader>
					<DrawerBody px="6" py="6" display="flex" flexDirection="column">
						<VStack w="full" align="stretch" spacing="2">
							<Link href="/" passHref><Button as="a" justifyContent="flex-start" h="12" px="4" gap="3" bg="transparent" color="#31494c" fontWeight="semibold" borderRadius="xl" _hover={{ bg: "#f0ece3", color: "#b85f36" }} leftIcon={<MdHomeWork size="19" />} onClick={onClose}>{lang.nav.home}</Button></Link>
							<Link href="/explore" passHref><Button as="a" justifyContent="flex-start" h="12" px="4" gap="3" bg="#21383e" color="white" fontWeight="semibold" borderRadius="xl" boxShadow="0 8px 18px rgba(33,56,62,.14)" _hover={{ bg: "#142a30" }} leftIcon={<MdExplore size="19" />} rightIcon={<MdArrowForward size="18" />} aria-current="page" onClick={onClose}>{lang.nav.explore}</Button></Link>
							<Link href="/#Contact" passHref><Button as="a" justifyContent="flex-start" h="12" px="4" gap="3" bg="transparent" color="#31494c" fontWeight="semibold" borderRadius="xl" _hover={{ bg: "#f0ece3", color: "#b85f36" }} leftIcon={<MdOutlineContactSupport size="19" />} onClick={onClose}>{lang.nav.contact}</Button></Link>
						</VStack>
						<Box mt="auto" pt="6">
							<Box mb="5" p="4" bg="#f3efe7" border="1px solid" borderColor="#ebe5d9" borderRadius="2xl">
								<Flex align="center" gap="2" color="#ad6348" mb="3"><MdLanguage size="17" /><Text color="#536467" fontSize="xs" fontWeight="bold" textTransform="uppercase" letterSpacing=".1em">{lang.common.language}</Text></Flex>
								<Flex p="1" bg="white" border="1px solid" borderColor="#e7e1d5" borderRadius="xl" gap="1">
									<Button flex="1" h="10" variant={router.locale === "en" ? "solid" : "ghost"} bg={router.locale === "en" ? "#21383e" : "transparent"} color={router.locale === "en" ? "white" : "#536467"} _hover={{ bg: router.locale === "en" ? "#142a30" : "#f5f3ee" }} borderRadius="lg" onClick={() => changeLocale("en")}>{lang.common.english}</Button>
									<Button flex="1" h="10" variant={router.locale === "am" ? "solid" : "ghost"} bg={router.locale === "am" ? "#21383e" : "transparent"} color={router.locale === "am" ? "white" : "#536467"} _hover={{ bg: router.locale === "am" ? "#142a30" : "#f5f3ee" }} borderRadius="lg" onClick={() => changeLocale("am")}>{lang.common.amharic}</Button>
								</Flex>
							</Box>
							{user ? (
								<Link href="/dashboard" passHref><Button as="a" w="full" h="12" color="white" bg="#c96f3d" _hover={{ bg: "#b65e31" }} borderRadius="xl" leftIcon={<MdBusinessCenter size="19" />} onClick={onClose}>{lang.common.dashboard}</Button></Link>
							) : (
							<Link href="/auth/login" passHref><Button as="a" w="full" h="12" color="white" bg="#c96f3d" _hover={{ bg: "#b65e31" }} borderRadius="xl" leftIcon={<MdBusinessCenter size="19" />} onClick={onClose}>{lang.common.signIn}</Button></Link>
							)}
						</Box>
					</DrawerBody>
				</DrawerContent>
			</Drawer>
		</Flex>
	);
}
