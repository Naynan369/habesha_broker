import { EditIcon } from "@chakra-ui/icons";
import {
	Alert,
	AlertDescription,
	AlertIcon,
	AlertTitle,
	Avatar,
	Badge,
	Box,
	Button,
	Flex,
	Heading,
	HStack,
	IconButton,
	Input,
	FormControl,
	FormLabel,
	Modal,
	ModalBody,
	ModalCloseButton,
	ModalContent,
	ModalFooter,
	ModalHeader,
	ModalOverlay,
	Textarea,
	Select,
	Tabs,
	TabList,
	Tab,
	TabPanels,
	TabPanel,
	SimpleGrid,
	Grid,
	Skeleton,
	SkeletonText,
	Spinner,
	Stack,
	Text,
	useToast,
	useDisclosure,
	useColorModeValue,
} from "@chakra-ui/react";
import { ContactInfo } from "@components/ContactInfo";
import { withSessionSsr } from "@config/cookie/cookie";
import { getListingPaymentConfig, LISTING_CURRENCY, LISTING_FEE } from "@config/listingPayment";
import { useListingCheckout } from "@libs/hooks/useListingCheckout";
import { dayjs } from "@config/dayjs";
import { MyTheme } from "@config/theme/MyTheme";
import { prisma } from "@config/prisma";
import axios from "axios";
import Link from "next/link";
import { useRouter } from "next/router";
import { useLang } from "@libs/hooks/useLang";
import { PointerEvent as ReactPointerEvent, useEffect, useState } from "react";
import { useReducedMotion } from "framer-motion";
import { FaExclamationCircle, FaHeart, FaRegHeart } from "react-icons/fa";
import { MdArrowBack, MdChevronLeft, MdChevronRight, MdLocationOn, MdOpenInFull, MdShare } from "react-icons/md";
import { generateNextSeo } from "next-seo/pages";
import Head from "next/head";
import { formatPrice } from "@libs/helpers/util.client";
import { ListingImage } from "@components/shared/ListingImage";
import { getMediaUrl } from "@libs/helpers/media";
import { SiteNavbar } from "@components/shared/SiteNavbar";

const SaveButton = () => {
	const toast = useToast();
	const lang = useLang();
	const { itemId } = useRouter().query;
	const [data, setData] = useState(null);
	const [loading, setLoading] = useState(false);
	const buttonSurface = useColorModeValue("#ffffff", "#171b1d");
	const buttonBorder = useColorModeValue("#c8cbc8", "rgba(255,255,255,.22)");
	const buttonText = useColorModeValue("#493528", "#f2e7de");
	const buttonHover = useColorModeValue("#f5eee8", "#24201e");

	useEffect(() => {
		setLoading(true);
		axios
			.get(`/api/items/save/check?itemId=${itemId}`)
			.then((res) => {
				setData(res.data);
			})
			.catch(() => setData({ saved: false }))
			.finally(() => {
				setLoading(false);
			});
	}, [itemId]);

	const saveItem = async () => {
		return await axios
			.post("/api/items/save", { itemId })
			.then((res) => {
				setData({ saved: true });
				toast({
					title: lang.itemDetailPage.savedToast,
					status: "success",
				});
			})
			.catch((err) => {
				toast({
					title: lang.itemDetailPage.savedErrorTitle,
					description: err?.response?.data?.err || lang.itemDetailPage.saveTryAgain,
					status: "error",
				});
			});
	};

	const unsaveItem = async () => {
		return await axios
			.delete("/api/items/save", {
				data: {
					itemId,
				},
			})
			.then((res) => {
				setData({ saved: false });
				toast({
					title: lang.itemDetailPage.unsavedToast,
					status: "success",
				});
			})
			.catch((err) => {
				toast({
					title: lang.itemDetailPage.unsavedErrorTitle,
					description: err?.response?.data?.err || lang.itemDetailPage.saveTryAgain,
					status: "error",
				});
			});
	};

	const toggleSaved = async () => {
		setLoading(true);
		const func = !data?.saved ? saveItem : unsaveItem;
		func().finally(() => {
			setLoading(false);
		});
	};

	return (
		<Button
			onClick={toggleSaved}
			disabled={loading}
			aria-label={data?.saved ? lang.common.removeSavedListing : lang.common.saveListing}
			aria-pressed={Boolean(data?.saved)}
			minW={{ base: "10", sm: "auto" }}
			px={{ base: 0, sm: 4 }}
			bg={buttonSurface}
			color={buttonText}
			variant="outline"
			border="1px solid"
			borderColor={buttonBorder}
			borderRadius="xl"
			_hover={{ bg: buttonHover }}
			leftIcon={
				loading ? (
					<Spinner />
				) : data?.saved ? (
					<FaHeart />
				) : (
					<FaRegHeart />
				)
			}
		>
			<Text display={{ base: "none", sm: "inline" }}>{data?.saved ? lang.common.savedListing : lang.common.saveListing}</Text>
		</Button>
	);
};

const ListingPaymentPanel = ({ item, fee, enabled, labels }) => {
	const { startCheckout, isLoading: checkoutLoading } = useListingCheckout(item.id, labels);
	const border = useColorModeValue("#edcbb3", "rgba(226,145,91,.34)");
	const surface = useColorModeValue("#fffaf5", "#171311");
	const mutedText = useColorModeValue("#667085", "#a7b0b8");
	const actionBg = useColorModeValue("#9b6245", "#51443b");
	const actionHover = useColorModeValue("#87533b", "#625044");
	const actionActive = useColorModeValue("#75472f", "#705c4f");
	const actionText = useColorModeValue("#ffffff", "#f7eee8");

	return (
		<Flex direction="column" gap="4" p={{ base: 5, md: 6 }} border="1px solid" borderColor={border} borderRadius="2xl" bg={surface} boxShadow="0 16px 38px rgba(30,20,12,.12)">
			<Flex align="flex-start" justify="space-between" gap="4">
				<Box minW="0">
					<Text color="mainorange" fontSize="xs" fontWeight="bold" letterSpacing=".12em" textTransform="uppercase">{labels.title}</Text>
					<Text mt="2" color={mutedText} fontSize="sm" lineHeight="1.65">{labels.description}</Text>
				</Box>
				<Badge flexShrink={0} colorScheme="orange" borderRadius="full" px="3" py="1.5">{labels.oneTime}</Badge>
			</Flex>
			<Flex align="baseline" justify="space-between" gap="3" p="4" borderRadius="xl" bg={useColorModeValue("#ffffff", "#0e1011")}>
				<Text fontSize="sm" fontWeight="semibold" color={mutedText}>{labels.oneTime}</Text>
				<Heading size="md" color="mainorange" textAlign="right">{LISTING_CURRENCY} {fee.toLocaleString("en-US")}</Heading>
			</Flex>
			<Button w="full" minH="12" whiteSpace="normal" color={actionText} bg={actionBg} borderRadius="xl" _hover={{ bg: actionHover }} _active={{ bg: actionActive }} onClick={startCheckout} isLoading={checkoutLoading} isDisabled={checkoutLoading || !enabled}>
				{item.paymentStatus === "PROCESSING" ? labels.continueCheckout : labels.payButton}
			</Button>
			{!enabled && <Text fontSize="xs" color={mutedText} lineHeight="1.6">{labels.notConfigured}</Text>}
		</Flex>
	);
};

const InteractivePhotoGallery = ({ data, images, preview, detailText, imageFallback, subtleBorder, onPreview, onSelectImage, onOpenGallery }) => {
	const prefersReducedMotion = useReducedMotion();
	const updatePose = (event: ReactPointerEvent<HTMLDivElement>) => {
		if (prefersReducedMotion || event.pointerType !== "mouse") return;
		const stage = event.currentTarget;
		const bounds = stage.getBoundingClientRect();
		if (!bounds.width || !bounds.height) return;
		const pointerX = Math.min(1, Math.max(0, (event.clientX - bounds.left) / bounds.width));
		const pointerY = Math.min(1, Math.max(0, (event.clientY - bounds.top) / bounds.height));
		stage.style.setProperty("--gallery-rotate-x", `${((0.5 - pointerY) * 7).toFixed(2)}deg`);
		stage.style.setProperty("--gallery-rotate-y", `${((pointerX - 0.5) * 7).toFixed(2)}deg`);
		stage.style.setProperty("--gallery-light-x", `${Math.round(pointerX * 100)}%`);
		stage.style.setProperty("--gallery-light-y", `${Math.round(pointerY * 100)}%`);
	};
	const resetPose = (event: ReactPointerEvent<HTMLDivElement>) => {
		event.currentTarget.style.setProperty("--gallery-rotate-x", "0deg");
		event.currentTarget.style.setProperty("--gallery-rotate-y", "0deg");
		event.currentTarget.style.setProperty("--gallery-light-x", "50%");
		event.currentTarget.style.setProperty("--gallery-light-y", "50%");
	};
	const gallerySurface = useColorModeValue("#ffffff", "#111416");
	const galleryBackdrop = useColorModeValue(
		"radial-gradient(ellipse at 50% 36%, #fdfdfc 0%, #e5e8e5 72%, #d9dfdc 100%)",
		"radial-gradient(ellipse at 50% 36%, #20282b 0%, #101416 68%, #090b0c 100%)",
	);
	const photoCount = detailText.photoCount.replace("{current}", String(Math.max(0, images.indexOf(preview)) + 1)).replace("{total}", String(images.length));

	return (
		<>
		<Box minW="0" bg={gallerySurface} border="1px solid" borderColor={subtleBorder} borderRadius={{ base: "2xl", md: "3xl" }} overflow="hidden" boxShadow="0 22px 56px rgba(9,18,20,.16)">
			<Box position="relative" h={{ base: "min(72vw, 370px)", sm: "390px", xl: "460px" }} minH={{ base: "250px", md: "340px" }} bg={galleryBackdrop} overflow="hidden" onPointerMove={updatePose} onPointerLeave={resetPose} style={{ perspective: "1400px", perspectiveOrigin: "var(--gallery-light-x, 50%) var(--gallery-light-y, 50%)", transformStyle: "preserve-3d" }}>
				<Box className={prefersReducedMotion ? undefined : "listing-photo-depth"} position="absolute" inset={{ base: "4%", md: "5%" }} pointerEvents="none" style={{ transform: prefersReducedMotion ? "translateZ(10px)" : undefined, transformStyle: "preserve-3d" }}>
					<Box position="absolute" inset="0" pointerEvents="none" style={{ transform: prefersReducedMotion ? "none" : `rotateX(var(--gallery-rotate-x, 0deg)) rotateY(var(--gallery-rotate-y, 0deg))`, transformStyle: "preserve-3d", willChange: prefersReducedMotion ? "auto" : "transform" }}>
						<ListingImage alt={data.title} src={preview} itemType={data.itemType} w="full" h="full" objectFit="contain" loading="eager" />
					</Box>
				</Box>
				<Box className={prefersReducedMotion ? undefined : "listing-photo-sheen"} position="absolute" top="-20%" bottom="-20%" left="-40%" w="35%" pointerEvents="none" />
				<Box position="absolute" inset="0" pointerEvents="none" bg={`radial-gradient(ellipse at var(--gallery-light-x, 50%) var(--gallery-light-y, 50%), rgba(255,255,255,.22) 0%, rgba(255,255,255,0) 42%)`} style={{ mixBlendMode: "screen", transform: "translateZ(18px)" }} />
<Flex position="absolute" inset="0" align="flex-start" justify="flex-end" p={{ base: 3, md: 5 }} pointerEvents="none" style={{ transform: "translateZ(30px)", transformStyle: "preserve-3d" }}>
					<IconButton isDisabled={!images.length} pointerEvents="auto" aria-label={detailText.openGallery} title={detailText.openGallery} icon={<MdOpenInFull />} size="sm" color="white" bg="blackAlpha.700" borderRadius="full" _hover={{ bg: "blackAlpha.850" }} onClick={onOpenGallery} />
					{images.length > 1 && <>
						<IconButton pointerEvents="auto" aria-label={detailText.previousPhoto} icon={<MdChevronLeft />} position="absolute" left={{ base: 3, md: 5 }} top="50%" transform="translateY(-50%)" color="white" bg="blackAlpha.600" borderRadius="full" _hover={{ bg: "blackAlpha.800" }} onClick={() => onPreview(-1)} />
						<IconButton pointerEvents="auto" aria-label={detailText.nextPhoto} icon={<MdChevronRight />} position="absolute" right={{ base: 3, md: 5 }} top="50%" transform="translateY(-50%)" color="white" bg="blackAlpha.600" borderRadius="full" _hover={{ bg: "blackAlpha.800" }} onClick={() => onPreview(1)} />
					</>}
					{images.length > 0 && <Badge position="absolute" bottom={{ base: 3, md: 5 }} right={{ base: 3, md: 5 }} bg="blackAlpha.700" color="white" backdropFilter="blur(12px)" borderRadius="full" px="3" py="1.5">{photoCount}</Badge>}
				</Flex>
			</Box>
			{images.length > 1 && <SimpleGrid columns={{ base: 4, sm: 5, md: 6 }} gap={{ base: 2, md: 3 }} p={{ base: 3, md: 4 }}>
				{images.map((image, index) => (
					<Box key={image + "-" + index}>
						<Box as="button" type="button" w="full" aria-label={detailText.viewPhoto.replace("{number}", String(index + 1))} aria-pressed={preview === image} onClick={() => onSelectImage(image)} position="relative" h={{ base: "64px", sm: "76px" }} border="2px solid" borderColor={preview === image ? "mainorange" : subtleBorder} borderRadius="xl" overflow="hidden" bg={imageFallback} boxShadow={preview === image ? "0 0 0 2px rgba(201,111,61,.18)" : "none"} _hover={{ filter: "brightness(1.06)" }} _focusVisible={{ outline: "3px solid", outlineColor: "orange.300", outlineOffset: "2px" }}>
							<ListingImage alt={detailText.viewPhoto.replace("{number}", String(index + 1))} src={image} itemType={data.itemType} w="full" h="full" />
						</Box>
					</Box>
				))}
			</SimpleGrid>}
		</Box>
		<style jsx>{`
			@keyframes listing-photo-depth-float {
				0%, 100% { transform: translate3d(0, 0, 12px) rotateX(-2.4deg) rotateY(-2deg) scale(1.025); }
				50% { transform: translate3d(0, -8px, 18px) rotateX(2.4deg) rotateY(2deg) scale(1.045); }
			}
			@keyframes listing-photo-light-sweep {
				0%, 68% { transform: translateX(-140%) skewX(-16deg); opacity: 0; }
				74% { opacity: 0.55; }
				90%, 100% { transform: translateX(460%) skewX(-16deg); opacity: 0; }
			}
			.listing-photo-depth { animation: listing-photo-depth-float 8s ease-in-out infinite; }
			.listing-photo-sheen { background: linear-gradient(90deg, transparent, rgba(255,255,255,.24), rgba(255,255,255,.06), transparent); animation: listing-photo-light-sweep 9s ease-in-out infinite; mix-blend-mode: screen; }
			@media (prefers-reduced-motion: reduce) { .listing-photo-depth, .listing-photo-sheen { animation: none !important; } }
		`}</style>
		</>
	);
};

const ItemDetail = ({ itemId, user, item, paymentFee, paymentEnabled, serviceRating }) => {
	const router = useRouter();
	const lang = useLang();
	const businessText = lang.businessListing;
	const serviceText = lang.serviceListing;
	const listingText = lang.listingManagementPage;
	const detailText = lang.itemDetailPage;
	const sellerTypeText = lang.sellerType;
	const vehicleText = lang.vehicleListing;
	const surface = useColorModeValue("#ffffff", "#111416");
	const subtleBorder = useColorModeValue("#e5e7eb", "rgba(255,255,255,.10)");
	const mutedText = useColorModeValue("#667085", "#a7b0b8");
	const headingText = useColorModeValue("#17272b", "#f3f5f6");
	const canvas = useColorModeValue("#f4f2ee", "#080a0b");
	const imageFallback = useColorModeValue("#e9e7e2", "#0b0e10");
	const priceSurface = useColorModeValue("#fff7ed", "rgba(201,111,61,.12)");
	const priceBorder = useColorModeValue("#f2d5bd", "rgba(226,145,91,.28)");
	const elevatedSurface = useColorModeValue("#f8f7f4", "#171b1d");
	const cardShadow = useColorModeValue("0 18px 48px rgba(29,39,41,.07)", "0 22px 60px rgba(0,0,0,.28)");
	const buttonBorder = useColorModeValue("#c8cbc8", "rgba(255,255,255,.22)");
	const actionBg = useColorModeValue("#9b6245", "#51443b");
	const actionHover = useColorModeValue("#87533b", "#625044");
	const actionActive = useColorModeValue("#75472f", "#705c4f");
	const actionText = useColorModeValue("#ffffff", "#f7eee8");
	const [preview, setPreview] = useState(item?.images?.[0]);
	const [requestMessage, setRequestMessage] = useState("");
	const [requestDate, setRequestDate] = useState("");
	const [minimumRequestDate, setMinimumRequestDate] = useState("");
	const [requestPhone, setRequestPhone] = useState("");
	const [requesting, setRequesting] = useState(false);
	const [reportReason, setReportReason] = useState("");
	const [reportDetails, setReportDetails] = useState("");
	const [reporting, setReporting] = useState(false);
	const requestModal = useDisclosure();
	const galleryModal = useDisclosure();
	const reportModal = useDisclosure();
	const toast = useToast();
	const requestText = lang.serviceListing;
	const submitListingReport = async () => {
		setReporting(true);
		try {
			await axios.post("/api/listingReports", { itemId, reason: reportReason, details: reportDetails });
			reportModal.onClose();
			setReportReason("");
			setReportDetails("");
			toast({ title: detailText.reportSent, status: "success", duration: 5000, isClosable: true });
		} catch (error: any) {
			toast({ title: detailText.reportFailed, description: error?.response?.data?.err || detailText.reportFailed, status: "error", duration: 6000, isClosable: true });
		} finally {
			setReporting(false);
		}
	};
	useEffect(() => {
		const localDate = new Date();
		localDate.setMinutes(localDate.getMinutes() - localDate.getTimezoneOffset());
		setMinimumRequestDate(localDate.toISOString().slice(0, 10));
	}, []);
	const data = item;
	const images = Array.isArray(data?.images) ? data.images : [];
	const detailRelation = data.itemType === "HOUSE" ? "House" : data.itemType === "CAR" ? "Car" : data.itemType === "BUSINESS_SPACE" ? "BusinessSpace" : "Service";
	const relationData = data[detailRelation];
	const listingDetails = Array.isArray(relationData) ? relationData[0] : relationData;
	const priceTypeLabel = data.priceType === "NEGOTIABLE" ? detailText.negotiable : detailText.fixedPrice;
	const priceFrequency = ["BUSINESS_SPACE", "HOUSE"].includes(data.itemType) && listingDetails?.type === "RENT" && listingDetails?.priceFrequency
		? businessText.frequencies[listingDetails.priceFrequency]
		: null;
	const currentImageIndex = Math.max(0, images.indexOf(preview));
	const locationLabel = [listingDetails?.neighborhood, listingDetails?.subcity, listingDetails?.city, listingDetails?.region]
		.filter((value) => typeof value === "string" && value.trim())
		.filter((value, index, values) => values.indexOf(value) === index)
		.join(", ");
	const detailItems = Object.entries(listingDetails || {})
		.filter(([key, value]) => !["id", "itemId", "item", "video", "createdAt", "updatedAt"].includes(key)
			&& value !== null
			&& value !== undefined
			&& value !== ""
			&& !(Array.isArray(value) && value.length === 0))
		.map(([key, value]) => {
			const labelSource = data.itemType === "CAR"
				? vehicleText.detailLabels
				: data.itemType === "SERVICE"
					? serviceText.detailLabels
					: businessText.detailLabels;
			const label = labelSource?.[key] || key.replace(/([A-Z])/g, " $1").replace(/^./, (letter) => letter.toUpperCase());
			let displayValue = Array.isArray(value) ? value.join(" · ") : String(value ?? "");
			if (key === "category" && data.itemType === "SERVICE") displayValue = serviceText.categories[value as string] || displayValue;
			else if (key === "spaceType") displayValue = businessText.spaceTypes[value as string] || displayValue;
			else if (key === "type" && ["BUSINESS_SPACE", "HOUSE"].includes(data.itemType)) displayValue = value === "RENT" ? businessText.rent : businessText.sale;
			else if (key === "priceFrequency") displayValue = businessText.frequencies[value as string] || displayValue;
			else if (key === "propertyType") displayValue = businessText.propertyTypes[value as string] || displayValue;
			else if (key === "furnishing") displayValue = businessText.furnishingTypes[value as string] || displayValue;
			else if (key === "status" && data.itemType === "CAR") displayValue = value === "USED" ? vehicleText.used : value === "NEW" ? vehicleText.new : vehicleText.newInEthiopia;
			else if (key === "bodyType" && data.itemType === "CAR") displayValue = vehicleText.bodyTypes[value as string] || displayValue;
			else if (key === "fuelType" && data.itemType === "CAR") displayValue = vehicleText.fuelTypes[value as string] || displayValue;
			else if (key === "driveType" && data.itemType === "CAR") displayValue = vehicleText.driveTypes[value as string] || displayValue;
			else if (key === "transmition" && data.itemType === "CAR") displayValue = value === "AUTO" ? vehicleText.automatic : vehicleText.manual;
			else if (key === "features" && data.itemType === "HOUSE") displayValue = (value as string[]).map((feature) => businessText.homeFeatures[feature] || feature).join(" · ");
			else if (key === "features" && data.itemType === "CAR") displayValue = (value as string[]).map((feature) => vehicleText.vehicleFeatures[feature] || feature).join(" · ");
			else if (key === "mileage" && data.itemType === "CAR") displayValue = String(Number(value).toLocaleString()) + " " + vehicleText.mileageUnit;
			else if (key === "fuel" && data.itemType === "CAR") displayValue = String(value) + " " + vehicleText.fuelUnit;
			else if (key === "cylinder" && data.itemType === "CAR") displayValue = String(value) + " L";
			else if (typeof value === "boolean") displayValue = value ? businessText.yes : businessText.no;
			else if (key === "area" && ["BUSINESS_SPACE", "HOUSE"].includes(data.itemType)) displayValue = String(value) + " m²";
			return { key, label, value: displayValue };
		});
	const statusLabels: Record<string, string> = {
		APPROVED: listingText.approved,
		PENDING: listingText.pending,
		DECLINED: listingText.declined,
		SOLD: listingText.sold,
		CLOSED: listingText.closed,
	};
	const categoryLabel = data.itemType === "SERVICE"
		? lang.explore.card.service
		: data.itemType === "HOUSE"
			? lang.explore.card.home
			: data.itemType === "CAR"
				? lang.explore.card.vehicle
				: lang.explore.card.businessSpace;
	const updatePreview = (offset: number) => {
		if (!images.length) return;
		const nextIndex = (currentImageIndex + offset + images.length) % images.length;
		setPreview(images[nextIndex]);
	};
	const shareListing = async () => {
		const shareData = { title: data.title, text: data.description || data.title, url: window.location.href };
		try {
			if (navigator.share) {
				await navigator.share(shareData);
				return;
			}
			await navigator.clipboard.writeText(shareData.url);
			toast({ title: detailText.linkCopied, status: "success", duration: 3000, isClosable: true });
		} catch (error: any) {
			if (error?.name !== "AbortError") toast({ title: detailText.shareFailed, status: "error", duration: 3500, isClosable: true });
		}
	};

	// check if saved
	return (
		<>
			<Head>
				{generateNextSeo({
					title: `${data.title} - Habesha Brokers`,
					description: data.description || detailText.descriptionEmpty,
					openGraph: {
						title: data.title,
						description: data.description || detailText.descriptionEmpty,
						images: (data.images || []).map((value: string) => ({
							url: getMediaUrl(value, "items"),
							alt: data.title,
						})),
					},
				})}
			</Head>
			<Flex direction="column" minH="100dvh" bg={canvas}>
				<SiteNavbar mode="public" user={user} />
				<Box as="main" flex="1">
					<Flex direction="column" w="full" maxW="1480px" mx="auto" px={{ base: 4, md: 8, xl: 12 }} pt={{ base: 5, md: 8 }} pb={{ base: 10, md: 16 }}>
						<Flex align="center" justify="space-between" gap="4" mb={{ base: 5, md: 7 }} p={{ base: 3, md: 4 }} wrap="wrap" bg={surface} border="1px solid" borderColor={subtleBorder} borderRadius="2xl" boxShadow={cardShadow}>
							<Flex as="nav" aria-label="Breadcrumb" align="center" minW="0" gap={{ base: 1, sm: 2 }} wrap="wrap" fontSize="sm">
								<Link legacyBehavior href="/" passHref><Button as="a" size="sm" h="9" px={{ base: 3, sm: 4 }} bg={elevatedSurface} color={mutedText} border="1px solid" borderColor={buttonBorder} borderRadius="full" fontWeight="semibold" _hover={{ bg: priceSurface, borderColor: priceBorder, color: headingText }}>{lang.nav.home}</Button></Link>
								<MdChevronRight aria-hidden="true" color="currentColor" opacity=".55" />
								<Link legacyBehavior href="/explore" passHref><Button as="a" size="sm" h="9" px={{ base: 3, sm: 4 }} bg={elevatedSurface} color={mutedText} border="1px solid" borderColor={buttonBorder} borderRadius="full" fontWeight="semibold" _hover={{ bg: priceSurface, borderColor: priceBorder, color: headingText }}>{lang.nav.explore}</Button></Link>
								<MdChevronRight aria-hidden="true" color="currentColor" opacity=".55" />
								<Flex align="center" minW="0" maxW={{ base: "42vw", sm: "54vw", lg: "400px" }} h="9" gap="2" px={{ base: 3, sm: 4 }} bg={priceSurface} border="1px solid" borderColor={priceBorder} borderRadius="full">
									<Box flexShrink={0} w="2" h="2" borderRadius="full" bg="mainorange" />
									<Text noOfLines={1} color={headingText} fontWeight="bold">{data.title}</Text>
								</Flex>
							</Flex>
							<HStack spacing="2">
								<Button display={{ base: "none", sm: "inline-flex" }} size="sm" variant="ghost" color={mutedText} leftIcon={<MdArrowBack />} onClick={() => router.back()}>{detailText.back}</Button>
								<IconButton size="sm" aria-label={detailText.shareListing} title={detailText.shareListing} icon={<MdShare />} variant="outline" borderColor={buttonBorder} color={mutedText} _hover={{ bg: priceSurface, borderColor: priceBorder, color: headingText }} onClick={() => void shareListing()} />
								{user && data.status === "APPROVED" && <SaveButton />}
							</HStack>
						</Flex>

<Flex direction="column" gap={{ base: 6, lg: 8 }}>
	<Grid
		w="full"
		templateColumns={{ base: "minmax(0, 1fr)", lg: "minmax(0, 1.2fr) minmax(340px, .8fr)" }}
		templateAreas={{ base: `"summary" "gallery"`, lg: `"gallery summary"` }}
		gap={{ base: 5, lg: 7 }}
		alignItems="start"
	>
		<Flex gridArea="gallery" minW="0" direction="column" gap={{ base: 4, md: 5 }}>
			<InteractivePhotoGallery
									data={data}
									images={images}
									preview={preview}
									detailText={detailText}
									imageFallback={imageFallback}
									subtleBorder={subtleBorder}
									onPreview={updatePreview}
									onSelectImage={setPreview}
									onOpenGallery={galleryModal.onOpen}
								/>
			{data.status !== "APPROVED" && (user?.id === data.userId || user?.role === "ADMIN") && <Alert status={data.status === "DECLINED" ? "error" : data.status === "CLOSED" || data.status === "SOLD" ? "info" : "warning"} borderRadius="xl" alignItems="flex-start" boxShadow={cardShadow}>
									<AlertIcon />
									<AlertDescription>
										{data.status === "CLOSED" ? listingText.closedDescription
										: data.status === "SOLD" ? listingText.soldDescription
										: data.status === "DECLINED" ? detailText.declinedDescription
											: data.paymentStatus === "DUE" || data.paymentStatus === "NOT_REQUIRED" ? lang.payments.paymentDue
												: data.paymentStatus === "PROCESSING" ? lang.payments.processing
													: data.paymentStatus === "PAID" ? lang.payments.paid
														: detailText.pendingDescription}
									</AlertDescription>
								</Alert>}
								{user?.id === data.userId && data.paymentStatus !== "PAID" && data.status !== "APPROVED" && data.status !== "SOLD" && data.status !== "CLOSED" && <ListingPaymentPanel item={data} fee={paymentFee} enabled={paymentEnabled} labels={lang.payments} />}
		</Flex>
		<Box gridArea="summary" minW="0"><Box position="relative" overflow="hidden" bg={surface} border="1px solid" borderColor={subtleBorder} borderRadius="2xl" p={{ base: 5, md: 6 }} boxShadow={cardShadow}>
									<Box position="absolute" top="0" left="0" right="0" h="1" bgGradient="linear(to-r, #c96f3d, #e6b35d, transparent)" />
									<Flex direction="column" gap="5">
										<Flex align="center" gap="2" wrap="wrap">
											<Badge colorScheme="teal" variant="subtle" borderRadius="full" px="3" py="1.5">{categoryLabel}</Badge>
							{data.sellerType && sellerTypeText.options[data.sellerType] && <Badge colorScheme="purple" variant="subtle" borderRadius="full" px="3" py="1.5">{detailText.sellerTypeLabel}: {sellerTypeText.options[data.sellerType]}</Badge>}
											{data.featured && <Badge colorScheme="orange" variant="subtle" borderRadius="full" px="3" py="1.5">{detailText.featured}</Badge>}
											{data.status && <Badge colorScheme={data.status === "APPROVED" ? "green" : data.status === "DECLINED" ? "red" : data.status === "SOLD" ? "purple" : data.status === "CLOSED" ? "gray" : "orange"} borderRadius="full" px="3" py="1.5">{statusLabels[data.status] || data.status}</Badge>}
										</Flex>
										<Box minW="0">
											<Heading as="h1" color={headingText} fontSize={{ base: "2xl", md: "3xl" }} lineHeight="1.12" letterSpacing="-.04em" wordBreak="break-word">{data.title}</Heading>
											<Flex align="flex-start" gap="2" mt="3" color={mutedText} fontSize="sm"><Box mt="0.5" flexShrink={0}><MdLocationOn size="18" /></Box><Text>{locationLabel || detailText.locationNotProvided}</Text></Flex>
											<Text mt="2" color={mutedText} fontSize="sm">{detailText.listedLabel} {dayjs(data?.createdAt).fromNow()}</Text>
											{data.sellerType && <Text mt="2" color={mutedText} fontSize="xs">{sellerTypeText.selfDeclared}</Text>}
											{data.featured && <Text mt="2" color={mutedText} fontSize="sm">{detailText.featuredDescription}</Text>}
										</Box>
										<Box p={{ base: 4, md: 5 }} bg={priceSurface} border="1px solid" borderColor={priceBorder} borderRadius="xl">
											<Text color={mutedText} fontSize="xs" fontWeight="bold" letterSpacing=".1em" textTransform="uppercase">{detailText.askingPrice}</Text>
											<Flex align="baseline" gap="2" mt="1" wrap="wrap"><Heading color="mainorange" fontSize={{ base: "2xl", md: "3xl" }} letterSpacing="tight" wordBreak="break-word">{formatPrice(data.price)}</Heading><Text color={mutedText} fontWeight="semibold">ETB</Text>{priceFrequency && <Text color={mutedText} fontSize="sm">· {priceFrequency}</Text>}</Flex>
											<Badge mt="2" colorScheme={data.priceType === "NEGOTIABLE" ? "teal" : "gray"} borderRadius="full" px="3" py="1">{priceTypeLabel}</Badge>
										</Box>
										<Flex direction="column" gap="3">
											<Button as="a" href="#seller-contact" w="full" minW="0" minH="12" whiteSpace="normal" fontWeight="bold" color={actionText} bg={actionBg} borderRadius="xl" px="4" boxShadow="0 6px 16px rgba(64,45,31,.10)" _hover={{ bg: actionHover, boxShadow: "0 8px 18px rgba(64,45,31,.14)" }} _active={{ bg: actionActive }} _focusVisible={{ outline: "3px solid", outlineColor: "orange.300", outlineOffset: "2px" }}>{detailText.contactOwner}</Button>
											{user?.id === data.userId && <Link legacyBehavior href={"/items/edit/" + itemId} passHref><Button as="a" w="full" minW="0" minH="12" whiteSpace="normal" variant="outline" borderColor={buttonBorder} color={headingText} borderRadius="xl" px="4" _hover={{ bg: priceSurface, borderColor: priceBorder }} leftIcon={<EditIcon />}>{detailText.editListing}</Button></Link>}
											{data.status === "APPROVED" && user?.id !== data.userId && user?.role !== "ADMIN" && <Button variant="outline" borderColor={buttonBorder} color={mutedText} onClick={() => { if (!user) { void router.push("/auth/login", undefined, { locale: router.locale }); return; } if (!user.verfied) { void router.push("/dashboard/verify-account", undefined, { locale: router.locale }); return; } reportModal.onOpen(); }}>{detailText.reportListing}</Button>}
										</Flex>
									</Flex>
								</Box></Box>
	</Grid>
	{data.status === "APPROVED" && <Alert status="info" borderRadius="2xl" alignItems="flex-start" bg={elevatedSurface} color={mutedText} border="1px solid" borderColor={subtleBorder}>
		<AlertIcon />
		<Box minW="0"><AlertDescription>{detailText.marketplaceNotice}</AlertDescription><Link legacyBehavior href="/policies" passHref><Text as="a" display="inline-block" mt="2" color={headingText} fontWeight="bold" textDecoration="underline">{lang.policies.heading}</Text></Link></Box>
	</Alert>}

	<Grid
		w="full"
		templateColumns={{ base: "minmax(0, 1fr)", lg: "minmax(0, 1.2fr) minmax(340px, .8fr)" }}
		templateAreas={{ base: `"information" "seller"`, lg: `"information seller"` }}
		gap={{ base: 5, lg: 7 }}
		alignItems="start"
	>
		{detailItems.length > 0 || (data.itemType === "HOUSE" && listingDetails?.video) ? <Tabs gridArea="information" minW="0" isLazy variant="soft-rounded" colorScheme="orange" bg={surface} border="1px solid" borderColor={subtleBorder} borderRadius="2xl" p={{ base: 4, md: 6 }} boxShadow={cardShadow}>
			<TabList gap="1.5" overflowX="auto" flexWrap="nowrap" p="1.5" bg={elevatedSurface} border="1px solid" borderColor={subtleBorder} borderRadius="xl">
				<Tab flexShrink="0" whiteSpace="nowrap" fontWeight="semibold" color={mutedText} _selected={{ color: headingText, bg: surface, boxShadow: "sm" }}>{detailText.descriptionTitle}</Tab>
				{detailItems.length > 0 && <Tab flexShrink="0" whiteSpace="nowrap" fontWeight="semibold" color={mutedText} _selected={{ color: headingText, bg: surface, boxShadow: "sm" }}>{detailText.detailsTitle}</Tab>}
				{data.itemType === "HOUSE" && listingDetails?.video && <Tab flexShrink="0" whiteSpace="nowrap" fontWeight="semibold" color={mutedText} _selected={{ color: headingText, bg: surface, boxShadow: "sm" }}>{detailText.videoTitle}</Tab>}
			</TabList>
			<TabPanels>
				<TabPanel px="0" pb="0"><Box bg={surface} border="1px solid" borderColor={subtleBorder} borderRadius="2xl" p={{ base: 5, md: 7 }} boxShadow={cardShadow}>
									<Box pb="4" borderBottom="1px solid" borderColor={subtleBorder}>
										<Text color="mainorange" fontSize="xs" fontWeight="bold" letterSpacing=".13em" textTransform="uppercase">{detailText.descriptionEyebrow}</Text>
										<Heading mt="2" color={headingText} as="h2" size="md">{detailText.descriptionTitle}</Heading>
									</Box>
									<Text mt="5" color={mutedText} fontSize="md" lineHeight="1.85" whiteSpace="pre-wrap">{data.description || detailText.descriptionEmpty}</Text>
								</Box></TabPanel>
				{detailItems.length > 0 && <TabPanel px="0" pb="0">{detailItems.length > 0 && <Box bg={surface} border="1px solid" borderColor={subtleBorder} borderRadius="2xl" p={{ base: 5, md: 7 }} boxShadow={cardShadow}>
									<Flex align="flex-start" justify="space-between" gap="4" mb="5">
										<Box><Text color="mainorange" fontSize="xs" fontWeight="bold" letterSpacing=".13em" textTransform="uppercase">{detailText.detailsEyebrow}</Text><Heading mt="2" color={headingText} size="md" as="h2">{detailText.detailsTitle}</Heading><Text mt="2" color={mutedText} fontSize="sm">{detailText.detailsDescription}</Text></Box>
										<Badge flexShrink={0} colorScheme="gray" borderRadius="full" px="3" py="1.5">{detailItems.length}</Badge>
									</Flex>
									<SimpleGrid columns={{ base: 1, sm: 2 }} spacing="3">
										{detailItems.map(({ key, label, value }) => <Box key={key} minW="0" minH="76px" p="4" bg={elevatedSurface} border="1px solid" borderColor={subtleBorder} borderRadius="xl">
											<Text color={mutedText} fontSize="xs" fontWeight="semibold" textTransform="capitalize">{label}</Text>
											<Text mt="1.5" fontSize="sm" fontWeight="semibold" color={headingText} whiteSpace="normal" wordBreak="break-word">{value}</Text>
										</Box>)}
									</SimpleGrid>
								</Box>}</TabPanel>}
				{data.itemType === "HOUSE" && listingDetails?.video && <TabPanel px="0" pb="0">{data.itemType === "HOUSE" && listingDetails?.video && <Box bg={surface} border="1px solid" borderColor={subtleBorder} borderRadius="2xl" p={{ base: 4, md: 5 }} boxShadow={cardShadow}>
									<Flex align="center" justify="space-between" mb="4" gap="3">
										<Box><Text color="mainorange" fontSize="xs" fontWeight="bold" letterSpacing=".12em" textTransform="uppercase">{detailText.videoTitle}</Text><Text mt="1" fontSize="sm" color={mutedText}>{detailText.videoDescription}</Text></Box>
									</Flex>
									<video aria-label={businessText.videoPreview} controls preload="metadata" src={getMediaUrl(listingDetails.video, "items")} style={{ width: "100%", maxHeight: 440, borderRadius: 16, background: "#000000" }} />
								</Box>}</TabPanel>}
			</TabPanels>
		</Tabs> : <Box gridArea="information" minW="0"><Box bg={surface} border="1px solid" borderColor={subtleBorder} borderRadius="2xl" p={{ base: 5, md: 7 }} boxShadow={cardShadow}>
									<Box pb="4" borderBottom="1px solid" borderColor={subtleBorder}>
										<Text color="mainorange" fontSize="xs" fontWeight="bold" letterSpacing=".13em" textTransform="uppercase">{detailText.descriptionEyebrow}</Text>
										<Heading mt="2" color={headingText} as="h2" size="md">{detailText.descriptionTitle}</Heading>
									</Box>
									<Text mt="5" color={mutedText} fontSize="md" lineHeight="1.85" whiteSpace="pre-wrap">{data.description || detailText.descriptionEmpty}</Text>
								</Box></Box>}
		<Box gridArea="seller" minW="0"><Flex id="seller-contact" scrollMarginTop="100px" direction="column" bg={surface} border="1px solid" borderColor={subtleBorder} borderRadius="2xl" p={{ base: 5, md: 6 }} boxShadow={cardShadow}>
									<Flex align="center" gap="4" mb="5">
										<Avatar size="lg" flexShrink={0} name={data.user.firstName + " " + data.user.lastName} src={getMediaUrl(data.user.profile_url, "profile")} border="2px solid" borderColor={priceBorder} />
										<Box minW="0"><Text color="mainorange" fontSize="xs" fontWeight="bold" letterSpacing=".1em" textTransform="uppercase">{detailText.ownerLabel}</Text><Heading mt="1" fontSize="lg" color={headingText}>{data.user.firstName} {data.user.lastName}</Heading><Text mt="1" color={mutedText} fontSize="sm">{data.user.bio || detailText.ownerFallback}</Text></Box>
									</Flex>
									{data.itemType === "SERVICE" && <Box mb="5" p="4" bg={elevatedSurface} border="1px solid" borderColor={subtleBorder} borderRadius="xl">
										<Flex justify="space-between" align="center" gap="3"><Heading size="sm" color={headingText}>{lang.serviceRequestsPage.providerRating}</Heading><Text fontSize="sm" fontWeight="bold" color={headingText}>{serviceRating.count ? `${serviceRating.average.toFixed(1)} / 5` : "—"}</Text></Flex>
										<Text mt="1" mb="3" fontSize="xs" color={mutedText}>{serviceRating.count ? lang.serviceRequestsPage.reviewCount.replace("{count}", String(serviceRating.count)) : lang.serviceRequestsPage.noReviews}</Text>
										{data.ServiceReviews?.length > 0 ? <Stack spacing="3">{data.ServiceReviews.map((review: any) => <Box key={review.id} pt="3" borderTop="1px solid" borderColor={subtleBorder}><Flex justify="space-between" gap="3"><Text fontSize="sm" fontWeight="semibold" color={headingText}>{review.reviewer?.firstName || detailText.reviewAnonymous}</Text><Text fontSize="sm" color="mainorange" fontWeight="bold">{review.rating}/5</Text></Flex>{review.comment && <Text mt="1.5" fontSize="sm" color={mutedText} whiteSpace="pre-wrap">{review.comment}</Text>}</Box>)}</Stack> : null}
									</Box>}
									{data.itemType === "SERVICE" && data.status === "APPROVED" && data.userId !== user?.id && <Box mb="5" p="4" bg={priceSurface} border="1px solid" borderColor={priceBorder} borderRadius="xl"><Heading size="sm" color={headingText}>{requestText.requestTitle}</Heading><Text mt="2" color={mutedText} fontSize="sm" lineHeight="1.65">{requestText.requestDescription}</Text><Button mt="4" w="full" minH="11" color={actionText} bg={actionBg} borderRadius="lg" _hover={{ bg: actionHover }} _active={{ bg: actionActive }} onClick={() => { if (!user) { void router.push("/auth/login", undefined, { locale: router.locale }); return; } if (!user.verfied) { void router.push("/dashboard/verify-account", undefined, { locale: router.locale }); return; } requestModal.onOpen(); }}>{requestText.requestButton}</Button></Box>}
									<Box pt="4" borderTop="1px solid" borderColor={subtleBorder}><Heading color={headingText} size="sm">{detailText.contactTitle}</Heading><Text mt="1" color={mutedText} fontSize="sm">{detailText.contactDescription}</Text><Box mt="4"><ContactInfo userID={data.userId} size="sm" appearance="subtle" /></Box></Box>
								</Flex></Box>
	</Grid>
</Flex>
					</Flex>
				</Box>
			</Flex>

			<Modal motionPreset="none" isOpen={galleryModal.isOpen} onClose={galleryModal.onClose} isCentered size="6xl">
				<ModalOverlay bg="blackAlpha.800" backdropFilter="blur(8px)" />
				<ModalContent mx="3" bg="#080808" color="white" border="1px solid" borderColor="whiteAlpha.200" borderRadius="2xl" overflow="hidden">
					<ModalCloseButton zIndex="2" color="white" bg="blackAlpha.600" borderRadius="full" />
					<ModalBody p={{ base: 2, md: 4 }}>
						<Box position="relative" h={{ base: "70dvh", md: "78dvh" }} bg="black" borderRadius="xl" overflow="hidden">
							<Box key={preview || "gallery"} position="absolute" inset="0"><ListingImage alt={data.title} src={preview} itemType={data.itemType} w="full" h="full" objectFit="contain" loading="eager" /></Box>
							{images.length > 1 && <><IconButton aria-label={detailText.previousPhoto} icon={<MdChevronLeft />} position="absolute" left={{ base: 2, md: 5 }} top="50%" transform="translateY(-50%)" color="white" bg="blackAlpha.600" borderRadius="full" _hover={{ bg: "blackAlpha.800" }} onClick={() => updatePreview(-1)} /><IconButton aria-label={detailText.nextPhoto} icon={<MdChevronRight />} position="absolute" right={{ base: 2, md: 5 }} top="50%" transform="translateY(-50%)" color="white" bg="blackAlpha.600" borderRadius="full" _hover={{ bg: "blackAlpha.800" }} onClick={() => updatePreview(1)} /></>}
							{images.length > 0 && <Badge position="absolute" left="50%" bottom="4" transform="translateX(-50%)" bg="blackAlpha.700" color="white" borderRadius="full" px="4" py="2">{detailText.photoCount.replace("{current}", String(currentImageIndex + 1)).replace("{total}", String(images.length))}</Badge>}
						</Box>
					</ModalBody>
				</ModalContent>
			</Modal>
				<Modal motionPreset="none" isOpen={requestModal.isOpen} onClose={() => { if (!requesting) requestModal.onClose(); }} isCentered size="lg">
					<ModalOverlay />
					<ModalContent mx="4" bg={surface} color={headingText}>
						<ModalHeader>{requestText.modalTitle}</ModalHeader>
						<ModalCloseButton isDisabled={requesting} />
						<ModalBody>
							<Text mb="4" color={mutedText} fontSize="sm">{requestText.modalDescription}</Text>
							<FormControl isRequired>
								<FormLabel>{requestText.messageLabel}</FormLabel>
								<Textarea value={requestMessage} onChange={(event) => setRequestMessage(event.target.value)} maxLength={2000} minH="140px" placeholder={requestText.messagePlaceholder} />
							</FormControl>
							<FormControl mt="4">
								<FormLabel>{requestText.dateLabel}</FormLabel>
								<Input type="date" min={minimumRequestDate} value={requestDate} onChange={(event) => setRequestDate(event.target.value)} />
							</FormControl>
							<FormControl mt="4">
								<FormLabel>{requestText.phoneLabel}</FormLabel>
								<Input type="tel" value={requestPhone} onChange={(event) => setRequestPhone(event.target.value)} maxLength={40} placeholder={requestText.phonePlaceholder} />
							</FormControl>
						</ModalBody>
						<ModalFooter gap="3">
							<Button variant="ghost" onClick={requestModal.onClose} isDisabled={requesting}>{requestText.cancel}</Button>
							<Button color={actionText} bg={actionBg} _hover={{ bg: actionHover }} _active={{ bg: actionActive }} isLoading={requesting} isDisabled={requestMessage.trim().length < 10} onClick={async () => {
								setRequesting(true);
								try {
									await axios.post("/api/serviceRequests", { itemId, message: requestMessage, preferredAt: requestDate || undefined, contactPhone: requestPhone });
									requestModal.onClose();
									setRequestMessage(""); setRequestDate(""); setRequestPhone("");
									toast({ title: requestText.sentTitle, description: requestText.sentDescription, status: "success", duration: 5000, isClosable: true });
								} catch (requestError: any) {
									toast({ title: requestText.failedTitle, description: requestError?.response?.data?.err || requestText.failedDescription, status: "error", duration: 6000, isClosable: true });
								} finally { setRequesting(false); }
							}}>{requestText.submit}</Button>
						</ModalFooter>
					</ModalContent>
				</Modal>
				<Modal motionPreset="none" isOpen={reportModal.isOpen} onClose={() => { if (!reporting) reportModal.onClose(); }} isCentered size="lg">
					<ModalOverlay />
					<ModalContent mx="4" bg={surface} color={headingText}>
						<ModalHeader>{detailText.reportTitle}</ModalHeader><ModalCloseButton isDisabled={reporting} />
						<ModalBody><Text mb="4" color={mutedText} fontSize="sm">{detailText.reportDescription}</Text>
							<FormControl isRequired><FormLabel>{detailText.reportReason}</FormLabel><Select value={reportReason} onChange={(event) => setReportReason(event.target.value)} placeholder={detailText.reportReason}>{Object.entries(detailText.reportReasons).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</Select></FormControl>
							<FormControl mt="4" isRequired={reportReason === "OTHER"}><FormLabel>{detailText.reportDetails}</FormLabel><Textarea value={reportDetails} onChange={(event) => setReportDetails(event.target.value)} maxLength={1200} minH="120px" placeholder={detailText.reportDetailsPlaceholder} /></FormControl>
						</ModalBody>
						<ModalFooter gap="3"><Button variant="ghost" onClick={reportModal.onClose} isDisabled={reporting}>{requestText.cancel}</Button><Button color={actionText} bg={actionBg} _hover={{ bg: actionHover }} isLoading={reporting} isDisabled={!reportReason || (reportReason === "OTHER" && reportDetails.trim().length < 10)} onClick={() => void submitListingReport()}>{detailText.submitReport}</Button></ModalFooter>
					</ModalContent>
				</Modal>
		</>
	);
};

export const ItemDetailLoading = () => {
	return (
		<SimpleGrid
			columns={[1, null, 2]}
			px={MyTheme.paddings.pagePadding}
			py="10"
			spacing={"16"}
		>
			<Flex flex={1} direction="column">
				<Skeleton
					width="full"
					height="400px"
					borderRadius={"xl"}
					mb="10"
					boxShadow={"xl"}
				/>
				<SimpleGrid columns={[2, 3]} spacing="5">
					{[...Array(3)].map((img, i) => {
						return (
							<Skeleton
								key={i}
								width={"full"}
								height="150px"
								boxShadow={"lg"}
											borderRadius="lg"
							/>
						);
					})}
				</SimpleGrid>
			</Flex>

			<Flex flex={1} direction="column">
				<Skeleton height={"50px"} width="full" mb="2"></Skeleton>
				<SkeletonText
					width={"200px"}
					lineHeight="30px"
					noOfLines={1}
					mb="5"
				></SkeletonText>
				<SkeletonText></SkeletonText>
				<SkeletonText my="3"></SkeletonText>
				<SkeletonText></SkeletonText>

				<Box my="5">
					<Skeleton
						width={"40"}
						height="7"
						color="mainorange"
						as="h2"
						size="md"
					></Skeleton>
					<SimpleGrid p="4" spacing={"5"} columns={[1, 2]}>
						<Skeleton
							width={"full"}
							height="24"
							boxShadow="md"
							borderRadius={"xl"}
						></Skeleton>
						<Skeleton
							width={"full"}
							height="24"
							boxShadow="md"
							borderRadius={"xl"}
						></Skeleton>
					</SimpleGrid>
				</Box>
				<Box my="5">
					<Skeleton
						width={"40"}
						height="7"
						color="mainorange"
						as="h2"
						size="md"
					></Skeleton>
					<SimpleGrid p="4" spacing={"5"} columns={[1, 2, 3]}>
						{[...Array(5)].map((v, i) => (
							<Skeleton
								key={i}
								width={"full"}
								height="24"
								boxShadow="md"
								borderRadius={"xl"}
							></Skeleton>
						))}
					</SimpleGrid>
				</Box>
			</Flex>
		</SimpleGrid>
	);
};

export const ItemDetailErrorMessage = () => {
	return (
		<Flex px={MyTheme.paddings.pagePadding} py="10">
			<Alert
				borderRadius="md"
				flexDirection={"column"}
				variant={"top-accent"}
				colorScheme={"red"}
				alignItems="center"
				justifyContent={"center"}
			>
				<AlertIcon boxSize={"24"}>
					<FaExclamationCircle />
				</AlertIcon>
				<AlertTitle mt="5" fontSize={"2xl"}>
					Error Loading Item Details
				</AlertTitle>
				<AlertDescription>
					Please Check your Internet Connection and Try Again
				</AlertDescription>
			</Alert>
		</Flex>
	);
};

export const getServerSideProps = withSessionSsr(async ({ req, params }) => {
	let user = req.user;
	const { itemId } = params;
	if (typeof itemId !== "string" || !/^[A-Za-z0-9_-]{8,128}$/.test(itemId)) {
		return { notFound: true };
	}

	const item = await prisma.item.findUnique({
		where: {
			id: itemId as string,
		},
		include: {
			Car: true,
			House: true,
			BusinessSpace: true,
			Service: true,
			ServiceReviews: {
				include: { reviewer: { select: { firstName: true, lastName: true } } },
				orderBy: { createdAt: "desc" },
				take: 10,
			},
			user: {
				select: {
					id: true,
					firstName: true,
					lastName: true,
					profile_url: true,
					bio: true,
				},
			},
		},
	});

	if (!item || (item.status !== "APPROVED" && item.userId !== user?.id && user?.role !== "ADMIN")) {
		return { notFound: true };
	}
	item["createdAt"] = item.createdAt.toString() as any;
	item.ServiceReviews?.forEach((review: any) => { review.createdAt = review.createdAt.toISOString(); });
	if (!user) user = null;
	const serviceRatingData = item.itemType === "SERVICE"
		? await prisma.serviceReview.aggregate({ where: { itemId: item.id }, _avg: { rating: true }, _count: { _all: true } })
		: null;
	const serviceRating = { average: serviceRatingData?._avg.rating || 0, count: serviceRatingData?._count._all || 0 };

	const paymentConfig = getListingPaymentConfig();

	return {
		props: { itemId, item, user, paymentFee: LISTING_FEE, paymentEnabled: paymentConfig.enabled, serviceRating },
	};
});
export default ItemDetail;
