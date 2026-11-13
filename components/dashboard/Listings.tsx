import { Alert, AlertDescription, AlertIcon, AlertTitle, Badge, Box, Button, Flex, Grid, Heading, Modal, ModalBody, ModalCloseButton, ModalContent, ModalFooter, ModalHeader, ModalOverlay, Skeleton, Text, Textarea, useColorModeValue, useDisclosure, useToast } from "@chakra-ui/react";
import { ListingImage } from "@components/shared/ListingImage";
import { useFetch } from "@libs/hooks/useFetch";
import { useListingCheckout } from "@libs/hooks/useListingCheckout";
import { useLang } from "@libs/hooks/useLang";
import { IUser } from "@libs/types/user";
import Link from "next/link";
import { FC, useEffect, useState } from "react";
import axios from "axios";
import { useRouter } from "next/router";
import { MdAdd } from "react-icons/md";

export interface IItem {
	id: string;
	title: string;
	photoURL: string;
	status?: string;
	paymentStatus?: string;
	paymentFee?: number;
	paymentEnabled?: boolean;
	listingPayment?: any;
	itemType: string;
	listingIntent?: string;
	canManage?: boolean;
}

export const Item: FC<IItem> = ({ id, title, photoURL, itemType, status, paymentStatus, paymentFee, paymentEnabled, listingPayment, listingIntent, canManage = true }) => {
	const router = useRouter();
	const lang = useLang();
	const copy = lang.listingManagementPage;
	const paymentLabels = lang.payments;
	const { startCheckout, isLoading } = useListingCheckout(id, paymentLabels);
	const { isOpen, onOpen, onClose } = useDisclosure();
	const soldDisclosure = useDisclosure();
	const rentedDisclosure = useDisclosure();
	const toast = useToast();
	const [paymentRecord, setPaymentRecord] = useState(listingPayment);
	const [refundReason, setRefundReason] = useState("");
	const [requestingRefund, setRequestingRefund] = useState(false);
	const [updatingListingStatus, setUpdatingListingStatus] = useState(false);
	useEffect(() => setPaymentRecord(listingPayment), [listingPayment]);
	const surface = useColorModeValue("#ffffff", "#101415");
	const border = useColorModeValue("#dce3e1", "whiteAlpha.200");
	const headingColor = useColorModeValue("#3b2b22", "#eef2f1");
	const muted = useColorModeValue("#637278", "#a5b1b4");
	const imageFallback = useColorModeValue("#e7ecea", "#151b1c");
	const divider = useColorModeValue("#e7ecea", "whiteAlpha.200");
	const paymentSurface = useColorModeValue("#f7f5f0", "rgba(255,255,255,.035)");
	const hoverBorder = useColorModeValue("#c8d4d1", "whiteAlpha.300");
	const inputBg = useColorModeValue("#ffffff", "#080b0c");
	const isRentalListing = (itemType === "HOUSE" || itemType === "BUSINESS_SPACE") && listingIntent === "RENT";
	const statusColor = status === "CLOSED" ? "#aeb7b9" : status === "SOLD" || status === "RENTED" ? "#cdb0ea" : paymentStatus === "DUE" || paymentStatus === "NOT_REQUIRED" ? "#f0c58a" : paymentStatus === "PROCESSING" ? "#9ec7ee" : status === "APPROVED" ? "#a4e0b6" : status === "DECLINED" ? "#efaca5" : "#f0c58a";
	const statusLabel = status === "CLOSED" ? copy.closed : status === "SOLD" ? copy.sold : status === "RENTED" ? copy.rented : paymentStatus === "DUE" || paymentStatus === "NOT_REQUIRED" ? copy.paymentDue : paymentStatus === "PROCESSING" ? copy.paymentProcessing : paymentStatus === "PAID" && status === "PENDING" ? copy.paidPending : status === "APPROVED" ? copy.available : status === "DECLINED" ? copy.declined : copy.pending;
	const canMarkSold = itemType === "CAR" || (itemType === "HOUSE" || itemType === "BUSINESS_SPACE") && listingIntent === "FORSALE";
	const needsPayment = canManage && typeof paymentFee === "number" && status !== "APPROVED" && status !== "SOLD" && status !== "RENTED" && status !== "CLOSED" && paymentStatus !== "PAID";
	const eligibleForRefundRequest = paymentRecord?.status === "PAID" && paymentRecord?.refundStatus === "NOT_REFUNDED" && paymentRecord?.txRef?.startsWith("HB-STRIPE-") && paymentRecord?.providerRef?.startsWith("cs_test_");
	const canRequestRefund = canManage && eligibleForRefundRequest && !["PENDING", "APPROVED"].includes(paymentRecord?.refundRequestStatus);
	const refundNotice = paymentRecord?.refundStatus === "REFUNDED"
		? copy.refundCompleted
		: paymentRecord?.refundStatus === "PROCESSING"
			? copy.refundProcessing
			: paymentRecord?.refundRequestStatus === "PENDING"
				? copy.refundRequestPending
				: paymentRecord?.refundRequestStatus === "APPROVED"
					? copy.refundRequestApproved
					: paymentRecord?.refundRequestStatus === "DECLINED"
						? copy.refundRequestDeclined
						: "";

	const updateListingStatus = async () => {
		setUpdatingListingStatus(true);
		const action = status === "CLOSED" ? "reopen" : "close";
		try {
			await axios.post("/api/items/close", { itemId: id, action });
			toast({ title: action === "close" ? copy.listingClosed : copy.listingReopened, description: action === "close" ? copy.listingClosedHelp : copy.listingReopenedHelp, status: "success", isClosable: true });
			router.reload();
		} catch (statusError: any) {
			toast({ title: copy.listingStatusFailed, description: statusError?.response?.data?.err || copy.refundRequestTryAgain, status: "error", isClosable: true });
		} finally { setUpdatingListingStatus(false); }
	};

	const markListingSold = async () => {
		setUpdatingListingStatus(true);
		try {
			await axios.post("/api/items/close", { itemId: id, action: "sold" });
			soldDisclosure.onClose();
			toast({ title: copy.listingMarkedSold, description: copy.listingMarkedSoldHelp, status: "success", isClosable: true });
			router.reload();
		} catch (statusError: any) {
			toast({ title: copy.listingStatusFailed, description: statusError?.response?.data?.err || copy.refundRequestTryAgain, status: "error", isClosable: true });
		} finally { setUpdatingListingStatus(false); }
	};

	const markRentalRented = async () => {
		setUpdatingListingStatus(true);
		try {
			await axios.post("/api/items/close", { itemId: id, action: "rented" });
			rentedDisclosure.onClose();
			toast({ title: copy.listingMarkedRented, description: copy.listingMarkedRentedHelp, status: "success", isClosable: true });
			router.reload();
		} catch (statusError: any) {
			toast({ title: copy.listingStatusFailed, description: statusError?.response?.data?.err || copy.refundRequestTryAgain, status: "error", isClosable: true });
		} finally { setUpdatingListingStatus(false); }
	};

	const markRentalAvailable = async () => {
		setUpdatingListingStatus(true);
		try {
			await axios.post("/api/items/close", { itemId: id, action: "available" });
			toast({ title: copy.listingMarkedAvailable, description: copy.listingMarkedAvailableHelp, status: "success", isClosable: true });
			router.reload();
		} catch (statusError: any) {
			toast({ title: copy.listingStatusFailed, description: statusError?.response?.data?.err || copy.refundRequestTryAgain, status: "error", isClosable: true });
		} finally { setUpdatingListingStatus(false); }
	};

	const submitRefundRequest = async () => {
		if (!paymentRecord?.id || refundReason.trim().length < 10) return;
		setRequestingRefund(true);
		try {
			const response = await axios.post("/api/user/requestRefund", { paymentId: paymentRecord.id, reason: refundReason.trim() });
			setPaymentRecord((current: any) => ({ ...current, refundRequestStatus: response.data?.status || "PENDING", refundRequestedAt: response.data?.requestedAt || new Date().toISOString(), refundRequestReason: refundReason.trim() }));
			setRefundReason("");
			onClose();
			toast({ title: copy.refundRequestSent, description: copy.refundRequestSentHelp, status: "success", isClosable: true });
		} catch (requestError: any) {
			toast({ title: copy.refundRequestFailed, description: requestError?.response?.data?.err || copy.refundRequestTryAgain, status: "error", isClosable: true });
		} finally {
			setRequestingRefund(false);
		}
	};

	return (
		<Flex className="dashboard-listing-card" direction="column" alignSelf="start" minW="0" bg={surface} border="1px solid" borderColor={border} borderRadius="3xl" overflow="hidden" boxShadow="0 10px 28px rgba(21,42,44,.07)" transition="transform 320ms cubic-bezier(.2,.8,.2,1), box-shadow 320ms ease, border-color 320ms ease" _hover={{ boxShadow: "0 18px 40px rgba(16,47,55,.13)", transform: "translateY(-8px) scale(1.012)", borderColor: hoverBorder }}>
			<Link legacyBehavior href={"/items/" + id} passHref>
				<Flex as="a" role="group" direction="column" minW="0" cursor="pointer" textDecoration="none" _focusVisible={{ outline: "3px solid #E9B75C", outlineOffset: "-3px" }}>
					<Box className="dashboard-listing-image" position="relative" h={{ base: "205px", md: "235px" }} flexShrink={0} bg={imageFallback} overflow="hidden">
						<ListingImage src={photoURL} alt={title} itemType={itemType} fill />
						<Flex position="absolute" top="4" left="4" zIndex="3" align="center" gap="2" maxW="calc(100% - 2rem)" px="3" py="1.5" bg="rgba(14,22,24,.84)" color="#fff" border="1px solid" borderColor="whiteAlpha.300" borderRadius="full" boxShadow="0 6px 18px rgba(0,0,0,.2)" fontSize="xs" fontWeight="bold" lineHeight="1.2">
							<Box as="span" flexShrink={0} w="2" h="2" bg={statusColor} borderRadius="full" />
							{statusLabel}
						</Flex>
					</Box>
					<Box p={{ base: 4, md: 5 }}>
						<Heading size="md" color={headingColor} noOfLines={2} lineHeight="1.35" letterSpacing="-.035em">{title}</Heading>
					</Box>
				</Flex>
			</Link>
			{needsPayment && (
				<Flex direction="column" gap="2" p={{ base: 4, md: 5 }} pt="4" borderTop="1px solid" borderColor={divider} bg={paymentSurface}>
					<Button w="full" size="sm" h="10" px="4" colorScheme="orange" borderRadius="lg" onClick={startCheckout} isLoading={isLoading} isDisabled={!paymentEnabled || isLoading}>
						{paymentStatus === "PROCESSING" ? paymentLabels.continueCheckout : paymentLabels.payButton}
					</Button>
					{!paymentEnabled && <Text fontSize="xs" color={muted}>{paymentLabels.notConfigured}</Text>}
				</Flex>
			)}
			{canManage && paymentRecord?.status === "PAID" && refundNotice && (
				<Flex direction="column" gap="2" px={{ base: 4, md: 5 }} pb="4" bg={surface}>
					<Flex align="center" justify="space-between" gap="3" wrap="wrap" p="3" border="1px solid" borderColor={border} borderRadius="lg">
						<Flex align="center" gap="2" minW="0">
							<Badge flexShrink={0} colorScheme={paymentRecord.refundStatus === "REFUNDED" ? "purple" : paymentRecord.refundRequestStatus === "DECLINED" ? "red" : "orange"} borderRadius="full">{paymentRecord.refundStatus === "REFUNDED" ? copy.refundCompletedLabel : paymentRecord.refundStatus === "PROCESSING" ? copy.refundProcessingLabel : paymentRecord.refundRequestStatus === "DECLINED" ? copy.refundDeclinedLabel : copy.refundRequestStatusLabel}</Badge>
							<Text fontSize="xs" color={muted}>{refundNotice}</Text>
						</Flex>
						{canRequestRefund && <Button size="xs" variant="outline" colorScheme="orange" borderRadius="lg" onClick={onOpen}>{paymentRecord.refundRequestStatus === "DECLINED" ? copy.requestRefundAgain : copy.requestRefund}</Button>}
					</Flex>
				</Flex>
			)}
			{canManage && (status === "APPROVED" || status === "CLOSED" || status === "RENTED") && <Flex gap="2" wrap="wrap" px={{ base: 4, md: 5 }} py="4" borderTop="1px solid" borderColor={divider}>
					{status === "APPROVED" && canMarkSold && <Button size="sm" variant="outline" colorScheme="purple" onClick={soldDisclosure.onOpen} isLoading={updatingListingStatus} borderRadius="lg">{copy.markAsSold}</Button>}
					{status === "APPROVED" && isRentalListing && <Button size="sm" variant="outline" colorScheme="purple" onClick={rentedDisclosure.onOpen} isLoading={updatingListingStatus} borderRadius="lg">{copy.markAsRented}</Button>}
					{status === "RENTED" && <Button size="sm" colorScheme="green" onClick={markRentalAvailable} isLoading={updatingListingStatus} borderRadius="lg">{copy.markAsAvailable}</Button>}
					{status !== "RENTED" && <Button size="sm" variant={status === "CLOSED" ? "solid" : "outline"} colorScheme={status === "CLOSED" ? "green" : "gray"} onClick={updateListingStatus} isLoading={updatingListingStatus} borderRadius="lg">{status === "CLOSED" ? copy.reopenListing : copy.closeListing}</Button>}
			</Flex>}
			<Modal isOpen={soldDisclosure.isOpen} onClose={() => { if (!updatingListingStatus) soldDisclosure.onClose(); }} isCentered size="md">
				<ModalOverlay />
				<ModalContent bg={surface} border="1px solid" borderColor={border} borderRadius="2xl">
					<ModalHeader color={headingColor}>{copy.markSoldConfirmationTitle}</ModalHeader>
					<ModalCloseButton isDisabled={updatingListingStatus} />
					<ModalBody><Text color={muted}>{copy.markSoldConfirmationDescription}</Text></ModalBody>
					<ModalFooter gap="3">
						<Button variant="ghost" borderRadius="lg" onClick={soldDisclosure.onClose} isDisabled={updatingListingStatus}>{copy.cancel}</Button>
						<Button colorScheme="purple" borderRadius="lg" onClick={markListingSold} isLoading={updatingListingStatus}>{copy.confirmMarkSold}</Button>
					</ModalFooter>
				</ModalContent>
			</Modal>
			<Modal isOpen={rentedDisclosure.isOpen} onClose={() => { if (!updatingListingStatus) rentedDisclosure.onClose(); }} isCentered size="md">
				<ModalOverlay />
				<ModalContent bg={surface} border="1px solid" borderColor={border} borderRadius="2xl">
					<ModalHeader color={headingColor}>{copy.rentedConfirmationTitle}</ModalHeader>
					<ModalCloseButton isDisabled={updatingListingStatus} />
					<ModalBody><Text color={muted}>{copy.rentedConfirmationDescription}</Text></ModalBody>
					<ModalFooter gap="3">
						<Button variant="ghost" borderRadius="lg" onClick={rentedDisclosure.onClose} isDisabled={updatingListingStatus}>{copy.cancel}</Button>
						<Button colorScheme="purple" borderRadius="lg" onClick={markRentalRented} isLoading={updatingListingStatus}>{copy.confirmMarkRented}</Button>
					</ModalFooter>
				</ModalContent>
			</Modal>
			<Modal isOpen={isOpen} onClose={() => { if (!requestingRefund) onClose(); }} isCentered size="lg">
				<ModalOverlay />
				<ModalContent bg={surface} border="1px solid" borderColor={border} borderRadius="2xl">
					<ModalHeader color={headingColor}>{copy.refundRequestTitle}</ModalHeader>
					<ModalCloseButton isDisabled={requestingRefund} />
					<ModalBody>
						<Text mb="4" color={muted} fontSize="sm">{copy.refundRequestDescription}</Text>
						<Textarea value={refundReason} onChange={(event) => setRefundReason(event.target.value.slice(0, 1000))} placeholder={copy.refundReasonPlaceholder} minH="140px" resize="vertical" maxLength={1000} borderRadius="xl" bg={inputBg} borderColor={border} _placeholder={{ color: muted }} _hover={{ borderColor: "orange.400" }} _focusVisible={{ borderColor: "orange.400", boxShadow: "0 0 0 1px var(--chakra-colors-orange-400)" }} />
						<Text mt="2" fontSize="xs" color={muted}>{refundReason.trim().length}/1000</Text>
					</ModalBody>
					<ModalFooter gap="3">
						<Button variant="ghost" borderRadius="lg" onClick={onClose} isDisabled={requestingRefund}>{copy.cancel}</Button>
						<Button colorScheme="orange" borderRadius="lg" onClick={submitRefundRequest} isLoading={requestingRefund} isDisabled={refundReason.trim().length < 10}>{copy.submitRefundRequest}</Button>
					</ModalFooter>
				</ModalContent>
			</Modal>
		</Flex>
	);
};

export const ItemLoader = () => (
	<Flex className="dashboard-listing-card" direction="column" h="full" minH="300px" border="1px solid" borderColor={useColorModeValue("gray.200", "whiteAlpha.200")} borderRadius="2xl" overflow="hidden" bg={useColorModeValue("white", "#0c0c0c")}>
		<Skeleton h={{ base: "205px", md: "235px" }} borderRadius="0" />
		<Box p={{ base: 4, md: 5 }}><Skeleton h="5" w="70%" /></Box>
	</Flex>
);

interface IItemsList {
	user: IUser;
	paymentFee: number;
	paymentEnabled: boolean;
	filters: string[];
	keyword: string;
	orderBy: any;
	copy: any;
}

export const ItemList: FC<IItemsList> = ({ user, paymentFee, paymentEnabled, filters, keyword = "", orderBy, copy }) => {
	const [page, setPage] = useState(0);
	const pageText = useLang().explore;
	const filterKey = filters.join("|");
	const sortKey = JSON.stringify(orderBy);
	const muted = useColorModeValue("gray.500", "gray.400");
	const surface = useColorModeValue("white", "#0c0c0c");
	const border = useColorModeValue("gray.200", "whiteAlpha.200");
	const heading = useColorModeValue("maingray", "gray.100");
	const emptyIconBg = useColorModeValue("orange.50", "rgba(233,183,92,.14)");
	const emptyIconColor = useColorModeValue("orange.700", "orange.200");
	useEffect(() => setPage(0), [filterKey, keyword, sortKey]);
	const [data, loading, error] = useFetch({
		fetchFunction: () => axios.post(`/api/items?page=${page}`, {
			orderBy,
			keyword,
			userId: user.id,
			itemType: { in: filters },
		}),
		dependencies: [...filters, orderBy, keyword, page],
	});

	if (error) {
		return (
			<Alert status="error" p={{ base: 6, md: 10 }} flexDirection="column" borderRadius="2xl" border="1px solid" borderColor="red.200" boxShadow="0 12px 30px rgba(137,46,38,.08)">
				<AlertIcon boxSize="40px" />
				<AlertTitle mt="5" mb="2">Problem loading your listings</AlertTitle>
				<AlertDescription>Check your connection and try again.</AlertDescription>
			</Alert>
		);
	}

	return (
		<Grid className="dashboard-listings-grid" justifyContent="center" columnGap={{ base: 4, md: 6 }} rowGap={{ base: 4, md: 6 }} templateColumns={{ base: "minmax(0, 1fr)", sm: "repeat(auto-fill, minmax(18rem, 1fr))" }} w="full">
			{loading || !data ? (
				[...Array(6)].map((_, index) => <ItemLoader key={index} />)
			) : data.items?.length ? (
				data.items.map((item) => (
					<Item
						key={item.id}
						id={item.id}
						title={item.title}
						photoURL={item.images?.[0]}
						itemType={item.itemType}
						listingIntent={item.House?.type || item.BusinessSpace?.type}
						status={item.status}
						paymentStatus={item.paymentStatus}
						paymentFee={paymentFee}
						paymentEnabled={paymentEnabled}
						listingPayment={item.ListingPayments?.[0]}
					/>
				))
			) : (
				<Flex gridColumn="1 / -1" minH={{ base: "280px", md: "340px" }} align="center" justify="center" direction="column" textAlign="center" px="6" py="12" bg={surface} border="1px dashed" borderColor={border} borderRadius="2xl" boxShadow="inset 0 0 0 6px rgba(128,145,145,.025)">
					<Box w="16" h="16" display="grid" placeItems="center" borderRadius="2xl" bg={emptyIconBg} color={emptyIconColor} boxShadow="0 10px 24px rgba(198,107,54,.10)">
						<MdAdd size="22" />
					</Box>
					<Heading mt="5" size="md" color={heading}>
						{keyword ? copy.noMatchTitle : filters.length ? copy.noListingsTitle : copy.chooseCategoryTitle}
					</Heading>
					<Text mt="2" maxW="sm" color={muted}>
						{keyword
							? copy.noMatchDescription
							: filters.length
								? copy.noListingsDescription
								: copy.chooseCategoryDescription}
					</Text>
					{!keyword && filters.length > 0 && (
						<Link legacyBehavior href="/dashboard/add-item" passHref>
							<Button as="a" mt="6" colorScheme="orange" borderRadius="xl" leftIcon={<MdAdd />}>{copy.createListing}</Button>
						</Link>
					)}
				</Flex>
			)}
			{!loading && data?.total > 30 && <Flex gridColumn="1 / -1" align="center" justify="space-between" gap="3" mt="2">
				<Button size="sm" variant="outline" isDisabled={page === 0} onClick={() => setPage((current) => Math.max(0, current - 1))}>{pageText.previousPage}</Button>
				<Text color={muted} fontSize="sm">{pageText.pageCounter.replace("{page}", String(page + 1)).replace("{pages}", String(Math.ceil(data.total / 30)))}</Text>
				<Button size="sm" colorScheme="orange" isDisabled={(page + 1) * 30 >= data.total} onClick={() => setPage((current) => current + 1)}>{pageText.nextPage}</Button>
			</Flex>}
		</Grid>
	);
};
