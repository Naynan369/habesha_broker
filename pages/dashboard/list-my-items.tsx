import {
	Box,
	Flex,
	Heading,
	Button,
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
	const pageBg = useColorModeValue("#f5f5f1", "#000000");
	const surface = useColorModeValue("white", "#0c0c0c");
	const border = useColorModeValue("gray.200", "whiteAlpha.200");
	const headingColor = useColorModeValue("maingray", "gray.100");
	const muted = useColorModeValue("gray.600", "gray.400");
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
			<Flex minH="100dvh" bg={pageBg} direction="column">
				<Flex
					alignItems="center"
					minH={MyTheme.size.navbarHeight}
					px={{ base: 4, md: 8, xl: 12 }}
					background={MyTheme.colors.maingray}
					color={"white"}
					boxShadow="0 8px 24px rgba(8,24,30,.12)"
				>
					<IconButton
						colorScheme={"whiteAlpha"}
						mr={{ base: 2, md: 5 }}
						borderRadius="xl"
						aria-label="Go back"
						onClick={() => router.back()}
					>
						<ArrowBackIcon />
					</IconButton>
					<Flex direction="column" minW="0" gap="1">
						<BrandLogo compact />
						<Text display={{ base: "none", sm: "block" }} color="whiteAlpha.700" fontSize="9px" letterSpacing=".1em" textTransform="uppercase">{text.sellerWorkspace}</Text>
					</Flex>
					<Box flex={1}></Box>
					<ColorModeToggle />
				</Flex>

				<Flex
					flex="1"
					direction="column"
					w="full"
					maxW="1500px"
					mx="auto"
					px={{ base: 4, md: 8, xl: 12 }}
					py={{ base: 6, md: 10 }}
				>
					<Flex align={{ base: "flex-start", md: "center" }} justify="space-between" gap="5" mb={{ base: 6, md: 8 }} direction={{ base: "column", md: "row" }}>
						<Box>
							<Text color="mainorange" fontSize="xs" fontWeight="bold" letterSpacing="widest" textTransform="uppercase">{text.myAccount}</Text>
							<Heading mt="2" color={headingColor} fontSize={{ base: "2xl", md: "3xl" }} letterSpacing="tight">{text.heading}</Heading>
							<Text mt="2" color={muted} fontSize="sm">{text.description}</Text>
						</Box>
						<Button
							flexShrink={0}
							colorScheme="orange"
							borderRadius="xl"
							leftIcon={<MdAdd />}
							onClick={() => router.push("/dashboard/add-item")}
						>
							{text.createListing}
						</Button>
					</Flex>

					<Flex direction="column" bg={surface} border="1px solid" borderColor={border} borderRadius="2xl" p={{ base: 4, md: 6 }} boxShadow="0 10px 30px rgba(21,42,44,.06)">
						<Flex direction={{ base: "column", md: "row" }} align={{ base: "stretch", md: "center" }} gap="3">
							<Input
								variant="outline"
								borderRadius="xl"
								bg={pageBg}
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
								w={{ base: "full", md: "auto" }}
								onClick={() => setKeyword(search.trim())}
							>
								{text.search}
							</Button>
						</Flex>

						<Flex align="center" justify="space-between" gap="4" mt="6" direction={{ base: "column", lg: "row" }}>
							<Flex direction="column" flex="1" minW="0">
								<Text mb="3" fontSize="xs" color={muted} fontWeight="bold" letterSpacing="wide" textTransform="uppercase">{text.filterTitle}</Text>
								<Stack direction="row" wrap="wrap" spacing="2">
									<FilterButton setFilters={setFilters} filters={filters} value="HOUSE" text={text} />
									<FilterButton setFilters={setFilters} filters={filters} value="CAR" text={text} />
									<FilterButton setFilters={setFilters} filters={filters} value="BUSINESS_SPACE" text={text} />
									<FilterButton setFilters={setFilters} filters={filters} value="SERVICE" text={text} />
								</Stack>
						</Flex>
							<Flex direction="column" align={{ base: "stretch", lg: "flex-end" }} w={{ base: "full", lg: "auto" }}>
								<Text mb="3" fontSize="xs" color={muted} fontWeight="bold" letterSpacing="wide" textTransform="uppercase">{text.sortTitle}</Text>
								<Menu>
									<MenuButton as={Button} w={{ base: "full", lg: "auto" }} size="sm" h="10" px="4" rightIcon={<MdArrowDownward />} variant="outline" borderRadius="xl" borderColor={border}>
										{sortLabel}
									</MenuButton>
									<MenuList borderRadius="xl" boxShadow="lg">
										<MenuItem onClick={() => setOrderBy({ title: "asc" })}>{text.titleAsc}</MenuItem>
										<MenuItem onClick={() => setOrderBy({ title: "desc" })}>{text.titleDesc}</MenuItem>
										<MenuItem onClick={() => setOrderBy({ createdAt: "desc" })}>{text.newest}</MenuItem>
										<MenuItem onClick={() => setOrderBy({ createdAt: "asc" })}>{text.oldest}</MenuItem>
									</MenuList>
								</Menu>
							</Flex>
						</Flex>
						<Flex mt={{ base: 6, md: 8 }} pt={{ base: 5, md: 6 }} borderTop="1px solid" borderColor={border} direction="column">
							<Flex align={{ base: "flex-start", sm: "center" }} justify="space-between" gap="3" mb="5" direction={{ base: "column", sm: "row" }}>
								<Box>
									<Heading size="md" color={headingColor}>{text.yourListings}</Heading>
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
					</Flex>
				</Flex>
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
	const handleToggle = () => {
		if (filters.indexOf(value) !== -1) {
			setFilters(filters.filter((val: string) => val != value));
		} else {
			setFilters([...filters, value]);
		}
	};

	return (
		<Button
			colorScheme={filters.indexOf(value) !== -1 ? "orange" : "gray"}
			borderRadius="full"
			size="sm"
			px="4"
			h="9"
			aria-pressed={filters.indexOf(value) !== -1}
			variant={filters.indexOf(value) !== -1 ? "solid" : "outline"}
			onClick={handleToggle}
		>
			{value === "BUSINESS_SPACE" ? text.categoryBusinessSpaces : value === "HOUSE" ? text.categoryHomes : value === "SERVICE" ? text.categoryServices : text.categoryVehicles}
		</Button>
	);
}
