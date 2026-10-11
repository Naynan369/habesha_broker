import { CheckIcon, CloseIcon, Search2Icon } from "@chakra-ui/icons";
import {
	Text,
	Avatar,
	Box,
	Flex,
	Heading,
	Spacer,
	SimpleGrid,
	Stat,
	StatLabel,
	StatNumber,
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
} from "@chakra-ui/react";
import { MyTheme } from "@config/theme/MyTheme";
import { useFetch } from "@libs/hooks/useFetch";
import { useUser } from "@libs/store";
import { ListingImage } from "@components/shared/ListingImage";
import axios from "axios";
import Link from "next/link";
import { useRouter } from "next/router";
import { FC, useState } from "react";
import { MdLogout } from "react-icons/md";
import {
	FaBuilding,
	FaCarSide,
	FaCheckCircle,
	FaClock,
	FaHome,
	FaTools,
	FaUsers,
} from "react-icons/fa";
import { dayjs } from "@config/dayjs";
import { withSessionSsr } from "@config/cookie/cookie";
import { getMediaUrl } from "@libs/helpers/media";
import { ColorModeToggle } from "@components/shared/ColorModeToggle";

export const getServerSideProps = withSessionSsr(
	async function getServerSideProps({ req }) {
		const user = req.session.user;

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
	const pageBg = useColorModeValue("#f4f6f8", "#10191d");
	const surface = useColorModeValue("white", "#17262b");
	const border = useColorModeValue("gray.200", "whiteAlpha.200");
	const textColor = useColorModeValue("maingray", "gray.100");
	const muted = useColorModeValue("gray.600", "gray.400");

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
					<Flex direction="column" py="3">
						<Heading fontSize={{ base: "lg", md: "xl" }} color={textColor} letterSpacing="tight">
							Habesha Brokers
						</Heading>
						<Heading fontSize="xs" color="mainorange" letterSpacing="widest" mt="1">
							ADMINISTRATION
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
								{user.email}
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
					maxW="1600px"
					mx="auto"
					px={{ base: 4, md: 8, xl: 12 }}
					py={{ base: 6, md: 10 }}
					direction={"column"}
				>
					<Box mb={{ base: 5, md: 7 }}>
						<Text fontSize="xs" fontWeight="bold" letterSpacing="widest" color="mainorange" textTransform="uppercase">Operations</Text>
						<Heading mt="2" fontSize={{ base: "xl", md: "2xl" }} color={textColor} letterSpacing="tight">Dashboard overview</Heading>
						<Text mt="2" color={muted} maxW="2xl" fontSize={{ base: "sm", md: "md" }}>
							Monitor marketplace activity and manage listing reviews from one place.
						</Text>
					</Box>
					<StatsBar key={refreshKey} />
					<Flex direction="column" bg={surface} border="1px solid" borderColor={border} borderRadius="2xl" boxShadow="0 12px 36px rgba(21,42,44,.07)" p={{ base: 4, md: 7 }} mt={{ base: 6, md: 8 }}>
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
					</Flex>
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
	const [data, loading, error] = useFetch({
		fetchFunction: () => axios.post("/api/items?page=0", {
			status: statusFilter === "PAYMENT" ? "PENDING" : statusFilter,
			...(statusFilter === "PAYMENT" ? { paymentFilter: "AWAITING" } : {}),
			...(searchQuery ? { id: searchQuery } : {}),
		}),
		dependencies: [searchQuery, statusFilter, refreshKey],
	});
	const muted = useColorModeValue("gray.600", "gray.400");
	if (loading) {
		return <Flex p="10" alignItems="center" justifyContent="center"><Spinner /></Flex>;
	}
	if (error) {
		return <Alert status="error" borderRadius="lg"><AlertIcon /><AlertTitle>Could not load listings</AlertTitle></Alert>;
	}
	if (!data?.length) {
		return <Text py="10" textAlign="center" color={muted}>{searchQuery ? "No listing matches that ID in this status." : `There are no ${statusFilter.toLowerCase()} listings.`}</Text>;
	}
	return <>{data.map((item) => <ItemCard key={item.id} item={item} onModerated={onModerated} />)}</>;
};

interface ICard {
	item: any;
	onModerated: () => void;
}

const ItemCard: FC<ICard> = ({ item, onModerated }) => {
	const border = useColorModeValue("gray.200", "whiteAlpha.200");
	const surface = useColorModeValue("white", "#17262b");
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
						{latestPayment && <Text fontSize="xs" color={muted} noOfLines={1}>{latestPayment.status} · ETB {Number(latestPayment.amount).toLocaleString("en-US")} · {latestPayment.paymentMethod || "Chapa"} · Ref {latestPayment.txRef}</Text>}
					</Flex>
				</Box>
			</Flex>
			<Flex align="center" gap="3" wrap="wrap" w={{ base: "full", lg: "auto" }} justify={{ base: "flex-end", lg: "flex-start" }}>
				<Badge colorScheme={status === "APPROVED" ? "green" : status === "DECLINED" ? "red" : status === "SOLD" ? "purple" : "orange"} borderRadius="full" px="3" py="1">{status}</Badge>
				<Link href={`/items/${id}`} passHref><Button as="a" size="sm" variant="outline">Review details</Button></Link>
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

function StatsBar() {
	const [data, loading, err] = useFetch({
		fetchFunction: () => axios.get("/api/admin/stat"),
	});
	const surface = useColorModeValue("white", "#17262b");
	const border = useColorModeValue("gray.200", "whiteAlpha.200");
	const statText = useColorModeValue("maingray", "gray.100");
	const labelText = useColorModeValue("gray.500", "gray.400");
	const iconSurface = useColorModeValue("gray.100", "whiteAlpha.100");

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

	const cards = [
		{ label: "Total users", value: data.users, icon: FaUsers, tone: "blue" },
		{ label: "Approved listings", value: data.approvedItems, icon: FaCheckCircle, tone: "green" },
		{ label: "Awaiting review", value: data.waitingItems, icon: FaClock, tone: "orange" },
		{ label: "Homes", value: data.houses, icon: FaHome, tone: "cyan" },
		{ label: "Vehicles", value: data.cars, icon: FaCarSide, tone: "purple" },
		{ label: "Business spaces", value: data.businessSpaces, icon: FaBuilding, tone: "teal" },
		{ label: "Services", value: data.services, icon: FaTools, tone: "pink" },
	];

	return (
		<SimpleGrid spacing={{ base: 3, md: 4 }} columns={{ base: 2, md: 3, xl: 4 }}>
			{cards.map((card) => (
				<Stat key={card.label} bg={surface} border="1px solid" borderColor={border} borderRadius="xl" p={{ base: 4, md: 5 }} minH={{ base: "110px", md: "128px" }} boxShadow="sm">
					<Flex justify="space-between" align="flex-start" gap="3">
						<Box>
							<StatLabel color={labelText} fontSize="xs" fontWeight="semibold" letterSpacing="wide" textTransform="uppercase">
								{card.label}
							</StatLabel>
							<StatNumber mt="2" color={statText} fontSize={{ base: "2xl", md: "3xl" }} fontWeight="bold" lineHeight="1">
								{card.value ?? 0}
							</StatNumber>
						</Box>
						<Flex w="10" h="10" flexShrink={0} align="center" justify="center" borderRadius="lg" bg={iconSurface} color={`${card.tone}.500`}>
							<Icon as={card.icon} boxSize="4" />
						</Flex>
					</Flex>
				</Stat>
			))}
		</SimpleGrid>
	);
}
