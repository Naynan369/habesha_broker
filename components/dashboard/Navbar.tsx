import { Box, Flex, Heading, ButtonGroup, Button, IconButton, Text } from "@chakra-ui/react";
import { MyTheme } from "@config/theme/MyTheme";
import { useLang } from "@libs/hooks/useLang";
import Link from "next/link";
import { MdLogout } from "react-icons/md";
import { ColorModeToggle } from "@components/shared/ColorModeToggle";

export function NavBar({ logout }) {
    const lang = useLang();
    return (
        <Flex
            position="sticky"
            top="0"
            zIndex="30"
            boxShadow="0 8px 28px rgba(8, 24, 30, .14)"
            minH={MyTheme.size.navbarHeight}
            alignItems="center"
            color="white"
            background="#143A45"
            px={{ base: 4, md: 8, xl: 14 }}
            py="3"
        >
            <Flex align="center" gap="3" minW="0">
                <Box flexShrink={0} w="10" h="10" borderRadius="xl" bg="mainyellow" color="maingray" display="grid" placeItems="center" fontWeight="black">HB</Box>
                <Flex direction="column" minW="0">
                    <Heading fontSize="sm" noOfLines={1}>{lang.title}</Heading>
                    <Text color="whiteAlpha.700" fontSize="xs" letterSpacing=".1em" textTransform="uppercase">Workspace</Text>
                </Flex>
            </Flex>
            <Box flex="1" />
            <ButtonGroup spacing={{ base: 1, md: 3 }} alignItems="center">
                <ColorModeToggle />
                <Link href="/" passHref><Button as="a" display={{ base: "none", sm: "inline-flex" }} color="whiteAlpha.900" _hover={{ background: "whiteAlpha.200" }} variant="ghost">Home</Button></Link>
                <Link href="/explore" passHref><Button as="a" display={{ base: "none", sm: "inline-flex" }} color="whiteAlpha.900" _hover={{ background: "whiteAlpha.200" }} variant="ghost">Explore</Button></Link>
                <IconButton display={{ base: "inline-flex", sm: "none" }} onClick={logout} aria-label="Logout" icon={<MdLogout />} color="white" _hover={{ background: "whiteAlpha.200" }} variant="ghost" />
                <Button display={{ base: "none", sm: "inline-flex" }} rightIcon={<MdLogout />} variant="ghost" color="white" _hover={{ background: "whiteAlpha.200" }} onClick={logout}>Logout</Button>
            </ButtonGroup>
        </Flex>
    );
}
