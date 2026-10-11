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
import { dayjs } from "@config/dayjs";
import { withSessionSsr } from "@config/cookie/cookie";
import { getMediaUrl } from "@libs/helpers/media";

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
	const pageBg = useColorModeValue("#f5f5f1", "#10191d");
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
					px={MyTheme.paddings.pagePadding}
					height={MyTheme.size.navbarHeight}
					bg={surface}
					borderBottom="1px solid"
					borderColor={border}
				>
					<Flex direction={"column"}>
						<Heading fontSize={"2xl"} color={textColor}>
							Habesha Brokers
						</Heading>
						<Heading fontSize={"md"} color="mainorange">
							ADMIN DASHBOARD
						</Heading>
					</Flex>
					<Spacer />
					<Flex>
						<Avatar name={user.firstName + " " + user.lastName} src={getMediaUrl(user.profile_url, "profile")} mr="5" />
						<Flex
							direction="column"
							display={["none", "none", "flex"]}
						>
							<Text fontWeight={"bold"}>
								{`${user.firstName} ${user.lastName}`}
							</Text>
							<Text fontSize={"sm"} color={muted}>
								{user.email}
							</Text>
						</Flex>
						<IconButton
							onClick={handleLogout}
							ml="4"
							colorScheme={"red"}
							variant="ghost"
							aria-label="logout"
						>
							<MdLogout />
						</IconButton>
					</Flex>
				</Flex>

				<Flex
					px={MyTheme.paddings.pagePadding}
					mt="5"
					direction={"column"}
				>
					<StatsBar key={refreshKey} />
					<Flex direction={"column"} bg={surface} border="1px solid" borderColor={border} borderRadius="2xl" boxShadow="0 8px 28px rgba(21,42,44,.06)" p={{ base: 4, md: 6 }} mt="8">
						<Flex direction={{ base: "column", md: "row" }} align={{ base: "stretch", md: "center" }} gap="4" mb="2">
							<Box>
								<Heading size="md">Listing review</Heading>
								<Text mt="2" color={muted} fontSize="sm" maxW="3xl" lineHeight="1.6">
									Every listing type requires the fixed listing fee before it enters review. Once payment is confirmed, verify the details and photos, then approve to publish or decline.
								</Text>
							</Box>
							<Flex flex="1" />
							<FormControl maxW={{ md: "sm" }}>
								<Input
									value={searchInput}
									onChange={(event) => setSearchInput(event.target.value)}
									onKeyDown={(event) => { if (event.key === "Enter") setSearchQuery(searchInput.trim()); }}
									placeholder="Search by listing ID"
									variant="filled"
									borderRadius="xl"
								/>
								<InputRightElement>
									<IconButton onClick={() => setSearchQuery(searchInput.trim())} aria-label="Search listings" colorScheme="blue" variant="ghost">
										<Search2Icon />
									</IconButton>
								</InputRightElement>
							</FormControl>
						</Flex>
						<ButtonGroup spacing="2" my="5" flexWrap="wrap">
							{[["PAYMENT", "Awaiting payment"], ["PENDING", "Pending review"], ["APPROVED", "Approved"], ["DECLINED", "Declined"]].map(([value, label]) => (
								<Button key={value} size="sm" borderRadius="full" colorScheme={statusFilter === value ? "orange" : "gray"} variant={statusFilter === value ? "solid" : "outline"} onClick={() => setStatusFilter(value)}>
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
		<Flex align={{ base: "flex-start", lg: "center" }} gap="4" py="4" px={{ base: 0, md: 2 }} borderBottom="1px solid" borderColor={border} direction={{ base: "column", lg: "row" }}>
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

	return (
		data && (
			<SimpleGrid p="5" spacing="6" columns={{ base: 2, md: 4, xl: 7 }}>
				<Stat
					boxShadow="2xl"
					p="5"
					borderRadius="lg"
					background="blue.400"
					color="white"
				>
					<StatLabel fontSize={"lg"}>TOTAL USERS</StatLabel>
					<StatNumber fontSize={"4xl"}>{data.users}</StatNumber>
				</Stat>
				<Stat
					boxShadow="2xl"
					p="5"
					borderRadius="lg"
					background="red.500"
					color="white"
				>
					<StatLabel fontSize={"lg"} textTransform="uppercase">
						Approved Items
					</StatLabel>
					<StatNumber fontSize={"4xl"}>
						{data.approvedItems}
					</StatNumber>
				</Stat>
				<Stat
					boxShadow="2xl"
					p="5"
					borderRadius="lg"
					background="green.500"
					color="white"
				>
					<StatLabel fontSize={"lg"} textTransform="uppercase">
						Pending Items
					</StatLabel>
					<StatNumber fontSize={"4xl"}>
						{data.waitingItems}
					</StatNumber>
				</Stat>
				<Stat
					boxShadow="2xl"
					p="5"
					borderRadius="lg"
					background="blackAlpha.900"
					color="white"
				>
					<StatLabel fontSize={"lg"} textTransform="uppercase">
						Total Houses
					</StatLabel>
					<StatNumber fontSize={"4xl"}>{data.houses}</StatNumber>
				</Stat>
				<Stat
					boxShadow="2xl"
					p="5"
					borderRadius="lg"
					background="orange.500"
					color="white"
				>
					<StatLabel fontSize={"lg"} textTransform="uppercase">
						Total Cars
					</StatLabel>
					<StatNumber fontSize={"4xl"}>{data.cars}</StatNumber>
				</Stat>
				<Stat boxShadow="2xl" p="5" borderRadius="lg" background="teal.600" color="white">
					<StatLabel fontSize="lg" textTransform="uppercase">Business Spaces</StatLabel>
					<StatNumber fontSize="4xl">{data.businessSpaces}</StatNumber>
				</Stat>
				<Stat boxShadow="2xl" p="5" borderRadius="lg" background="purple.600" color="white">
					<StatLabel fontSize="lg" textTransform="uppercase">Services</StatLabel>
					<StatNumber fontSize="4xl">{data.services}</StatNumber>
				</Stat>
			</SimpleGrid>
		)
	);
}
