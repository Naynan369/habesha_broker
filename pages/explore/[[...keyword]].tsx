import {
	Alert, AlertDescription, AlertIcon, Badge, Box, Button, Flex, Grid, Heading, Input, SimpleGrid, Text, useColorModeValue,
} from "@chakra-ui/react";
import { useFetch } from "@libs/hooks/useFetch";
import { useLang } from "@libs/hooks/useLang";
import { useFilter } from "@libs/store";
import { organizeFilters } from "@libs/store/useFilter";
import axios from "axios";
import Head from "next/head";
import { useRouter } from "next/router";
import { FormEvent, useCallback, useEffect, useState } from "react";
import type { CSSProperties } from "react";
import { MdArrowForward, MdDirectionsCar, MdHomeWork, MdMiscellaneousServices, MdSearch, MdSearchOff, MdStorefront } from "react-icons/md";
import { FilterNav } from "@components/explore/FilterNav";
import { Navbar } from "@components/explore/Navbar";
import { HomeMotionSystem } from "@components/home/HomeMotion";
import { ItemCard, ItemLoader } from "@components/explore/ItemCard";
import { withSessionSsr } from "@config/cookie/cookie";

const SERVICE_CATEGORIES = ["BROKER_SUPPORT", "PROPERTY_PHOTOGRAPHY", "MOVING", "CLEANING", "REPAIRS", "PROPERTY_MANAGEMENT"] as const;

export const getServerSideProps = withSessionSsr(async ({ req, params }) => {
	const user = req.user;
	const keyword = params?.keyword ? params.keyword[0] : "";
	return { props: { user: user || null, keyword } };
});

export default function ExplorePage({ user, keyword }) {
	const [searchInput, setSearchInput] = useState(keyword || "");
	const [search, setSearch] = useState(keyword || "");
	const [filterRevision, setFilterRevision] = useState(0);
	const [retryCount, setRetryCount] = useState(0);
	const [pageIndex, setPageIndex] = useState(0);
	const lang = useLang();
	const filter = useFilter();
	const router = useRouter();
	const canvas = useColorModeValue("#f3f2ed", "#000000");
	const surface = useColorModeValue("white", "#111111");
	const searchSurface = useColorModeValue("white", "#111111");
	const searchText = useColorModeValue("#243b40", "#e7eff0");
	const searchIconColor = useColorModeValue("#788588", "#aebdc1");
	const titleColor = useColorModeValue("#21383e", "#e7eff0");
	const bodyColor = useColorModeValue("gray.600", "gray.300");
	const borderColor = useColorModeValue("gray.200", "whiteAlpha.200");
	const accentSurface = useColorModeValue("#fbede4", "rgba(198,107,54,.18)");
	const accentText = useColorModeValue("#bc6332", "#f0b078");
	const errorSurface = useColorModeValue("#fff5f1", "#321f1d");
	const errorText = useColorModeValue("#783e32", "#f3c1b5");
	const badgeSurface = useColorModeValue("#e8efec", "#191919");
	const applyFilters = useCallback(() => {
		setPageIndex(0);
		setFilterRevision((revision) => revision + 1);
		const currentFilter = useFilter.getState();
		const query: Record<string, string | string[]> = {};
		if (router.query.keyword) query.keyword = router.query.keyword;
		if (currentFilter.itemType) query.itemType = currentFilter.itemType;
		const category = currentFilter.itemType === "SERVICE" ? currentFilter.Service?.some?.category : undefined;
		if (category) query.serviceCategory = category;
		const currentType = Array.isArray(router.query.itemType) ? router.query.itemType[0] : router.query.itemType;
		const currentCategory = Array.isArray(router.query.serviceCategory) ? router.query.serviceCategory[0] : router.query.serviceCategory;
		if (currentType !== currentFilter.itemType || currentCategory !== category) {
			void router.replace({ pathname: router.pathname, query }, undefined, { shallow: true, scroll: false });
		}
	}, [router]);
	const serviceCategoryFromQuery = Array.isArray(router.query.serviceCategory) ? router.query.serviceCategory[0] : router.query.serviceCategory;
	const updateBrowseRoute = (itemType?: "HOUSE" | "CAR" | "BUSINESS_SPACE" | "SERVICE", serviceCategory?: typeof SERVICE_CATEGORIES[number]) => {
		const query: Record<string, string | string[]> = {};
		const currentKeyword = router.query.keyword;
		if (currentKeyword) query.keyword = currentKeyword;
		if (itemType) query.itemType = itemType;
		if (itemType === "SERVICE" && serviceCategory) query.serviceCategory = serviceCategory;
		const currentType = Array.isArray(router.query.itemType) ? router.query.itemType[0] : router.query.itemType;
		const currentCategory = Array.isArray(router.query.serviceCategory) ? router.query.serviceCategory[0] : router.query.serviceCategory;
		if (currentType === itemType && currentCategory === (itemType === "SERVICE" ? serviceCategory : undefined)) {
			filter.setField("itemType", itemType);
			filter.setField("Service", { some: itemType === "SERVICE" && serviceCategory ? { category: serviceCategory } : {} });
			applyFilters();
			return;
		}
		void router.push({ pathname: router.pathname, query }, undefined, { shallow: true, scroll: false });
	};

	useEffect(() => {
		const nextKeyword = keyword || "";
		setSearchInput(nextKeyword);
		setSearch(nextKeyword);
	}, [keyword]);

	useEffect(() => {
		if (!router.isReady) return;
		const requestedType = Array.isArray(router.query.itemType) ? router.query.itemType[0] : router.query.itemType;
		const selectedType = ["HOUSE", "CAR", "BUSINESS_SPACE", "SERVICE"].includes(requestedType || "") ? requestedType as "HOUSE" | "CAR" | "BUSINESS_SPACE" | "SERVICE" : undefined;
		const currentFilter = useFilter.getState();
		currentFilter.setField("itemType", selectedType);
		if (selectedType === "SERVICE") {
			currentFilter.setService("category", SERVICE_CATEGORIES.includes(serviceCategoryFromQuery as typeof SERVICE_CATEGORIES[number]) ? serviceCategoryFromQuery : undefined);
		} else {
			currentFilter.setField("Service", { some: {} });
		}
		applyFilters();
	}, [router.isReady, router.query.itemType, router.query.serviceCategory, serviceCategoryFromQuery, applyFilters]);

	const [data, loading, error] = useFetch({
		fetchFunction: () => axios.post(`/api/items?page=${pageIndex}`, {
			keyword: search,
			...organizeFilters(filter),
		}, { timeout: 10000 }),
		dependencies: [search, filterRevision, retryCount, pageIndex],
	});

	const selectCategory = (type: "HOUSE" | "CAR" | "BUSINESS_SPACE" | "SERVICE") => {
		updateBrowseRoute(type);
	};
	const selectServiceCategory = (category?: typeof SERVICE_CATEGORIES[number]) => {
		updateBrowseRoute("SERVICE", category);
	};
	const handleSearch = (event: FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		const term = searchInput.trim();
		setPageIndex(0);
		const query: Record<string, string | string[]> = {};
		if (filter.itemType) query.itemType = filter.itemType;
		if (filter.itemType === "SERVICE" && filter.Service?.some?.category) query.serviceCategory = filter.Service.some.category;
		void router.push({ pathname: term ? `/explore/${encodeURIComponent(term)}` : "/explore", query }, undefined, { scroll: false });
	};
	const selectedServiceCategory = filter.Service?.some?.category;
	const activeResultLabel = filter.itemType === "SERVICE"
		? selectedServiceCategory ? lang.serviceListing.categories[selectedServiceCategory] : lang.home.services_txt
		: filter.itemType === "HOUSE" ? lang.explore.homes
			: filter.itemType === "CAR" ? lang.explore.vehicles
				: filter.itemType === "BUSINESS_SPACE" ? lang.explore.businessSpaces
					: undefined;

	return (
		<>
			<HomeMotionSystem showProgress={false} />
			<Head>
				<title>{lang.explore.pageTitle}</title>
				<meta name="description" content={lang.explore.metaDescription} />
			</Head>
			<Box lang={router.locale || "en"} minH="100dvh" bg={canvas} pb={{ base: 12, md: 20 }}>
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
									<Flex mt={{ base: 7, md: 9 }} maxW="720px" bg={searchSurface} p="2" gap="2" borderRadius="2xl" boxShadow="0 18px 48px rgba(0,0,0,.22)" direction={{ base: "column", sm: "row" }}>
										<Flex flex="1" minW="0" align="center" px={{ base: 3, sm: 4 }}>
											<MdSearch size="22" color={searchIconColor} />
											<Input value={searchInput} onChange={(event) => setSearchInput(event.target.value)} variant="unstyled" px="3" py="3" color={searchText} placeholder={lang.explore.searchPlaceholder} aria-label={lang.explore.searchAria} />
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
									<Flex align="center" gap="2"><MdMiscellaneousServices color="#f2b64e" /> {lang.home.services_txt}</Flex>
									<Box w="1px" h="4" bg="whiteAlpha.500" />
									<Text>{lang.explore.directConnections}</Text>
								</Flex>
							</Box>
						</Flex>
						<Flex position="absolute" right={{ base: 5, md: 10, xl: 14 }} bottom={{ base: 5, md: 8 }} display={{ base: "none", md: "flex" }} align="center" gap="3" bg={surface} color={titleColor} border="1px solid" borderColor="whiteAlpha.300" backdropFilter="blur(12px)" borderRadius="2xl" px="5" py="4" boxShadow="0 12px 30px rgba(0,0,0,.18)">
							<Box w="10" h="10" borderRadius="xl" bg={accentSurface} color={accentText} display="grid" placeItems="center"><MdHomeWork size="20" /></Box>
							<Box><Text color={titleColor} fontSize="sm" fontWeight="bold">{lang.explore.heroCardTitle}</Text><Text color={bodyColor} fontSize="xs" mt="1">{lang.explore.heroCardSubtitle}</Text></Box>
						</Flex>
					</Box>

					<Box as="section" mt={{ base: 10, md: 14 }}>
						<Flex align={{ base: "flex-start", md: "end" }} justify="space-between" gap="4" mb="5" direction={{ base: "column", md: "row" }}>
							<Box>
								<Text color={accentText} textTransform="uppercase" letterSpacing=".16em" fontWeight="bold" fontSize="xs">{lang.explore.categoryKicker}</Text>
								<Heading mt="2" color={titleColor} fontSize={{ base: "2xl", md: "3xl" }} letterSpacing="-.04em">{lang.explore.categoryHeading}</Heading>
							</Box>
							<Text color={bodyColor} maxW="430px" fontSize="sm" lineHeight="1.7">{lang.explore.categoryDescription}</Text>
						</Flex>
						<SimpleGrid id="explore-category-cards" columns={{ base: 1, md: 2, xl: 4 }} spacing={{ base: 4, md: 6 }}>
							<Box
								as="button"
								type="button"
								textAlign="left"
								aria-pressed={filter.itemType === "HOUSE"}
								className="explore-category-card" data-home-stagger
								onClick={() => selectCategory("HOUSE")}
								position="relative" overflow="hidden" h={{ base: "220px", md: "280px" }} borderRadius="2xl"
								bgImage="linear-gradient(90deg, rgba(14,34,38,.78), rgba(14,34,38,.12)), url('/assets/images/apartment-interior-showcase.jpg')" bgSize="cover" bgPosition="center 52%"
								boxShadow={filter.itemType === "HOUSE" ? "0 0 0 3px #d7783f, 0 18px 36px rgba(27,47,48,.18)" : "0 14px 34px rgba(27,47,48,.12)"}
								transition="transform 180ms ease, box-shadow 180ms ease" _hover={{ transform: "translateY(-3px)", boxShadow: "0 20px 42px rgba(27,47,48,.2)" }} _focusVisible={{ outline: "3px solid #f2b64e", outlineOffset: "3px" }}
							>
								<Flex h="full" direction="column" align="flex-start" justify="flex-end" p={{ base: 6, md: 8 }}>
									<Text className="explore-category-label" color="#f5c579" textTransform="uppercase" fontSize="xs" letterSpacing=".18em" fontWeight="bold">{lang.explore.propertyLabel}</Text>
									<Flex className="explore-category-content" w="full" align="end" justify="space-between" gap="3" mt="2"><Box><Heading color="white" fontSize={{ base: "2xl", md: "3xl" }} letterSpacing="-.035em">{lang.explore.homeCardTitle}</Heading><Text color="whiteAlpha.900" fontSize="sm" mt="1">{lang.explore.homeCardDescription}</Text></Box><MdArrowForward color="white" size="24" /></Flex>
								</Flex>
							</Box>
							<Box
								as="button"
								type="button"
								textAlign="left"
								aria-pressed={filter.itemType === "CAR"}
								className="explore-category-card" data-home-stagger
								onClick={() => selectCategory("CAR")}
								position="relative" overflow="hidden" h={{ base: "220px", md: "280px" }} borderRadius="2xl"
								bgImage="linear-gradient(90deg, rgba(14,34,38,.82), rgba(14,34,38,.08)), url('/assets/images/supercar-showcase.jpg')" bgSize="cover" bgPosition="center 55%"
								boxShadow={filter.itemType === "CAR" ? "0 0 0 3px #d7783f, 0 18px 36px rgba(27,47,48,.18)" : "0 14px 34px rgba(27,47,48,.12)"}
								transition="transform 180ms ease, box-shadow 180ms ease" _hover={{ transform: "translateY(-3px)", boxShadow: "0 20px 42px rgba(27,47,48,.2)" }} _focusVisible={{ outline: "3px solid #f2b64e", outlineOffset: "3px" }}
							>
								<Flex h="full" direction="column" align="flex-start" justify="flex-end" p={{ base: 6, md: 8 }}>
									<Text className="explore-category-label" color="#f5c579" textTransform="uppercase" fontSize="xs" letterSpacing=".18em" fontWeight="bold">{lang.explore.vehicleCardLabel}</Text>
									<Flex className="explore-category-content" w="full" align="end" justify="space-between" gap="3" mt="2"><Box><Heading color="white" fontSize={{ base: "2xl", md: "3xl" }} letterSpacing="-.035em">{lang.explore.vehicleCardTitle}</Heading><Text color="whiteAlpha.900" fontSize="sm" mt="1">{lang.explore.vehicleCardDescription}</Text></Box><MdArrowForward color="white" size="24" /></Flex>
								</Flex>
							</Box>
							<Box
								as="button"
								type="button"
								textAlign="left"
								aria-pressed={filter.itemType === "BUSINESS_SPACE"}
								className="explore-category-card" data-home-stagger
								onClick={() => selectCategory("BUSINESS_SPACE")}
								position="relative" overflow="hidden" h={{ base: "220px", md: "280px" }} borderRadius="2xl"
								bgImage="linear-gradient(90deg, rgba(14,34,38,.86), rgba(14,34,38,.22)), url('/assets/images/apartment-showcase.jpg')"
								bgSize="cover"
								bgPosition="center"
								boxShadow={filter.itemType === "BUSINESS_SPACE" ? "0 0 0 3px #d7783f, 0 18px 36px rgba(27,47,48,.18)" : "0 14px 34px rgba(27,47,48,.12)"}
								transition="transform 180ms ease, box-shadow 180ms ease" _hover={{ transform: "translateY(-3px)", boxShadow: "0 20px 42px rgba(27,47,48,.2)" }} _focusVisible={{ outline: "3px solid #f2b64e", outlineOffset: "3px" }}
							>
								<Flex position="absolute" inset="0" align="center" justify="center" color="whiteAlpha.200"><MdStorefront size="150" /></Flex>
								<Flex position="relative" h="full" direction="column" align="flex-start" justify="flex-end" p={{ base: 6, md: 8 }}>
									<Text className="explore-category-label" color="#f5c579" textTransform="uppercase" fontSize="xs" letterSpacing=".18em" fontWeight="bold">{lang.explore.businessSpaces}</Text>
									<Flex className="explore-category-content" w="full" align="end" justify="space-between" gap="3" mt="2"><Box><Heading color="white" fontSize={{ base: "2xl", md: "3xl" }} letterSpacing="-.035em">{lang.explore.businessCardTitle}</Heading><Text color="whiteAlpha.900" fontSize="sm" mt="1">{lang.explore.businessCardDescription}</Text></Box><MdArrowForward color="white" size="24" /></Flex>
								</Flex>
							</Box>
										<Box
											as="button"
											type="button"
											textAlign="left"
											aria-pressed={filter.itemType === "SERVICE"}
								className="explore-category-card" data-home-stagger
											onClick={() => selectCategory("SERVICE")}
											position="relative" overflow="hidden" h={{ base: "220px", md: "280px" }} borderRadius="2xl"
											bgImage="linear-gradient(90deg, rgba(14,34,38,.84), rgba(14,34,38,.20)), url('https://images.unsplash.com/photo-1741388222137-c0d3007ec173?auto=format&fit=crop&crop=faces&w=1200&h=800&q=80')"
									bgSize="cover"
									bgPosition="center 52%"
											boxShadow={filter.itemType === "SERVICE" ? "0 0 0 3px #d7783f, 0 18px 36px rgba(27,47,48,.18)" : "0 14px 34px rgba(27,47,48,.12)"}
											transition="transform 180ms ease, box-shadow 180ms ease" _hover={{ transform: "translateY(-3px)", boxShadow: "0 20px 42px rgba(27,47,48,.2)" }} _focusVisible={{ outline: "3px solid #f2b64e", outlineOffset: "3px" }}
										>
											<Flex position="absolute" inset="0" align="center" justify="center" color="whiteAlpha.200"><MdMiscellaneousServices size="150" /></Flex>
											<Flex position="relative" h="full" direction="column" align="flex-start" justify="flex-end" p={{ base: 6, md: 8 }}>
												<Text className="explore-category-label" color="#f5c579" textTransform="uppercase" fontSize="xs" letterSpacing=".18em" fontWeight="bold">{lang.home.services_txt}</Text>
												<Flex className="explore-category-content" w="full" align="end" justify="space-between" gap="3" mt="2"><Box><Heading color="white" fontSize={{ base: "2xl", md: "3xl" }} letterSpacing="-.035em">{lang.explore.servicesCardTitle}</Heading><Text color="whiteAlpha.900" fontSize="sm" mt="1">{lang.explore.servicesCardDescription}</Text></Box><MdArrowForward color="white" size="24" /></Flex>
											</Flex>
										</Box>
						</SimpleGrid>
					</Box>

					{filter.itemType === "SERVICE" && <Box as="section" mt={{ base: 8, md: 10 }}>
						<Flex align={{ base: "flex-start", md: "flex-end" }} justify="space-between" gap="4" mb="5" direction={{ base: "column", md: "row" }}>
							<Box><Text color={accentText} textTransform="uppercase" letterSpacing=".15em" fontWeight="bold" fontSize="xs">{lang.home.services_txt}</Text><Heading mt="2" color={titleColor} fontSize={{ base: "xl", md: "2xl" }}>{lang.explore.serviceCategoryHeading}</Heading></Box>
							<Text color={bodyColor} maxW="520px" fontSize="sm" lineHeight="1.7">{lang.explore.serviceCategoryDescription}</Text>
						</Flex>
						<Flex wrap="wrap" gap="3" mb="5"><Button variant={filter.Service?.some?.category ? "outline" : "solid"} color={filter.Service?.some?.category ? titleColor : "white"} bg={filter.Service?.some?.category ? surface : "maingray"} borderColor={borderColor} onClick={() => selectServiceCategory()}>{lang.explore.allServices}</Button></Flex>
						<SimpleGrid id="explore-service-categories" columns={{ base: 1, sm: 2, xl: 3 }} spacing="4">
							{SERVICE_CATEGORIES.map((category, index) => {
								const card = lang.home.service_cards[index];
								const selected = filter.Service?.some?.category === category;
								return <Box as="button" type="button" key={category} className="explore-service-card" data-home-stagger style={{ "--home-stagger-delay": Math.min(index, 4) * 90 + "ms" } as CSSProperties} onClick={() => selectServiceCategory(category)} aria-pressed={selected} textAlign="left" p="5" minH="130px" bg={surface} border="1px solid" borderColor={selected ? "#d7783f" : borderColor} borderRadius="xl" boxShadow={selected ? "0 0 0 2px #d7783f" : "sm"} transition="all 160ms ease" _hover={{ transform: "translateY(-2px)", boxShadow: "md" }} _focusVisible={{ outline: "3px solid #f2b64e", outlineOffset: "2px" }}><Flex align="center" gap="3"><Box flexShrink={0} w="10" h="10" display="grid" placeItems="center" borderRadius="xl" bg={accentSurface} color={accentText}><MdMiscellaneousServices size="21" /></Box><Text color={titleColor} fontWeight="bold" lineHeight="1.4">{lang.serviceListing.categories[category]}</Text></Flex><Text mt="3" color={bodyColor} fontSize="sm" lineHeight="1.6">{card.description}</Text></Box>;
							})}
						</SimpleGrid>
					</Box>}

					<Box as="section" id="explore-listings" mt={{ base: 12, md: 16 }}>
						<Flex align={{ base: "flex-start", md: "end" }} justify="space-between" gap="4" mb="6" direction={{ base: "column", md: "row" }}>
							<Box>
								<Text color={accentText} textTransform="uppercase" letterSpacing=".16em" fontWeight="bold" fontSize="xs">{lang.explore.marketplaceKicker}</Text>
								<Heading mt="2" color={titleColor} fontSize={{ base: "2xl", md: "3xl" }} letterSpacing="-.04em">{lang.explore.listingHeading}</Heading>
							</Box>
							<Flex align="center" gap="3" wrap="wrap">
								{activeResultLabel && <Badge color={titleColor} bg={badgeSurface} borderRadius="full" px="3" py="1">{activeResultLabel}</Badge>}
								<Text color={bodyColor} fontSize="sm" fontWeight="medium">{error ? lang.explore.unavailable : loading ? lang.explore.loading : `${data?.total || 0} ${(data?.total || 0) === 1 ? lang.explore.foundSingular : lang.explore.foundPlural}`}</Text>
							</Flex>
						</Flex>
						<Grid templateColumns={{ base: "1fr", lg: "290px minmax(0, 1fr)" }} gap={{ base: 5, lg: 7 }} alignItems="start">
							<FilterNav applyFilters={applyFilters} />
							<Box minW="0">
								{error ? (
					<Alert status="error" borderRadius="2xl" border="1px solid #f1c6ba" bg={errorSurface} py="5" alignItems="center">
										<AlertIcon color="#bd5d43" />
										<Flex w="full" align={{ base: "flex-start", sm: "center" }} justify="space-between" direction={{ base: "column", sm: "row" }} gap="4">
						<Box><Text color={errorText} fontWeight="bold">{lang.explore.errorTitle}</Text><AlertDescription color={bodyColor} fontSize="sm" mt="1">{lang.explore.errorDescription}</AlertDescription></Box>
											<Button type="button" size="sm" bg="#21383e" color="white" _hover={{ bg: "#142a30" }} onClick={() => setRetryCount((count) => count + 1)} isLoading={loading}>{lang.explore.retry}</Button>
										</Flex>
									</Alert>
								) : loading || !data ? (
									<SimpleGrid columns={{ base: 1, md: 2 }} spacing="5">{[...Array(4)].map((_, index) => <ItemLoader key={index} />)}</SimpleGrid>
								) : data.items?.length ? (
									<SimpleGrid columns={{ base: 1, md: 2 }} spacing="5">
										{data.items.map((item, index) => (
											<Box
												key={item.id}
												className="explore-listing-card"
												data-home-stagger
												style={{ "--home-stagger-delay": Math.min(index, 5) * 110 + "ms" } as CSSProperties}
											>
												<ItemCard
													id={item.id}
													title={item.title}
													date={item.createdAt}
													photoURL={item.images?.[0]}
													ownerName={[item.user?.firstName, item.user?.lastName].filter(Boolean).join(" ")}
													ownerPhoto={item?.user?.profile_url}
													price={item.price}
													itemType={item.itemType}
													priceFrequency={item.BusinessSpace?.priceFrequency}
													featured={item.featured}
													status={item.status}
													serviceCategory={item.Service?.category}
												/>
											</Box>
										))}
									</SimpleGrid>
								) : (
					<Flex align="center" justify="center" direction="column" bg={surface} borderRadius="2xl" border="1px solid" borderColor={borderColor} p={{ base: 8, md: 12 }} textAlign="center">
						<Box color={accentText} bg={accentSurface} borderRadius="full" p="4"><MdSearchOff size="28" /></Box>
						<Heading mt="5" fontSize="xl" color={titleColor}>{lang.explore.noMatchesTitle}</Heading>
						<Text color={bodyColor} mt="2" maxW="460px">{lang.explore.noMatchesDescription}</Text>
									</Flex>
								)}
								{!loading && data?.total > 30 && <Flex align="center" justify="space-between" direction={{ base: "column", sm: "row" }} gap="3" mt="6" p="4" bg={surface} border="1px solid" borderColor={borderColor} borderRadius="xl">
									<Button w={{ base: "full", sm: "auto" }} size="sm" variant="outline" isDisabled={pageIndex === 0} onClick={() => setPageIndex((page) => Math.max(0, page - 1))}>{lang.explore.previousPage}</Button>
									<Text color={bodyColor} fontSize="sm" textAlign="center">{lang.explore.pageCounter.replace("{page}", String(pageIndex + 1)).replace("{pages}", String(Math.ceil(data.total / 30)))}</Text>
									<Button w={{ base: "full", sm: "auto" }} size="sm" colorScheme="orange" isDisabled={(pageIndex + 1) * 30 >= data.total} onClick={() => setPageIndex((page) => page + 1)}>{lang.explore.nextPage}</Button>
								</Flex>}
							</Box>
						</Grid>
					</Box>
				</Box>
			</Box>
		</>
	);
}
