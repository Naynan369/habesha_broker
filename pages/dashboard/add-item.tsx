import {
	Box,
	Button,
	Container,
	Flex,
	Heading,
	SimpleGrid,
	Text,
	useColorModeValue,
} from "@chakra-ui/react";
import { AddCar } from "@components/dashboard/forms/AddCar";
import { HouseAddForm } from "@components/dashboard/forms/AddHouse";
import { AddBusinessSpace } from "@components/dashboard/forms/AddBusinessSpace";
import { AddService } from "@components/dashboard/forms/AddService";
import { ColorModeToggle } from "@components/shared/ColorModeToggle";
import { BrandLogo } from "@components/shared/BrandLogo";
import { useLang } from "@libs/hooks/useLang";
import { withSessionSsr } from "@config/cookie/cookie";
import { MyTheme } from "@config/theme/MyTheme";
import Head from "next/head";
import { useRouter } from "next/router";
import { FC, ReactNode, useState } from "react";
import { FaCar } from "react-icons/fa";
import { MdArrowBack, MdCheckCircle, MdHomeWork, MdMiscellaneousServices, MdStorefront } from "react-icons/md";

type FormTypes = "HOUSE" | "CAR" | "BUSINESS_SPACE" | "SERVICE";

export const getServerSideProps = withSessionSsr(async ({ req, locale }) => {
	const user = req.user;
	if (!user) {
		return {
			redirect: {
				destination: locale === "am" ? "/am/auth/login/" : "/auth/login/",
			},
			props: {},
		};
	}
	if (!user.verfied) {
		return {
			redirect: {
				destination: locale === "am" ? "/am/dashboard/verify-account" : "/dashboard/verify-account",
			},
			props: {},
		};
	}
	return {
		props: {
			user,
		},
	};
});

export default function AddItem({ user }) {
	const router = useRouter();
	const lang = useLang();
	const text = lang.businessListing;
	const [type, setType] = useState("" as FormTypes);
	const pageBg = useColorModeValue("#f4f5f2", "#050707");
	const textColor = useColorModeValue("#20383d", "#e8eff0");
	const muted = useColorModeValue("#637278", "#a5b1b4");
	const formSurface = useColorModeValue("#ffffff", "#101415");
	const navBackground = useColorModeValue("#102f37", "#080b0c");
	const formBorder = useColorModeValue("#dce3e1", "whiteAlpha.200");
	const formShadow = useColorModeValue("0 24px 60px rgba(20,48,53,.10)", "0 28px 76px rgba(0,0,0,.42)");
	const ambientGlow = useColorModeValue("rgba(198,107,54,.08)", "rgba(233,183,92,.06)");
	const detailIconBg = useColorModeValue("#fbf1df", "rgba(233,183,92,.12)");
	const detailIconColor = useColorModeValue("#9b6522", "#f0c978");
	const selectedTypeLabel = type === "HOUSE" ? text.homeCategory
		: type === "CAR" ? text.carCategory
			: type === "BUSINESS_SPACE" ? text.category
				: type === "SERVICE" ? lang.serviceListing.chooseCategory : "";
	const changeType = (type: FormTypes) => setType(type);

	return (
		<>
			<Head>
				<title>{text.addListing} - {lang.title}</title>
			</Head>
			<Flex className="dashboard-page-enter" direction="column" minH="100dvh" bg={pageBg}>
				<Flex
					position="sticky"
					top="0"
					zIndex="20"
					height={MyTheme.size.navbarHeightCompact}
					px={{ base: 4, md: 8, xl: 12 }}
					boxShadow="0 12px 34px rgba(4,16,19,.18)"
					background={navBackground}
					color="white"
					alignItems={"center"}
					borderBottom="1px solid"
					borderColor="whiteAlpha.200"
				>
					<Container maxW="1500px" px="0">
						<Flex align="center" w="full">
							<Flex align="center" gap={{ base: 3, sm: 5 }}>
								<BrandLogo compact />
								<Box display={{ base: "none", sm: "block" }} pl={{ sm: 4 }} borderLeft="1px solid" borderColor="whiteAlpha.300">
									<Heading color="white" fontSize={{ sm: "sm", md: "md" }} letterSpacing="-.02em">{text.addListing}</Heading>
									<Text mt="1" color="whiteAlpha.600" fontSize="10px" letterSpacing=".12em" textTransform="uppercase">Habesha Brokers</Text>
								</Box>
							</Flex>
							<Box flex="1" />
							<Flex align="center" gap={{ base: 2, sm: 3 }} flexShrink={0}>
								<ColorModeToggle />
								<Button
									onClick={() => router.push("/dashboard")}
									aria-label={text.cancel}
									title={text.cancel}
									variant="outline"
									size="sm"
									h="10"
									w={{ base: "10", sm: "auto" }}
									px={{ base: 0, sm: 4 }}
									leftIcon={<MdArrowBack size="18" />}
									bg="whiteAlpha.100"
									borderColor="whiteAlpha.300"
									color="white"
									borderRadius="xl"
									fontWeight="semibold"
									_hover={{ bg: "whiteAlpha.200", borderColor: "whiteAlpha.700", transform: "translateY(-1px)" }}
									_active={{ transform: "translateY(0)" }}
									_focusVisible={{ outline: "3px solid #E9B75C", outlineOffset: "2px" }}
								>
									<Box as="span" display={{ base: "none", sm: "inline" }}>{text.cancel}</Box>
								</Button>
							</Flex>
						</Flex>
					</Container>
				</Flex>
				<Box position="relative" flex="1" overflow="hidden" color={textColor}>
					<Box aria-hidden="true" position="absolute" w="520px" h="520px" top="-260px" right={{ base: "-220px", md: "-100px" }} borderRadius="full" bg={ambientGlow} filter="blur(2px)" pointerEvents="none" />
					<Container position="relative" maxW="7xl" py={{ base: 6, md: 10, xl: 12 }} px={{ base: 4, sm: 6, lg: 8 }}>
						<Flex className="dashboard-create-hero dashboard-page-enter" position="relative" overflow="hidden" align={{ base: "flex-start", lg: "center" }} justify="space-between" gap={{ base: 5, lg: 8 }} direction={{ base: "column", lg: "row" }} p={{ base: 6, sm: 8, lg: 10 }} border="1px solid" borderColor="whiteAlpha.200" borderRadius={{ base: "2xl", md: "3xl" }} color="white" bgImage="radial-gradient(circle at 82% 15%, rgba(233,183,92,.24), transparent 28%), linear-gradient(125deg, #102f37 0%, #163d46 58%, #1b4449 100%)" boxShadow="0 26px 70px rgba(9,31,35,.22)">
							<Box aria-hidden="true" position="absolute" w={{ base: "180px", md: "260px" }} h={{ base: "180px", md: "260px" }} right={{ base: "-70px", md: "10%" }} top={{ base: "-100px", md: "-120px" }} border="1px solid" borderColor="whiteAlpha.100" borderRadius="full" boxShadow="0 0 0 28px rgba(255,255,255,.025), 0 0 0 58px rgba(255,255,255,.02)" />
							<Box position="relative" maxW="760px">
								<Flex align="center" gap="2" color="#f0c978" fontSize="xs" fontWeight="bold" letterSpacing=".16em" textTransform="uppercase">
									<Box w="2" h="2" borderRadius="full" bg="#f0c978" boxShadow="0 0 0 5px rgba(240,201,120,.13)" />
									{text.addListing}
								</Flex>
								<Heading as="h1" mt="4" fontSize={{ base: "2xl", sm: "3xl", md: "4xl" }} lineHeight="1.08" letterSpacing="-.045em">{text.chooseListingType}</Heading>
								<Text mt="4" maxW="2xl" color="whiteAlpha.800" fontSize={{ base: "sm", md: "md" }} lineHeight="1.75">{text.chooseListingTypeHint}</Text>
							</Box>
							<Flex position="relative" display={{ base: "none", lg: "flex" }} align="center" justify="center" flexShrink={0} w="140px" h="140px" border="1px solid" borderColor="whiteAlpha.200" borderRadius="full" bg="whiteAlpha.50" boxShadow="inset 0 0 0 10px rgba(255,255,255,.025), 0 14px 34px rgba(0,0,0,.15)">
								<Box w="74px" h="74px" display="grid" placeItems="center" borderRadius="2xl" bg="rgba(233,183,92,.16)" color="#f0c978" fontSize="36px"><MdHomeWork /></Box>
							</Flex>
						</Flex>

						<Box as="section" mt={{ base: 7, md: 9 }}>
							<Flex justify="flex-end" mb="3">{type && <Text px="3" py="1.5" border="1px solid" borderColor={formBorder} borderRadius="full" color={muted} fontSize="xs" fontWeight="semibold">{selectedTypeLabel}</Text>}</Flex>
							<SimpleGrid className="dashboard-listing-type-grid" columns={{ base: 2, md: 4 }} spacing={{ base: 3, md: 4 }} w="full">
								<ItemButton icon={<MdHomeWork size="22" />} text={text.homeCategory} type="HOUSE" changeType={changeType} selected={type === "HOUSE"} />
								<ItemButton icon={<FaCar size="22" />} text={text.carCategory} type="CAR" changeType={changeType} selected={type === "CAR"} />
								<ItemButton icon={<MdStorefront size="22" />} text={text.category} type="BUSINESS_SPACE" changeType={changeType} selected={type === "BUSINESS_SPACE"} />
								<ItemButton icon={<MdMiscellaneousServices size="22" />} text={lang.serviceListing.chooseCategory} type="SERVICE" changeType={changeType} selected={type === "SERVICE"} />
							</SimpleGrid>
						</Box>

						{type && (
							<Box className="dashboard-create-form-panel dashboard-page-enter" mt={{ base: 6, md: 8 }} bg={formSurface} border="1px solid" borderColor={formBorder} borderRadius={{ base: "2xl", md: "3xl" }} p={{ base: 4, sm: 6, md: 8, xl: 10 }} boxShadow={formShadow}>
								<Flex align="center" gap="4" mb={{ base: 5, md: 7 }} pb={{ base: 5, md: 6 }} borderBottom="1px solid" borderColor={formBorder}>
									<Flex flexShrink={0} w={{ base: 11, md: 12 }} h={{ base: 11, md: 12 }} align="center" justify="center" borderRadius="xl" bg={detailIconBg} color={detailIconColor} fontSize="23px"><MdCheckCircle /></Flex>
									<Box minW="0">
										<Text color="mainorange" fontSize="xs" fontWeight="bold" textTransform="uppercase" letterSpacing=".13em">{selectedTypeLabel}</Text>
										<Heading as="h2" mt="1" fontSize={{ base: "lg", md: "xl" }} letterSpacing="-.025em">{text.listingDetails}</Heading>
									</Box>
								</Flex>
								{type === "HOUSE" ? <HouseAddForm user={user} />
									: type === "CAR" ? <AddCar user={user} />
									: type === "BUSINESS_SPACE" ? <AddBusinessSpace user={user} />
										: <AddService user={user} />}
							</Box>
						)}
					</Container>
				</Box>
			</Flex>
		</>
	);
}
interface ItemButtonProps {
	icon: ReactNode;
	text: string;
	type: FormTypes;
	changeType: (type: FormTypes) => void;
	selected: boolean;
}
const ItemButton: FC<ItemButtonProps> = ({
	icon,
	text,
	type,
	changeType,
	selected,
}: ItemButtonProps) => {
	const unselectedBg = useColorModeValue("#ffffff", "#101415");
	const unselectedColor = useColorModeValue("#20383d", "#e8eff0");
	const border = useColorModeValue("#dce3e1", "whiteAlpha.200");
	const selectedBg = useColorModeValue("#fffaf1", "rgba(233,183,92,.10)");
	const iconBg = useColorModeValue("#f4f0e6", "rgba(233,183,92,.10)");
	const iconColor = useColorModeValue("#a66327", "#f0c978");
	const cardShadow = useColorModeValue("0 12px 30px rgba(21,42,44,.07)", "0 14px 32px rgba(0,0,0,.24)");
	const selectedShadow = useColorModeValue("0 0 0 2px rgba(201,111,61,.2), 0 18px 38px rgba(21,42,44,.12)", "0 0 0 2px rgba(233,183,92,.3), 0 18px 38px rgba(0,0,0,.34)");
	return (
	<Button
		className="dashboard-type-card"
		type="button"
		aria-pressed={selected}
		onClick={() => changeType(type)}
		display="flex"
		flexDirection="column"
		alignItems="stretch"
		justifyContent="space-between"
		gap="4"
		w="full"
		minW="0"
		h={{ base: "142px", md: "164px" }}
		p={{ base: 4, md: 5 }}
		whiteSpace="normal"
		textAlign="left"
		bg={selected ? selectedBg : unselectedBg}
		color={unselectedColor}
		border="1px solid"
		borderColor={selected ? "mainorange" : border}
		borderRadius={{ base: "xl", md: "2xl" }}
		boxShadow={selected ? selectedShadow : cardShadow}
		transition="transform 240ms cubic-bezier(.2,.7,.2,1), box-shadow 240ms ease, border-color 240ms ease, background-color 240ms ease"
		_hover={{ bg: selectedBg, borderColor: "mainorange", transform: "translateY(-4px)", boxShadow: selectedShadow }}
		_active={{ transform: "translateY(-1px) scale(.99)" }}
		_focusVisible={{ outline: "3px solid #E9B75C", outlineOffset: "3px" }}
	>
		<Flex align="center" justify="space-between" gap="3">
			<Flex w={{ base: 11, md: 12 }} h={{ base: 11, md: 12 }} align="center" justify="center" borderRadius="xl" bg={iconBg} color={iconColor} boxShadow="inset 0 0 0 1px rgba(140,105,49,.08)">{icon}</Flex>
			{selected && <Flex w="8" h="8" align="center" justify="center" borderRadius="full" bg="mainorange" color="white" boxShadow="0 5px 12px rgba(198,107,54,.28)"><MdCheckCircle size="18" /></Flex>}
		</Flex>
		<Flex align="end" justify="space-between" gap="2">
			<Text fontWeight="bold" fontSize={{ base: "sm", md: "md" }} lineHeight="1.3" noOfLines={2}>{text}</Text>
			<Box w="8" h="1px" flexShrink={0} bg={selected ? "mainorange" : border} borderRadius="full" />
		</Flex>
	</Button>
	);
};
