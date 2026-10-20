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
	const surface = useColorModeValue("#ffffff", "#101415");
	const border = useColorModeValue("#dce3e1", "whiteAlpha.200");
	const headingColor = useColorModeValue("#20383d", "#eef2f1");
	const muted = useColorModeValue("#637278", "#a5b1b4");
	const imageFallback = useColorModeValue("#e7ecea", "#151b1c");
	const divider = useColorModeValue("#e7ecea", "whiteAlpha.200");
	const paymentSurface = useColorModeValue("#fbf4e7", "rgba(233,183,92,.08)");
	const inputBg = useColorModeValue("#ffffff", "#080b0c");
	const accentText = useColorModeValue("mainorange", "#f0c978");
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
		<Flex className="dashboard-listing-card" direction="column" h="full" minW="0" bg={surface} border="1px solid" borderColor={border} borderRadius="3xl" overflow="hidden" boxShadow="0 16px 42px rgba(21,42,44,.10)" transition="transform 320ms cubic-bezier(.2,.8,.2,1), box-shadow 320ms ease, border-color 320ms ease" _hover={{ boxShadow: "0 32px 70px rgba(16,47,55,.24)", transform: "translateY(-8px) scale(1.012)", borderColor: "mainorange" }}>
			<Link legacyBehavior href={"/items/" + id} passHref>
				<Flex as="a" role="group" direction="column" flex="1" minW="0" cursor="pointer" textDecoration="none" _focusVisible={{ outline: "3px solid #E9B75C", outlineOffset: "-3px" }}>
					<Box className="dashboard-listing-image" position="relative" h={{ base: "210px", md: "250px" }} flexShrink={0} bg={imageFallback} overflow="hidden">
						<ListingImage src={photoURL} alt={title} itemType={itemType} fill />
						<Box position="absolute" inset="0" bgGradient="linear(to-b, rgba(7,23,27,.18), transparent 35%, rgba(7,23,27,.78))" pointerEvents="none" />
						{featured && <Badge position="absolute" top="4" left="4" zIndex="3" color="#182d31" bg="#f0c978" borderRadius="full" px="3.5" py="1.5" boxShadow="0 7px 20px rgba(0,0,0,.24)" letterSpacing=".04em">✦ {copy.featured}</Badge>}
						{status && <Badge position="absolute" top="4" right="4" zIndex="3" colorScheme={statusColor} variant="solid" borderRadius="full" px="3.5" py="1.5" boxShadow="0 7px 20px rgba(0,0,0,.24)">{statusLabel}</Badge>}
						<Flex position="absolute" left="5" right="5" bottom="4" align="center" justify="space-between" gap="3" color="white" zIndex="3">
							<Flex align="center" gap="2.5" minW="0" px="3.5" py="2.5" border="1px solid" borderColor="whiteAlpha.400" borderRadius="full" bg="rgba(7,23,27,.56)" backdropFilter="blur(12px)">
								<Box w="2" h="2" flexShrink={0} borderRadius="full" bg="#f0c978" boxShadow="0 0 0 5px rgba(240,201,120,.15)" />
								<Text noOfLines={1} fontSize="10px" fontWeight="bold" letterSpacing=".11em" textTransform="uppercase">{itemTypeLabel}</Text>
							</Flex>
							<Text fontSize="xs" color="whiteAlpha.800" fontWeight="semibold">{copy.posted} {dayjs(date).locale(locale === "am" ? "am" : "en").fromNow()}</Text>
						</Flex>
					</Box>
					<Flex direction="column" flex="1" p={{ base: 4, md: 5.5 }}>
						<Flex align="flex-start" justify="space-between" gap="3">
							<Box minW="0">
								<Heading size="md" color={headingColor} noOfLines={2} lineHeight="1.3" letterSpacing="-.035em">{title}</Heading>
							</Box>
						</Flex>
						<Flex className="dashboard-listing-price" align="center" justify="space-between" gap="3" mt="5" p={{ base: 4, md: 4.5 }} border="1px solid" borderColor="rgba(240,201,120,.28)" borderRadius="2xl" bg="#102f37" boxShadow="inset 0 1px 0 rgba(255,255,255,.06), 0 12px 28px rgba(16,47,55,.18)">
							<Box minW="0">
								<Text color="#f0c978" fontSize="9px" fontWeight="bold" letterSpacing=".14em" textTransform="uppercase">{lang.itemDetailPage.askingPrice}</Text>
								<Flex align="baseline" gap="2" mt="1">
									<Heading fontSize={{ base: "lg", md: "xl" }} color="white" letterSpacing="-.045em">{Intl.NumberFormat("en-US").format(Number(price) || 0)}</Heading>
									<Text color="whiteAlpha.800" fontSize="xs" fontWeight="bold">ETB</Text>
								</Flex>
							</Box>
							{itemType === "BUSINESS_SPACE" && priceFrequency && <Text flexShrink={0} px="3" py="2" color="whiteAlpha.800" fontSize="xs" fontWeight="semibold" borderLeft="1px solid" borderColor="whiteAlpha.300">/ {lang.businessListing.frequencies[priceFrequency]}</Text>}
						</Flex>
						<Flex mt="auto" pt="5" align="center" gap="3">
							<Avatar size="sm" name={ownerName || "Habesha Brokers seller"} src={getMediaUrl(ownerPhoto, "profile")} border="2px solid" borderColor={surface} boxShadow="0 0 0 2px rgba(240,201,120,.4)" />
							<Box minW="0"><Text fontSize="9px" color={muted} fontWeight="bold" letterSpacing=".08em" textTransform="uppercase">{copy.listedBy}</Text><Text noOfLines={1} fontSize="sm" fontWeight="semibold" color={headingColor}>{ownerName || copy.seller}</Text></Box>
							<Box flex="1" />
							<Flex aria-hidden="true" align="center" justify="center" flexShrink={0} w="10" h="10" borderRadius="full" bg={paymentSurface} color={accentText} transition="transform 240ms ease, background 240ms ease" _groupHover={{ transform: "translate(2px,-2px)", bg: "rgba(198,107,54,.16)" }}>
								<Text fontSize="xl" fontWeight="bold">↗</Text>
							</Flex>
						</Flex>
					</Flex>
				</Flex>
			</Link>
			{needsPayment && (
				<Flex direction="column" gap="3" p={{ base: 4, md: 5 }} pt="4" borderTop="1px solid" borderColor={divider} bg={paymentSurface}>
					<Flex align="center" justify="space-between" gap="3" wrap="wrap">
						<Box>
							<Text fontSize="9px" color={muted} fontWeight="bold" letterSpacing="wide" textTransform="uppercase">{paymentLabels.oneTime}</Text>
							<Text mt="1" fontSize="sm" fontWeight="bold" color={headingColor}>{LISTING_CURRENCY} {paymentFee!.toLocaleString("en-US")}</Text>
						</Box>
						<Button size="sm" h="10" px="4" colorScheme="orange" borderRadius="lg" boxShadow="0 6px 16px rgba(198,107,54,.18)" onClick={startCheckout} isLoading={isLoading} isDisabled={!paymentEnabled || isLoading}>
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
