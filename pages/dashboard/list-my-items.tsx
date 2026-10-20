import {
	Box,
	Flex,
	Heading,
	Button,
	Container,
	IconButton,
	Input,
	Menu,
	MenuButton,
	MenuItem,
	MenuList,
	Stack,
	Text,
	useColorModeValue,
} from "@chakra-ui/react";
import { MyTheme } from "@config/theme/MyTheme";
import { Dispatch, SetStateAction, useState } from "react";
import { MdAdd, MdArrowDownward, MdSearch } from "react-icons/md";
import { ItemList } from "@components/dashboard/itemList/itemList";
import { withSessionSsr } from "@config/cookie/cookie";
import { getListingPaymentConfig, LISTING_FEE } from "@config/listingPayment";
import { useRouter } from "next/router";
import { ArrowBackIcon } from "@chakra-ui/icons";
import Head from "next/head";
import { ColorModeToggle } from "@components/shared/ColorModeToggle";
import { BrandLogo } from "@components/shared/BrandLogo";
import { useLang } from "@libs/hooks/useLang";

export const getServerSideProps = withSessionSsr(async ({ req, locale }) => {
	const user = req.user;
	const paymentConfig = getListingPaymentConfig();
	if (!user) {
		return {
			redirect: {
				destination: locale === "am" ? "/am/auth/login/" : "/auth/login/",
			},
			props: {},
		};
	}
	return {
		props: {
			user,
			paymentFee: LISTING_FEE,
			paymentEnabled: paymentConfig.enabled,
		},
	};
});

export default function MyItemsList({ user, paymentFee, paymentEnabled }) {
	const text = useLang().listingManagementPage;
	const [search, setSearch] = useState("");
	const [keyword, setKeyword] = useState("");
	const [filters, setFilters] = useState(["HOUSE", "CAR", "BUSINESS_SPACE", "SERVICE"]);
	const [orderBy, setOrderBy] = useState({
		createdAt: "desc",
	} as any);
	const router = useRouter();
	const pageBg = useColorModeValue("#f4f5f2", "#050707");
	const surface = useColorModeValue("#ffffff", "#101415");
	const border = useColorModeValue("#dce3e1", "whiteAlpha.200");
	const headingColor = useColorModeValue("#20383d", "#eef2f1");
	const muted = useColorModeValue("#637278", "#a5b1b4");
	const controlBg = useColorModeValue("#f7f8f6", "#090c0d");
	const sortLabel = orderBy.title === "asc"
		? text.titleAsc
		: orderBy.title === "desc"
			? text.titleDesc
			: orderBy.createdAt === "asc" ? text.oldest : text.newest;


	return (
		<>
			<Head>
				<title>{text.pageTitle}</title>
			</Head>
			<Flex className="dashboard-page-enter" minH="100dvh" bg={pageBg} direction="column">
				<Flex
					position="sticky"
					top="0"
					zIndex="20"
					alignItems="center"
					minH={MyTheme.size.navbarHeightCompact}
					px={{ base: 4, md: 8, xl: 12 }}
					background="#102f37"
					color={"white"}
					boxShadow="0 12px 34px rgba(4,16,19,.18)"
					borderBottom="1px solid"
					borderColor="whiteAlpha.200"
				>
					<Container maxW="1500px" px="0">
						<Flex align="center" w="full">
							<IconButton colorScheme="whiteAlpha" mr={{ base: 3, md: 5 }} borderRadius="xl" aria-label="Go back" onClick={() => router.back()} _hover={{ bg: "whiteAlpha.200", transform: "translateX(-2px)" }}>
								<ArrowBackIcon />
							</IconButton>
							<Flex direction="column" minW="0" gap="1" pr={{ sm: 4 }} borderRight={{ base: "none", sm: "1px solid" }} borderColor="whiteAlpha.300">
								<BrandLogo compact />
								<Text display={{ base: "none", sm: "block" }} color="whiteAlpha.600" fontSize="9px" letterSpacing=".12em" textTransform="uppercase">{text.sellerWorkspace}</Text>
							</Flex>
							<Box flex="1" />
							<ColorModeToggle />
						</Flex>
					</Container>
				</Flex>

				<Container flex="1" maxW="1500px" py={{ base: 6, md: 10, xl: 12 }} px={{ base: 4, md: 8, xl: 12 }}>
					<Flex className="dashboard-manage-hero" position="relative" overflow="hidden" align={{ base: "flex-start", md: "center" }} justify="space-between" gap="5" mb={{ base: 5, md: 7 }} p={{ base: 6, sm: 8, lg: 10 }} direction={{ base: "column", md: "row" }} border="1px solid" borderColor="whiteAlpha.200" borderRadius={{ base: "2xl", md: "3xl" }} color="white" bgImage="radial-gradient(circle at 82% 10%, rgba(233,183,92,.22), transparent 27%), linear-gradient(125deg, #102f37 0%, #163d46 58%, #1b4449 100%)" boxShadow="0 26px 70px rgba(9,31,35,.18)">
						<Box position="relative" zIndex="1">
							<Text color="#f0c978" fontSize="xs" fontWeight="bold" letterSpacing=".16em" textTransform="uppercase">{text.myAccount}</Text>
							<Heading as="h1" mt="3" fontSize={{ base: "2xl", md: "4xl" }} letterSpacing="-.045em" lineHeight="1.1">{text.heading}</Heading>
							<Text mt="3" color="whiteAlpha.800" maxW="2xl" fontSize={{ base: "sm", md: "md" }} lineHeight="1.7">{text.description}</Text>
						</Box>
						<Button flexShrink={0} position="relative" zIndex="1" colorScheme="orange" borderRadius="xl" h="12" px="6" leftIcon={<MdAdd />} boxShadow="0 12px 24px rgba(198,107,54,.24)" onClick={() => router.push("/dashboard/add-item")} _hover={{ transform: "translateY(-2px)", boxShadow: "0 16px 30px rgba(198,107,54,.34)" }}>
							{text.createListing}
						</Button>
						<Box aria-hidden="true" position="absolute" w="260px" h="260px" right={{ base: "-180px", md: "16%" }} bottom="-210px" border="1px solid" borderColor="whiteAlpha.100" borderRadius="full" boxShadow="0 0 0 28px rgba(255,255,255,.025), 0 0 0 58px rgba(255,255,255,.02)" />
					</Flex>

					<Flex className="dashboard-control-panel" direction="column" bg={surface} border="1px solid" borderColor={border} borderRadius={{ base: "2xl", md: "3xl" }} p={{ base: 4, md: 6, xl: 7 }} boxShadow="0 16px 40px rgba(21,42,44,.06)">
						<Flex direction={{ base: "column", md: "row" }} align={{ base: "stretch", md: "center" }} gap="3">
							<Input
								variant="filled"
								h="12"
								borderRadius="xl"
								bg={controlBg}
								color={headingColor}
								border="1px solid"
								borderColor={border}
								_focusVisible={{ borderColor: "mainorange", boxShadow: "0 0 0 1px #C66B36" }}
								placeholder={text.searchPlaceholder}
								value={search}
								onChange={(e) => setSearch(e.target.value)}
								onKeyDown={(event) => { if (event.key === "Enter") setKeyword(search.trim()); }}
								aria-label={text.searchPlaceholder}
							/>
							<Button
								leftIcon={<MdSearch />}
								colorScheme="orange"
								borderRadius="xl"
								h="12"
								w={{ base: "full", md: "auto" }}
								onClick={() => setKeyword(search.trim())}
							>
								{text.search}
							</Button>
						</Flex>

						<Flex align="flex-start" justify="space-between" gap="5" mt={{ base: 5, md: 7 }} pt={{ base: 5, md: 6 }} borderTop="1px solid" borderColor={border} direction={{ base: "column", lg: "row" }}>
							<Flex direction="column" flex="1" minW="0">
								<Text mb="3" fontSize="xs" color={muted} fontWeight="bold" letterSpacing=".12em" textTransform="uppercase">{text.filterTitle}</Text>
								<Stack direction="row" wrap="wrap" spacing="2">
									<FilterButton setFilters={setFilters} filters={filters} value="HOUSE" text={text} />
									<FilterButton setFilters={setFilters} filters={filters} value="CAR" text={text} />
									<FilterButton setFilters={setFilters} filters={filters} value="BUSINESS_SPACE" text={text} />
									<FilterButton setFilters={setFilters} filters={filters} value="SERVICE" text={text} />
								</Stack>
							</Flex>
							<Flex direction="column" align={{ base: "stretch", lg: "flex-end" }} w={{ base: "full", lg: "auto" }}>
								<Text mb="3" fontSize="xs" color={muted} fontWeight="bold" letterSpacing=".12em" textTransform="uppercase">{text.sortTitle}</Text>
								<Menu>
									<MenuButton as={Button} w={{ base: "full", lg: "auto" }} size="sm" h="11" px="4" rightIcon={<MdArrowDownward />} variant="outline" borderRadius="xl" borderColor={border} bg={controlBg}>
										{sortLabel}
									</MenuButton>
									<MenuList borderRadius="xl" boxShadow="xl" borderColor={border} bg={surface}>
										<MenuItem onClick={() => setOrderBy({ title: "asc" })}>{text.titleAsc}</MenuItem>
										<MenuItem onClick={() => setOrderBy({ title: "desc" })}>{text.titleDesc}</MenuItem>
										<MenuItem onClick={() => setOrderBy({ createdAt: "desc" })}>{text.newest}</MenuItem>
										<MenuItem onClick={() => setOrderBy({ createdAt: "asc" })}>{text.oldest}</MenuItem>
									</MenuList>
								</Menu>
							</Flex>
						</Flex>
					</Flex>

					<Flex className="dashboard-listings-panel" mt={{ base: 5, md: 7 }} p={{ base: 4, md: 6, xl: 7 }} bg={surface} border="1px solid" borderColor={border} borderRadius={{ base: "2xl", md: "3xl" }} boxShadow="0 16px 40px rgba(21,42,44,.06)" direction="column">
						<Flex align={{ base: "flex-start", sm: "center" }} justify="space-between" gap="3" mb="5" direction={{ base: "column", sm: "row" }}>
							<Box>
								<Heading size="md" color={headingColor} letterSpacing="-.025em">{text.yourListings}</Heading>
								<Text mt="1" color={muted} fontSize="sm">{text.listingHelp}</Text>
							</Box>
						</Flex>
						<ItemList
							user={user}
							orderBy={orderBy}
							filters={filters}
							keyword={keyword}
							copy={text}
							paymentFee={paymentFee}
							paymentEnabled={paymentEnabled}
						/>
					</Flex>
				</Container>
			</Flex>
		</>
	);
}

interface IFilterButton {
	value: string;
	filters: string[];
	setFilters: Dispatch<SetStateAction<string[]>>;
	text: any;
}

function FilterButton({ filters, setFilters, value, text }) {
	const selected = filters.indexOf(value) !== -1;
	const unselectedText = useColorModeValue("#52656a", "#bbc5c6");
	const unselectedBorder = useColorModeValue("#d7dfdd", "whiteAlpha.300");
	const handleToggle = () => {
		if (filters.indexOf(value) !== -1) {
			setFilters(filters.filter((val: string) => val != value));
		} else {
			setFilters([...filters, value]);
		}
	};

	return (
		<Button
			color={selected ? "white" : unselectedText}
			bg={selected ? "maingray" : "transparent"}
			borderRadius="full"
			size="sm"
			px="4.5"
			h="10"
			border="1px solid"
			borderColor={selected ? "maingray" : unselectedBorder}
			aria-pressed={filters.indexOf(value) !== -1}
			variant="ghost"
			onClick={handleToggle}
			transition="all 180ms ease"
			_hover={{ bg: selected ? "#1c4a53" : "rgba(198,107,54,.08)", borderColor: selected ? "#1c4a53" : "mainorange", color: selected ? "white" : "mainorange", transform: "translateY(-1px)" }}
			_active={{ transform: "scale(.97)" }}
			_focusVisible={{ outline: "3px solid #E9B75C", outlineOffset: "2px" }}
		>
			{value === "BUSINESS_SPACE" ? text.categoryBusinessSpaces : value === "HOUSE" ? text.categoryHomes : value === "SERVICE" ? text.categoryServices : text.categoryVehicles}
		</Button>
	);
}
