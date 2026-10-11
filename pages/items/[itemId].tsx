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
import { NextSeo } from "next-seo";
import { formatPrice } from "@libs/helpers/util.client";
import { ListingImage } from "@components/shared/ListingImage";
import { getMediaUrl } from "@libs/helpers/media";
import { ColorModeToggle } from "@components/shared/ColorModeToggle";

const SaveButton = ({ user }) => {
	const toast = useToast();
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
			{data?.saved ? "Saved" : "Save"}
		</Button>
	);
};

const ListingPaymentPanel = ({ item, fee, enabled, testMode, labels }) => {
	const toast = useToast();
	const router = useRouter();
	const [loading, setLoading] = useState<"chapa" | "simulate" | false>(false);
	const border = useColorModeValue("orange.200", "orange.900");
	const surface = useColorModeValue("orange.50", "whiteAlpha.100");

	const startPayment = async () => {
		if (loading || !enabled) return;
		setLoading("chapa");
		try {
			const response = await axios.post("/api/items/payment/initialize", {
				itemId: item.id,
				locale: router.locale === "am" ? "am" : "en",
			});
			if (typeof response.data?.checkoutUrl !== "string") throw new Error("Secure checkout link was not returned");
			window.location.assign(response.data.checkoutUrl);
		} catch (error: any) {
			toast({ title: "Could not start payment", description: error?.response?.data?.err || error?.message || "Please try again.", status: "error", isClosable: true });
			setLoading(false);
		}
	};

	const simulatePayment = async () => {
		if (loading || !testMode) return;
		setLoading("simulate");
		try {
			await axios.post("/api/items/payment/simulate", { itemId: item.id });
			toast({ title: labels.testPaidTitle, description: labels.testPaidDescription, status: "success", isClosable: true });
			router.reload();
		} catch (error: any) {
			toast({ title: labels.testPaymentFailed, description: error?.response?.data?.err || error?.message || "Please try again.", status: "error", isClosable: true });
			setLoading(false);
		}
	};

	return (
		<Flex direction="column" gap="3" p={{ base: 4, md: 5 }} mb="5" border="1px solid" borderColor={border} borderRadius="2xl" bg={surface}>
			<Box>
				<Heading size="sm">{labels.title}</Heading>
				<Text mt="2" fontSize="sm" color="gray.600">{labels.description}</Text>
			</Box>
			<Flex align="center" justify="space-between" gap="4" wrap="wrap">
				<Text fontSize="sm" fontWeight="semibold">{labels.oneTime}</Text>
				<Heading size="md" color="mainorange">{fee ? fee.toLocaleString("en-US") + " ETB" : "—"}</Heading>
			</Flex>
			{enabled && <Button colorScheme="orange" onClick={startPayment} isLoading={loading === "chapa"} isDisabled={Boolean(loading) || !fee}>
				{item.paymentStatus === "PROCESSING" ? labels.continueCheckout : labels.payButton}
			</Button>}
			{testMode && <Button variant="outline" colorScheme="blue" onClick={simulatePayment} isLoading={loading === "simulate"} isDisabled={Boolean(loading) || !fee}>
				{labels.simulatePayment}
			</Button>}
			{enabled && <Text fontSize="xs" color="gray.600">{labels.methods}</Text>}
			{!enabled && !testMode && <Text fontSize="xs" color="gray.600">{labels.notConfigured}</Text>}
			{testMode && <Text fontSize="xs" color="blue.600">{labels.testModeNotice}</Text>}
		</Flex>
	);
};

const ItemDetail = ({ itemId, user, item, paymentFee, paymentEnabled, testPaymentEnabled }) => {
	const router = useRouter();
	const lang = useLang();
	const businessText = lang.businessListing;
	const serviceText = lang.serviceListing;
	const surface = useColorModeValue("white", "#1b2a30");
	const subtleBorder = useColorModeValue("gray.200", "whiteAlpha.200");
	const mutedText = useColorModeValue("gray.600", "gray.300");
	const headingText = useColorModeValue("maingray", "gray.100");
	const canvas = useColorModeValue("#f5f5f1", "#10191d");
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
	const priceFrequency = data.itemType === "BUSINESS_SPACE" && listingDetails?.type === "RENT" && listingDetails?.priceFrequency
		? businessText.frequencies[listingDetails.priceFrequency]
		: null;

	// check if saved
	return (
		<>
			<NextSeo
				title={`${data.title} - Habesha Brokers`}
				description={`${data.description}`}
				openGraph={{
					title: `${data.title}`,
					description: data.description
						? data.description
						: "No Description - Habesha Brokers",
					images: (data.images || []).map((value: string) => ({
						url: getMediaUrl(value, "items"),
						alt: data.title,
					})),
				}}
			/>
			<Flex direction="column" overflow="auto" minH="100vh" bg={canvas}>
				<Flex
					px={{ base: 4, md: 8, xl: 12 }}
					minH={MyTheme.size.navbarHeightCompact}
					background={"maingray"}
					color="white"
					alignItems={"center"}
					boxShadow="0 8px 24px rgba(8,24,30,.12)"
				>
					<IconButton
						colorScheme="whiteAlpha"
						aria-label="Go back"
						mr="4"
						onClick={() => router.back()}
					>
						<MdArrowBack size="20px" />
					</IconButton>
					<Heading fontSize={{ base: "md", md: "lg" }} letterSpacing="tight">Habesha Brokers</Heading>
					<Box flex={1}></Box>
					<HStack spacing={{ base: 3, md: 4 }} flexShrink={0}>
						<ColorModeToggle />
						{data && (
							<HStack spacing={{ base: 2, md: 3 }} pl={{ base: 3, md: 4 }} borderLeft="1px solid" borderColor="whiteAlpha.300">
								{user && data.userId === user.id && (
									<Link href={"/items/edit/" + itemId} passHref>
										<Button as="a" size="md" colorScheme="whiteAlpha" leftIcon={<EditIcon />}>Edit Item</Button>
									</Link>
								)}
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
							<Flex minW="0" direction="column" bg={surface} border="1px solid" borderColor={subtleBorder} borderRadius="2xl" overflow="hidden" boxShadow="0 12px 32px rgba(21,42,44,.08)">
								<Box position="relative" w="full" h={{ base: "300px", md: "440px", xl: "520px" }} bg="gray.100">
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
											: data.paymentStatus === "DUE"
												? lang.payments.paymentDue
												: data.paymentStatus === "PROCESSING"
													? lang.payments.processing
													: data.paymentStatus === "PAID"
														? lang.payments.paid
														: "This listing is waiting for admin review. It is not public or save-able until an admin approves it."}
									</AlertDescription>
								</Alert>
							)}
							{user?.id === data.userId && data.paymentStatus !== "PAID" && data.paymentStatus !== "NOT_REQUIRED" && data.status !== "APPROVED" && data.status !== "SOLD" && (
								<ListingPaymentPanel item={data} fee={paymentFee} enabled={paymentEnabled} testMode={testPaymentEnabled} labels={lang.payments} />
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
										if (["id", "itemId"].includes(key)) return null;
										const label = data.itemType === "BUSINESS_SPACE"
											? businessText.detailLabels[key] || key
											: data.itemType === "SERVICE"
												? serviceText.detailLabels[key] || key
												: key.replace(/([A-Z])/g, " $1");
										let displayValue = String(value ?? "");
										if (key === "category" && data.itemType === "SERVICE") displayValue = serviceText.categories[value as string] || displayValue;
										else if (key === "spaceType") displayValue = businessText.spaceTypes[value as string] || displayValue;
										else if (key === "type" && data.itemType === "BUSINESS_SPACE") displayValue = value === "RENT" ? businessText.rent : businessText.sale;
										else if (key === "priceFrequency") displayValue = businessText.frequencies[value as string] || displayValue;
										else if (typeof value === "boolean") displayValue = value ? businessText.yes : businessText.no;
										else if (key === "area" && data.itemType === "BUSINESS_SPACE") displayValue = String(value) + " m²";
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
	let user = req.session.user;
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

	const paymentFee = Number(process.env.LISTING_FEE_ETB ?? process.env.CAR_LISTING_FEE_ETB);
	const validPaymentFee = Number.isFinite(paymentFee) && paymentFee > 0 ? paymentFee : 0;
	const paymentEnabled = Boolean(process.env.CHAPA_SECRET_KEY?.trim() && validPaymentFee);
	const testPaymentEnabled = process.env.NODE_ENV === "development" && process.env.ENABLE_TEST_LISTING_PAYMENTS === "true";

	return {
		props: { itemId, item, user, paymentFee: validPaymentFee, paymentEnabled, testPaymentEnabled },
	};
});
export default ItemDetail;
