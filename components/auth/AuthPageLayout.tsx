import { ArrowBackIcon } from "@chakra-ui/icons";
import { Box, Button, Flex, Grid, Heading, Text, useColorModeValue } from "@chakra-ui/react";
import { BrandLogo } from "@components/shared/BrandLogo";
import { ColorModeToggle } from "@components/shared/ColorModeToggle";
import { useLang } from "@libs/hooks/useLang";
import styles from "@styles/Auth.module.scss";
import Link from "next/link";
import { useRouter } from "next/router";
import type { ReactNode } from "react";

export function AuthPageLayout({ children }: { children: ReactNode }) {
	const lang = useLang();
	const router = useRouter();
	const canvas = useColorModeValue("#e9ece9", "#080b0d");
	const surface = useColorModeValue("#fbfcfa", "#101516");
	const textColor = useColorModeValue("#1a3236", "#f0f3f1");
	const muted = useColorModeValue("#667679", "#a6b5b7");
	const line = useColorModeValue("#dce3e0", "#344044");
	const controlBg = useColorModeValue("#f2f5f2", "#1b2426");
	const selectedBg = useColorModeValue("#1b4145", "#d8b479");
	const selectedText = useColorModeValue("#ffffff", "#162526");
	const controlHover = useColorModeValue("#e6eeea", "#2a3739");

	return (
		<Box minH="100dvh" bg={canvas}>
			<Grid mx="auto" maxW="1680px" minH="100dvh" templateColumns={{ base: "minmax(0, 1fr)", lg: "minmax(0, 1.03fr) minmax(0, .97fr)" }}>
				<Box className={styles.authImagePanel} position={{ base: "relative", lg: "sticky" }} top="0" alignSelf="start" h={{ base: "220px", sm: "260px", lg: "100dvh" }} minH={{ lg: "720px" }} overflow="hidden">
					<Flex position="relative" zIndex="1" h="full" p={{ base: 6, sm: 8, lg: 12, xl: 16 }} direction="column" justify="space-between" color="white">
						<Flex align="center" justify="space-between" gap="4">
							<BrandLogo />
							<Text fontSize="xs" fontWeight="700" letterSpacing=".15em" textTransform="uppercase" color="#f1d4a8" textAlign="right">{lang.auth.photo_location}</Text>
						</Flex>
						<Box display={{ base: "none", lg: "block" }} maxW="580px">
							<Box w="54px" h="3px" bg="#d8b479" mb="8" />
							<Heading as="h2" fontSize={{ lg: "3.5rem", xl: "4.5rem" }} lineHeight="1.04" letterSpacing="-.06em" fontWeight="700">
								{lang.auth.panel_title}
							</Heading>
							<Text mt="6" maxW="470px" fontSize={{ lg: "md", xl: "lg" }} lineHeight="1.7" color="rgba(255,255,255,.88)">
								{lang.auth.panel_description}
							</Text>
							<Box mt="12" pt="5" borderTop="1px solid rgba(255,255,255,.34)" fontSize="xs" letterSpacing=".12em" textTransform="uppercase" color="rgba(255,255,255,.76)">
								Habesha Brokers
							</Box>
						</Box>
					</Flex>
				</Box>

				<Flex bg={surface} minW="0" minH={{ lg: "100dvh" }} direction="column" px={{ base: 5, sm: 9, lg: 12, xl: 16 }}>
					<Flex as="nav" aria-label={lang.auth.home} w="full" maxW="560px" mx="auto" pt={{ base: 6, lg: 10 }} align="center" justify="space-between" gap="4">
						<Link legacyBehavior href="/" passHref>
							<Button as="a" leftIcon={<ArrowBackIcon />} variant="ghost" color={textColor} fontSize="sm" fontWeight="700" borderRadius="full" px="3" _hover={{ bg: controlHover, color: textColor }} _focusVisible={{ outline: "2px solid #c66b36", outlineOffset: "2px" }}>
								{lang.auth.home}
							</Button>
						</Link>
						<Flex align="center" gap="3">
							<Flex role="group" aria-label={lang.auth.switch_language} p="1" bg={controlBg} border="1px solid" borderColor={line} borderRadius="full" gap="1">
								{(["en", "am"] as const).map((locale) => {
									const active = router.locale === locale;
									return (
										<Button key={locale} size="xs" h="31px" minW="44px" px="2" borderRadius="full" bg={active ? selectedBg : "transparent"} color={active ? selectedText : muted} _hover={{ bg: active ? selectedBg : controlHover, color: active ? selectedText : textColor }} _focusVisible={{ outline: "2px solid #c66b36", outlineOffset: "2px" }} onClick={() => void router.push(router.asPath, router.asPath, { locale })} aria-pressed={active} aria-label={locale === "en" ? "English" : "አማርኛ"}>
											{locale === "en" ? "EN" : "አማ"}
										</Button>
									);
								})}
							</Flex>
							<ColorModeToggle />
						</Flex>
					</Flex>
					<Flex flex="1" w="full" maxW="560px" mx="auto" py={{ base: 10, sm: 12, lg: 12, xl: 16 }} direction="column" justify="center">
						{children}
					</Flex>
					<Box w="full" maxW="560px" mx="auto" py="5" borderTop="1px solid" borderColor={line} color={muted} fontSize="xs">
						Habesha Brokers
					</Box>
				</Flex>
			</Grid>
		</Box>
	);
}
