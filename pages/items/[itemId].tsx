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
	SimpleGrid,
	Skeleton,
	SkeletonText,
	Spinner,
	Text,
	useToast,
	Wrap,
	WrapItem,
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
import { useEffect, useState } from "react";
import { FaExclamationCircle, FaHeart, FaRegHeart } from "react-icons/fa";
import { MdArrowBack, MdFullscreen } from "react-icons/md";
import { generateNextSeo } from "next-seo/pages";
import Head from "next/head";
import { formatPrice } from "@libs/helpers/util.client";
import { ListingImage } from "@components/shared/ListingImage";
import { getMediaUrl } from "@libs/helpers/media";
import { ColorModeToggle } from "@components/shared/ColorModeToggle";
import { BrandLogo } from "@components/shared/BrandLogo";

const SaveButton = ({ user }) => {
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
					title: "Item Saved",
					status: "success",
				});
			})
			.catch((err) => {
				toast({
					title: "Error Saving item",
					description: err?.response?.data?.err || "Please try again.",
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
					title: "Item Unsaved",
					status: "success",
				});
			})
			.catch((err) => {
				toast({
					title: "Error deleting saved item",
					description: err?.response?.data?.err || "Please try again.",
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
	const methodsLabel = labels.methods;

	return (
		<Flex direction="column" gap="3" p={{ base: 4, md: 5 }} mb="5" border="1px solid" borderColor={border} borderRadius="2xl" bg={surface}>
			<Box>
				<Heading size="sm">{labels.title}</Heading>
				<Text mt="2" fontSize="sm" color="gray.600">{labels.description}</Text>
			</Box>
			<Flex align="center" justify="space-between" gap="4" wrap="wrap">
				<Text fontSize="sm" fontWeight="semibold">{labels.oneTime}</Text>
				<Heading size="md" color="mainorange">{LISTING_CURRENCY} {fee.toLocaleString("en-US")}</Heading>
			</Flex>
			<Button colorScheme="orange" onClick={startCheckout} isLoading={checkoutLoading} isDisabled={checkoutLoading || !enabled}>
				{item.paymentStatus === "PROCESSING" ? labels.continueCheckout : labels.payButton}
			</Button>
			{enabled && <Text fontSize="xs" color="gray.600">{methodsLabel}</Text>}
			{!enabled && <Text fontSize="xs" color="gray.600">{labels.notConfigured}</Text>}
		</Flex>
	);
};

const ItemDetail = ({ itemId, user, item, paymentFee, paymentEnabled }) => {
	const router = useRouter();
	const lang = useLang();
	const businessText = lang.businessListing;
	const serviceText = lang.serviceListing;
	const vehicleText = lang.vehicleListing;
	const surface = useColorModeValue("white", "#111111");
	const subtleBorder = useColorModeValue("gray.200", "whiteAlpha.200");
	const mutedText = useColorModeValue("gray.600", "gray.300");
	const headingText = useColorModeValue("maingray", "gray.100");
	const canvas = useColorModeValue("#f5f5f1", "#000000");
	const navBackground = useColorModeValue("maingray", "#000000");
	const imageFallback = useColorModeValue("gray.100", "#101010");
	const priceSurface = useColorModeValue("orange.50", "whiteAlpha.100");
	const priceBorder = useColorModeValue("orange.100", "whiteAlpha.200");
	const [preview, setPreview] = useState(item?.images?.[0]);
	const data = item;
	const images = Array.isArray(data?.images) ? data.images : [];
	const activeImageNumber = Math.max(0, images.indexOf(preview)) + 1;
	const detailRelation = data.itemType === "HOUSE" ? "House" : data.itemType === "CAR" ? "Car" : data.itemType === "BUSINESS_SPACE" ? "BusinessSpace" : "Service";
	const relationData = data[detailRelation];
	const listingDetails = Array.isArray(relationData) ? relationData[0] : relationData;
	const priceTypeLabel = data.priceType === "NEGOTIABLE" ? "Negotiable" : "Fixed price";
	const priceFrequency = ["BUSINESS_SPACE", "HOUSE"].includes(data.itemType) && listingDetails?.type === "RENT" && listingDetails?.priceFrequency
		? businessText.frequencies[listingDetails.priceFrequency]
		: null;

	// check if saved
	return (
		<>
			<Head>
				{generateNextSeo({
					title: `${data.title} - Habesha Brokers`,
					description: data.description || "No Description - Habesha Brokers",
					openGraph: {
						title: data.title,
						description: data.description || "No Description - Habesha Brokers",
						images: (data.images || []).map((value: string) => ({
							url: getMediaUrl(value, "items"),
							alt: data.title,
						})),
					},
				})}
			</Head>
			<Flex direction="column" overflow="auto" minH="100dvh" bg={canvas}>
				<Flex
					px={{ base: 3, md: 8, xl: 12 }}
					minH={MyTheme.size.navbarHeightCompact}
					background={navBackground}
					color="white"
					alignItems={"center"}
					boxShadow="0 8px 24px rgba(8,24,30,.12)"
				>
					<IconButton
						colorScheme="whiteAlpha"
						aria-label="Go back"
						mr={{ base: 2, md: 4 }}
						onClick={() => router.back()}
					>
						<MdArrowBack size="20px" />
					</IconButton>
					<BrandLogo compact />
					<Box flex={1}></Box>
					<HStack spacing={{ base: 1, md: 4 }} flexShrink={0}>
						<ColorModeToggle />
						{data && (
							<HStack spacing={{ base: 1, md: 3 }} pl={{ base: 2, md: 4 }} borderLeft="1px solid" borderColor="whiteAlpha.300">
								{user && data.userId === user.id && (
									<Link legacyBehavior href={"/items/edit/" + itemId} passHref>
										<Button as="a" display={{ base: "none", sm: "inline-flex" }} size="md" colorScheme="whiteAlpha" leftIcon={<EditIcon />}>Edit Item</Button>
									</Link>
								)}
								{user && data.userId === user.id && <Link legacyBehavior href={"/items/edit/" + itemId} passHref><IconButton as="a" display={{ base: "inline-flex", sm: "none" }} aria-label="Edit item" title="Edit item" size="sm" colorScheme="whiteAlpha" icon={<EditIcon />} /></Link>}
								{user && data.status === "APPROVED" && <SaveButton user={user} />}
							</HStack>
						)}
					</HStack>
				</Flex>
				{data && (
					<SimpleGrid
						w="full"
						maxW="1500px"
						mx="auto"
							templateColumns={{ base: "minmax(0, 1fr)", lg: "minmax(0, 1.08fr) minmax(390px, .92fr)" }}
						px={{ base: 4, md: 8, xl: 12 }}
						py={{ base: 6, md: 10 }}
						spacing={{ base: 6, xl: 8 }}
						alignItems="start"
					>
							<Flex minW="0" direction="column" gap="4">
							<Flex minW="0" direction="column" bg={surface} border="1px solid" borderColor={subtleBorder} borderRadius="2xl" overflow="hidden" boxShadow="0 12px 32px rgba(21,42,44,.08)">
								<Box position="relative" w="full" h={{ base: "300px", md: "440px", xl: "520px" }} bg={imageFallback}>
									<ListingImage alt={item.title} src={preview} itemType={item.itemType} w="full" h="full" />
									{images.length > 0 && (
										<Badge position="absolute" right="4" bottom="4" zIndex="1" color="white" bg="blackAlpha.700" borderRadius="full" px="3" py="1">
											{activeImageNumber} / {images.length} photos
										</Badge>
									)}
								</Box>
							{images.length > 1 && (
								<SimpleGrid columns={{ base: 3, sm: 4 }} spacing="3" p={{ base: 3, md: 4 }}>
									{images.map((img, index) => (
										<Box as="button" type="button" aria-label={"View photo " + (index + 1) + " for " + data.title} aria-pressed={preview === img} key={index + "-" + img} onClick={() => setPreview(img)} position="relative" border="2px solid" borderColor={preview === img ? "mainorange" : "transparent"} borderRadius="xl" overflow="hidden" transition="border-color .16s ease, transform .16s ease" _hover={{ transform: "translateY(-2px)" }} _focusVisible={{ outline: "3px solid", outlineColor: "orange.300" }}>
											<Box
												_hover={{
													background: "#0008",
												}}
												position={"absolute"}
												top="0"
												left={"0"}
												display={"block"}
												width="100%"
												height={"100%"}
												background={preview === img ? "blackAlpha.300" : "transparent"}
												borderRadius={"lg"}
												transition="all .3s ease"
											>
												<Flex
													width={"100%"}
													height={"100%"}
													alignItems={"center"}
													justifyContent="center"
												>
													<MdFullscreen color="white" size="24px" />
												</Flex>
											</Box>
											<ListingImage alt={data.title} src={img} itemType={data.itemType} w="full" h="100px" />
										</Box>
									))}
								</SimpleGrid>
							)}
						</Flex>
							{data.itemType === "HOUSE" && listingDetails?.video && <Box minW="0" bg={surface} border="1px solid" borderColor={subtleBorder} borderRadius="2xl" p={{ base: 4, md: 5 }} boxShadow="0 12px 32px rgba(21,42,44,.08)">
								<Heading color={headingText} size="sm" mb="3">{businessText.video}</Heading>
								<video aria-label={businessText.videoPreview} controls preload="metadata" src={getMediaUrl(listingDetails.video, "items")} style={{ width: "100%", maxHeight: 440, borderRadius: 12, background: "#000000" }} />
							</Box>}
							</Flex>
							<Flex minW="0" direction="column" bg={surface} border="1px solid" borderColor={subtleBorder} borderRadius="2xl" p={{ base: 5, md: 7 }} boxShadow="0 12px 32px rgba(21,42,44,.08)">
								<Wrap mb="3">
								<WrapItem>
									<Badge
										variant={"subtle"}
										colorScheme={"green"}
									>
										{data.itemType === "SERVICE" ? lang.explore.card.service : data.itemType === "HOUSE" ? lang.explore.card.home : data.itemType === "CAR" ? lang.explore.card.vehicle : lang.explore.card.businessSpace}
									</Badge>
								</WrapItem>
								<WrapItem>
									{data.featured && (
										<Badge
											variant={"subtle"}
											colorScheme={"blue"}
										>
											Featured
										</Badge>
									)}
								</WrapItem>
								<WrapItem>
									{data.status && (
										<Badge
											variant={"subtle"}
											colorScheme={data.status === "APPROVED" ? "green" : data.status === "DECLINED" ? "red" : data.status === "SOLD" ? "purple" : "orange"}
										>
											{data.status}
										</Badge>
									)}
								</WrapItem>
							</Wrap>
							<Heading as="h1" mt="1" color={headingText} fontSize={{ base: "2xl", md: "3xl" }} lineHeight="1.2" letterSpacing="tight">
								{data.title}
							</Heading>
							<Flex mt="5" p={{ base: 4, md: 5 }} align={{ base: "flex-start", sm: "center" }} justify="space-between" gap="4" direction={{ base: "column", sm: "row" }} bg={priceSurface} border="1px solid" borderColor={priceBorder} borderRadius="2xl">
								<Box>
									<Text color={mutedText} fontSize="xs" fontWeight="bold" letterSpacing="wide" textTransform="uppercase">Asking price</Text>
									<Flex align="baseline" gap="2" mt="1" wrap="wrap">
										<Heading color="mainorange" fontSize={{ base: "2xl", md: "3xl" }} letterSpacing="tight">{formatPrice(data.price)}</Heading>
										<Text color={mutedText} fontWeight="semibold">ETB</Text>
										{priceFrequency && <Text color={mutedText} fontSize="sm">· {priceFrequency}</Text>}
									</Flex>
								</Box>
								<Badge colorScheme={data.priceType === "NEGOTIABLE" ? "teal" : "gray"} borderRadius="full" px="3" py="2" fontSize="xs">
									{priceTypeLabel}
								</Badge>
							</Flex>
							{data.status !== "APPROVED" && (user?.id === data.userId || user?.role === "ADMIN") && (
								<Alert status={data.status === "DECLINED" ? "error" : "warning"} borderRadius="xl" mb="4">
									<AlertIcon />
									<AlertDescription>
										{data.status === "DECLINED"
											? "This listing was declined. Edit it and save to send it back for review."
											: data.paymentStatus === "DUE" || data.paymentStatus === "NOT_REQUIRED"
												? lang.payments.paymentDue
												: data.paymentStatus === "PROCESSING"
													? lang.payments.processing
													: data.paymentStatus === "PAID"
														? lang.payments.paid
														: "This listing is waiting for admin review. It is not public or save-able until an admin approves it."}
									</AlertDescription>
								</Alert>
							)}
							{user?.id === data.userId && data.paymentStatus !== "PAID" && data.status !== "APPROVED" && data.status !== "SOLD" && (
								<ListingPaymentPanel item={data} fee={paymentFee} enabled={paymentEnabled} labels={lang.payments} />
							)}
							<Flex align="center" mt="5" gap="2" color={mutedText} fontSize="sm">
								<Text fontWeight="semibold">Listed</Text>
								<Text>{dayjs(data?.createdAt).fromNow()}</Text>
							</Flex>
							<Box mt="5" p={{ base: 4, md: 5 }} bg={canvas} border="1px solid" borderColor={subtleBorder} borderRadius="xl">
								<Heading color={headingText} as="h2" size="sm">Description</Heading>
								<Text mt="3" color={mutedText} fontSize="md" lineHeight="1.8" whiteSpace="pre-wrap">
									{data?.description || "No description has been added yet."}
								</Text>
							</Box>
							<Box mt="6" p={{ base: 4, md: 5 }} border="1px solid" borderColor={subtleBorder} borderRadius="2xl">
								<Heading color={headingText} size="md" as="h2">Listing details</Heading>
								<Text mt="1" color={mutedText} fontSize="sm">Key information about this listing.</Text>
								<SimpleGrid columns={{ base: 1, sm: 2 }} spacing="3" mt="5">
									{Object.entries(listingDetails || {}).map(([key, value]) => {
										if (["id", "itemId", "video"].includes(key)) return null;
						if (value === null || value === undefined || value === "" || (Array.isArray(value) && value.length === 0)) return null;
										const label = data.itemType === "BUSINESS_SPACE"
											? businessText.detailLabels[key] || key
							: data.itemType === "HOUSE"
								? businessText.detailLabels[key] || key
								: data.itemType === "CAR"
									? vehicleText.detailLabels[key] || key
											: data.itemType === "SERVICE"
												? serviceText.detailLabels[key] || key
												: key.replace(/([A-Z])/g, " $1");
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
						else if (key === "mileage" && data.itemType === "CAR") displayValue = `${Number(value).toLocaleString()} ${vehicleText.mileageUnit}`;
						else if (key === "fuel" && data.itemType === "CAR") displayValue = `${value} ${vehicleText.fuelUnit}`;
						else if (key === "cylinder" && data.itemType === "CAR") displayValue = `${value} L`;
										else if (typeof value === "boolean") displayValue = value ? businessText.yes : businessText.no;
						else if (key === "area" && ["BUSINESS_SPACE", "HOUSE"].includes(data.itemType)) displayValue = String(value) + " m²";
										return (
											<Box key={key} minW="0" p="4" bg={canvas} border="1px solid" borderColor={subtleBorder} borderRadius="xl">
												<Text color={mutedText} fontSize="xs" fontWeight="semibold" textTransform="capitalize">{label}</Text>
												<Text mt="1" fontSize="md" fontWeight="medium" color={headingText} whiteSpace="normal" wordBreak="break-word">{displayValue}</Text>
											</Box>
										);
									})}
								</SimpleGrid>
							</Box>
							<Box mt="6">
								<Heading color={headingText} as="h2" size="md" mb="3">Seller</Heading>
								<Flex align="center" gap="4" p={{ base: 4, md: 5 }} bg={canvas} border="1px solid" borderColor={subtleBorder} borderRadius="2xl">
									<Avatar size="lg" flexShrink={0} name={data.user.firstName + " " + data.user.lastName} src={getMediaUrl(data.user.profile_url, "profile")} />
									<Box minW="0">
										<Heading fontSize="md" color={headingText}>{data.user.firstName} {data.user.lastName}</Heading>
										<Text mt="1" color={mutedText} fontSize="sm">{data.user.bio || "Listing owner"}</Text>
									</Box>
								</Flex>
								<Flex mt="4" p={{ base: 4, md: 5 }} direction="column" bg={surface} border="1px solid" borderColor={subtleBorder} borderRadius="2xl">
									<Heading size="sm" color={headingText}>Contact information</Heading>
									<Box mt="3"><ContactInfo userID={data.userId} /></Box>
								</Flex>
							</Box>
						</Flex>
					</SimpleGrid>
				)}
			</Flex>
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
