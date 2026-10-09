import { Flex, SimpleGrid, Heading, Text } from "@chakra-ui/react";
import Link, { LinkProps } from "next/link";
import { FC, ReactElement, ReactNode } from "react";
import styles from "@styles/Home.module.scss";
import { ChatIcon, EmailIcon, PhoneIcon } from "@chakra-ui/icons";
import { am } from "@locales/am";
import { en } from "@locales/en";
import { useRouter } from "next/router";

export const HomeFooter = () => {
	const { locale } = useRouter();
	const lang = locale === "am" ? am : en;
	return (
		<Flex background="maingray" color="white" direction="column">
			<SimpleGrid columns={{ base: 1, sm: 2, lg: 4 }} spacing={{ base: 8, md: 10 }} p={{ base: 7, md: 14 }}>
				<Flex direction="column">
					<Flex alignItems="center" gap="3" mb="4">
						<Flex w="10" h="10" borderRadius="xl" bg="whiteAlpha.100" color="mainyellow" alignItems="center" justifyContent="center" fontWeight="black">HB</Flex>
						<Heading textTransform="uppercase" fontSize="lg">{lang.title}</Heading>
					</Flex>
					<Text color="whiteAlpha.800" lineHeight="1.8">Find homes and vehicles across Ethiopia, compare the details, and connect with sellers directly.</Text>
				</Flex>
				<Flex direction="column">
					<Heading fontSize="sm" color="mainyellow" textTransform="uppercase" letterSpacing=".12em">{lang.home.services_txt}</Heading>
					<Flex mt="4" alignItems="flex-start" direction="column">
						<FooterLink href="/#categories">Browse by category</FooterLink>
						<FooterLink href="/explore">Explore all listings</FooterLink>
						<FooterLink href="/auth/login">{lang.home.work_btn}</FooterLink>
					</Flex>
				</Flex>
				<Flex direction="column">
					<Heading fontSize="sm" color="mainyellow" textTransform="uppercase" letterSpacing=".12em">{lang.home.footer.links}</Heading>
					<Flex mt="4" alignItems="flex-start" direction="column">
						<FooterLink href="/">Home</FooterLink>
						<FooterLink href="/explore">Explore</FooterLink>
						<FooterLink href="/#Contact">Contact</FooterLink>
					</Flex>
				</Flex>
				<Flex direction="column">
					<Heading fontSize="sm" color="mainyellow" textTransform="uppercase" letterSpacing=".12em">{lang.home.contacttxt}</Heading>
					<Flex mt="4" alignItems="flex-start" direction="column">
						<ContactLink icon={<PhoneIcon />} href="tel:0973723769">0973723769</ContactLink>
						<ContactLink icon={<EmailIcon />} href="mailto:naolchala6@gmail.com">naolchala6@gmail.com</ContactLink>
						<ContactLink icon={<ChatIcon />} href="https://t.me/stepphenwolf">@stepphenwolf</ContactLink>
					</Flex>
				</Flex>
			</SimpleGrid>
			<Flex background="blackAlpha.300" justifyContent="center" p="5" alignItems="center">
				<Text fontSize="sm" color="whiteAlpha.800">{lang.home.year} © {lang.home.copyright}</Text>
			</Flex>
		</Flex>
	);
};

interface ILink extends LinkProps { children?: ReactNode; icon?: ReactElement; }
const FooterLink: FC<ILink> = ({ children, ...props }) => (
	<Link {...props} passHref><Text as="a" my="1.5" className={styles.navLink} color="whiteAlpha.800" _hover={{ color: "white" }}>{children}</Text></Link>
);
const ContactLink: FC<ILink> = ({ children, icon, ...props }) => (
	<Link {...props} passHref><Flex as="a" my="1.5" className={styles.navLink} alignItems="center" color="whiteAlpha.800" _hover={{ color: "white" }}>{icon}<Text ml="2">{children}</Text></Flex></Link>
);
