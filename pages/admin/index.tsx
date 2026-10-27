import { CheckIcon, CloseIcon, Search2Icon } from "@chakra-ui/icons";
import {
	Text,
	Box,
	Flex,
	Heading,
	SimpleGrid,
	Input,
	FormControl,
	InputGroup,
	IconButton,
	InputRightElement,
	ButtonGroup,
	Spinner,
	Alert,
	AlertTitle,
	AlertIcon,
	Badge,
	Button,
	useToast,
	useColorModeValue,
	Icon,
	Table,
	Thead,
	Tbody,
	Tr,
	Th,
	Td,
	TableContainer,
	Select,
} from "@chakra-ui/react";
import { useFetch } from "@libs/hooks/useFetch";
import { useUser } from "@libs/store";
import { ListingImage } from "@components/shared/ListingImage";
import axios from "axios";
import Link from "next/link";
import { useRouter } from "next/router";
import { FC, useEffect, useState } from "react";
import {
	FaBuilding,
	FaCarSide,
	FaCheckCircle,
	FaClock,
	FaCreditCard,
	FaHome,
	FaStar,
	FaTools,
	FaUsers,
} from "react-icons/fa";
import { dayjs } from "@config/dayjs";
import { withSessionSsr } from "@config/cookie/cookie";
import { useLang } from "@libs/hooks/useLang";
import { SiteNavbar } from "@components/shared/SiteNavbar";

export const getServerSideProps = withSessionSsr(
	async function getServerSideProps({ req }) {
		const user = req.user;

		if (!user || user.role !== "ADMIN") {
			return {
				notFound: true,
			};
		}

		return {
			props: {
				user,
			},
		};
	}
);

export default function AdminDashboard({ user }) {
	const { logout } = useUser();
	const router = useRouter();
	const copy = useLang().adminPage;
	const pageLanguage = router.locale === "am" || /^\/am(?:\/|$)/.test(router.asPath) ? "am" : "en";
	const [searchInput, setSearchInput] = useState("");
	const [searchQuery, setSearchQuery] = useState("");
	const [statusFilter, setStatusFilter] = useState("PENDING");
	const [refreshKey, setRefreshKey] = useState(0);
	const [activeSection, setActiveSection] = useState("OVERVIEW");
	const [paymentQueueStatus, setPaymentQueueStatus] = useState("ALL");
	const pageBg = useColorModeValue("#f4f6f8", "#000000");
	const surface = useColorModeValue("white", "#0c0c0c");
	const border = useColorModeValue("gray.200", "whiteAlpha.200");
	const textColor = useColorModeValue("maingray", "gray.100");
	const muted = useColorModeValue("gray.600", "gray.400");
	const sectionTitle = {
		OVERVIEW: copy.titles.overview,
		LISTINGS: copy.titles.listings,
		PAYMENTS: copy.titles.payments,
		USERS: copy.titles.users,
		REPORTS: copy.titles.reports,
	}[activeSection] || copy.titles.fallback;
	const sectionDescription = {
		OVERVIEW: copy.descriptions.overview,
		LISTINGS: copy.descriptions.listings,
		PAYMENTS: copy.descriptions.payments,
		USERS: copy.descriptions.users,
		REPORTS: copy.descriptions.reports,
	}[activeSection] || copy.descriptions.fallback;
	const navHoverBg = useColorModeValue("blackAlpha.50", "whiteAlpha.100");

	const openListingQueue = () => {
		setSearchInput("");
		setSearchQuery("");
		setStatusFilter("PENDING");
		setActiveSection("LISTINGS");
	};
	const openPaymentQueue = (status: string) => {
		setPaymentQueueStatus(status);
		setActiveSection("PAYMENTS");
	};

	const handleLogout = async () => {
		logout();
		try {
			await axios.post("/api/user/logout");
		} finally {
			router.replace("/auth/login");
		}
	};

	return (
		<>
			<Flex className="admin-dashboard-shell" lang={pageLanguage} direction="column" minH="100dvh" bg={pageBg}>
				<SiteNavbar mode="admin" user={user} onLogout={handleLogout} />

				<Flex
					w="full"
					maxW="1480px"
					mx="auto"
					px={{ base: 4, md: 8, xl: 10 }}
					py={{ base: 5, md: 9 }}
					direction="column"
					className="admin-dashboard-content"
				>
					<Flex className="admin-console-hero" align={{ base: "flex-start", md: "flex-end" }} justify="space-between" gap="4" mb={{ base: 5, md: 8 }} p={{ base: 4, sm: 5, md: 7 }} border="1px solid" borderColor={border} borderRadius={{ base: "2xl", md: "3xl" }} bgGradient={useColorModeValue("linear(to-br, white, #f7f1e9)", "linear(to-br, #111111, #050505)")} boxShadow="0 20px 48px rgba(20,32,38,.08)" direction={{ base: "column", sm: "row" }}>
						<Box>
							<Text fontSize="xs" fontWeight="bold" letterSpacing="0.16em" color="mainorange" textTransform="uppercase">{copy.kicker}</Text>
							<Heading mt="2" fontSize={{ base: "2xl", md: "3xl" }} color={textColor} letterSpacing="tight" fontWeight="bold">{sectionTitle}</Heading>
							<Text mt="2" color={muted} maxW="2xl" fontSize="sm" lineHeight="1.7">{sectionDescription}</Text>
						</Box>
						<Badge alignSelf={{ base: "flex-start", sm: "flex-end" }} colorScheme="purple" borderRadius="full" px="3" py="1.5" fontSize="xs" textTransform="uppercase" letterSpacing="wide">{copy.access}</Badge>
					</Flex>
					<SimpleGrid className="admin-section-nav" columns={{ base: 2, sm: 3, xl: 5 }} spacing="2" p="1" mb={{ base: 5, md: 7 }} bg={surface} border="1px solid" borderColor={border} borderRadius="2xl" role="tablist" aria-label={copy.sectionsLabel}>
						{[["OVERVIEW", copy.tabs.overview], ["LISTINGS", copy.tabs.listings], ["PAYMENTS", copy.tabs.payments], ["USERS", copy.tabs.users], ["REPORTS", copy.tabs.reports]].map(([value, label]) => {
							const selected = activeSection === value;
							return <Button key={value} role="tab" aria-selected={selected} minW="0" minH="11" w="full" px={{ base: 2, sm: 3 }} whiteSpace="normal" onClick={() => value === "REPORTS" ? void router.push("/admin/reports") : setActiveSection(value)} color={selected ? "white" : muted} bg={selected ? "mainorange" : "transparent"} borderRadius="xl" fontSize={{ base: "xs", sm: "sm" }} fontWeight={selected ? "bold" : "medium"} boxShadow={selected ? "0 5px 14px rgba(198,107,54,.22)" : "none"} _hover={{ bg: selected ? "mainorange" : navHoverBg, color: selected ? "white" : textColor }}>{label}</Button>;
						})}
					</SimpleGrid>
					{activeSection === "OVERVIEW" && <Box key={`overview-${refreshKey}`} className="admin-section-enter">
						<StatsBar onOpenListings={openListingQueue} onOpenPayments={openPaymentQueue} />
						<PaymentsPanel compact refreshKey={refreshKey} />
					</Box>}
					{activeSection === "LISTINGS" && <Flex className="admin-section-enter admin-data-panel" direction="column" bg={surface} border="1px solid" borderColor={border} borderRadius="2xl" boxShadow="0 12px 36px rgba(21,42,44,.07)" p={{ base: 4, md: 7 }}>
						<Flex direction={{ base: "column", lg: "row" }} align={{ base: "stretch", lg: "center" }} gap="5" mb="3">
							<Box>
								<Heading size="md" color={textColor}>{copy.listing.title}</Heading>
								<Text mt="2" color={muted} fontSize="sm" maxW="3xl" lineHeight="1.7">{copy.listing.description}</Text>
							</Box>
							<Flex flex="1" />
							<FormControl maxW={{ lg: "sm" }}>
								<InputGroup size="md">
									<Input
										value={searchInput}
										onChange={(event) => setSearchInput(event.target.value)}
										onKeyDown={(event) => { if (event.key === "Enter") setSearchQuery(searchInput.trim()); }}
										placeholder={copy.listing.searchPlaceholder}
										variant="outline"
										borderRadius="xl"
										bg={pageBg}
										pr="12"
									/>
									<InputRightElement h="full">
										<IconButton onClick={() => setSearchQuery(searchInput.trim())} aria-label={copy.listing.searchAria} colorScheme="orange" variant="ghost" borderRadius="lg" icon={<Search2Icon />} />
									</InputRightElement>
								</InputGroup>
							</FormControl>
						</Flex>
						<SimpleGrid columns={{ base: 2, sm: 3, xl: 6 }} spacing="2" my="5" role="group" aria-label={copy.listing.filterAria}>
							{[["PAYMENT", copy.listing.filters.payment], ["PENDING", copy.listing.filters.pending], ["APPROVED", copy.listing.filters.approved], ["DECLINED", copy.listing.filters.declined], ["SOLD", copy.listing.filters.sold], ["CLOSED", copy.listing.filters.closed]].map(([value, label]) => (
								<Button key={value} size="sm" w="full" minW="0" px={{ base: 2, sm: 3 }} h="9" borderRadius="full" fontSize={{ base: "xs", sm: "sm" }} colorScheme={statusFilter === value ? "orange" : "gray"} variant={statusFilter === value ? "solid" : "outline"} onClick={() => setStatusFilter(value)}>
									{label}
								</Button>
							))}
						</SimpleGrid>
						<Flex direction="column" borderTop="1px solid" borderColor={border}>
							<ItemsList
								searchQuery={searchQuery}
								statusFilter={statusFilter}
								refreshKey={refreshKey}
								onModerated={() => setRefreshKey((key) => key + 1)}
							/>
						</Flex>
					</Flex>}
					{activeSection === "PAYMENTS" && <Box key={`payments-${paymentQueueStatus}`} className="admin-section-enter"><PaymentsPanel refreshKey={refreshKey} initialStatus={paymentQueueStatus} /></Box>}
					{activeSection === "USERS" && <Box className="admin-section-enter"><UsersPanel currentUserId={user.id} /></Box>}
				</Flex>
			</Flex>
		</>
	);
}

interface IItemList {
	searchQuery: string;
	statusFilter: string;
	refreshKey: number;
	onModerated: () => void;
}

const ItemsList: FC<IItemList> = ({ searchQuery, statusFilter, refreshKey, onModerated }) => {
	const [page, setPage] = useState(0);
	const pageText = useLang().explore;
	const copy = useLang().adminPage.listing;
	useEffect(() => setPage(0), [searchQuery, statusFilter]);
	const [data, loading, error] = useFetch({
		fetchFunction: () => axios.post(`/api/items?page=${page}`, {
			status: statusFilter === "PAYMENT" ? "PENDING" : statusFilter,
			...(statusFilter === "PAYMENT" ? { paymentFilter: "AWAITING" } : {}),
			...(searchQuery ? { id: searchQuery } : {}),
		}),
		dependencies: [searchQuery, statusFilter, refreshKey, page],
	});
	const muted = useColorModeValue("gray.600", "gray.400");
	if (loading) {
		return <Flex p="10" alignItems="center" justifyContent="center"><Spinner /></Flex>;
	}
	if (error) {
		return <Alert status="error" borderRadius="lg"><AlertIcon /><AlertTitle>{copy.loadError}</AlertTitle></Alert>;
	}
	if (!data?.items?.length) {
		return <Text py="10" textAlign="center" color={muted}>{searchQuery ? copy.noMatch : copy.noListings}</Text>;
	}
	return <>
		{data.items.map((item) => <ItemCard key={item.id} item={item} onModerated={onModerated} />)}
		{data.total > 30 && <Flex align="center" justify="space-between" direction={{ base: "column", sm: "row" }} gap="3" mt="5" py="3">
			<Button w={{ base: "full", sm: "auto" }} size="sm" variant="outline" isDisabled={page === 0} onClick={() => setPage((current) => Math.max(0, current - 1))}>{pageText.previousPage}</Button>
			<Text color={muted} fontSize="sm">{pageText.pageCounter.replace("{page}", String(page + 1)).replace("{pages}", String(Math.ceil(data.total / 30)))}</Text>
			<Button w={{ base: "full", sm: "auto" }} size="sm" colorScheme="orange" isDisabled={(page + 1) * 30 >= data.total} onClick={() => setPage((current) => current + 1)}>{pageText.nextPage}</Button>
		</Flex>}
	</>;
};

interface ICard {
	item: any;
	onModerated: () => void;
}

const ItemCard: FC<ICard> = ({ item, onModerated }) => {
	const lang = useLang();
	const adminCopy = lang.adminPage;
	const sellerTypeText = lang.sellerType;
	const copy = adminCopy.listing;
	const { locale } = useRouter();
	const border = useColorModeValue("gray.200", "whiteAlpha.200");
	const surface = useColorModeValue("white", "#0c0c0c");
	const muted = useColorModeValue("gray.600", "gray.400");
	const [working, setWorking] = useState(false);
	const [featuredWorking, setFeaturedWorking] = useState(false);
	const toast = useToast();
	const { id, title, featured, createdAt, itemType, status, paymentStatus } = item;
	const latestPayment = item.ListingPayments?.[0];
	const car = item.Car;
	const itemTypeLabels: Record<string, string> = {
		HOUSE: adminCopy.stats.homes,
		CAR: adminCopy.stats.vehicles,
		BUSINESS_SPACE: adminCopy.stats.businessSpaces,
		SERVICE: adminCopy.stats.services,
	};
	const subtitle = itemType === "CAR" && car
		? [car.manufacturer, car.model, car.year].filter(Boolean).join(" · ")
		: itemTypeLabels[itemType] || itemType.replace(/_/g, " ");

	const handleItem = async (newStatus: "APPROVED" | "DECLINED") => {
		if (working || status !== "PENDING") return;
		if (newStatus === "APPROVED" && paymentStatus !== "PAID") {
			toast({ title: copy.paymentRequired, description: copy.paymentRequiredHelp, status: "warning" });
			return;
		}
		if (newStatus === "APPROVED" && !item.sellerAttested) {
			toast({ title: copy.attestationRequired, description: sellerTypeText.attestationHint, status: "warning" });
			return;
		}
		setWorking(true);
		try {
			await axios.post("/api/admin/changeItemStatus", { itemId: id, status: newStatus });
			toast({
				title: newStatus === "APPROVED" ? copy.approvedToast : copy.declinedToast,
				description: newStatus === "APPROVED" ? copy.published : copy.resubmit,
				status: newStatus === "APPROVED" ? "success" : "info",
				isClosable: true,
			});
			onModerated();
		} catch (error: any) {
			toast({
				title: copy.updateFailed,
				description: error?.response?.data?.err || copy.reviewRetry,
				status: "error",
				isClosable: true,
			});
		} finally {
			setWorking(false);
		}
	};

	const handleFeatured = async () => {
		if (featuredWorking || (!featured && status !== "APPROVED")) return;
		setFeaturedWorking(true);
		try {
			await axios.post("/api/admin/setFeatured", { itemId: id, featured: !featured });
			toast({ title: featured ? copy.featuredRemoved : copy.featuredAdded, description: featured ? copy.featuredRemovedHelp : copy.featuredAddedHelp, status: "success", isClosable: true });
			onModerated();
		} catch (error: any) {
			toast({ title: copy.featuredUpdateFailed, description: error?.response?.data?.err || copy.listingRetry, status: "error", isClosable: true });
		} finally {
			setFeaturedWorking(false);
		}
	};

	return (
		<Flex className="admin-listing-review-card" align={{ base: "flex-start", lg: "center" }} gap="4" p={{ base: 4, md: 5 }} mt="4" bg={surface} border="1px solid" borderColor={border} borderRadius="xl" boxShadow="sm" transition="box-shadow .2s, border-color .2s" _hover={{ boxShadow: "md", borderColor: "orange.200" }} direction={{ base: "column", lg: "row" }}>
			<Flex align="center" gap="4" minW="0" flex="1">
				<Box flexShrink={0}><ListingImage src={item.images?.[0]} alt={title} itemType={itemType} w="88px" h="72px" borderRadius="lg" /></Box>
				<Box minW="0">
					<Flex align="center" gap="2" wrap="wrap">
						<Heading size="sm" noOfLines={2}>{title}</Heading>
						{featured && <Badge colorScheme="orange">{copy.featured}</Badge>}
					</Flex>
					<Text mt="1" fontSize="sm" color={muted}>{subtitle}</Text>
					{item.sellerType && sellerTypeText.options[item.sellerType] && <Flex mt="2" align="center" gap="2" wrap="wrap"><Badge colorScheme="purple" variant="subtle">{copy.sellerRole}: {sellerTypeText.options[item.sellerType]}</Badge><Text fontSize="xs" color={muted} title={sellerTypeText.selfDeclared}>{sellerTypeText.selfDeclaredShort}</Text><Badge colorScheme={item.sellerAttested ? "green" : "orange"} variant="subtle">{item.sellerAttested ? sellerTypeText.attested : copy.attestationRequired}</Badge></Flex>}
					<Text mt="1" fontSize="xs" color={muted}>{copy.posted} {dayjs(createdAt).locale(locale === "am" ? "am" : "en").fromNow()} · ID {id}</Text>
					<Flex mt="2" direction="column" align="flex-start" gap="1">
						<Badge colorScheme={paymentStatus === "PAID" ? "green" : paymentStatus === "PROCESSING" ? "blue" : paymentStatus === "DUE" ? "orange" : "gray"}>
							{paymentStatus === "PAID" ? copy.paymentVerified : paymentStatus === "PROCESSING" ? copy.paymentInProgress : paymentStatus === "DUE" ? copy.paymentDue : copy.noFee}
						</Badge>
						{latestPayment && <Text fontSize="xs" color={muted} noOfLines={1}>{adminCopy.payments.states[latestPayment.status] || latestPayment.status} · {latestPayment.currency || "EUR"} {Number(latestPayment.amount).toLocaleString(locale === "am" ? "am-ET" : "en-US")} · {latestPayment.paymentMethod || copy.paymentMethodUnavailable} · {copy.reference} {latestPayment.txRef}</Text>}
					</Flex>
				</Box>
			</Flex>
			<Flex align="center" gap="3" wrap="wrap" w={{ base: "full", lg: "auto" }} justify={{ base: "flex-end", lg: "flex-start" }}>
				<Badge colorScheme={status === "APPROVED" ? "green" : status === "DECLINED" ? "red" : status === "SOLD" ? "purple" : status === "CLOSED" ? "gray" : "orange"} borderRadius="full" px="3" py="1">{copy.status[status] || status}</Badge>
				<Link legacyBehavior href={`/items/${id}`} passHref><Button as="a" size="sm" variant="outline">{copy.reviewDetails}</Button></Link>
				{status === "PENDING" && paymentStatus === "PAID" && (
					<ButtonGroup size="sm">
						<Button colorScheme="green" onClick={() => handleItem("APPROVED")} isLoading={working} leftIcon={<CheckIcon />}>{copy.approve}</Button>
						<Button colorScheme="red" variant="outline" onClick={() => handleItem("DECLINED")} isLoading={working} leftIcon={<CloseIcon />}>{copy.decline}</Button>
					</ButtonGroup>
				)}
				{(status === "APPROVED" || featured) && (
					<Button size="sm" colorScheme="orange" variant={featured ? "solid" : "outline"} leftIcon={<FaStar />} onClick={handleFeatured} isLoading={featuredWorking}>
						{featured ? copy.removeFeatured : copy.featureListing}
					</Button>
				)}
			</Flex>
		</Flex>
	);
};

function formatMoney(amount: number, currency: string, locale = "en-US") {
	try {
		return new Intl.NumberFormat(locale, { style: "currency", currency }).format(amount);
	} catch {
		return `${amount.toLocaleString(locale)} ${currency}`;
	}
}

function PaymentsPanel({ compact = false, refreshKey = 0, initialStatus = "ALL" }: { compact?: boolean; refreshKey?: number; initialStatus?: string }) {
	const adminCopy = useLang().adminPage;
	const copy = adminCopy.payments;
	const listingTypeLabels: Record<string, string> = {
		HOUSE: adminCopy.stats.homes,
		CAR: adminCopy.stats.vehicles,
		BUSINESS_SPACE: adminCopy.stats.businessSpaces,
		SERVICE: adminCopy.stats.services,
	};
	const { locale } = useRouter();
	const dateLocale = locale === "am" ? "am" : "en";
	const numberLocale = locale === "am" ? "am-ET" : "en-US";
	const [page, setPage] = useState(0);
	const [status, setStatus] = useState(initialStatus);
	const [searchInput, setSearchInput] = useState("");
	const [query, setQuery] = useState("");
	const [listRefresh, setListRefresh] = useState(0);
	const [refundingId, setRefundingId] = useState("");
	const [decliningId, setDecliningId] = useState("");
	const [data, loading, error] = useFetch({
		fetchFunction: () => axios.get("/api/admin/payments", { params: { page: compact ? 0 : page, status: compact ? "ALL" : status, query: compact ? "" : query } }),
		dependencies: [compact, page, status, query, refreshKey, listRefresh],
	});
	const surface = useColorModeValue("white", "#0c0c0c");
	const border = useColorModeValue("gray.200", "whiteAlpha.200");
	const muted = useColorModeValue("gray.600", "gray.400");
	const tableHead = useColorModeValue("gray.50", "#111113");
	const rowHoverBg = useColorModeValue("gray.50", "whiteAlpha.50");
	const mobileCardBg = useColorModeValue("gray.50", "whiteAlpha.50");
	const toast = useToast();
	const visiblePayments = compact ? data?.payments?.slice(0, 6) || [] : data?.payments || [];
	const paymentStatusLabel = (value: string) => value === "INITIATED" ? copy.inProgress : copy.states[value] || value;
	const pageLabel = (total: number, pageSize: number) => copy.page.replace("{page}", String(page + 1)).replace("{pages}", String(Math.ceil(total / pageSize)));
	useEffect(() => setPage(0), [status, query]);
	useEffect(() => setStatus(initialStatus), [initialStatus]);

	const handleRefund = async (payment: any) => {
		const amount = formatMoney(Number(payment.amount) || 0, payment.currency || "EUR", numberLocale);
		const title = payment.item?.title || copy.listingRemoved;
		const checking = payment.refundStatus === "PROCESSING";
		const requested = payment.refundRequestStatus === "PENDING";
		const prompt = checking ? copy.confirmCheck : requested ? copy.confirmApprove : copy.confirmRefund;
		const confirmed = window.confirm(prompt.replace("{amount}", amount).replace("{title}", title));
		if (!confirmed) return;
		setRefundingId(payment.id);
		try {
			const response = await axios.post("/api/admin/refundPayment", { paymentId: payment.id });
			const pending = response.data?.status === "PROCESSING";
			toast({
				title: pending ? copy.processingTitle : copy.completedTitle,
				description: pending ? copy.processingDescription : copy.completedDescription.replace("{amount}", amount),
				status: pending ? "warning" : "success",
				isClosable: true,
			});
			setListRefresh((value) => value + 1);
		} catch (requestError: any) {
			toast({ title: copy.refundFailed, description: requestError?.response?.data?.err || copy.refundRetry, status: "error", isClosable: true });
			setListRefresh((value) => value + 1);
		} finally {
			setRefundingId("");
		}
	};

	const handleDeclineRefundRequest = async (payment: any) => {
		const confirmed = window.confirm(copy.confirmDecline.replace("{title}", payment.item?.title || copy.listingRemoved));
		if (!confirmed) return;
		setDecliningId(payment.id);
		try {
			await axios.post("/api/admin/declineRefundRequest", { paymentId: payment.id });
			toast({ title: copy.requestDeclined, status: "info", isClosable: true });
			setListRefresh((value) => value + 1);
		} catch (requestError: any) {
			toast({ title: copy.updateRequestFailed, description: requestError?.response?.data?.err || copy.paymentRetry, status: "error", isClosable: true });
			setListRefresh((value) => value + 1);
		} finally {
			setDecliningId("");
		}
	};

	return <Flex className="admin-data-panel" direction="column" bg={surface} border="1px solid" borderColor={border} borderRadius="2xl" boxShadow="0 12px 36px rgba(21,42,44,.07)" p={{ base: 4, md: 7 }} mt={compact ? { base: 5, md: 7 } : 0}>
		<Flex direction={{ base: "column", md: "row" }} align={{ base: "stretch", md: "center" }} gap="4" mb="5">
			<Box flex="1">
				<Heading size="md">{compact ? copy.recentTitle : copy.title}</Heading>
				<Text mt="1" fontSize="sm" color={muted}>{compact ? copy.compactDescription : copy.description}</Text>
			</Box>
			{!compact && <Flex gap="3" direction={{ base: "column", sm: "row" }}>
				<InputGroup maxW={{ sm: "sm" }}>
					<Input value={searchInput} onChange={(event) => setSearchInput(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") setQuery(searchInput.trim()); }} placeholder={copy.searchPlaceholder} borderRadius="xl" />
					<InputRightElement><IconButton aria-label={copy.searchAria} variant="ghost" icon={<Search2Icon />} onClick={() => setQuery(searchInput.trim())} /></InputRightElement>
				</InputGroup>
				<Select value={status} onChange={(event) => setStatus(event.target.value)} maxW={{ sm: "48" }} borderRadius="xl" aria-label={copy.filterAria}>
					<option value="ALL">{copy.states.ALL}</option><option value="REFUND_REQUESTED">{copy.states.REFUND_REQUESTED}</option><option value="PAID">{copy.states.PAID}</option><option value="INITIATED">{copy.states.INITIATED}</option><option value="FAILED">{copy.states.FAILED}</option>
				</Select>
			</Flex>}
		</Flex>
		{loading ? <Flex py="10" justify="center"><Spinner /></Flex> : error ? <Alert status="error" borderRadius="lg"><AlertIcon /><AlertTitle>{copy.loadError}</AlertTitle></Alert> : !data?.payments?.length ? <Text py="8" textAlign="center" color={muted}>{copy.empty}</Text> : <>
				<Flex display={{ base: "flex", lg: "none" }} direction="column" gap="3">
				{visiblePayments.map((payment) => <Box key={payment.id} className="admin-mobile-record" p="4" border="1px solid" borderColor={border} borderRadius="xl" bg={mobileCardBg}>
					<Flex align="flex-start" justify="space-between" gap="3">
						<Box minW="0"><Text fontSize="xs" color={muted} fontWeight="bold" textTransform="uppercase" letterSpacing=".08em">{payment.paymentMethod || copy.payment}</Text><Text mt="1" fontWeight="bold" noOfLines={2}>{payment.item?.title || copy.listingRemoved}</Text><Text mt="1" fontSize="xs" color={muted} noOfLines={1}>{payment.item?.user?.email || copy.accountUnavailable}</Text></Box>
						<Text flexShrink="0" fontWeight="bold" fontSize="sm">{formatMoney(Number(payment.amount) || 0, payment.currency || "EUR", numberLocale)}</Text>
					</Flex>
					<Flex mt="3" wrap="wrap" gap="2" align="center"><Badge borderRadius="full" colorScheme={payment.status === "PAID" ? "green" : payment.status === "FAILED" ? "red" : "orange"}>{paymentStatusLabel(payment.status)}</Badge>{payment.refundRequestStatus === "PENDING" && <Badge borderRadius="full" colorScheme="orange">{copy.refundRequest}</Badge>}{payment.refundRequestStatus === "APPROVED" && <Badge borderRadius="full" colorScheme="green">{copy.requestApproved}</Badge>}{payment.refundRequestStatus === "DECLINED" && <Badge borderRadius="full" colorScheme="red">{copy.requestDeclined}</Badge>}{payment.refundStatus === "PROCESSING" && <Badge borderRadius="full" colorScheme="orange">{copy.refundProcessing}</Badge>}{payment.refundStatus === "REFUNDED" && <Badge borderRadius="full" colorScheme="purple">{copy.refunded}</Badge>}</Flex>
					<Text mt="3" fontSize="xs" color={muted} wordBreak="break-all">{copy.reference}: {payment.txRef}</Text>
					<Text mt="1" fontSize="xs" color={muted}>{dayjs(payment.verifiedAt || payment.createdAt).locale(dateLocale).format("MMM D, YYYY · HH:mm")}</Text>
					{payment.refundRequestReason && <Text mt="2" fontSize="sm" color={muted}>{copy.refundRequest}: {payment.refundRequestReason}</Text>}
					{!compact && <Flex mt="3" gap="2" wrap="wrap">
						{payment.refundRequestStatus === "PENDING" && payment.refundStatus === "NOT_REFUNDED" && <Button size="sm" variant="outline" isLoading={decliningId === payment.id} isDisabled={Boolean((decliningId && decliningId !== payment.id) || (refundingId && refundingId !== payment.id))} onClick={() => handleDeclineRefundRequest(payment)}>{copy.declineRequest}</Button>}
						{payment.status === "PAID" && payment.refundStatus !== "REFUNDED" && payment.txRef?.startsWith("HB-STRIPE-") && payment.providerRef?.startsWith("cs_test_") ? <Button size="sm" colorScheme="red" variant="outline" isLoading={refundingId === payment.id} isDisabled={Boolean((refundingId && refundingId !== payment.id) || (decliningId && decliningId !== payment.id)) || (payment.refundStatus === "PROCESSING" && payment.refundStartedAt && dayjs(payment.refundStartedAt).isAfter(dayjs().subtract(2, "minute")))} onClick={() => handleRefund(payment)}>{payment.refundStatus === "PROCESSING" ? copy.checkRefund : payment.refundRequestStatus === "PENDING" ? copy.approveRefund : copy.fullRefund}</Button> : payment.refundStatus === "REFUNDED" ? <Text alignSelf="center" fontSize="xs" color={muted}>{copy.completed}</Text> : <Text alignSelf="center" fontSize="xs" color={muted}>{copy.unavailable}</Text>}
					</Flex>}
				</Box>)}
			</Flex>
			<TableContainer display={{ base: "none", lg: "block" }} border="1px solid" borderColor={border} borderRadius="xl">
				<Table size="sm" variant="simple" minW={compact ? "760px" : "900px"} sx={{ "th": { bg: tableHead, color: muted, fontSize: "10px", letterSpacing: "0.1em", textTransform: "uppercase", borderColor: border, py: 3 }, "td": { borderColor: border, py: 3 } }}>
					<Thead><Tr><Th>{copy.payment}</Th><Th>{copy.listing}</Th><Th display={{ base: "none", md: "table-cell" }}>{copy.account}</Th><Th>{copy.amount}</Th><Th>{copy.status}</Th><Th display={{ base: "none", lg: "table-cell" }}>{copy.recorded}</Th>{!compact && <Th>{copy.action}</Th>}</Tr></Thead>
					<Tbody>{visiblePayments.map((payment) => <Tr key={payment.id} _hover={{ bg: rowHoverBg }}>
						<Td><Text fontWeight="semibold" noOfLines={1}>{payment.paymentMethod || copy.payment}</Text><Text fontSize="xs" color={muted} noOfLines={1}>{payment.txRef}</Text>{payment.refundRef && <Text fontSize="xs" color={muted} noOfLines={1}>{copy.refundReference} {payment.refundRef}</Text>}</Td>
						<Td><Text fontWeight="medium" noOfLines={1}>{payment.item?.title || copy.listingRemoved}</Text><Text fontSize="xs" color={muted}>{listingTypeLabels[payment.item?.itemType] || "—"}</Text>{payment.refundRequestStatus === "PENDING" && <><Badge mt="1" colorScheme="orange" borderRadius="full">{copy.refundPending}</Badge>{payment.refundRequestReason && <Text mt="1" fontSize="xs" color={muted} noOfLines={3}>{payment.refundRequestReason}</Text>}</>}</Td>
						<Td display={{ base: "none", md: "table-cell" }}><Text noOfLines={1}>{payment.item?.user?.email || "—"}</Text></Td>
						<Td whiteSpace="nowrap" fontWeight="semibold">{formatMoney(Number(payment.amount) || 0, payment.currency || "EUR", numberLocale)}</Td>
						<Td><Flex direction="column" align="flex-start" gap="1"><Badge borderRadius="full" colorScheme={payment.status === "PAID" ? "green" : payment.status === "FAILED" ? "red" : "orange"}>{paymentStatusLabel(payment.status)}</Badge>{payment.refundRequestStatus === "APPROVED" && <Badge borderRadius="full" colorScheme="green">{copy.requestApproved}</Badge>}{payment.refundRequestStatus === "DECLINED" && <Badge borderRadius="full" colorScheme="red">{copy.requestDeclined}</Badge>}{payment.refundStatus === "REFUNDED" && <><Badge borderRadius="full" colorScheme="purple">{copy.refunded}</Badge><Text fontSize="xs" color={muted}>{payment.refundedAt ? dayjs(payment.refundedAt).locale(dateLocale).format("MMM D, YYYY · HH:mm") : copy.refundCompleted}</Text></>}{payment.refundStatus === "PROCESSING" && <Badge borderRadius="full" colorScheme="orange">{copy.refundProcessing}</Badge>}</Flex></Td>
						<Td display={{ base: "none", lg: "table-cell" }} color={muted} whiteSpace="nowrap">{dayjs(payment.verifiedAt || payment.createdAt).locale(dateLocale).format("MMM D, YYYY · HH:mm")}</Td>
						{!compact && <Td><Flex direction="column" align="flex-start" gap="2">{payment.refundRequestStatus === "PENDING" && payment.refundStatus === "NOT_REFUNDED" && <Button size="xs" variant="ghost" colorScheme="gray" borderRadius="lg" isLoading={decliningId === payment.id} isDisabled={Boolean((decliningId && decliningId !== payment.id) || (refundingId && refundingId !== payment.id))} onClick={() => handleDeclineRefundRequest(payment)}>{copy.declineRequest}</Button>}{payment.status === "PAID" && payment.refundStatus !== "REFUNDED" && payment.txRef?.startsWith("HB-STRIPE-") && payment.providerRef?.startsWith("cs_test_") ? <Button size="xs" variant="outline" colorScheme="red" borderRadius="lg" isLoading={refundingId === payment.id} isDisabled={Boolean((refundingId && refundingId !== payment.id) || (decliningId && decliningId !== payment.id)) || (payment.refundStatus === "PROCESSING" && payment.refundStartedAt && dayjs(payment.refundStartedAt).isAfter(dayjs().subtract(2, "minute")))} onClick={() => handleRefund(payment)}>{payment.refundStatus === "PROCESSING" ? copy.checkRefund : payment.refundRequestStatus === "PENDING" ? copy.approveRefund : copy.fullRefund}</Button> : payment.refundStatus === "REFUNDED" ? <Text fontSize="xs" color={muted}>{copy.completed}</Text> : <Text fontSize="xs" color={muted}>{copy.unavailable}</Text>}</Flex></Td>}
					</Tr>)}</Tbody>
				</Table>
			</TableContainer>
			{!compact && data.total > data.pageSize && <Flex align="center" justify="space-between" direction={{ base: "column", sm: "row" }} gap="3" mt="5">
				<Button w={{ base: "full", sm: "auto" }} size="sm" variant="outline" isDisabled={page === 0} onClick={() => setPage((current) => Math.max(0, current - 1))}>{copy.previous}</Button>
				<Text color={muted} fontSize="sm">{pageLabel(data.total, data.pageSize)}</Text>
				<Button w={{ base: "full", sm: "auto" }} size="sm" colorScheme="orange" isDisabled={(page + 1) * data.pageSize >= data.total} onClick={() => setPage((current) => current + 1)}>{copy.next}</Button>
			</Flex>}
		</>}
	</Flex>;
}

function UsersPanel({ currentUserId }: { currentUserId: string }) {
	const copy = useLang().adminPage.users;
	const [page, setPage] = useState(0);
	const [role, setRole] = useState("ALL");
	const [searchInput, setSearchInput] = useState("");
	const [query, setQuery] = useState("");
	const [refreshKey, setRefreshKey] = useState(0);
	const [workingId, setWorkingId] = useState("");
	const [data, loading, error] = useFetch({
		fetchFunction: () => axios.get("/api/admin/users", { params: { page, role, query } }),
		dependencies: [page, role, query, refreshKey],
	});
	const toast = useToast();
	const surface = useColorModeValue("white", "#0c0c0c");
	const border = useColorModeValue("gray.200", "whiteAlpha.200");
	const muted = useColorModeValue("gray.600", "gray.400");
	const tableHead = useColorModeValue("gray.50", "#111113");
	const rowHoverBg = useColorModeValue("gray.50", "whiteAlpha.50");
	const mobileCardBg = useColorModeValue("gray.50", "whiteAlpha.50");
	const pageLabel = (total: number, pageSize: number) => copy.page.replace("{page}", String(page + 1)).replace("{pages}", String(Math.ceil(total / pageSize)));
	useEffect(() => setPage(0), [role, query]);

	const updateRole = async (target: any, newRole: string) => {
		if (newRole === "ADMIN" && !window.confirm(copy.confirmRole.replace("{email}", target.email))) {
			setRefreshKey((value) => value + 1);
			return;
		}
		setWorkingId(target.id);
		try {
			await axios.post("/api/admin/changeUserRole", { userId: target.id, role: newRole });
			toast({ title: copy.roleUpdated, status: "success", isClosable: true });
			setRefreshKey((value) => value + 1);
		} catch (requestError: any) {
			toast({ title: copy.roleUpdateFailed, description: requestError?.response?.data?.err || copy.roleRetry, status: "error", isClosable: true });
			setRefreshKey((value) => value + 1);
		} finally {
			setWorkingId("");
		}
	};

	return <Flex className="admin-data-panel" direction="column" bg={surface} border="1px solid" borderColor={border} borderRadius="2xl" boxShadow="0 12px 36px rgba(21,42,44,.07)" p={{ base: 4, md: 7 }}>
		<Flex direction={{ base: "column", md: "row" }} align={{ base: "stretch", md: "center" }} gap="4" mb="5">
			<Box flex="1"><Heading size="md">{copy.title}</Heading><Text mt="1" fontSize="sm" color={muted}>{copy.description}</Text></Box>
			<Flex gap="3" direction={{ base: "column", sm: "row" }}>
				<InputGroup maxW={{ sm: "sm" }}><Input value={searchInput} onChange={(event) => setSearchInput(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") setQuery(searchInput.trim()); }} placeholder={copy.searchPlaceholder} borderRadius="xl" /><InputRightElement><IconButton aria-label={copy.searchAria} variant="ghost" icon={<Search2Icon />} onClick={() => setQuery(searchInput.trim())} /></InputRightElement></InputGroup>
				<Select value={role} onChange={(event) => setRole(event.target.value)} maxW={{ sm: "44" }} borderRadius="xl" aria-label={copy.filterAria}><option value="ALL">{copy.roles.ALL}</option><option value="USER">{copy.roles.USER}</option><option value="ADMIN">{copy.roles.ADMIN}</option></Select>
			</Flex>
		</Flex>
		{loading ? <Flex py="10" justify="center"><Spinner /></Flex> : error ? <Alert status="error" borderRadius="lg"><AlertIcon /><AlertTitle>{copy.loadError}</AlertTitle></Alert> : !data?.users?.length ? <Text py="8" textAlign="center" color={muted}>{copy.empty}</Text> : <>
				<Flex display={{ base: "flex", lg: "none" }} direction="column" gap="3">
				{data.users.map((account) => <Box key={account.id} className="admin-mobile-record" p="4" border="1px solid" borderColor={border} borderRadius="xl" bg={mobileCardBg}>
					<Flex justify="space-between" align="flex-start" gap="3"><Box minW="0"><Text fontWeight="bold" noOfLines={1}>{account.firstName} {account.lastName}</Text><Text mt="1" fontSize="sm" color={muted} wordBreak="break-word">{account.email}</Text></Box><Badge flexShrink="0" colorScheme={account.verfied ? "green" : "orange"} borderRadius="full">{account.verfied ? copy.verified : copy.unverified}</Badge></Flex>
					<Flex mt="3" justify="space-between" align="center" gap="3"><Text fontSize="sm" color={muted}>{account._count?.AddedItem ?? 0} {copy.listings}</Text>{account.id === currentUserId ? <Badge colorScheme="purple" borderRadius="full" px="3">{copy.adminYou}</Badge> : <Select size="sm" maxW="48" value={account.role} isDisabled={workingId === account.id} onChange={(event) => updateRole(account, event.target.value)} aria-label={copy.changeRoleAria.replace("{email}", account.email)} borderRadius="lg"><option value="USER">{copy.user}</option><option value="ADMIN">{copy.administrator}</option></Select>}</Flex>
				</Box>)}
			</Flex>
			<TableContainer display={{ base: "none", lg: "block" }} border="1px solid" borderColor={border} borderRadius="xl">
				<Table size="sm" variant="simple" minW="680px" sx={{ "th": { bg: tableHead, color: muted, fontSize: "10px", letterSpacing: "0.1em", textTransform: "uppercase", borderColor: border, py: 3 }, "td": { borderColor: border, py: 3 } }}>
					<Thead><Tr><Th>{copy.account}</Th><Th>{copy.listingCount}</Th><Th>{copy.emailStatus}</Th><Th>{copy.access}</Th></Tr></Thead>
					<Tbody>{data.users.map((account) => <Tr key={account.id} _hover={{ bg: rowHoverBg }}>
						<Td><Text fontWeight="semibold">{account.firstName} {account.lastName}</Text><Text fontSize="xs" color={muted}>{account.email}</Text></Td>
						<Td>{account._count?.AddedItem ?? 0}</Td>
						<Td><Badge colorScheme={account.verfied ? "green" : "orange"} borderRadius="full">{account.verfied ? copy.verified : copy.notVerified}</Badge></Td>
						<Td>{account.id === currentUserId ? <Badge colorScheme="purple" borderRadius="full" px="3">{copy.adminYou}</Badge> : <Select size="sm" maxW="40" value={account.role} isDisabled={workingId === account.id} onChange={(event) => updateRole(account, event.target.value)} aria-label={copy.changeRoleAria.replace("{email}", account.email)} borderRadius="lg"><option value="USER">{copy.user}</option><option value="ADMIN">{copy.administrator}</option></Select>}</Td>
					</Tr>)}</Tbody>
				</Table>
			</TableContainer>
			{data.total > data.pageSize && <Flex align="center" justify="space-between" direction={{ base: "column", sm: "row" }} gap="3" mt="5"><Button w={{ base: "full", sm: "auto" }} size="sm" variant="outline" isDisabled={page === 0} onClick={() => setPage((value) => Math.max(0, value - 1))}>{copy.previous}</Button><Text color={muted} fontSize="sm">{pageLabel(data.total, data.pageSize)}</Text><Button w={{ base: "full", sm: "auto" }} size="sm" colorScheme="orange" isDisabled={(page + 1) * data.pageSize >= data.total} onClick={() => setPage((value) => value + 1)}>{copy.next}</Button></Flex>}
		</>}
	</Flex>;
}

function QueueCard({ label, count, detail, action, tone, onClick }: { label: string; count: number; detail: string; action: string; tone: string; onClick: () => void }) {
	const muted = useColorModeValue("gray.600", "gray.400");
	const border = useColorModeValue("gray.200", "whiteAlpha.200");
	const background = useColorModeValue("white", "#0c0c0c");
	const inset = useColorModeValue(`${tone}.50`, "whiteAlpha.100");
	return <Box as="button" type="button" className="admin-queue-card" onClick={onClick} textAlign="left" w="full" minW="0" p={{ base: 4, md: 5 }} bg={background} border="1px solid" borderColor={border} borderRadius="2xl" overflow="hidden" position="relative" _focusVisible={{ outline: "3px solid", outlineColor: `${tone}.300`, outlineOffset: "2px" }}>
		<Flex align="flex-start" justify="space-between" gap="3">
			<Box minW="0"><Text color={muted} fontSize="xs" fontWeight="bold" letterSpacing=".1em" textTransform="uppercase">{label}</Text><Heading mt="2" fontSize={{ base: "2xl", md: "3xl" }} lineHeight="1">{count}</Heading></Box>
			<Flex className="admin-queue-orbit" flexShrink="0" w="11" h="11" align="center" justify="center" borderRadius="full" bg={inset} color={`${tone}.500`} fontSize="xl" aria-hidden="true">↗</Flex>
		</Flex>
		<Text mt="3" color={muted} fontSize="sm" lineHeight="1.55" minH={{ sm: "44px" }}>{detail}</Text>
		<Flex className="admin-queue-action" mt="4" align="center" justify="space-between" color={`${tone}.500`} fontSize="sm" fontWeight="bold"><Text>{action}</Text><Text aria-hidden="true">→</Text></Flex>
	</Box>;
}

function StatsBar({ onOpenListings, onOpenPayments }: { onOpenListings: () => void; onOpenPayments: (status: string) => void }) {
	const copy = useLang().adminPage.stats;
	const { locale } = useRouter();
	const numberLocale = locale === "am" ? "am-ET" : "en-US";
	const [data, loading, err] = useFetch({
		fetchFunction: () => axios.get("/api/admin/stat"),
	});
	const surface = useColorModeValue("white", "#0c0c0c");
	const border = useColorModeValue("gray.200", "whiteAlpha.200");
	const statText = useColorModeValue("maingray", "gray.100");
	const labelText = useColorModeValue("gray.500", "gray.400");
	const iconSurface = useColorModeValue("gray.100", "whiteAlpha.100");
	const insetSurface = useColorModeValue("gray.50", "#101012");

	if (loading) {
		return (
			<Flex alignItems={"center"} justifyContent="center" height={"40"}>
				<Spinner></Spinner>
			</Flex>
		);
	}

	if (err) {
		return (
			<Alert variant={"left-accent"} status="error">
				<AlertIcon></AlertIcon>
				<AlertTitle>{copy.loadError}</AlertTitle>
			</Alert>
		);
	}

	if (!data) return null;

	const revenue = (data.revenueByCurrency || []).length
		? data.revenueByCurrency.map((entry) => formatMoney(Number(entry.amount) || 0, entry.currency, numberLocale)).join(" · ")
		: formatMoney(0, "EUR", numberLocale);
	const refundedAmount = (data.refundsByCurrency || []).length
		? data.refundsByCurrency.map((entry) => formatMoney(Number(entry.amount) || 0, entry.currency, numberLocale)).join(" · ")
		: formatMoney(0, "EUR", numberLocale);
	const cards = [
		{ label: copy.registeredAccounts, value: data.users ?? 0, note: copy.members, icon: FaUsers, tone: "blue" },
		{ label: copy.approvedListings, value: data.approvedItems ?? 0, note: copy.listingsInMarket.replace("{count}", String(data.listings ?? 0)), icon: FaBuilding, tone: "teal" },
		{ label: copy.awaitingReview, value: data.waitingItems ?? 0, note: copy.paymentConfirmedReview, icon: FaClock, tone: "orange" },
		{ label: copy.netFees, value: revenue, note: copy.retainedPayments.replace("{count}", String(data.paidPayments ?? 0)), icon: FaCreditCard, tone: "green" },
	];
	const inventory = [
		{ label: copy.homes, value: data.houses ?? 0, icon: FaHome, tone: "cyan" },
		{ label: copy.vehicles, value: data.cars ?? 0, icon: FaCarSide, tone: "purple" },
		{ label: copy.businessSpaces, value: data.businessSpaces ?? 0, icon: FaBuilding, tone: "teal" },
		{ label: copy.services, value: data.services ?? 0, icon: FaTools, tone: "pink" },
	];
	const paymentStates = [
		{ label: copy.confirmed, value: data.paidPayments ?? 0, tone: "green" },
		{ label: copy.refunded, value: data.refundedPayments ?? 0, tone: "purple", note: refundedAmount },
		{ label: copy.refundRequests, value: data.pendingRefundRequests ?? 0, tone: "orange" },
		{ label: copy.inProgress, value: data.initiatedPayments ?? 0, tone: "orange" },
		{ label: copy.failed, value: data.failedPayments ?? 0, tone: "red" },
	];

	return <Flex direction="column" gap={{ base: 4, md: 5 }}>
		<SimpleGrid className="admin-stats-grid" spacing={{ base: 3, lg: 4 }} columns={{ base: 1, sm: 2, xl: 4 }}>
			{cards.map((card) => <Box className="admin-stat-card" key={card.label} position="relative" overflow="hidden" bg={surface} border="1px solid" borderColor={border} borderRadius="xl" p={{ base: 4, md: 5 }} minH="138px" boxShadow="0 4px 18px rgba(20,30,40,.045)" transition="transform .18s ease, box-shadow .18s ease" _hover={{ transform: "translateY(-2px)", boxShadow: "0 10px 24px rgba(20,30,40,.09)" }}>
				<Box position="absolute" insetInline="0" top="0" h="2px" bg={`${card.tone}.400`} />
				<Flex align="flex-start" justify="space-between" gap="3">
					<Box minW="0">
						<Text color={labelText} fontSize="xs" fontWeight="bold" letterSpacing="0.1em" textTransform="uppercase">{card.label}</Text>
						<Heading mt="3" color={statText} fontSize={card.label === copy.netFees ? { base: "xl", md: "2xl" } : { base: "2xl", md: "3xl" }} lineHeight="1.05" noOfLines={1}>{card.value}</Heading>
						<Text mt="2" color={labelText} fontSize="xs" noOfLines={1}>{card.note}</Text>
					</Box>
					<Flex w="10" h="10" flexShrink={0} align="center" justify="center" borderRadius="lg" bg={iconSurface} color={`${card.tone}.500`}><Icon as={card.icon} boxSize="4" /></Flex>
				</Flex>
			</Box>)}
		</SimpleGrid>
		<SimpleGrid className="admin-work-queue" columns={{ base: 1, sm: 3 }} spacing={{ base: 3, md: 4 }}>
			<QueueCard label={copy.listingReview} count={data.waitingItems ?? 0} detail={copy.paidWaiting} action={copy.openReviewQueue} tone="orange" onClick={onOpenListings} />
			<QueueCard label={copy.refundRequests} count={data.pendingRefundRequests ?? 0} detail={copy.refundQueue} action={copy.reviewRefundRequests} tone="purple" onClick={() => onOpenPayments("REFUND_REQUESTED")} />
			<QueueCard label={copy.paymentRecords} count={(data.paidPayments ?? 0) + (data.initiatedPayments ?? 0) + (data.failedPayments ?? 0)} detail={copy.paymentActivity} action={copy.openPaymentRecords} tone="teal" onClick={() => onOpenPayments("ALL")} />
		</SimpleGrid>
		<SimpleGrid columns={{ base: 1, lg: 2 }} spacing={{ base: 4, md: 5 }}>
			<Box className="admin-data-panel" bg={surface} border="1px solid" borderColor={border} borderRadius="xl" p={{ base: 4, md: 5 }} boxShadow="0 4px 18px rgba(20,30,40,.035)">
				<Flex align="center" justify="space-between" mb="2"><Box><Heading size="sm" color={statText}>{copy.inventory}</Heading><Text mt="1" color={labelText} fontSize="xs">{copy.listingsGrouped}</Text></Box><Badge colorScheme="gray" borderRadius="full" px="3">{data.listings ?? 0} {copy.total}</Badge></Flex>
				{inventory.map((entry, index) => <Flex key={entry.label} align="center" gap="3" py="3" borderBottom={index < inventory.length - 1 ? "1px solid" : "none"} borderColor={border}>
					<Flex w="8" h="8" align="center" justify="center" bg={iconSurface} color={`${entry.tone}.500`} borderRadius="lg"><Icon as={entry.icon} boxSize="3.5" /></Flex>
					<Text flex="1" fontSize="sm" color={statText} fontWeight="medium">{entry.label}</Text><Text fontSize="sm" color={statText} fontWeight="bold">{entry.value}</Text>
				</Flex>)}
			</Box>
			<Box className="admin-data-panel" bg={surface} border="1px solid" borderColor={border} borderRadius="xl" p={{ base: 4, md: 5 }} boxShadow="0 4px 18px rgba(20,30,40,.035)">
				<Flex align="center" justify="space-between" mb="4"><Box><Heading size="sm" color={statText}>{copy.paymentHealth}</Heading><Text mt="1" color={labelText} fontSize="xs">{copy.feeTransactions}</Text></Box><Icon as={FaCreditCard} color="mainorange" /></Flex>
				<SimpleGrid columns={{ base: 2, lg: 4 }} spacing="3">
					{paymentStates.map((state) => <Box key={state.label} bg={insetSurface} border="1px solid" borderColor={border} borderRadius="lg" p={{ base: 3, md: 4 }}>
						<Flex align="center" gap="2"><Box w="2" h="2" borderRadius="full" bg={`${state.tone}.400`} /><Text color={labelText} fontSize="xs" fontWeight="semibold">{state.label}</Text></Flex>
						<Heading mt="3" size="md" color={statText}>{state.value}</Heading>
						{state.note && <Text mt="1" color={labelText} fontSize="xs" noOfLines={1}>{state.note}</Text>}
					</Box>)}
				</SimpleGrid>
				<Text mt="4" color={labelText} fontSize="xs" lineHeight="1.6">{copy.confirmedOnly}</Text>
			</Box>
		</SimpleGrid>
	</Flex>;
}
