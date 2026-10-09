import { HamburgerIcon } from "@chakra-ui/icons";
import {
	useDisclosure, Flex, Heading, Box, HStack, Button, IconButton,
	Drawer, DrawerOverlay, DrawerContent, DrawerCloseButton, DrawerHeader,
	DrawerBody, VStack, Avatar, Text,
} from "@chakra-ui/react";
import { MyTheme } from "@config/theme/MyTheme";
import { useLang } from "@libs/hooks/useLang";
import { getMediaUrl } from "@libs/helpers/media";
import Link from "next/link";

export function Navbar({ user }) {
	const lang = useLang();
	const { isOpen, onOpen, onClose } = useDisclosure();
	return (
		<Flex
			position="sticky"
			top="0"
			zIndex="20"
			bg="white"
			color="maingray"
			alignItems="center"
			px={MyTheme.paddings.pagePadding}
			height={MyTheme.size.navbarHeight}
			boxShadow="sm"
		>
			<Link href="/" passHref>
				<Flex as="a" alignItems="center" gap="3" aria-label="Habesha Brokers home">
					<Box w="10" h="10" borderRadius="xl" bg="maingray" color="mainyellow" display="grid" placeItems="center" fontWeight="black">HB</Box>
					<Flex direction="column">
						<Heading textTransform="uppercase" fontSize="sm" letterSpacing=".08em">{lang.title}</Heading>
						<Text color="gray.500" fontSize="xs">Homes & vehicles</Text>
					</Flex>
				</Flex>
			</Link>
			<Box flex="1" />
			<HStack display={{ base: "none", md: "flex" }} spacing="2">
				<Link href="/" passHref><Button as="a" variant="ghost">Home</Button></Link>
				<Button as="span" variant="solid" colorScheme="orange" aria-current="page" cursor="default">Explore</Button>
				<Link href="/#Contact" passHref><Button as="a" variant="ghost">Contact us</Button></Link>
				{!user ? (
					<Link href="/auth/login" passHref><Button as="a" colorScheme="blue" borderRadius="full" px="7">Sign in</Button></Link>
				) : (
					<Link href="/dashboard" passHref>
						<Flex as="a" alignItems="center" gap="3" bg="maingray" color="white" borderRadius="full" px="2" py="2" pr="4" cursor="pointer" boxShadow="sm">
							<Avatar name={`${user.firstName} ${user.lastName}`} src={getMediaUrl(user.profile_url, "profile")} size="sm" />
							<Text textTransform="uppercase" fontSize="xs" fontWeight="bold">Dashboard</Text>
						</Flex>
					</Link>
				)}
			</HStack>
			{user && (
				<Link href="/dashboard" passHref>
					<IconButton as="a" display={{ base: "flex", md: "none" }} aria-label="Open dashboard" mr="2" icon={<Avatar name={`${user.firstName} ${user.lastName}`} src={getMediaUrl(user.profile_url, "profile")} size="sm" />} />
				</Link>
			)}
			<IconButton ml="2" display={{ base: "flex", md: "none" }} onClick={onOpen} colorScheme="blue" aria-label="Open menu" variant="outline" icon={<HamburgerIcon boxSize="5" />} />
			<Drawer isOpen={isOpen} closeOnOverlayClick onClose={onClose} placement="right">
				<DrawerOverlay />
				<DrawerContent>
					<DrawerCloseButton />
					<DrawerHeader color="maingray">Menu</DrawerHeader>
					<DrawerBody>
						<VStack w="full" align="stretch" spacing="3">
							<Link href="/" passHref><Button as="a" w="full" variant="ghost" onClick={onClose}>Home</Button></Link>
							<Button w="full" colorScheme="orange" onClick={onClose}>Explore</Button>
							<Link href="/#Contact" passHref><Button as="a" w="full" variant="ghost" onClick={onClose}>Contact us</Button></Link>
							{user ? (
								<Link href="/dashboard" passHref><Button as="a" w="full" colorScheme="blue" onClick={onClose}>Dashboard</Button></Link>
							) : (
								<Link href="/auth/login" passHref><Button as="a" w="full" colorScheme="blue" onClick={onClose}>Sign in</Button></Link>
							)}
						</VStack>
					</DrawerBody>
				</DrawerContent>
			</Drawer>
		</Flex>
	);
}
