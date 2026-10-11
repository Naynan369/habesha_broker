import { ArrowLeftIcon } from "@chakra-ui/icons";
import { Box, Button, Flex, Heading, Text, useColorModeValue } from "@chakra-ui/react";
import { useLang } from "@libs/hooks/useLang";
import Link from "next/link";
import { useRouter } from "next/router";
import { ReactNode } from "react";
import styles from "@styles/Auth.module.scss";
import { ColorModeToggle } from "@components/shared/ColorModeToggle";

interface AuthPageLayoutProps {
	children: ReactNode;
}

export const AuthPageLayout = ({ children }: AuthPageLayoutProps) => {
	const lang = useLang();
	const router = useRouter();
	const canvas = useColorModeValue("#f2f5f4", "#10191d");
	const surface = useColorModeValue("white", "#1b2a30");
	const textColor = useColorModeValue("#143A45", "#e7eff0");
	const borderColor = useColorModeValue("gray.200", "whiteAlpha.200");
	const inactiveLanguageColor = useColorModeValue("gray.600", "gray.300");
	const inactiveLanguageHover = useColorModeValue("gray.100", "whiteAlpha.100");

	const imageContent = (
		<Flex
			position="relative"
			zIndex={1}
			maxW="460px"
			height="full"
			p={{ base: 6, md: 10, xl: 14 }}
			direction="column"
			justify="space-between"
			color="white"
		>
			<Flex align="center" gap="3">
				<Flex
					w="44px"
					h="44px"
					align="center"
					justify="center"
					borderRadius="14px"
					bg="mainyellow"
					color="maingray"
					fontWeight="800"
					fontSize="sm"
				>
					HB
				</Flex>
				<Box>
					<Text fontWeight="800" letterSpacing="0.08em" fontSize="sm">
						HABESHA BROKERS
					</Text>
				</Box>
			</Flex>

			<Box mt={{ base: 8, lg: 0 }}>
				<Text
					mb="4"
					fontSize="xs"
					fontWeight="700"
					letterSpacing="0.14em"
					textTransform="uppercase"
					color="mainyellow"
				>
					HABESHA BROKERS
				</Text>
				<Heading
					maxW="440px"
					fontSize={{ base: "2xl", md: "4xl", xl: "5xl" }}
					lineHeight="1.12"
					letterSpacing="-0.035em"
				>
					{lang.auth.panel_title}
				</Heading>
				<Text mt="5" maxW="410px" color="whiteAlpha.900" fontSize={{ base: "sm", md: "md" }} lineHeight="1.8">
					{lang.auth.panel_description}
				</Text>
			</Box>

			<Text fontSize="xs" color="whiteAlpha.800">
				Habesha Brokers
			</Text>
		</Flex>
	);

	return (
		<Box minH="100vh" bg={canvas} px={{ base: 0, md: 6 }} py={{ base: 0, md: 6 }}>
			<Box
				mx="auto"
				w="full"
				maxW="1280px"
				minH={{ base: "100vh", md: "calc(100vh - 48px)" }}
				bg={surface}
				borderRadius={{ base: 0, md: "28px" }}
				overflow="hidden"
				boxShadow={{ base: "none", md: "0 24px 80px rgba(20, 58, 69, 0.12)" }}
				display="grid"
				gridTemplateColumns={{ base: "minmax(0, 1fr)", lg: "minmax(0, 0.43fr) minmax(0, 0.57fr)" }}
			>
				<Box
					className={styles.authImagePanel}
					display={{ base: "none", lg: "block" }}
					minH="720px"
				>
					{imageContent}
				</Box>

				<Box
					className={styles.authImagePanel}
					display={{ base: "block", lg: "none" }}
					position="relative"
					h={{ base: "200px", sm: "230px" }}
					aria-label={lang.auth.panel_title}
				>
					<Flex
						position="relative"
						zIndex={1}
						h="full"
						px={{ base: 5, sm: 8 }}
						py="5"
						direction="column"
						justify="space-between"
						color="white"
					>
						<Flex align="center" gap="3">
							<Flex w="40px" h="40px" align="center" justify="center" borderRadius="13px" bg="mainyellow" color="maingray" fontWeight="800" fontSize="sm">
								HB
							</Flex>
							<Text fontWeight="800" letterSpacing="0.08em" fontSize="sm">HABESHA BROKERS</Text>
						</Flex>
						<Heading fontSize="2xl" lineHeight="1.15" maxW="520px">
							{lang.auth.panel_title}
						</Heading>
					</Flex>
				</Box>

				<Flex minW={0} w="full" direction="column" justify="center">
					<Flex
						w="full"
						maxW="620px"
						mx="auto"
						px={{ base: 6, sm: 10, lg: 12, xl: 16 }}
						pt={{ base: 6, lg: 10 }}
						pb={{ base: 10, lg: 12 }}
						direction="column"
					>
						<Flex align="center" justify="space-between" gap="3" mb={{ base: 8, md: 10 }}>
							<Link href="/" passHref>
								<Button
									as="a"
									leftIcon={<ArrowLeftIcon />}
									variant="ghost"
					color={textColor}
									fontSize="sm"
									px="2"
									aria-label={lang.auth.home}
								>
									{lang.auth.home}
								</Button>
							</Link>
							<Flex
								align="center"
								border="1px solid"
				borderColor={borderColor}
								borderRadius="full"
								p="1"
								role="group"
								aria-label={lang.auth.switch_language}
							>
				<Button size="xs" h="30px" minW="42px" borderRadius="full" bg={router.locale === "en" ? "mainorange" : "transparent"} color={router.locale === "en" ? "white" : inactiveLanguageColor} _hover={{ bg: router.locale === "en" ? "#ad582a" : inactiveLanguageHover }} onClick={() => void router.push(router.asPath, router.asPath, { locale: "en" })} aria-pressed={router.locale === "en"} aria-label="English">
									EN
								</Button>
				<Button size="xs" h="30px" minW="42px" borderRadius="full" bg={router.locale === "am" ? "mainorange" : "transparent"} color={router.locale === "am" ? "white" : inactiveLanguageColor} _hover={{ bg: router.locale === "am" ? "#ad582a" : inactiveLanguageHover }} onClick={() => void router.push(router.asPath, router.asPath, { locale: "am" })} aria-pressed={router.locale === "am"} aria-label="አማርኛ">
									አማ
								</Button>
							</Flex>
							<ColorModeToggle />
						</Flex>

						{children}
					</Flex>
				</Flex>
			</Box>
		</Box>
	);
};
