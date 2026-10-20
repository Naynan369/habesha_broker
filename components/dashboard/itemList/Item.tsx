import { Avatar, Badge, Box, Button, Flex, Heading, Modal, ModalBody, ModalCloseButton, ModalContent, ModalFooter, ModalHeader, ModalOverlay, Text, Textarea, useColorModeValue, useDisclosure, useToast } from "@chakra-ui/react";
import { ListingImage } from "@components/shared/ListingImage";
import { getMediaUrl } from "@libs/helpers/media";
import { dayjs } from "@config/dayjs";
import Link from "next/link";
import { FC, useEffect, useState } from "react";
import axios from "axios";
import { useRouter } from "next/router";
import { useLang } from "@libs/hooks/useLang";
import { useListingCheckout } from "@libs/hooks/useListingCheckout";
import { LISTING_CURRENCY } from "@config/listingPayment";

export interface IItem {
	id: string;
	title: string;
	price: string;
	photoURL: string;
	date: string;
	ownerPhoto?: string;
	status?: string;
	paymentStatus?: string;
	paymentFee?: number;
	paymentEnabled?: boolean;
	listingPayment?: any;
	itemType: string;
	ownerName: string;
	featured?: boolean;
	priceFrequency?: string;
	serviceCategory?: string;
	listingIntent?: string;
}

export const Item: FC<IItem> = ({ id, title, price, photoURL, date, ownerPhoto, ownerName, itemType, featured, status, paymentStatus, paymentFee, paymentEnabled, listingPayment, priceFrequency, serviceCategory, listingIntent }) => {
	const router = useRouter();
	const { locale } = router;
	const lang = useLang();
	const copy = lang.listingManagementPage;
	const paymentLabels = lang.payments;
	const { startCheckout, isLoading } = useListingCheckout(id, paymentLabels);
	const { isOpen, onOpen, onClose } = useDisclosure();
	const soldDisclosure = useDisclosure();
	const toast = useToast();
	const [paymentRecord, setPaymentRecord] = useState(listingPayment);
	const [refundReason, setRefundReason] = useState("");
	const [requestingRefund, setRequestingRefund] = useState(false);
	const [updatingListingStatus, setUpdatingListingStatus] = useState(false);
	useEffect(() => setPaymentRecord(listingPayment), [listingPayment]);
	const surface = useColorModeValue("white", "#0c0c0c");
	const border = useColorModeValue("gray.200", "whiteAlpha.200");
	const headingColor = useColorModeValue("#25383d", "#e8eff0");
	const muted = useColorModeValue("gray.600", "gray.400");
	const imageFallback = useColorModeValue("gray.100", "#101010");
	const divider = useColorModeValue("gray.100", "whiteAlpha.200");
	const paymentSurface = useColorModeValue("orange.50", "whiteAlpha.100");
	const inputBg = useColorModeValue("white", "#080808");
	const statusColor = status === "CLOSED" ? "gray" : status === "SOLD" ? "purple" : paymentStatus === "DUE" || paymentStatus === "NOT_REQUIRED" ? "orange" : paymentStatus === "PROCESSING" ? "blue" : status === "APPROVED" ? "green" : status === "DECLINED" ? "red" : "orange";
	const statusLabel = status === "CLOSED" ? copy.closed : status === "SOLD" ? copy.sold : paymentStatus === "DUE" || paymentStatus === "NOT_REQUIRED" ? copy.paymentDue : paymentStatus === "PROCESSING" ? copy.paymentProcessing : paymentStatus === "PAID" && status === "PENDING" ? copy.paidPending : status === "APPROVED" ? copy.approved : status === "DECLINED" ? copy.declined : copy.pending;
	const canMarkSold = itemType === "CAR" || (itemType === "HOUSE" || itemType === "BUSINESS_SPACE") && listingIntent === "FORSALE";
	const itemTypeLabel = itemType === "SERVICE"
		? lang.serviceListing.categories[serviceCategory] || copy.categoryServices
		: itemType === "BUSINESS_SPACE" ? copy.categoryBusinessSpaces : itemType === "CAR" ? copy.categoryVehicles : copy.categoryHomes;
	const needsPayment = typeof paymentFee === "number" && status !== "APPROVED" && status !== "SOLD" && status !== "CLOSED" && paymentStatus !== "PAID";
	const eligibleForRefundRequest = paymentRecord?.status === "PAID" && paymentRecord?.refundStatus === "NOT_REFUNDED" && paymentRecord?.txRef?.startsWith("HB-STRIPE-") && paymentRecord?.providerRef?.startsWith("cs_test_");
	const canRequestRefund = eligibleForRefundRequest && !["PENDING", "APPROVED"].includes(paymentRecord?.refundRequestStatus);
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
		<Flex direction="column" h="full" minW="0" bg={surface} border="1px solid" borderColor={border} borderRadius="2xl" overflow="hidden" boxShadow="0 6px 22px rgba(21,42,44,.06)" transition="transform 180ms ease, box-shadow 180ms ease, border-color 180ms ease" _hover={{ boxShadow: "0 16px 34px rgba(21,42,44,.14)", transform: "translateY(-3px)", borderColor: "mainyellow" }}>
			<Link legacyBehavior href={"/items/" + id} passHref>
				<Flex as="a" direction="column" flex="1" minW="0" cursor="pointer" textDecoration="none" _focusVisible={{ outline: "3px solid #E9B75C", outlineOffset: "-3px" }}>
					<Box position="relative" h={{ base: "190px", md: "215px" }} flexShrink={0} bg={imageFallback}>
						<ListingImage src={photoURL} alt={title} itemType={itemType} fill />
						{featured && <Badge position="absolute" top="4" left="4" zIndex="1" colorScheme="orange" borderRadius="full" px="3" py="1">{copy.featured}</Badge>}
						{status && <Badge position="absolute" top="4" right="4" zIndex="1" colorScheme={statusColor} variant="solid" borderRadius="full" px="3" py="1">{statusLabel}</Badge>}
					</Box>
					<Flex direction="column" flex="1" p={{ base: 4, md: 5 }}>
						<Flex align="flex-start" justify="space-between" gap="3">
							<Box minW="0">
								<Heading size="md" color={headingColor} noOfLines={2} lineHeight="1.35">{title}</Heading>
								<Text color={muted} fontSize="xs" mt="2">{copy.posted} {dayjs(date).locale(locale === "am" ? "am" : "en").fromNow()}</Text>
							</Box>
							<Badge flexShrink={0} colorScheme="teal" variant="subtle" borderRadius="full" px="2.5" py="1">{itemTypeLabel}</Badge>
						</Flex>
						<Flex align="baseline" gap="2" mt="5">
							<Heading fontSize="xl" color={headingColor} letterSpacing="-.02em">{Intl.NumberFormat("en-US").format(Number(price) || 0)}</Heading>
							<Text color={muted} fontSize="sm" fontWeight="semibold">ETB</Text>
							{itemType === "BUSINESS_SPACE" && priceFrequency && <Text color={muted} fontSize="xs">/ {lang.businessListing.frequencies[priceFrequency]}</Text>}
						</Flex>
						<Flex mt="5" pt="4" align="center" gap="3" borderTop="1px solid" borderColor={divider}>
							<Avatar size="sm" name={ownerName || "Habesha Brokers seller"} src={getMediaUrl(ownerPhoto, "profile")} />
							<Box minW="0"><Text fontSize="xs" color={muted}>{copy.listedBy}</Text><Text noOfLines={1} fontSize="sm" fontWeight="semibold" color={headingColor}>{ownerName || copy.seller}</Text></Box>
						</Flex>
					</Flex>
				</Flex>
			</Link>
			{needsPayment && (
				<Flex direction="column" gap="2" p={{ base: 4, md: 5 }} pt="4" borderTop="1px solid" borderColor={divider} bg={paymentSurface}>
					<Flex align="center" justify="space-between" gap="3" wrap="wrap">
						<Box>
							<Text fontSize="9px" color={muted} fontWeight="bold" letterSpacing="wide" textTransform="uppercase">{paymentLabels.oneTime}</Text>
							<Text mt="1" fontSize="sm" fontWeight="bold" color={headingColor}>{LISTING_CURRENCY} {paymentFee!.toLocaleString("en-US")}</Text>
						</Box>
						<Button size="sm" colorScheme="orange" borderRadius="lg" onClick={startCheckout} isLoading={isLoading} isDisabled={!paymentEnabled || isLoading}>
							{paymentStatus === "PROCESSING" ? paymentLabels.continueCheckout : paymentLabels.payButton}
						</Button>
					</Flex>
					{!paymentEnabled && <Text fontSize="xs" color={muted}>{paymentLabels.notConfigured}</Text>}
				</Flex>
			)}
			{paymentRecord?.status === "PAID" && refundNotice && (
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
			{(status === "APPROVED" || status === "CLOSED") && <Flex align={{ base: "stretch", sm: "center" }} justify="space-between" gap="3" wrap="wrap" px={{ base: 4, md: 5 }} pb="4">
				<Text fontSize="xs" color={muted}>{status === "CLOSED" ? copy.listingClosedHelp : canMarkSold ? copy.saleListingHelp : copy.closeListingHelp}</Text>
				<Flex gap="2" wrap="wrap" justify="flex-end">
					{status === "APPROVED" && canMarkSold && <Button size="sm" variant="outline" colorScheme="purple" onClick={soldDisclosure.onOpen} isLoading={updatingListingStatus} borderRadius="lg">{copy.markAsSold}</Button>}
					<Button size="sm" variant={status === "CLOSED" ? "solid" : "outline"} colorScheme={status === "CLOSED" ? "green" : "gray"} onClick={updateListingStatus} isLoading={updatingListingStatus} borderRadius="lg">{status === "CLOSED" ? copy.reopenListing : copy.closeListing}</Button>
				</Flex>
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
