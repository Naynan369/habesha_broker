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
	SimpleGrid,
	Skeleton,
	SkeletonText,
	Spinner,
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
			colorScheme="whiteAlpha"
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
	const border = useColorModeValue("orange.200", "orange.900");
	const surface = useColorModeValue("orange.50", "whiteAlpha.100");
	const mutedText = useColorModeValue("gray.600", "gray.300");
	const methodsLabel = labels.methods;

	return (
		<Flex direction="column" gap="3" p={{ base: 4, md: 5 }} mb="5" border="1px solid" borderColor={border} borderRadius="2xl" bg={surface}>
			<Box>
				<Heading size="sm">{labels.title}</Heading>
				<Text mt="2" fontSize="sm" color={mutedText}>{labels.description}</Text>
			</Box>
			<Flex align="center" justify="space-between" gap="4" wrap="wrap">
				<Text fontSize="sm" fontWeight="semibold">{labels.oneTime}</Text>
				<Heading size="md" color="mainorange">{LISTING_CURRENCY} {fee.toLocaleString("en-US")}</Heading>
			</Flex>
			<Button colorScheme="orange" onClick={startCheckout} isLoading={checkoutLoading} isDisabled={checkoutLoading || !enabled}>
				{item.paymentStatus === "PROCESSING" ? labels.continueCheckout : labels.payButton}
			</Button>
			{enabled && <Text fontSize="xs" color={mutedText}>{methodsLabel}</Text>}
			{!enabled && <Text fontSize="xs" color={mutedText}>{labels.notConfigured}</Text>}
		</Flex>
	);
};

const InteractivePhotoGallery = ({ data, images, preview, categoryLabel, detailText, imageFallback, subtleBorder, onPreview, onSelectImage, onOpenGallery }) => {
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
	const gallerySurface = useColorModeValue("white", "#111111");
	const photoCount = detailText.photoCount.replace("{current}", String(Math.max(0, images.indexOf(preview)) + 1)).replace("{total}", String(images.length));

	return (
		<>
		<Box minW="0" bg={gallerySurface} border="1px solid" borderColor={subtleBorder} borderRadius={{ base: "2xl", md: "3xl" }} overflow="hidden" boxShadow="0 18px 48px rgba(18,32,36,.10)">
			<Box position="relative" h={{ base: "min(74vw, 390px)", sm: "430px", xl: "560px" }} minH={{ base: "260px", md: "380px" }} bg={imageFallback} overflow="hidden" onPointerMove={updatePose} onPointerLeave={resetPose} style={{ perspective: "1400px", perspectiveOrigin: "var(--gallery-light-x, 50%) var(--gallery-light-y, 50%)", transformStyle: "preserve-3d" }}>
				<Box className={prefersReducedMotion ? undefined : "listing-photo-depth"} position="absolute" top="-5%" right="-5%" bottom="-5%" left="-5%" pointerEvents="none" style={{ transform: prefersReducedMotion ? "translateZ(10px)" : undefined, transformStyle: "preserve-3d" }}>
					<Box position="absolute" inset="0" pointerEvents="none" style={{ transform: prefersReducedMotion ? "none" : `rotateX(var(--gallery-rotate-x, 0deg)) rotateY(var(--gallery-rotate-y, 0deg)) scale(1.08)`, transformStyle: "preserve-3d", willChange: prefersReducedMotion ? "auto" : "transform" }}>
						<ListingImage alt={data.title} src={preview} itemType={data.itemType} w="full" h="full" loading="eager" />
					</Box>
				</Box>
				<Box className={prefersReducedMotion ? undefined : "listing-photo-sheen"} position="absolute" top="-20%" bottom="-20%" left="-40%" w="35%" pointerEvents="none" />
				<Box position="absolute" inset="0" pointerEvents="none" bg={`radial-gradient(ellipse at var(--gallery-light-x, 50%) var(--gallery-light-y, 50%), rgba(255,255,255,.22) 0%, rgba(255,255,255,0) 42%)`} style={{ mixBlendMode: "screen", transform: "translateZ(18px)" }} />
				<Flex position="absolute" inset="0" align="flex-start" justify="space-between" p={{ base: 3, md: 5 }} pointerEvents="none" style={{ transform: "translateZ(30px)", transformStyle: "preserve-3d" }}>
					<Flex gap="2" wrap="wrap">
						<Badge bg="blackAlpha.700" color="white" backdropFilter="blur(12px)" borderRadius="full" px="3" py="1.5">{categoryLabel}</Badge>
						{data.featured && <Badge bg="mainyellow" color="maingray" borderRadius="full" px="3" py="1.5">{detailText.featured}</Badge>}
					</Flex>
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

const ItemDetail = ({ itemId, user, item, paymentFee, paymentEnabled }) => {
	const router = useRouter();
	const lang = useLang();
	const businessText = lang.businessListing;
	const serviceText = lang.serviceListing;
	const listingText = lang.listingManagementPage;
	const detailText = lang.itemDetailPage;
	const vehicleText = lang.vehicleListing;
	const surface = useColorModeValue("white", "#111111");
	const subtleBorder = useColorModeValue("gray.200", "whiteAlpha.200");
	const mutedText = useColorModeValue("gray.600", "gray.300");
	const headingText = useColorModeValue("maingray", "gray.100");
	const canvas = useColorModeValue("#f5f5f1", "#000000");
	const imageFallback = useColorModeValue("gray.100", "#101010");
	const priceSurface = useColorModeValue("orange.50", "whiteAlpha.100");
	const priceBorder = useColorModeValue("orange.100", "whiteAlpha.200");
	const [preview, setPreview] = useState(item?.images?.[0]);
	const [requestMessage, setRequestMessage] = useState("");
	const [requestDate, setRequestDate] = useState("");
	const [minimumRequestDate, setMinimumRequestDate] = useState("");
	const [requestPhone, setRequestPhone] = useState("");
	const [requesting, setRequesting] = useState(false);
	const requestModal = useDisclosure();
	const galleryModal = useDisclosure();
	const toast = useToast();
	const requestText = lang.serviceListing;
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
	const preferredFacts: Record<string, string[]> = {
		HOUSE: ["bedrooms", "bathrooms", "area", "propertyType"],
		CAR: ["manufacturer", "model", "year", "mileage"],
		BUSINESS_SPACE: ["spaceType", "area", "type", "priceFrequency"],
		SERVICE: ["category", "availability", "serviceArea", "duration"],
	};
	const preferredFactItems = (preferredFacts[data.itemType] || [])
		.map((key) => detailItems.find((detail) => detail.key === key))
		.filter(Boolean);
	const highlightItems = (preferredFactItems.length ? preferredFactItems : detailItems).slice(0, 3);
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
						<Flex align="center" justify="space-between" gap="4" mb={{ base: 5, md: 7 }} wrap="wrap">
							<Flex as="nav" aria-label="Breadcrumb" align="center" minW="0" gap={{ base: 2, md: 3 }} color={mutedText} fontSize="sm">
								<Link legacyBehavior href="/" passHref><Button as="a" variant="link" color={mutedText} fontWeight="medium">{lang.nav.home}</Button></Link>
								<Text aria-hidden="true">/</Text>
								<Link legacyBehavior href="/explore" passHref><Button as="a" variant="link" color={mutedText} fontWeight="medium">{lang.nav.explore}</Button></Link>
								<Text aria-hidden="true">/</Text>
								<Text noOfLines={1} maxW={{ base: "32vw", sm: "50vw", lg: "400px" }} color={headingText} fontWeight="semibold">{data.title}</Text>
							</Flex>
							<HStack spacing="2">
								<Button display={{ base: "none", sm: "inline-flex" }} size="sm" variant="ghost" color={mutedText} leftIcon={<MdArrowBack />} onClick={() => router.back()}>{detailText.back}</Button>
								<IconButton size="sm" aria-label={detailText.shareListing} title={detailText.shareListing} icon={<MdShare />} variant="outline" borderColor={subtleBorder} onClick={() => void shareListing()} />
								{user && data.status === "APPROVED" && <SaveButton />}
							</HStack>
						</Flex>

						<SimpleGrid
							w="full"
							templateColumns={{ base: "minmax(0, 1fr)", lg: "minmax(0, 1.18fr) minmax(360px, .82fr)" }}
							spacing={{ base: 5, lg: 7 }}
							alignItems="start"
						>
							<Flex minW="0" direction="column" gap={{ base: 5, md: 6 }}>
								<InteractivePhotoGallery
									data={data}
									images={images}
									preview={preview}
									categoryLabel={categoryLabel}
									detailText={detailText}
									imageFallback={imageFallback}
									subtleBorder={subtleBorder}
									onPreview={updatePreview}
									onSelectImage={setPreview}
									onOpenGallery={galleryModal.onOpen}
								/>

								{data.itemType === "HOUSE" && listingDetails?.video && <Box>
									<Box minW="0" bg={surface} border="1px solid" borderColor={subtleBorder} borderRadius="2xl" p={{ base: 4, md: 5 }} boxShadow="0 10px 28px rgba(21,42,44,.06)">
										<Flex align="center" justify="space-between" mb="3" gap="3"><Box><Heading color={headingText} size="sm">{detailText.videoTitle}</Heading><Text mt="1" fontSize="sm" color={mutedText}>{detailText.videoDescription}</Text></Box></Flex>
										<video aria-label={businessText.videoPreview} controls preload="metadata" src={getMediaUrl(listingDetails.video, "items")} style={{ width: "100%", maxHeight: 440, borderRadius: 16, background: "#000000" }} />
									</Box>
								</Box>}

								<Box>
									<Box bg={surface} border="1px solid" borderColor={subtleBorder} borderRadius="2xl" p={{ base: 5, md: 7 }} boxShadow="0 10px 28px rgba(21,42,44,.055)">
										<Flex align="flex-start" justify="space-between" gap="4">
											<Box><Text color="mainorange" fontSize="xs" fontWeight="bold" letterSpacing=".13em" textTransform="uppercase">{detailText.descriptionEyebrow}</Text><Heading mt="2" color={headingText} as="h2" size="md">{detailText.descriptionTitle}</Heading></Box>
											<Box display={{ base: "none", sm: "flex" }} alignItems="center" justifyContent="center" w="10" h="10" borderRadius="xl" bg={priceSurface} color="mainorange"><MdLocationOn size="20" /></Box>
										</Flex>
										<Text mt="4" color={mutedText} fontSize="md" lineHeight="1.85" whiteSpace="pre-wrap">{data.description || detailText.descriptionEmpty}</Text>
									</Box>
								</Box>

								{detailItems.length > 0 && <Box>
									<Box bg={surface} border="1px solid" borderColor={subtleBorder} borderRadius="2xl" p={{ base: 5, md: 7 }} boxShadow="0 10px 28px rgba(21,42,44,.055)">
										<Flex align="flex-start" justify="space-between" gap="4" mb="5"><Box><Text color="mainorange" fontSize="xs" fontWeight="bold" letterSpacing=".13em" textTransform="uppercase">{detailText.detailsEyebrow}</Text><Heading mt="2" color={headingText} size="md" as="h2">{detailText.detailsTitle}</Heading><Text mt="2" color={mutedText} fontSize="sm">{detailText.detailsDescription}</Text></Box><Badge flexShrink={0} colorScheme="gray" borderRadius="full" px="3" py="1.5">{detailItems.length}</Badge></Flex>
										<SimpleGrid columns={{ base: 1, sm: 2 }} spacing="3">
											{detailItems.map(({ key, label, value }, index) => <Box key={key}>
												<Flex minW="0" minH="76px" direction="column" justify="center" p="4" bg={canvas} border="1px solid" borderColor={subtleBorder} borderRadius="xl">
													<Text color={mutedText} fontSize="xs" fontWeight="semibold" textTransform="capitalize">{label}</Text>
													<Text mt="1.5" fontSize="sm" fontWeight="semibold" color={headingText} whiteSpace="normal" wordBreak="break-word">{value}</Text>
												</Flex>
											</Box>)}
										</SimpleGrid>
									</Box>
								</Box>}
							</Flex>

							<Flex minW="0" direction="column" gap={{ base: 4, md: 5 }}>
								<Box>
									<Flex minW="0" direction="column" bg={surface} border="1px solid" borderColor={subtleBorder} borderRadius="2xl" p={{ base: 5, md: 7 }} boxShadow="0 18px 48px rgba(18,32,36,.085)">
										<Flex align="center" justify="space-between" gap="3" wrap="wrap">
											<Badge colorScheme="teal" variant="subtle" borderRadius="full" px="3" py="1.5">{categoryLabel}</Badge>
											{data.status && <Badge colorScheme={data.status === "APPROVED" ? "green" : data.status === "DECLINED" ? "red" : data.status === "SOLD" ? "purple" : data.status === "CLOSED" ? "gray" : "orange"} borderRadius="full" px="3" py="1.5">{statusLabels[data.status] || data.status}</Badge>}
										</Flex>
										{data.featured && <Flex mt="4" align="center" gap="2" color="mainorange" fontSize="sm" fontWeight="semibold"><Box w="2" h="2" borderRadius="full" bg="mainorange" />{detailText.featured} · {detailText.featuredDescription}</Flex>}
										<Heading as="h1" mt="4" color={headingText} fontSize={{ base: "2xl", sm: "3xl", xl: "4xl" }} lineHeight="1.12" letterSpacing="-.045em" wordBreak="break-word">{data.title}</Heading>
										<Flex align="center" gap="2" mt="4" color={mutedText} fontSize="sm"><MdLocationOn size="18" /><Text>{locationLabel || detailText.locationNotProvided}</Text></Flex>
										<Flex align="center" gap="2" mt="2" color={mutedText} fontSize="xs"><Box as="span" w="1.5" h="1.5" borderRadius="full" bg="green.400" /><Text>{detailText.listedLabel} {dayjs(data?.createdAt).fromNow()}</Text></Flex>

										<Flex mt="6" p={{ base: 4, md: 5 }} align={{ base: "flex-start", sm: "center" }} justify="space-between" gap="4" direction={{ base: "column", sm: "row" }} bg={priceSurface} border="1px solid" borderColor={priceBorder} borderRadius="2xl">
											<Box><Text color={mutedText} fontSize="xs" fontWeight="bold" letterSpacing=".1em" textTransform="uppercase">{detailText.askingPrice}</Text><Flex align="baseline" gap="2" mt="1" wrap="wrap"><Heading color="mainorange" fontSize={{ base: "2xl", md: "3xl" }} letterSpacing="tight">{formatPrice(data.price)}</Heading><Text color={mutedText} fontWeight="semibold">ETB</Text>{priceFrequency && <Text color={mutedText} fontSize="sm">· {priceFrequency}</Text>}</Flex></Box>
											<Badge colorScheme={data.priceType === "NEGOTIABLE" ? "teal" : "gray"} borderRadius="full" px="3" py="2" fontSize="xs">{priceTypeLabel}</Badge>
										</Flex>

										{highlightItems.length > 0 && <SimpleGrid columns={{ base: 1, sm: 2 }} spacing="2.5" mt="4">{highlightItems.map((fact) => <Box key={fact.key}><Flex minW="0" align="center" justify="space-between" gap="3" px="3.5" py="3" bg={canvas} border="1px solid" borderColor={subtleBorder} borderRadius="xl"><Text color={mutedText} fontSize="xs" noOfLines={1}>{fact.label}</Text><Text color={headingText} fontSize="sm" fontWeight="bold" noOfLines={1}>{fact.value}</Text></Flex></Box>)}</SimpleGrid>}

										<Flex mt="5" direction={{ base: "column", sm: "row" }} gap="2.5">
											<Button flex="1" as="a" href="#seller-contact" color="white" bg="mainorange" borderRadius="xl" h="12" _hover={{ bg: "#ad582a", transform: "translateY(-1px)" }} transition="none">{detailText.contactOwner}</Button>
											{user?.id === data.userId && <Link legacyBehavior href={"/items/edit/" + itemId} passHref><Button as="a" flex="1" variant="outline" borderColor={subtleBorder} borderRadius="xl" h="12" leftIcon={<EditIcon />}>{detailText.editListing}</Button></Link>}
										</Flex>
									</Flex>
								</Box>

								{data.status !== "APPROVED" && (user?.id === data.userId || user?.role === "ADMIN") && <Box>
									<Alert status={data.status === "DECLINED" ? "error" : data.status === "CLOSED" || data.status === "SOLD" ? "info" : "warning"} borderRadius="xl" boxShadow="0 8px 24px rgba(21,42,44,.05)">
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
									</Alert>
								</Box>}
								{user?.id === data.userId && data.paymentStatus !== "PAID" && data.status !== "APPROVED" && data.status !== "SOLD" && data.status !== "CLOSED" && <ListingPaymentPanel item={data} fee={paymentFee} enabled={paymentEnabled} labels={lang.payments} />}

								<Box>
									<Flex id="seller-contact" scrollMarginTop="100px" direction="column" bg={surface} border="1px solid" borderColor={subtleBorder} borderRadius="2xl" p={{ base: 5, md: 6 }} boxShadow="0 10px 28px rgba(21,42,44,.055)">
										<Flex align="center" gap="4" mb="5">
											<Avatar size="lg" flexShrink={0} name={data.user.firstName + " " + data.user.lastName} src={getMediaUrl(data.user.profile_url, "profile")} />
											<Box minW="0"><Text color="mainorange" fontSize="xs" fontWeight="bold" letterSpacing=".1em" textTransform="uppercase">{detailText.ownerLabel}</Text><Heading mt="1" fontSize="lg" color={headingText}>{data.user.firstName} {data.user.lastName}</Heading><Text mt="1" color={mutedText} fontSize="sm">{data.user.bio || detailText.ownerFallback}</Text></Box>
										</Flex>
										{data.itemType === "SERVICE" && data.status === "APPROVED" && data.userId !== user?.id && <Box mb="5" p="4" bg={priceSurface} border="1px solid" borderColor={priceBorder} borderRadius="xl"><Heading size="sm" color={headingText}>{requestText.requestTitle}</Heading><Text mt="2" color={mutedText} fontSize="sm" lineHeight="1.65">{requestText.requestDescription}</Text><Button mt="4" w="full" colorScheme="orange" borderRadius="lg" onClick={() => { if (!user) { void router.push("/auth/login", undefined, { locale: router.locale }); return; } if (!user.verfied) { void router.push("/dashboard/verify-account", undefined, { locale: router.locale }); return; } requestModal.onOpen(); }}>{requestText.requestButton}</Button></Box>}
										<Box pt="4" borderTop="1px solid" borderColor={subtleBorder}><Heading color={headingText} size="sm">{detailText.contactTitle}</Heading><Text mt="1" color={mutedText} fontSize="sm">{detailText.contactDescription}</Text><Box mt="4"><ContactInfo userID={data.userId} size="sm" appearance="subtle" /></Box></Box>
									</Flex>
								</Box>
							</Flex>
						</SimpleGrid>
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
							<Button colorScheme="orange" isLoading={requesting} isDisabled={requestMessage.trim().length < 10} onClick={async () => {
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
	if (!user) user = null;

	const paymentConfig = getListingPaymentConfig();

	return {
		props: { itemId, item, user, paymentFee: LISTING_FEE, paymentEnabled: paymentConfig.enabled },
	};
});
export default ItemDetail;
