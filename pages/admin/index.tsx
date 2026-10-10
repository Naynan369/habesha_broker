import { CheckIcon, CloseIcon, Search2Icon } from "@chakra-ui/icons";
import {
	Text,
	Avatar,
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
	useToast,
} from "@chakra-ui/react";
import { MyTheme } from "@config/theme/MyTheme";
import { useFetch } from "@libs/hooks/useFetch";
import { useUser } from "@libs/store";
import axios from "axios";
import { useRouter } from "next/router";
import { FC, useRef, useState } from "react";
import { MdCarRental, MdHouse, MdLogout, MdStorefront } from "react-icons/md";
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
	const [searchQuery, setSearchQuery] = useState("");
	const searchRef = useRef(null as HTMLInputElement);

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
			<Flex direction={"column"}>
				<Flex
					alignItems={"center"}
					px={MyTheme.paddings.pagePadding}
					height={MyTheme.size.navbarHeight}
				>
					<Flex direction={"column"}>
						<Heading fontSize={"2xl"} color="maingray">
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
							<Text fontSize={"sm"} color="gray">
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
					<StatsBar />
					<Flex direction={"column"} boxShadow="md" p="4" mt="10">
						<Flex mb="5" alignItems={"center"}>
							<Heading
								flex={1}
								size="md"
								textTransform="uppercase"
							>
								Waiting for Approval
							</Heading>
							<FormControl flex={1}>
								<Input
									ref={searchRef}
									type={"text"}
									placeholder="Search By Item ID"
									variant={"filled"}
								/>
								<InputRightElement>
									<IconButton
										onClick={() => {
											setSearchQuery(
												searchRef?.current?.value
											);
										}}
										aria-label="search"
										colorScheme={"blue"}
									>
										<Search2Icon />
									</IconButton>
								</InputRightElement>
							</FormControl>
						</Flex>
						<Flex direction="column">
							<ItemsList searchQuery={searchQuery} />
						</Flex>
					</Flex>
				</Flex>
			</Flex>
		</>
	);
}

interface IItemList {
	searchQuery: string;
}

const ItemsList: FC<IItemList> = ({ searchQuery }) => {
	const [data, loading, error] = useFetch({
		fetchFunction: () => {
			let data =
				searchQuery != "" ? { id: searchQuery } : { status: "PENDING" };

			return axios.post("/api/items?page=0", data);
		},
		dependencies: [searchQuery],
	});
	if (loading) {
		return (
			<Flex p="10" alignItems={"center"} justifyContent={"center"}>
				<Spinner />
			</Flex>
		);
	}

	return <>{data && data.map((item, i) => <ItemCard key={i} {...item} />)}</>;
};

interface ICard {
	id: string;
	title: string;
	itemType: string;
	featured?: boolean;
	createdAt: string;
}

const ItemCard: FC<ICard> = ({ id, title, featured, createdAt, itemType }) => {
	const [status, setStatus] = useState("PENDING");
	const toast = useToast();

	const itemIcon =
		itemType === "HOUSE" ? <MdHouse size="28px" /> :
		itemType === "CAR" ? <MdCarRental size="28px" /> :
		<MdStorefront size="28px" />;

	const handleItem = async (newStatus: "APPROVED" | "DECLINED") => {
		setStatus("LOADING");
		await axios
			.post(
				"/api/admin/changeItemStatus",
				{
					itemId: id,
					status: newStatus,
				}
			)
			.then((res) => {
				setStatus(newStatus);
			})
			.catch((err) => {
				toast({
					title: "Error changing status",
					status: "error",
					isClosable: true,
				});
				setStatus("PENDING");
			});
	};

	return (
		<Flex
			alignItems="center"
			transition="all 200ms ease"
			_hover={{ background: "gray.200" }}
			p="4"
		>
			<Avatar
				background="red.500"
				color="white"
				icon={itemIcon}
				colorScheme="red"
				mr="5"
			></Avatar>
			<Flex direction="column">
				<Heading size="sm">
					{title} <> </>
					{featured && <Badge variant={"solid"}>Featured</Badge>}
				</Heading>
				<Text fontSize={"sm"}>
					Posted {dayjs(createdAt).fromNow()} | {id}
				</Text>
			</Flex>
			<Spacer />
			{status === "LOADING" ? (
				<Spinner />
			) : status === "PENDING" ? (
				<ButtonGroup>
					<IconButton
						onClick={() => handleItem("APPROVED")}
						aria-label="Approve"
						colorScheme={"green"}
					>
						<CheckIcon />
					</IconButton>
					<IconButton
						onClick={() => handleItem("DECLINED")}
						aria-label="Reject"
						colorScheme={"red"}
					>
						<CloseIcon />
					</IconButton>
				</ButtonGroup>
			) : status === "APPROVED" ? (
				<Badge fontSize="lg" variant={"solid"} colorScheme={"green"}>
					APPROVED
				</Badge>
			) : (
				<Badge fontSize="lg" colorScheme={"red"}>
					DECLINED
				</Badge>
			)}
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
			<SimpleGrid p="5" spacing="10" columns={[2, 3, 6]}>
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
			</SimpleGrid>
		)
	);
}
