import { Flex, Heading, Box, ButtonGroup, Button } from "@chakra-ui/react";
import { MyTheme } from "@config/theme/MyTheme";
import { useLang } from "@libs/hooks/useLang";
import Link from "next/link";
import { MdLogout } from "react-icons/md";

export function NavBar({ logout }) {
	const lang = useLang();
	return (
		<Flex
			boxShadow={"md"}
			height={MyTheme.size.navbarHeight}
			alignItems={"center"}
			color={"white"}
			background={"maingray"}
			px={MyTheme.paddings.pagePadding}
			py="5"
		>
			<Flex direction="column">
				<Heading fontSize={["sm", "md"]}>{lang.title}</Heading>
				<Heading
					fontSize={["md", "xl"]}
					textTransform="uppercase"
					color="mainyellow"
				>
					Dashboard
				</Heading>
			</Flex>
			<Box flex={"1"}></Box>
			<ButtonGroup spacing={"5"}>
				<Link href={"/"} passHref>
					<Button as="a" _hover={{ background: "#fff2" }} variant="ghost">Home</Button>
				</Link>
				<Link href={"/explore"} passHref>
					<Button as="a" _hover={{ background: "#fff2" }} variant="ghost">Explore</Button>
				</Link>
				<Button
					rightIcon={<MdLogout />}
					variant={"ghost"}
					_hover={{
						background: "#fff2",
					}}
					onClick={logout}
				>
					Logout
				</Button>
			</ButtonGroup>
		</Flex>
	);
}
