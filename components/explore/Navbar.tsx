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

export function Navbar({ user }) {
	const lang = useLang();
	const router = useRouter();
	const { isOpen, onOpen, onClose } = useDisclosure();
	const changeLocale = (locale: "en" | "am") => {
		void router.push(router.asPath, router.asPath, { locale });
		onClose();
	};

	return (
		<Flex position="sticky" top="0" zIndex="20" bg="white" color="maingray" alignItems="center" px={MyTheme.paddings.pagePadding} height={MyTheme.size.navbarHeight} boxShadow="sm">
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
				<Button as="span" variant="solid" colorScheme="orange" aria-current="page" cursor="default">{lang.nav.explore}</Button>
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
			<IconButton ml="2" display={{ base: "flex", md: "none" }} onClick={onOpen} colorScheme="blue" aria-label={lang.common.menu} variant="outline" icon={<HamburgerIcon boxSize="5" />} />
			<Drawer isOpen={isOpen} closeOnOverlayClick onClose={onClose} placement="right">
				<DrawerOverlay />
				<DrawerContent>
					<DrawerCloseButton aria-label={lang.common.close} />
					<DrawerHeader color="maingray">{lang.common.menu}</DrawerHeader>
					<DrawerBody>
						<VStack w="full" align="stretch" spacing="3">
							<Link href="/" passHref><Button as="a" w="full" variant="ghost" onClick={onClose}>{lang.nav.home}</Button></Link>
							<Button w="full" colorScheme="orange" onClick={onClose}>{lang.nav.explore}</Button>
							<Link href="/#Contact" passHref><Button as="a" w="full" variant="ghost" onClick={onClose}>{lang.nav.contact}</Button></Link>
							{user ? (
								<Link href="/dashboard" passHref><Button as="a" w="full" colorScheme="blue" onClick={onClose}>{lang.common.dashboard}</Button></Link>
							) : (
								<Link href="/auth/login" passHref><Button as="a" w="full" colorScheme="blue" onClick={onClose}>{lang.common.signIn}</Button></Link>
							)}
							<Box pt="5" mt="2" borderTop="1px solid" borderColor="gray.100">
								<Text color="gray.500" fontSize="sm" mb="2">{lang.common.language}</Text>
								<Flex gap="2">
									<Button flex="1" variant={router.locale === "en" ? "solid" : "outline"} colorScheme={router.locale === "en" ? "orange" : "gray"} onClick={() => changeLocale("en")}>{lang.common.english}</Button>
									<Button flex="1" variant={router.locale === "am" ? "solid" : "outline"} colorScheme={router.locale === "am" ? "orange" : "gray"} onClick={() => changeLocale("am")}>{lang.common.amharic}</Button>
								</Flex>
							</Box>
						</VStack>
					</DrawerBody>
				</DrawerContent>
			</Drawer>
		</Flex>
	);
}
