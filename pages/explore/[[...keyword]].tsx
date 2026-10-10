import {
	Alert, AlertDescription, AlertIcon, Badge, Box, Button, Flex, Grid, Heading, Input, SimpleGrid, Text,
} from "@chakra-ui/react";
import { useFetch } from "@libs/hooks/useFetch";
import { useLang } from "@libs/hooks/useLang";
import { useFilter } from "@libs/store";
import { organizeFilters } from "@libs/store/useFilter";
import axios from "axios";
import Head from "next/head";
import { useRouter } from "next/router";
import { FormEvent, useEffect, useState } from "react";
import { MdArrowForward, MdDirectionsCar, MdHomeWork, MdSearch, MdSearchOff, MdStorefront } from "react-icons/md";
import { FilterNav } from "@components/explore/FilterNav";
import { Navbar } from "@components/explore/Navbar";
import { ItemCard, ItemLoader } from "@components/explore/ItemCard";
import { withSessionSsr } from "@config/cookie/cookie";

export const getServerSideProps = withSessionSsr(async ({ req, params }) => {
	const user = req.session.user;
	const keyword = params?.keyword ? params.keyword[0] : "";
	return { props: { user: user || null, keyword } };
});

export default function ExplorePage({ user, keyword }) {
	const [searchInput, setSearchInput] = useState(keyword || "");
	const [search, setSearch] = useState(keyword || "");
	const [filterRevision, setFilterRevision] = useState(0);
	const [retryCount, setRetryCount] = useState(0);
	const lang = useLang();
	const filter = useFilter();
	const router = useRouter();

	useEffect(() => {
		const nextKeyword = keyword || "";
		setSearchInput(nextKeyword);
		setSearch(nextKeyword);
	}, [keyword]);

	const [data, loading, error] = useFetch({
		fetchFunction: () => axios.post("/api/items", {
			title: { startsWith: search },
			...organizeFilters(filter),
		}, { timeout: 10000 }),
		dependencies: [search, filterRevision, retryCount],
	});

	const applyFilters = () => setFilterRevision((revision) => revision + 1);
	const selectCategory = (type: "HOUSE" | "CAR" | "BUSINESS_SPACE") => {
		filter.setField("itemType", type);
		applyFilters();
	};
	const handleSearch = (event: FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		const term = searchInput.trim();
		setSearch(term);
		void router.push(term ? `/explore/${encodeURIComponent(term)}` : "/explore");
	};

	return (
		<>
			<Head>
				<title>{lang.explore.pageTitle}</title>
				<meta name="description" content={lang.explore.metaDescription} />
			</Head>
			<Box lang={router.locale || "en"} minH="100vh" bg="#f5f3ee" pb={{ base: 12, md: 20 }}>
				<Navbar user={user} />
				<Box maxW="1480px" mx="auto" px={{ base: 4, md: 8, xl: 12 }} pt={{ base: 5, md: 8 }}>
					<Box
						as="section"
						position="relative"
						overflow="hidden"
						minH={{ base: "490px", md: "500px", xl: "540px" }}
						borderRadius={{ base: "2xl", md: "3xl" }}
						bgImage="linear-gradient(90deg, rgba(13, 34, 39, .94) 0%, rgba(13, 34, 39, .82) 44%, rgba(13, 34, 39, .18) 100%), url('/assets/images/hero-addis.jpg')"
						bgSize="cover"
						bgPosition="center 55%"
						boxShadow="0 26px 70px rgba(20, 34, 35, .16)"
					>
						<Flex minH={{ base: "490px", md: "500px", xl: "540px" }} align="center" px={{ base: 6, md: 12, xl: 16 }} py={{ base: 10, md: 14 }}>
							<Box maxW="760px" w="full">
								<Badge bg="rgba(255,255,255,.13)" color="white" border="1px solid rgba(255,255,255,.24)" borderRadius="full" px="4" py="2" letterSpacing=".14em" fontSize="10px">{lang.explore.kicker}</Badge>
								<Heading mt={{ base: 5, md: 6 }} color="white" fontSize={{ base: "4xl", sm: "5xl", xl: "6xl" }} lineHeight=".99" letterSpacing="-.055em" maxW="700px">
									{lang.explore.heroTitleLead}{" "}<Box as="span" color="#f2b64e">{lang.explore.heroTitleAccent}</Box>
								</Heading>
								<Text color="rgba(255,255,255,.84)" mt="5" maxW="560px" fontSize={{ base: "md", md: "lg" }} lineHeight="1.7">
									{lang.explore.heroDescription}
								</Text>
								<form onSubmit={handleSearch}>
									<Flex mt={{ base: 7, md: 9 }} maxW="720px" bg="white" p="2" gap="2" borderRadius="2xl" boxShadow="0 18px 48px rgba(0,0,0,.22)" direction={{ base: "column", sm: "row" }}>
										<Flex flex="1" minW="0" align="center" px={{ base: 3, sm: 4 }}>
											<MdSearch size="22" color="#788588" />
											<Input value={searchInput} onChange={(event) => setSearchInput(event.target.value)} variant="unstyled" px="3" py="3" color="#243b40" placeholder={lang.explore.searchPlaceholder} aria-label={lang.explore.searchAria} />
										</Flex>
										<Button type="submit" bg="#d7783f" color="white" _hover={{ bg: "#c56731" }} h={{ base: "48px", sm: "54px" }} px={{ base: 5, md: 7 }} borderRadius="xl" leftIcon={<MdSearch size="18" />}>
									{lang.explore.searchButton}
								</Button>
									</Flex>
								</form>
								<Flex mt="5" align="center" gap="3" color="whiteAlpha.800" fontSize="sm" wrap="wrap">
									<Flex align="center" gap="2"><MdHomeWork color="#f2b64e" /> {lang.explore.homes}</Flex>
									<Box w="1px" h="4" bg="whiteAlpha.500" />
									<Flex align="center" gap="2"><MdDirectionsCar color="#f2b64e" /> {lang.explore.vehicles}</Flex>
									<Box w="1px" h="4" bg="whiteAlpha.500" />
									<Flex align="center" gap="2"><MdStorefront color="#f2b64e" /> {lang.explore.businessSpaces}</Flex>
									<Box w="1px" h="4" bg="whiteAlpha.500" />
									<Text>{lang.explore.directConnections}</Text>
								</Flex>
							</Box>
						</Flex>
						<Flex position="absolute" right={{ base: 5, md: 10, xl: 14 }} bottom={{ base: 5, md: 8 }} display={{ base: "none", md: "flex" }} align="center" gap="3" bg="rgba(255,255,255,.92)" backdropFilter="blur(12px)" borderRadius="2xl" px="5" py="4" boxShadow="0 12px 30px rgba(0,0,0,.18)">
							<Box w="10" h="10" borderRadius="xl" bg="#f7ead7" color="#bc6332" display="grid" placeItems="center"><MdHomeWork size="20" /></Box>
							<Box><Text color="#254047" fontSize="sm" fontWeight="bold">{lang.explore.heroCardTitle}</Text><Text color="gray.600" fontSize="xs" mt="1">{lang.explore.heroCardSubtitle}</Text></Box>
						</Flex>
					</Box>

					<Box as="section" mt={{ base: 10, md: 14 }}>
						<Flex align={{ base: "flex-start", md: "end" }} justify="space-between" gap="4" mb="5" direction={{ base: "column", md: "row" }}>
							<Box>
								<Text color="#ad6348" textTransform="uppercase" letterSpacing=".16em" fontWeight="bold" fontSize="xs">{lang.explore.categoryKicker}</Text>
								<Heading mt="2" color="#21383e" fontSize={{ base: "2xl", md: "3xl" }} letterSpacing="-.04em">{lang.explore.categoryHeading}</Heading>
							</Box>
							<Text color="gray.600" maxW="430px" fontSize="sm" lineHeight="1.7">{lang.explore.categoryDescription}</Text>
						</Flex>
						<SimpleGrid columns={{ base: 1, md: 2, xl: 3 }} spacing={{ base: 4, md: 6 }}>
							<Box
								as="button"
								type="button"
								textAlign="left"
								aria-pressed={filter.itemType === "HOUSE"}
								onClick={() => selectCategory("HOUSE")}
								position="relative" overflow="hidden" h={{ base: "220px", md: "280px" }} borderRadius="2xl"
								bgImage="linear-gradient(90deg, rgba(14,34,38,.78), rgba(14,34,38,.12)), url('/assets/images/homes-addis.jpg')" bgSize="cover" bgPosition="center 52%"
								boxShadow={filter.itemType === "HOUSE" ? "0 0 0 3px #d7783f, 0 18px 36px rgba(27,47,48,.18)" : "0 14px 34px rgba(27,47,48,.12)"}
								transition="transform 180ms ease, box-shadow 180ms ease" _hover={{ transform: "translateY(-3px)", boxShadow: "0 20px 42px rgba(27,47,48,.2)" }} _focusVisible={{ outline: "3px solid #f2b64e", outlineOffset: "3px" }}
							>
								<Flex h="full" direction="column" align="flex-start" justify="flex-end" p={{ base: 6, md: 8 }}>
									<Text color="#f5c579" textTransform="uppercase" fontSize="xs" letterSpacing=".18em" fontWeight="bold">{lang.explore.propertyLabel}</Text>
									<Flex w="full" align="end" justify="space-between" gap="3" mt="2"><Box><Heading color="white" fontSize={{ base: "2xl", md: "3xl" }} letterSpacing="-.035em">{lang.explore.homeCardTitle}</Heading><Text color="whiteAlpha.900" fontSize="sm" mt="1">{lang.explore.homeCardDescription}</Text></Box><MdArrowForward color="white" size="24" /></Flex>
								</Flex>
							</Box>
							<Box
								as="button"
								type="button"
								textAlign="left"
								aria-pressed={filter.itemType === "CAR"}
								onClick={() => selectCategory("CAR")}
								position="relative" overflow="hidden" h={{ base: "220px", md: "280px" }} borderRadius="2xl"
								bgImage="linear-gradient(90deg, rgba(14,34,38,.82), rgba(14,34,38,.08)), url('/assets/images/vehicles-addis.jpg')" bgSize="cover" bgPosition="center 55%"
								boxShadow={filter.itemType === "CAR" ? "0 0 0 3px #d7783f, 0 18px 36px rgba(27,47,48,.18)" : "0 14px 34px rgba(27,47,48,.12)"}
								transition="transform 180ms ease, box-shadow 180ms ease" _hover={{ transform: "translateY(-3px)", boxShadow: "0 20px 42px rgba(27,47,48,.2)" }} _focusVisible={{ outline: "3px solid #f2b64e", outlineOffset: "3px" }}
							>
								<Flex h="full" direction="column" align="flex-start" justify="flex-end" p={{ base: 6, md: 8 }}>
									<Text color="#f5c579" textTransform="uppercase" fontSize="xs" letterSpacing=".18em" fontWeight="bold">{lang.explore.vehicleCardLabel}</Text>
									<Flex w="full" align="end" justify="space-between" gap="3" mt="2"><Box><Heading color="white" fontSize={{ base: "2xl", md: "3xl" }} letterSpacing="-.035em">{lang.explore.vehicleCardTitle}</Heading><Text color="whiteAlpha.900" fontSize="sm" mt="1">{lang.explore.vehicleCardDescription}</Text></Box><MdArrowForward color="white" size="24" /></Flex>
								</Flex>
							</Box>
							<Box
								as="button"
								type="button"
								textAlign="left"
								aria-pressed={filter.itemType === "BUSINESS_SPACE"}
								onClick={() => selectCategory("BUSINESS_SPACE")}
								position="relative" overflow="hidden" h={{ base: "220px", md: "280px" }} borderRadius="2xl"
								bg="linear-gradient(135deg, #243f43, #48625d 58%, #b96a43)"
								boxShadow={filter.itemType === "BUSINESS_SPACE" ? "0 0 0 3px #d7783f, 0 18px 36px rgba(27,47,48,.18)" : "0 14px 34px rgba(27,47,48,.12)"}
								transition="transform 180ms ease, box-shadow 180ms ease" _hover={{ transform: "translateY(-3px)", boxShadow: "0 20px 42px rgba(27,47,48,.2)" }} _focusVisible={{ outline: "3px solid #f2b64e", outlineOffset: "3px" }}
							>
								<Flex position="absolute" inset="0" align="center" justify="center" color="whiteAlpha.200"><MdStorefront size="150" /></Flex>
								<Flex position="relative" h="full" direction="column" align="flex-start" justify="flex-end" p={{ base: 6, md: 8 }}>
									<Text color="#f5c579" textTransform="uppercase" fontSize="xs" letterSpacing=".18em" fontWeight="bold">{lang.explore.businessSpaces}</Text>
									<Flex w="full" align="end" justify="space-between" gap="3" mt="2"><Box><Heading color="white" fontSize={{ base: "2xl", md: "3xl" }} letterSpacing="-.035em">{lang.explore.businessCardTitle}</Heading><Text color="whiteAlpha.900" fontSize="sm" mt="1">{lang.explore.businessCardDescription}</Text></Box><MdArrowForward color="white" size="24" /></Flex>
								</Flex>
							</Box>
						</SimpleGrid>
					</Box>

					<Box as="section" mt={{ base: 12, md: 16 }}>
						<Flex align={{ base: "flex-start", md: "end" }} justify="space-between" gap="4" mb="6" direction={{ base: "column", md: "row" }}>
							<Box>
								<Text color="#ad6348" textTransform="uppercase" letterSpacing=".16em" fontWeight="bold" fontSize="xs">{lang.explore.marketplaceKicker}</Text>
								<Heading mt="2" color="#21383e" fontSize={{ base: "2xl", md: "3xl" }} letterSpacing="-.04em">{lang.explore.listingHeading}</Heading>
							</Box>
							<Text color="gray.600" fontSize="sm" fontWeight="medium">{error ? lang.explore.unavailable : loading ? lang.explore.loading : `${data?.length || 0} ${data?.length === 1 ? lang.explore.foundSingular : lang.explore.foundPlural}`}</Text>
						</Flex>
						<Grid templateColumns={{ base: "1fr", lg: "290px minmax(0, 1fr)" }} gap={{ base: 5, lg: 7 }} alignItems="start">
							<FilterNav applyFilters={applyFilters} />
							<Box minW="0">
								{error ? (
									<Alert status="error" borderRadius="2xl" border="1px solid #f1c6ba" bg="#fff5f1" py="5" alignItems="center">
										<AlertIcon color="#bd5d43" />
										<Flex w="full" align={{ base: "flex-start", sm: "center" }} justify="space-between" direction={{ base: "column", sm: "row" }} gap="4">
											<Box><Text color="#783e32" fontWeight="bold">{lang.explore.errorTitle}</Text><AlertDescription color="gray.600" fontSize="sm" mt="1">{lang.explore.errorDescription}</AlertDescription></Box>
											<Button type="button" size="sm" bg="#21383e" color="white" _hover={{ bg: "#142a30" }} onClick={() => setRetryCount((count) => count + 1)} isLoading={loading}>{lang.explore.retry}</Button>
										</Flex>
									</Alert>
								) : loading || !data ? (
									<SimpleGrid columns={{ base: 1, md: 2 }} spacing="5">{[...Array(4)].map((_, index) => <ItemLoader key={index} />)}</SimpleGrid>
								) : data.length ? (
									<SimpleGrid columns={{ base: 1, md: 2 }} spacing="5">
										{data.map((item) => <ItemCard key={item.id} id={item.id} title={item.title} date={item.createdAt} photoURL={item.images?.[0]} ownerName={[item.user?.firstName, item.user?.lastName].filter(Boolean).join(" ")} ownerPhoto={item?.user?.profile_url} price={item.price} itemType={item.itemType} priceFrequency={item.BusinessSpace?.priceFrequency} featured={item.featured} status={item.status} />)}
									</SimpleGrid>
								) : (
									<Flex align="center" justify="center" direction="column" bg="white" borderRadius="2xl" border="1px solid" borderColor="gray.200" p={{ base: 8, md: 12 }} textAlign="center">
										<Box color="#b9603d" bg="#fbede4" borderRadius="full" p="4"><MdSearchOff size="28" /></Box>
										<Heading mt="5" fontSize="xl" color="#21383e">{lang.explore.noMatchesTitle}</Heading>
										<Text color="gray.600" mt="2" maxW="460px">{lang.explore.noMatchesDescription}</Text>
									</Flex>
								)}
							</Box>
						</Grid>
					</Box>
				</Box>
			</Box>
		</>
	);
}
