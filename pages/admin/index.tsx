import { CheckIcon, CloseIcon, Search2Icon } from "@chakra-ui/icons";
import {
	Text,
	Avatar,
	Box,
	Flex,
	Heading,
	Spacer,
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
import { MyTheme } from "@config/theme/MyTheme";
import { useFetch } from "@libs/hooks/useFetch";
import { useUser } from "@libs/store";
import { ListingImage } from "@components/shared/ListingImage";
import axios from "axios";
import Link from "next/link";
import { useRouter } from "next/router";
import { FC, useEffect, useState } from "react";
import { MdLogout } from "react-icons/md";
import {
	FaBuilding,
	FaCarSide,
	FaCheckCircle,
	FaClock,
	FaCreditCard,
	FaHome,
	FaTools,
	FaUsers,
} from "react-icons/fa";
import { dayjs } from "@config/dayjs";
import { withSessionSsr } from "@config/cookie/cookie";
import { getMediaUrl } from "@libs/helpers/media";
import { ColorModeToggle } from "@components/shared/ColorModeToggle";
import { BrandLogo } from "@components/shared/BrandLogo";
import { useLang } from "@libs/hooks/useLang";

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
	const [searchInput, setSearchInput] = useState("");
	const [searchQuery, setSearchQuery] = useState("");
	const [statusFilter, setStatusFilter] = useState("PENDING");
	const [refreshKey, setRefreshKey] = useState(0);
	const [activeSection, setActiveSection] = useState("OVERVIEW");
	const pageBg = useColorModeValue("#f4f6f8", "#000000");
	const surface = useColorModeValue("white", "#0c0c0c");
	const border = useColorModeValue("gray.200", "whiteAlpha.200");
	const textColor = useColorModeValue("maingray", "gray.100");
	const muted = useColorModeValue("gray.600", "gray.400");
	const sectionTitle = { OVERVIEW: "Dashboard overview", LISTINGS: "Listing management", PAYMENTS: "Payment records", USERS: "User accounts" }[activeSection] || "Administration";
	const sectionDescription = {
		OVERVIEW: "A clear snapshot of marketplace activity and listing publication fees.",
		LISTINGS: "Review listing details and publish only after the required fee is confirmed.",
		PAYMENTS: "Search and review the recorded payments for listing publication.",
		USERS: "Find marketplace accounts and manage administrator access.",
	}[activeSection] || "Manage Habesha Brokers marketplace operations.";
	const navHoverBg = useColorModeValue("blackAlpha.50", "whiteAlpha.100");

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
			<Flex direction={"column"} minH="100vh" bg={pageBg}>
				<Flex
					alignItems={"center"}
					px={{ base: 4, md: 8, xl: 12 }}
					minH={MyTheme.size.navbarHeight}
					bg={surface}
					borderBottom="1px solid"
					borderColor={border}
					boxShadow="sm"
				>
					<Flex direction="column" py="3" gap="1">
						<BrandLogo />
						<Heading fontSize="10px" color="mainorange" letterSpacing="0.18em" mt="1" fontWeight="bold">
							ADMIN CONSOLE
						</Heading>
					</Flex>
					<Spacer />
					<Flex align="center" gap={{ base: 2, md: 4 }}>
						<ColorModeToggle />
						<Avatar size="sm" name={user.firstName + " " + user.lastName} src={getMediaUrl(user.profile_url, "profile")} />
						<Flex
							direction="column"
							display={["none", "none", "flex"]}
						>
							<Text fontWeight="semibold" fontSize="sm" color={textColor}>
								{`${user.firstName} ${user.lastName}`}
							</Text>
							<Text fontSize="xs" color={muted}>
								Administrator · {user.email}
							</Text>
						</Flex>
						<IconButton
							onClick={handleLogout}
							ml={{ base: 1, md: 2 }}
							colorScheme="red"
							variant="ghost"
							borderRadius="xl"
							aria-label="Log out"
							icon={<MdLogout />}
						/>
					</Flex>
				</Flex>

				<Flex
					w="full"
					maxW="1480px"
					mx="auto"
					px={{ base: 4, md: 8, xl: 10 }}
					py={{ base: 6, md: 9 }}
					direction={"column"}
				>
					<Flex align={{ base: "flex-start", md: "flex-end" }} justify="space-between" gap="4" mb={{ base: 5, md: 8 }} direction={{ base: "column", sm: "row" }}>
						<Box>
							<Text fontSize="xs" fontWeight="bold" letterSpacing="0.16em" color="mainorange" textTransform="uppercase">Marketplace operations</Text>
							<Heading mt="2" fontSize={{ base: "2xl", md: "3xl" }} color={textColor} letterSpacing="tight" fontWeight="bold">{sectionTitle}</Heading>
							<Text mt="2" color={muted} maxW="2xl" fontSize="sm" lineHeight="1.7">{sectionDescription}</Text>
						</Box>
						<Badge alignSelf={{ base: "flex-start", sm: "flex-end" }} colorScheme="purple" borderRadius="full" px="3" py="1.5" fontSize="xs" textTransform="uppercase" letterSpacing="wide">Administrator access</Badge>
					</Flex>
					<Flex gap={{ base: 1, md: 2 }} overflowX="auto" borderBottom="1px solid" borderColor={border} mb={{ base: 5, md: 7 }} role="tablist" aria-label="Administration sections">
						{[["OVERVIEW", "Overview"], ["LISTINGS", "Listings"], ["PAYMENTS", "Payments"], ["USERS", "Users"]].map(([value, label]) => (
							<Button key={value} role="tab" aria-selected={activeSection === value} flexShrink={0} onClick={() => setActiveSection(value)} variant="ghost" color={activeSection === value ? "mainorange" : muted} borderRadius="0" borderBottom="2px solid" borderColor={activeSection === value ? "mainorange" : "transparent"} px={{ base: 3, md: 5 }} pb="3" mb="-1px" fontWeight={activeSection === value ? "bold" : "medium"} _hover={{ bg: navHoverBg, color: textColor }}>{label}</Button>
						))}
					</Flex>
					{activeSection === "OVERVIEW" && <>
						<StatsBar key={refreshKey} />
						<PaymentsPanel compact refreshKey={refreshKey} />
					</>}
					{activeSection === "LISTINGS" && <Flex direction="column" bg={surface} border="1px solid" borderColor={border} borderRadius="2xl" boxShadow="0 12px 36px rgba(21,42,44,.07)" p={{ base: 4, md: 7 }}>
						<Flex direction={{ base: "column", lg: "row" }} align={{ base: "stretch", lg: "center" }} gap="5" mb="3">
							<Box>
								<Heading size="md" color={textColor}>Listing review</Heading>
								<Text mt="2" color={muted} fontSize="sm" maxW="3xl" lineHeight="1.7">
									Confirm payment and review listing details before publishing. Only paid listings can be approved.
								</Text>
							</Box>
							<Flex flex="1" />
							<FormControl maxW={{ lg: "sm" }}>
								<InputGroup size="md">
								<Input
									value={searchInput}
									onChange={(event) => setSearchInput(event.target.value)}
									onKeyDown={(event) => { if (event.key === "Enter") setSearchQuery(searchInput.trim()); }}
									placeholder="Search by listing ID"
									variant="outline"
									borderRadius="xl"
									bg={pageBg}
									pr="12"
								/>
								<InputRightElement h="full">
									<IconButton onClick={() => setSearchQuery(searchInput.trim())} aria-label="Search listings" colorScheme="orange" variant="ghost" borderRadius="lg" icon={<Search2Icon />} />
								</InputRightElement>
								</InputGroup>
							</FormControl>
						</Flex>
						<ButtonGroup spacing="2" my="5" flexWrap="wrap" role="group" aria-label="Filter listing reviews">
							{[["PAYMENT", "Awaiting payment"], ["PENDING", "Pending review"], ["APPROVED", "Approved"], ["DECLINED", "Declined"]].map(([value, label]) => (
								<Button key={value} size="sm" px="4" h="9" borderRadius="full" colorScheme={statusFilter === value ? "orange" : "gray"} variant={statusFilter === value ? "solid" : "outline"} onClick={() => setStatusFilter(value)}>
									{label}
								</Button>
							))}
						</ButtonGroup>
						<Flex direction="column" borderTop="1px solid" borderColor={border}>
							<ItemsList
								searchQuery={searchQuery}
								statusFilter={statusFilter}
								refreshKey={refreshKey}
								onModerated={() => setRefreshKey((key) => key + 1)}
							/>
						</Flex>
					</Flex>}
					{activeSection === "PAYMENTS" && <PaymentsPanel refreshKey={refreshKey} />}
					{activeSection === "USERS" && <UsersPanel currentUserId={user.id} />}
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
		return <Alert status="error" borderRadius="lg"><AlertIcon /><AlertTitle>Could not load listings</AlertTitle></Alert>;
	}
	if (!data?.items?.length) {
		return <Text py="10" textAlign="center" color={muted}>{searchQuery ? "No listing matches that ID in this status." : `There are no ${statusFilter.toLowerCase()} listings.`}</Text>;
	}
	return <>
		{data.items.map((item) => <ItemCard key={item.id} item={item} onModerated={onModerated} />)}
		{data.total > 30 && <Flex align="center" justify="space-between" gap="3" mt="5" py="3">
			<Button size="sm" variant="outline" isDisabled={page === 0} onClick={() => setPage((current) => Math.max(0, current - 1))}>{pageText.previousPage}</Button>
			<Text color={muted} fontSize="sm">{pageText.pageCounter.replace("{page}", String(page + 1)).replace("{pages}", String(Math.ceil(data.total / 30)))}</Text>
			<Button size="sm" colorScheme="orange" isDisabled={(page + 1) * 30 >= data.total} onClick={() => setPage((current) => current + 1)}>{pageText.nextPage}</Button>
		</Flex>}
	</>;
};

interface ICard {
	item: any;
	onModerated: () => void;
}

const ItemCard: FC<ICard> = ({ item, onModerated }) => {
	const border = useColorModeValue("gray.200", "whiteAlpha.200");
	const surface = useColorModeValue("white", "#0c0c0c");
	const muted = useColorModeValue("gray.600", "gray.400");
	const [working, setWorking] = useState(false);
	const toast = useToast();
	const { id, title, featured, createdAt, itemType, status, paymentStatus } = item;
	const latestPayment = item.ListingPayments?.[0];
	const car = item.Car;
	const subtitle = itemType === "CAR" && car
		? [car.manufacturer, car.model, car.year].filter(Boolean).join(" · ")
		: itemType.replace(/_/g, " ");

	const handleItem = async (newStatus: "APPROVED" | "DECLINED") => {
		if (working || status !== "PENDING") return;
		if (newStatus === "APPROVED" && paymentStatus !== "PAID") {
			toast({ title: "Payment must be confirmed first", description: "A listing enters review after its payment is confirmed.", status: "warning" });
			return;
		}
		setWorking(true);
		try {
			await axios.post("/api/admin/changeItemStatus", { itemId: id, status: newStatus });
			toast({
				title: newStatus === "APPROVED" ? "Listing approved" : "Listing declined",
				description: newStatus === "APPROVED" ? "It is now published in public search." : "The owner can edit it and resubmit it for review.",
				status: newStatus === "APPROVED" ? "success" : "info",
				isClosable: true,
			});
			onModerated();
		} catch (error: any) {
			toast({
				title: "Could not update listing",
				description: error?.response?.data?.err || "Refresh the review queue and try again.",
				status: "error",
				isClosable: true,
			});
		} finally {
			setWorking(false);
		}
	};

	return (
		<Flex align={{ base: "flex-start", lg: "center" }} gap="4" p={{ base: 4, md: 5 }} mt="4" bg={surface} border="1px solid" borderColor={border} borderRadius="xl" boxShadow="sm" transition="box-shadow .2s, border-color .2s" _hover={{ boxShadow: "md", borderColor: "orange.200" }} direction={{ base: "column", lg: "row" }}>
			<Flex align="center" gap="4" minW="0" flex="1">
				<Box flexShrink={0}><ListingImage src={item.images?.[0]} alt={title} itemType={itemType} w="88px" h="72px" borderRadius="lg" /></Box>
				<Box minW="0">
					<Flex align="center" gap="2" wrap="wrap">
						<Heading size="sm" noOfLines={2}>{title}</Heading>
						{featured && <Badge colorScheme="orange">Featured</Badge>}
					</Flex>
					<Text mt="1" fontSize="sm" color={muted}>{subtitle}</Text>
					<Text mt="1" fontSize="xs" color={muted}>Posted {dayjs(createdAt).fromNow()} · ID {id}</Text>
					<Flex mt="2" direction="column" align="flex-start" gap="1">
						<Badge colorScheme={paymentStatus === "PAID" ? "green" : paymentStatus === "PROCESSING" ? "blue" : paymentStatus === "DUE" ? "orange" : "gray"}>
							{paymentStatus === "PAID" ? "Payment verified" : paymentStatus === "PROCESSING" ? "Payment in progress" : paymentStatus === "DUE" ? "Payment due" : "No fee required"}
						</Badge>
						{latestPayment && <Text fontSize="xs" color={muted} noOfLines={1}>{latestPayment.status} · {latestPayment.currency || "EUR"} {Number(latestPayment.amount).toLocaleString("en-US")} · {latestPayment.paymentMethod || "Payment method unavailable"} · Ref {latestPayment.txRef}</Text>}
					</Flex>
				</Box>
			</Flex>
			<Flex align="center" gap="3" wrap="wrap" w={{ base: "full", lg: "auto" }} justify={{ base: "flex-end", lg: "flex-start" }}>
				<Badge colorScheme={status === "APPROVED" ? "green" : status === "DECLINED" ? "red" : status === "SOLD" ? "purple" : "orange"} borderRadius="full" px="3" py="1">{status}</Badge>
				<Link legacyBehavior href={`/items/${id}`} passHref><Button as="a" size="sm" variant="outline">Review details</Button></Link>
				{status === "PENDING" && paymentStatus === "PAID" && (
					<ButtonGroup size="sm">
						<Button colorScheme="green" onClick={() => handleItem("APPROVED")} isLoading={working} leftIcon={<CheckIcon />}>Approve</Button>
						<Button colorScheme="red" variant="outline" onClick={() => handleItem("DECLINED")} isLoading={working} leftIcon={<CloseIcon />}>Decline</Button>
					</ButtonGroup>
				)}
			</Flex>
		</Flex>
	);
};

function formatMoney(amount: number, currency: string) {
	try {
		return new Intl.NumberFormat("en-US", { style: "currency", currency }).format(amount);
	} catch {
		return `${amount.toLocaleString("en-US")} ${currency}`;
	}
}

function PaymentsPanel({ compact = false, refreshKey = 0 }: { compact?: boolean; refreshKey?: number }) {
	const [page, setPage] = useState(0);
	const [status, setStatus] = useState("ALL");
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
	const toast = useToast();
	useEffect(() => setPage(0), [status, query]);

	const handleRefund = async (payment: any) => {
		const amount = formatMoney(Number(payment.amount) || 0, payment.currency || "EUR");
		const checking = payment.refundStatus === "PROCESSING";
		const requested = payment.refundRequestStatus === "PENDING";
		const confirmed = window.confirm(checking
			? `Check or safely resume the pending refund of ${amount} for “${payment.item?.title || "this listing"}”?`
			: requested
				? `Approve this refund request and issue a full refund of ${amount} for “${payment.item?.title || "this listing"}”? If the listing is currently published, it will be unpublished.`
				: `Issue a full refund of ${amount} for “${payment.item?.title || "this listing"}”? If the listing is currently published, it will be unpublished.`);
		if (!confirmed) return;
		setRefundingId(payment.id);
		try {
			const response = await axios.post("/api/admin/refundPayment", { paymentId: payment.id });
			const pending = response.data?.status === "PROCESSING";
			toast({
				title: pending ? "Refund is still processing" : "Full refund completed",
				description: pending ? "Stripe has not confirmed completion yet. The payment will remain marked as processing." : `${amount} was refunded. The listing fee is due again before it can be published.`,
				status: pending ? "warning" : "success",
				isClosable: true,
			});
			setListRefresh((value) => value + 1);
		} catch (requestError: any) {
			toast({ title: "Refund could not be completed", description: requestError?.response?.data?.err || "Review the payment in Stripe before retrying.", status: "error", isClosable: true });
			setListRefresh((value) => value + 1);
		} finally {
			setRefundingId("");
		}
	};

	const handleDeclineRefundRequest = async (payment: any) => {
		const confirmed = window.confirm(`Decline the refund request for “${payment.item?.title || "this listing"}”?`);
		if (!confirmed) return;
		setDecliningId(payment.id);
		try {
			await axios.post("/api/admin/declineRefundRequest", { paymentId: payment.id });
			toast({ title: "Refund request declined", status: "info", isClosable: true });
			setListRefresh((value) => value + 1);
		} catch (requestError: any) {
			toast({ title: "Could not update request", description: requestError?.response?.data?.err || "Review the payment and try again.", status: "error", isClosable: true });
			setListRefresh((value) => value + 1);
		} finally {
			setDecliningId("");
		}
	};

	return <Flex direction="column" bg={surface} border="1px solid" borderColor={border} borderRadius="2xl" boxShadow="0 12px 36px rgba(21,42,44,.07)" p={{ base: 4, md: 7 }} mt={compact ? { base: 5, md: 7 } : 0}>
		<Flex direction={{ base: "column", md: "row" }} align={{ base: "stretch", md: "center" }} gap="4" mb="5">
			<Box flex="1">
				<Heading size="md">{compact ? "Recent listing-fee payments" : "Listing-fee payments"}</Heading>
				<Text mt="1" fontSize="sm" color={muted}>{compact ? "Platform fees recorded for listing publication." : "Review the payment records received for listing publication."}</Text>
			</Box>
			{!compact && <Flex gap="3" direction={{ base: "column", sm: "row" }}>
				<InputGroup maxW={{ sm: "sm" }}>
					<Input value={searchInput} onChange={(event) => setSearchInput(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") setQuery(searchInput.trim()); }} placeholder="Search reference, listing, or email" borderRadius="xl" />
					<InputRightElement><IconButton aria-label="Search payments" variant="ghost" icon={<Search2Icon />} onClick={() => setQuery(searchInput.trim())} /></InputRightElement>
				</InputGroup>
				<Select value={status} onChange={(event) => setStatus(event.target.value)} maxW={{ sm: "48" }} borderRadius="xl" aria-label="Filter payments by status">
					<option value="ALL">All payment states</option><option value="REFUND_REQUESTED">Refund requests</option><option value="PAID">Paid</option><option value="INITIATED">In progress</option><option value="FAILED">Failed</option>
				</Select>
			</Flex>}
		</Flex>
		{loading ? <Flex py="10" justify="center"><Spinner /></Flex> : error ? <Alert status="error" borderRadius="lg"><AlertIcon /><AlertTitle>Could not load payment records</AlertTitle></Alert> : !data?.payments?.length ? <Text py="8" textAlign="center" color={muted}>No listing-fee payment records found.</Text> : <>
			<TableContainer border="1px solid" borderColor={border} borderRadius="xl">
				<Table size="sm" variant="simple" minW={compact ? "760px" : "900px"} sx={{ "th": { bg: tableHead, color: muted, fontSize: "10px", letterSpacing: "0.1em", textTransform: "uppercase", borderColor: border, py: 3 }, "td": { borderColor: border, py: 3 } }}>
					<Thead><Tr><Th>Payment</Th><Th>Listing</Th><Th display={{ base: "none", md: "table-cell" }}>Account</Th><Th>Amount</Th><Th>Status</Th><Th display={{ base: "none", lg: "table-cell" }}>Recorded</Th>{!compact && <Th>Action</Th>}</Tr></Thead>
					<Tbody>{(compact ? data.payments.slice(0, 6) : data.payments).map((payment) => <Tr key={payment.id} _hover={{ bg: rowHoverBg }}>
						<Td><Text fontWeight="semibold" noOfLines={1}>{payment.paymentMethod || "Payment"}</Text><Text fontSize="xs" color={muted} noOfLines={1}>{payment.txRef}</Text>{payment.refundRef && <Text fontSize="xs" color={muted} noOfLines={1}>Refund {payment.refundRef}</Text>}</Td>
						<Td><Text fontWeight="medium" noOfLines={1}>{payment.item?.title || "Listing removed"}</Text><Text fontSize="xs" color={muted}>{payment.item?.itemType?.replace(/_/g, " ") || "—"}</Text>{payment.refundRequestStatus === "PENDING" && <><Badge mt="1" colorScheme="orange" borderRadius="full">REFUND REQUEST PENDING</Badge>{payment.refundRequestReason && <Text mt="1" fontSize="xs" color={muted} noOfLines={3}>{payment.refundRequestReason}</Text>}</>}</Td>
						<Td display={{ base: "none", md: "table-cell" }}><Text noOfLines={1}>{payment.item?.user?.email || "—"}</Text></Td>
						<Td whiteSpace="nowrap" fontWeight="semibold">{formatMoney(Number(payment.amount) || 0, payment.currency || "EUR")}</Td>
						<Td><Flex direction="column" align="flex-start" gap="1"><Badge borderRadius="full" colorScheme={payment.status === "PAID" ? "green" : payment.status === "FAILED" ? "red" : "orange"}>{payment.status === "INITIATED" ? "IN PROGRESS" : payment.status}</Badge>{payment.refundRequestStatus === "APPROVED" && <Badge borderRadius="full" colorScheme="green">REQUEST APPROVED</Badge>}{payment.refundRequestStatus === "DECLINED" && <Badge borderRadius="full" colorScheme="red">REQUEST DECLINED</Badge>}{payment.refundStatus === "REFUNDED" && <><Badge borderRadius="full" colorScheme="purple">REFUNDED</Badge><Text fontSize="xs" color={muted}>{payment.refundedAt ? dayjs(payment.refundedAt).format("MMM D, YYYY · HH:mm") : "Refund completed"}</Text></>}{payment.refundStatus === "PROCESSING" && <Badge borderRadius="full" colorScheme="orange">REFUND PROCESSING</Badge>}</Flex></Td>
						<Td display={{ base: "none", lg: "table-cell" }} color={muted} whiteSpace="nowrap">{dayjs(payment.verifiedAt || payment.createdAt).format("MMM D, YYYY · HH:mm")}</Td>
						{!compact && <Td><Flex direction="column" align="flex-start" gap="2">{payment.refundRequestStatus === "PENDING" && payment.refundStatus === "NOT_REFUNDED" && <Button size="xs" variant="ghost" colorScheme="gray" borderRadius="lg" isLoading={decliningId === payment.id} isDisabled={Boolean((decliningId && decliningId !== payment.id) || (refundingId && refundingId !== payment.id))} onClick={() => handleDeclineRefundRequest(payment)}>Decline request</Button>}{payment.status === "PAID" && payment.refundStatus !== "REFUNDED" && payment.txRef?.startsWith("HB-STRIPE-") && payment.providerRef?.startsWith("cs_test_") ? <Button size="xs" variant="outline" colorScheme="red" borderRadius="lg" isLoading={refundingId === payment.id} isDisabled={Boolean((refundingId && refundingId !== payment.id) || (decliningId && decliningId !== payment.id)) || (payment.refundStatus === "PROCESSING" && payment.refundStartedAt && dayjs(payment.refundStartedAt).isAfter(dayjs().subtract(2, "minute")))} onClick={() => handleRefund(payment)}>{payment.refundStatus === "PROCESSING" ? "Check refund" : payment.refundRequestStatus === "PENDING" ? "Approve & refund" : "Full refund"}</Button> : payment.refundStatus === "REFUNDED" ? <Text fontSize="xs" color={muted}>Completed</Text> : <Text fontSize="xs" color={muted}>Unavailable</Text>}</Flex></Td>}
					</Tr>)}</Tbody>
				</Table>
			</TableContainer>
			{!compact && data.total > data.pageSize && <Flex align="center" justify="space-between" gap="3" mt="5">
				<Button size="sm" variant="outline" isDisabled={page === 0} onClick={() => setPage((current) => Math.max(0, current - 1))}>Previous</Button>
				<Text color={muted} fontSize="sm">Page {page + 1} of {Math.ceil(data.total / data.pageSize)}</Text>
				<Button size="sm" colorScheme="orange" isDisabled={(page + 1) * data.pageSize >= data.total} onClick={() => setPage((current) => current + 1)}>Next</Button>
			</Flex>}
		</>}
	</Flex>;
}

function UsersPanel({ currentUserId }: { currentUserId: string }) {
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
	useEffect(() => setPage(0), [role, query]);

	const updateRole = async (target: any, newRole: string) => {
		if (newRole === "ADMIN" && !window.confirm(`Give administrator access to ${target.email}? Administrators can manage all listings and accounts.`)) {
			setRefreshKey((value) => value + 1);
			return;
		}
		setWorkingId(target.id);
		try {
			await axios.post("/api/admin/changeUserRole", { userId: target.id, role: newRole });
			toast({ title: "Account role updated", status: "success", isClosable: true });
			setRefreshKey((value) => value + 1);
		} catch (requestError: any) {
			toast({ title: "Could not update role", description: requestError?.response?.data?.err || "Refresh the account list and try again.", status: "error", isClosable: true });
			setRefreshKey((value) => value + 1);
		} finally {
			setWorkingId("");
		}
	};

	return <Flex direction="column" bg={surface} border="1px solid" borderColor={border} borderRadius="2xl" boxShadow="0 12px 36px rgba(21,42,44,.07)" p={{ base: 4, md: 7 }}>
		<Flex direction={{ base: "column", md: "row" }} align={{ base: "stretch", md: "center" }} gap="4" mb="5">
			<Box flex="1"><Heading size="md">User accounts</Heading><Text mt="1" fontSize="sm" color={muted}>Search accounts, check email verification, and manage administrator access.</Text></Box>
			<Flex gap="3" direction={{ base: "column", sm: "row" }}>
				<InputGroup maxW={{ sm: "sm" }}><Input value={searchInput} onChange={(event) => setSearchInput(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") setQuery(searchInput.trim()); }} placeholder="Search name or email" borderRadius="xl" /><InputRightElement><IconButton aria-label="Search accounts" variant="ghost" icon={<Search2Icon />} onClick={() => setQuery(searchInput.trim())} /></InputRightElement></InputGroup>
				<Select value={role} onChange={(event) => setRole(event.target.value)} maxW={{ sm: "44" }} borderRadius="xl" aria-label="Filter accounts by role"><option value="ALL">All roles</option><option value="USER">Users</option><option value="ADMIN">Administrators</option></Select>
			</Flex>
		</Flex>
		{loading ? <Flex py="10" justify="center"><Spinner /></Flex> : error ? <Alert status="error" borderRadius="lg"><AlertIcon /><AlertTitle>Could not load accounts</AlertTitle></Alert> : !data?.users?.length ? <Text py="8" textAlign="center" color={muted}>No matching accounts found.</Text> : <>
			<TableContainer border="1px solid" borderColor={border} borderRadius="xl">
				<Table size="sm" variant="simple" minW="680px" sx={{ "th": { bg: tableHead, color: muted, fontSize: "10px", letterSpacing: "0.1em", textTransform: "uppercase", borderColor: border, py: 3 }, "td": { borderColor: border, py: 3 } }}>
					<Thead><Tr><Th>Account</Th><Th>Listings</Th><Th>Email status</Th><Th>Account access</Th></Tr></Thead>
					<Tbody>{data.users.map((account) => <Tr key={account.id} _hover={{ bg: rowHoverBg }}>
						<Td><Text fontWeight="semibold">{account.firstName} {account.lastName}</Text><Text fontSize="xs" color={muted}>{account.email}</Text></Td>
						<Td>{account._count?.AddedItem ?? 0}</Td>
						<Td><Badge colorScheme={account.verfied ? "green" : "orange"} borderRadius="full">{account.verfied ? "Verified" : "Not verified"}</Badge></Td>
						<Td>{account.id === currentUserId ? <Badge colorScheme="purple" borderRadius="full" px="3">Administrator · you</Badge> : <Select size="sm" maxW="40" value={account.role} isDisabled={workingId === account.id} onChange={(event) => updateRole(account, event.target.value)} aria-label={`Change role for ${account.email}`} borderRadius="lg"><option value="USER">User</option><option value="ADMIN">Administrator</option></Select>}</Td>
					</Tr>)}</Tbody>
				</Table>
			</TableContainer>
			{data.total > data.pageSize && <Flex align="center" justify="space-between" gap="3" mt="5"><Button size="sm" variant="outline" isDisabled={page === 0} onClick={() => setPage((value) => Math.max(0, value - 1))}>Previous</Button><Text color={muted} fontSize="sm">Page {page + 1} of {Math.ceil(data.total / data.pageSize)}</Text><Button size="sm" colorScheme="orange" isDisabled={(page + 1) * data.pageSize >= data.total} onClick={() => setPage((value) => value + 1)}>Next</Button></Flex>}
		</>}
	</Flex>;
}

function StatsBar() {
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
				<AlertTitle>Error Loading Stats</AlertTitle>
			</Alert>
		);
	}

	if (!data) return null;

	const revenue = (data.revenueByCurrency || []).length
		? data.revenueByCurrency.map((entry) => formatMoney(Number(entry.amount) || 0, entry.currency)).join(" · ")
		: formatMoney(0, "EUR");
	const refundedAmount = (data.refundsByCurrency || []).length
		? data.refundsByCurrency.map((entry) => formatMoney(Number(entry.amount) || 0, entry.currency)).join(" · ")
		: formatMoney(0, "EUR");
	const cards = [
		{ label: "Registered accounts", value: data.users ?? 0, note: "Marketplace members", icon: FaUsers, tone: "blue" },
		{ label: "Approved listings", value: data.approvedItems ?? 0, note: `${data.listings ?? 0} listings in the marketplace`, icon: FaBuilding, tone: "teal" },
		{ label: "Awaiting review", value: data.waitingItems ?? 0, note: "Payment confirmed · review required", icon: FaClock, tone: "orange" },
		{ label: "Net fees collected", value: revenue, note: `${data.paidPayments ?? 0} retained listing payments`, icon: FaCreditCard, tone: "green" },
	];
	const inventory = [
		{ label: "Homes", value: data.houses ?? 0, icon: FaHome, tone: "cyan" },
		{ label: "Vehicles", value: data.cars ?? 0, icon: FaCarSide, tone: "purple" },
		{ label: "Business spaces", value: data.businessSpaces ?? 0, icon: FaBuilding, tone: "teal" },
		{ label: "Services", value: data.services ?? 0, icon: FaTools, tone: "pink" },
	];
	const paymentStates = [
		{ label: "Confirmed", value: data.paidPayments ?? 0, tone: "green" },
		{ label: "Refunded", value: data.refundedPayments ?? 0, tone: "purple", note: refundedAmount },
		{ label: "Refund requests", value: data.pendingRefundRequests ?? 0, tone: "orange" },
		{ label: "In progress", value: data.initiatedPayments ?? 0, tone: "orange" },
		{ label: "Failed", value: data.failedPayments ?? 0, tone: "red" },
	];

	return <Flex direction="column" gap={{ base: 4, md: 5 }}>
		<SimpleGrid spacing={{ base: 3, lg: 4 }} columns={{ base: 1, sm: 2, xl: 4 }}>
			{cards.map((card) => <Box key={card.label} position="relative" overflow="hidden" bg={surface} border="1px solid" borderColor={border} borderRadius="xl" p={{ base: 4, md: 5 }} minH="138px" boxShadow="0 4px 18px rgba(20,30,40,.045)" transition="transform .18s ease, box-shadow .18s ease" _hover={{ transform: "translateY(-2px)", boxShadow: "0 10px 24px rgba(20,30,40,.09)" }}>
				<Box position="absolute" insetInline="0" top="0" h="2px" bg={`${card.tone}.400`} />
				<Flex align="flex-start" justify="space-between" gap="3">
					<Box minW="0">
						<Text color={labelText} fontSize="xs" fontWeight="bold" letterSpacing="0.1em" textTransform="uppercase">{card.label}</Text>
						<Heading mt="3" color={statText} fontSize={card.label === "Fees collected" ? { base: "xl", md: "2xl" } : { base: "2xl", md: "3xl" }} lineHeight="1.05" noOfLines={1}>{card.value}</Heading>
						<Text mt="2" color={labelText} fontSize="xs" noOfLines={1}>{card.note}</Text>
					</Box>
					<Flex w="10" h="10" flexShrink={0} align="center" justify="center" borderRadius="lg" bg={iconSurface} color={`${card.tone}.500`}><Icon as={card.icon} boxSize="4" /></Flex>
				</Flex>
			</Box>)}
		</SimpleGrid>
		<SimpleGrid columns={{ base: 1, lg: 2 }} spacing={{ base: 4, md: 5 }}>
			<Box bg={surface} border="1px solid" borderColor={border} borderRadius="xl" p={{ base: 4, md: 5 }} boxShadow="0 4px 18px rgba(20,30,40,.035)">
				<Flex align="center" justify="space-between" mb="2"><Box><Heading size="sm" color={statText}>Marketplace inventory</Heading><Text mt="1" color={labelText} fontSize="xs">Listings grouped by category</Text></Box><Badge colorScheme="gray" borderRadius="full" px="3">{data.listings ?? 0} total</Badge></Flex>
				{inventory.map((entry, index) => <Flex key={entry.label} align="center" gap="3" py="3" borderBottom={index < inventory.length - 1 ? "1px solid" : "none"} borderColor={border}>
					<Flex w="8" h="8" align="center" justify="center" bg={iconSurface} color={`${entry.tone}.500`} borderRadius="lg"><Icon as={entry.icon} boxSize="3.5" /></Flex>
					<Text flex="1" fontSize="sm" color={statText} fontWeight="medium">{entry.label}</Text><Text fontSize="sm" color={statText} fontWeight="bold">{entry.value}</Text>
				</Flex>)}
			</Box>
			<Box bg={surface} border="1px solid" borderColor={border} borderRadius="xl" p={{ base: 4, md: 5 }} boxShadow="0 4px 18px rgba(20,30,40,.035)">
				<Flex align="center" justify="space-between" mb="4"><Box><Heading size="sm" color={statText}>Payment health</Heading><Text mt="1" color={labelText} fontSize="xs">Listing publication fee transactions</Text></Box><Icon as={FaCreditCard} color="mainorange" /></Flex>
				<SimpleGrid columns={{ base: 2, lg: 4 }} spacing="3">
					{paymentStates.map((state) => <Box key={state.label} bg={insetSurface} border="1px solid" borderColor={border} borderRadius="lg" p={{ base: 3, md: 4 }}>
						<Flex align="center" gap="2"><Box w="2" h="2" borderRadius="full" bg={`${state.tone}.400`} /><Text color={labelText} fontSize="xs" fontWeight="semibold">{state.label}</Text></Flex>
						<Heading mt="3" size="md" color={statText}>{state.value}</Heading>
						{state.note && <Text mt="1" color={labelText} fontSize="xs" noOfLines={1}>{state.note}</Text>}
					</Box>)}
				</SimpleGrid>
				<Text mt="4" color={labelText} fontSize="xs" lineHeight="1.6">Only confirmed listing publication fees are included in the total.</Text>
			</Box>
		</SimpleGrid>
	</Flex>;
}
