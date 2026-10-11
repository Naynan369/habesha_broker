import {
	Box,
	Button,
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
	const user = req.session.user;
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
	const pageBg = useColorModeValue("#f5f5f1", "#10191d");
	const textColor = useColorModeValue("#25383d", "#e8eff0");
	const muted = useColorModeValue("gray.600", "gray.400");
	const formSurface = useColorModeValue("white", "#17262b");
	const formBorder = useColorModeValue("gray.300", "whiteAlpha.300");
	const formShadow = useColorModeValue("0 12px 32px rgba(21,42,44,.08)", "0 14px 34px rgba(0,0,0,.32)");

	const changeType = (type: FormTypes) => setType(type);

	return (
		<>
			<Head>
				<title>{text.addListing} - {lang.title}</title>
			</Head>
			<Flex direction={"column"} minH="100vh" bg={pageBg}>
				<Flex
					height={[
						MyTheme.size.navbarHeightCompact,
						null,
						MyTheme.size.navbarHeight,
					]}
					px={MyTheme.paddings.pagePadding}
					boxShadow="md"
					background={"maingray"}
					color="white"
					alignItems={"center"}
				>
					<Flex direction={"column"}>
						<Heading fontSize={"md"}>Habesha Brokers</Heading>
						<Heading
							color="mainyellow"
							textTransform={"uppercase"}
							fontSize={"xl"}
						>
							{text.addListing}
						</Heading>
					</Flex>
					<Box flex="1" minW={{ base: 2, sm: 4 }} />
					<Flex align="center" gap={{ base: 2, sm: 3 }} flexShrink={0}>
						<ColorModeToggle />
						<Button
							onClick={() => router.push("/dashboard")}
							variant="outline"
							size="sm"
							h="10"
							px={{ base: 3, sm: 4 }}
							leftIcon={<MdArrowBack size="18" />}
							bg="whiteAlpha.100"
							borderColor="whiteAlpha.400"
							color="white"
							borderRadius="lg"
							fontWeight="semibold"
							_hover={{ bg: "whiteAlpha.200", borderColor: "whiteAlpha.700", transform: "translateY(-1px)" }}
							_active={{ transform: "translateY(0)" }}
							_focusVisible={{ outline: "3px solid #E9B75C", outlineOffset: "2px" }}
						>
							{text.cancel}
						</Button>
					</Flex>
				</Flex>
				<Flex
					color={textColor}
					flex="1"
					py={{ base: 7, md: 10 }}
					px={MyTheme.paddings.pagePadding}
					direction={"column"}
				>
					<Box w="full" maxW="1100px" mx="auto" mb={{ base: 7, md: 9 }}>
						<Heading as="h2" fontSize="lg" letterSpacing="-.02em">{text.chooseListingType}</Heading>
						<Text mt="2" mb="5" color={muted} fontSize="sm" lineHeight="1.6">{text.chooseListingTypeHint}</Text>
						<SimpleGrid columns={{ base: 2, md: 4 }} spacing={{ base: 3, md: 4 }} w="full">
							<ItemButton icon={<MdHomeWork size="22" />} text={text.homeCategory} type="HOUSE" changeType={changeType} selected={type === "HOUSE"} />
							<ItemButton icon={<FaCar size="22" />} text={text.carCategory} type="CAR" changeType={changeType} selected={type === "CAR"} />
							<ItemButton icon={<MdStorefront size="22" />} text={text.category} type="BUSINESS_SPACE" changeType={changeType} selected={type === "BUSINESS_SPACE"} />
							<ItemButton icon={<MdMiscellaneousServices size="22" />} text={lang.serviceListing.chooseCategory} type="SERVICE" changeType={changeType} selected={type === "SERVICE"} />
						</SimpleGrid>
					</Box>

					{type && (
						<Box w="full" maxW="1100px" mx="auto" bg={formSurface} border="1px solid" borderColor={formBorder} borderRadius="3xl" p={{ base: 5, md: 8 }} boxShadow={formShadow}>
							<Heading as="h2" fontSize="lg" letterSpacing="-.02em" mb={{ base: 5, md: 7 }}>{text.listingDetails}</Heading>
							{type === "HOUSE" ? <HouseAddForm user={user} />
								: type === "CAR" ? <AddCar user={user} />
									: type === "BUSINESS_SPACE" ? <AddBusinessSpace />
										: <AddService />}
						</Box>
					)}
				</Flex>
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
	const unselectedBg = useColorModeValue("white", "#17262b");
	const unselectedColor = useColorModeValue("#25383d", "#e8eff0");
	const border = useColorModeValue("gray.300", "whiteAlpha.400");
	const selectedBg = useColorModeValue("#fffaf0", "rgba(233,183,92,.12)");
	const iconBg = useColorModeValue("gray.100", "whiteAlpha.200");
	const iconColor = useColorModeValue("#9b6522", "#f0c978");
	const cardShadow = useColorModeValue("0 8px 22px rgba(21,42,44,.10)", "0 9px 24px rgba(0,0,0,.30)");
	const selectedShadow = useColorModeValue("0 0 0 2px rgba(201,111,61,.14), 0 12px 26px rgba(21,42,44,.15)", "0 0 0 2px rgba(233,183,92,.16), 0 12px 28px rgba(0,0,0,.38)");
	return (
	<Button
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
		h={{ base: "132px", md: "154px" }}
		p={{ base: 4, md: 5 }}
		whiteSpace="normal"
		textAlign="left"
		bg={selected ? selectedBg : unselectedBg}
		color={unselectedColor}
		border="1px solid"
		borderColor={selected ? "mainorange" : border}
		borderRadius="2xl"
		boxShadow={selected ? selectedShadow : cardShadow}
		transition="all 180ms ease"
		_hover={{ bg: selectedBg, borderColor: "mainorange", transform: "translateY(-2px)", boxShadow: selectedShadow }}
		_focusVisible={{ outline: "3px solid #E9B75C", outlineOffset: "3px" }}
	>
		<Flex align="center" justify="space-between" gap="3">
			<Flex w="11" h="11" align="center" justify="center" borderRadius="xl" bg={iconBg} color={iconColor}>{icon}</Flex>
			{selected && <Box color="mainorange"><MdCheckCircle size="20" /></Box>}
		</Flex>
		<Text fontWeight="semibold" fontSize={{ base: "sm", md: "md" }} lineHeight="1.3" noOfLines={2}>{text}</Text>
	</Button>
	);
};
