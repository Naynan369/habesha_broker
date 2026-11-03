import { Box, Flex, SimpleGrid, Heading, Text, useColorModeValue } from "@chakra-ui/react";
import Link, { LinkProps } from "next/link";
import { FC, ReactElement, ReactNode } from "react";
import styles from "@styles/Home.module.scss";
import { ChatIcon, EmailIcon } from "@chakra-ui/icons";
import { am } from "@locales/am";
import { en } from "@locales/en";
import { useRouter } from "next/router";
import { BrandLogo } from "@components/shared/BrandLogo";

export const HomeFooter = () => {
	const { locale } = useRouter();
	const lang = locale === "am" ? am : en;
	const background = useColorModeValue("#1b1a1b", "#000000");
	return (
		<Flex as="footer" bg={background} color="white" direction="column">
			<SimpleGrid maxW="1440px" w="full" mx="auto" columns={{ base: 1, sm: 2, lg: 4 }} spacing={{ base: 8, md: 10 }} px={{ base: 6, md: 12, xl: 16 }} py={{ base: 10, md: 14 }}>
				<Flex direction="column">
					<Box mb="4"><BrandLogo /></Box>
					<Text color="whiteAlpha.700" lineHeight="1.8" maxW="300px">{lang.home.footer_description}</Text>
				</Flex>
				<FooterColumn title={lang.home.services_txt}><FooterLink href="/#categories">{lang.home.browse_categories}</FooterLink><FooterLink href="/explore?itemType=SERVICE">{lang.home.services_txt}</FooterLink><FooterLink href="/explore">{lang.home.explore_all}</FooterLink><FooterLink href="/auth/login">{lang.home.work_btn}</FooterLink></FooterColumn>
				<FooterColumn title={lang.home.footer.links}><FooterLink href="/">{lang.nav.home}</FooterLink><FooterLink href="/explore">{lang.nav.explore}</FooterLink><FooterLink href="/#Contact">{lang.home.contacttxt}</FooterLink><FooterLink href="/policies">{lang.policies.heading}</FooterLink></FooterColumn>
				<FooterColumn title={lang.home.contacttxt}><ContactLink icon={<EmailIcon />} href="mailto:nasaamazement321@gmail.com">nasaamazement321@gmail.com</ContactLink><ContactLink icon={<ChatIcon />} href="https://t.me/Nine131621">@Nine131621</ContactLink></FooterColumn>
			</SimpleGrid>
			<Flex bg="blackAlpha.200" justify="center" px="6" py="5" align="center"><Text fontSize="sm" color="whiteAlpha.600">© {new Date().getFullYear()} {lang.title}. {lang.home.copyright}</Text></Flex>
		</Flex>
	);
};

const FooterColumn = ({ title, children }) => <Flex direction="column"><Heading fontSize="xs" color="mainyellow" textTransform="uppercase" letterSpacing=".16em">{title}</Heading><Flex mt="4" align="flex-start" direction="column">{children}</Flex></Flex>;
interface ILink extends LinkProps { children?: ReactNode; icon?: ReactElement; }
const FooterLink: FC<ILink> = ({ children, ...props }) => <Link legacyBehavior {...props} passHref><Text as="a" my="1.5" className={styles.navLink} color="whiteAlpha.700" _hover={{ color: "white" }}>{children}</Text></Link>;
const ContactLink: FC<ILink> = ({ children, icon, ...props }) => <Link legacyBehavior {...props} passHref><Flex as="a" my="1.5" className={styles.navLink} align="center" color="whiteAlpha.700" _hover={{ color: "white" }}>{icon}<Text ml="2">{children}</Text></Flex></Link>;
