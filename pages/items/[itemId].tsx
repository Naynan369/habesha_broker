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
	Stat,
	StatLabel,
	StatNumber,
	Text,
	useToast,
	Wrap,
	WrapItem,
} from "@chakra-ui/react";
import { ContactInfo } from "@components/ContactInfo";
import { withSessionSsr } from "@config/cookie/cookie";
import { dayjs } from "@config/dayjs";
import { MyTheme } from "@config/theme/MyTheme";
import { prisma } from "@config/prisma";
import axios from "axios";
import Link from "next/link";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { FaExclamationCircle, FaHeart, FaRegHeart } from "react-icons/fa";
import { MdArrowBack, MdFullscreen } from "react-icons/md";
import { NextSeo } from "next-seo";
import { formatPrice } from "@libs/helpers/util.client";
import { ListingImage } from "@components/shared/ListingImage";
import { getMediaUrl } from "@libs/helpers/media";

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
					description: "Please try again",
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
					description: "Please try again",
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

const ItemDetail = ({ itemId, user, item }) => {
	const router = useRouter();
	const [preview, setPreview] = useState(item?.images[0]);
	const data = item;

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
			<Flex direction="column" overflow="auto">
				<Flex
					px={MyTheme.paddings.pagePadding}
					height={MyTheme.size.navbarHeightCompact}
					background={"maingray"}
					color="white"
					alignItems={"center"}
				>
					<IconButton
						colorScheme="whiteAlpha"
						aria-label="Go back"
						mr="4"
						onClick={() => router.back()}
					>
						<MdArrowBack size="20px" />
					</IconButton>
					<Heading fontSize="lg">Habesha Brokers</Heading>
					<Box flex={1}></Box>
					{data && (
						<HStack>
							{user && data.userId === user.id && (
								<Link href={"/items/edit/" + itemId} passHref>
									<Button as="a" size="md" colorScheme="whiteAlpha" leftIcon={<EditIcon />}>Edit Item</Button>
								</Link>
							)}
							{user && <SaveButton user={user} />}
						</HStack>
					)}
				</Flex>
				{data && (
					<SimpleGrid
						columns={[1, null, 2]}
						px={MyTheme.paddings.pagePadding}
						py="10"
						spacing={"16"}
					>
						<Flex flex={1} direction="column">
							<ListingImage alt={item.title} src={preview} itemType={item.itemType} w="full" h={{ base: "300px", md: "520px" }} borderRadius="2xl" mb="8" />
							<SimpleGrid columns={[2, 3]} spacing="5">
								{data?.images.map((img) => {
									return (
										<Box as="button" type="button" aria-label={"View photo for " + data.title} key={img} onClick={() => setPreview(img)} position="relative" borderRadius="lg" overflow="hidden" _focusVisible={{ outline: "3px solid", outlineColor: "orange.300" }}>
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
												background="transparent"
												borderRadius={"lg"}
												transition="all .3s ease"
											>
												<Flex
													width={"100%"}
													height={"100%"}
													alignItems={"center"}
													justifyContent="center"
												>
													<MdFullscreen
														color="white"
														size={"30px"}
													/>
												</Flex>
											</Box>
											<ListingImage alt={data.title} src={img} itemType={data.itemType} w="full" h="120px" borderRadius="lg" />
										</Box>
									);
								})}
							</SimpleGrid>
						</Flex>
						<Flex flex={1} direction="column">
							<Heading as="h1">{data?.title}</Heading>
							<Wrap my="2">
								<WrapItem>
									<Badge
										variant={"subtle"}
										colorScheme={"green"}
									>
										{data.itemType}
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
											colorScheme={"red"}
										>
											{data.status}
										</Badge>
									)}
								</WrapItem>
							</Wrap>
							<Text
								fontWeight={"bold"}
								color="gray"
								fontSize={"sm"}
								as="h3"
							>
								Posted {dayjs(data?.createdAt).fromNow()}
							</Text>
							<Text my="5" fontSize={"lg"} whiteSpace="pre-wrap">
								{data?.description
									? data?.description
									: "No Description added"}
							</Text>
							<Box my="5">
								<Heading color="mainorange" as="h2" size="md">
									Price
								</Heading>
								<SimpleGrid
									p="4"
									spacing={"5"}
									columns={[1, 2]}
								>
									<Stat
										p="4"
										boxShadow="md"
										borderRadius={"xl"}
									>
										<StatLabel>Price Type</StatLabel>
										<StatNumber>
											{data.priceType}
										</StatNumber>
									</Stat>
									<Stat
										boxShadow="md"
										p="4"
										borderRadius={"xl"}
									>
										<StatLabel>Price</StatLabel>
										<StatNumber>
											{formatPrice(data.price)} ETB
										</StatNumber>
									</Stat>
								</SimpleGrid>
							</Box>
							<Box my="5">
								<Heading color="mainorange" size="md" as={"h2"}>
									Details
								</Heading>
								<Wrap p="4" spacing="5">
									{Object.entries(
										data[
											data.itemType.charAt(0) +
												data.itemType
													.slice(1)
													.toLowerCase()
										]?.[0] || {}
									).map(([key, value]) => {
										if (key == "id") {
											return;
										}
										return (
											<WrapItem key={key}>
												<Stat
													p="4"
													minW={"40"}
													boxShadow="md"
													borderRadius={"xl"}
												>
													<StatLabel
														textTransform={
															"capitalize"
														}
													>
														{key}
													</StatLabel>
													<StatNumber>
														{value}
													</StatNumber>
												</Stat>
											</WrapItem>
										);
									})}
								</Wrap>
							</Box>
							<Box>
								<Heading color="mainorange" as="h2" size="md">
									Posted By
								</Heading>
								<Flex direction={"column"} p="4">
									<Flex
										borderRadius={"md"}
										boxShadow="md"
										alignItems="center"
										p="4"
										my="5"
									>
										<Avatar
											mr="4"
											src={getMediaUrl(data.user.profile_url, "profile")}
										></Avatar>
										<Flex
											direction="column"
											justifyContent={"center"}
										>
											<Heading fontSize={"md"}>
												{data.user.firstName +
													" " +
													data.user.lastName}
											</Heading>
											<Text>{data.user.bio}</Text>
										</Flex>
									</Flex>
									<Flex
										my="5"
										boxShadow="md"
										borderRadius={"md"}
										p="4"
										direction={"column"}
									>
										<Heading size="md" mb="4">
											Contact Info
										</Heading>
										<ContactInfo
											userID={data.userId}
										></ContactInfo>
									</Flex>
								</Flex>
							</Box>
						</Flex>
					</SimpleGrid>
				)}
				<Flex my="5"></Flex>
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
	if (typeof itemId !== "string" || !/^[a-f0-9]{24}$/i.test(itemId)) {
		return { notFound: true };
	}

	const item = await prisma.item.findUnique({
		where: {
			id: itemId as string,
		},
		include: {
			Car: true,
			House: true,
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

	return {
		props: { itemId, item, user },
	};
});
export default ItemDetail;
