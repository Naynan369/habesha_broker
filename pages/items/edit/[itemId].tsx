import {
	Alert,
	AlertDescription,
	AlertIcon,
	Badge,
	Box,
	Button,
	Divider,
	Flex,
	Heading,
	SimpleGrid,
	Text,
	useColorModeValue,
	useToast,
} from "@chakra-ui/react";
import { EditInputField } from "@components/dashboard/forms/EditInputField";
import { ColorModeToggle } from "@components/shared/ColorModeToggle";
import { ListingImage } from "@components/shared/ListingImage";
import { withSessionSsr } from "@config/cookie/cookie";
import { MyTheme } from "@config/theme/MyTheme";
import { prisma } from "@config/prisma";
import { useLang } from "@libs/hooks/useLang";
import axios from "axios";
import Head from "next/head";
import { useRouter } from "next/router";
import { FormEvent, useRef, useState } from "react";
import { MdSave } from "react-icons/md";

export const getServerSideProps = withSessionSsr(async ({ req, params }) => {
	const user = req.session.user;
	if (!user) return { redirect: { destination: "/auth/login" }, props: {} };
	if (!user.verfied) return { redirect: { destination: "/dashboard/verify-account" }, props: {} };
	const itemId = params?.itemId;
	if (typeof itemId !== "string" || !/^[A-Za-z0-9_-]{8,128}$/.test(itemId)) return { notFound: true };

	const item = await prisma.item.findUnique({
		where: { id: itemId },
		select: {
			id: true,
			userId: true,
			title: true,
			description: true,
			price: true,
			priceType: true,
			itemType: true,
			status: true,
			images: true,
			House: { select: { area: true, room: true, type: true, region: true, city: true } },
			Car: { select: { model: true, status: true, manufacturer: true, year: true, transmition: true, color: true, cylinder: true, fuel: true } },
			Service: { select: { category: true, region: true, city: true, serviceArea: true } },
			BusinessSpace: { select: { spaceType: true, type: true, priceFrequency: true, area: true, region: true, city: true, subcity: true, woreda: true, neighborhood: true, landmark: true, electricity: true, water: true, roadAccess: true, parking: true } },
		},
	});
	if (!item || item.userId !== user.id) return { notFound: true };

	return { props: { item } };
});

function editValuesForItem(item: any) {
	const detail = item.itemType === "HOUSE" ? item.House : item.itemType === "CAR" ? item.Car : item.itemType === "BUSINESS_SPACE" ? item.BusinessSpace : item.Service;
	const specificProps = Object.fromEntries(
		Object.entries(detail || {}).map(([key, value]) => [key, value == null ? "" : String(value)])
	);
	return {
		title: item.title || "",
		description: item.description || "",
		price: String(item.price ?? ""),
		priceType: item.priceType || "FIXED",
		specificProps,
	};
}

export default function EditItemPage({ item }) {
	const pageBg = useColorModeValue("#f5f5f1", "#10191d");
	const surface = useColorModeValue("white", "#17262b");
	const border = useColorModeValue("gray.200", "whiteAlpha.200");
	const muted = useColorModeValue("gray.600", "gray.400");
	const router = useRouter();
	const toast = useToast();
	const serviceText = useLang().serviceListing;
	const initialValues = useRef(editValuesForItem(item));
	const [values, setValues] = useState(initialValues.current);
	const [saving, setSaving] = useState(false);
	const isDirty = JSON.stringify(values) !== JSON.stringify(initialValues.current);

	const updateValue = (name: string, value: string) => {
		setValues((current) => ({ ...current, [name]: value }));
	};
	const updateSpecific = (name: string, value: string) => {
		setValues((current) => ({
			...current,
			specificProps: { ...current.specificProps, [name]: value },
		}));
	};

	const saveChanges = async (event: FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		if (!isDirty || saving) return;
		setSaving(true);
		try {
			await axios.post("/api/items/edit", {
				itemId: item.id,
				title: values.title,
				description: values.description,
				price: values.price,
				priceType: values.priceType,
				specificProps: values.specificProps,
			});
			toast({
				title: "Listing updated",
				description: "Your changes were saved. The listing is now waiting for admin approval.",
				status: "success",
				isClosable: true,
			});
			await router.push(`/items/${item.id}`);
		} catch (error: any) {
			toast({
				title: "Could not save listing",
				description: error?.response?.data?.err || "Check your changes and try again.",
				status: "error",
				isClosable: true,
			});
		} finally {
			setSaving(false);
		}
	};

	const field = (title: string, name: string, type?: string, helpText?: string) => (
		<EditInputField
			key={name}
			title={title}
			name={name}
			type={type}
			value={values.specificProps[name] ?? ""}
			onChange={(value) => updateSpecific(name, value)}
			helpText={helpText}
		/>
	);
	const select = (title: string, name: string, options: Array<[string, string]>) => (
		<EditInputField
			key={name}
			title={title}
			name={name}
			value={values.specificProps[name] ?? ""}
			onChange={(value) => updateSpecific(name, value)}
			isSelect
			required
		>
			<option value="" disabled>Choose {title.toLowerCase()}</option>
			{options.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
		</EditInputField>
	);

	const detailFields = item.itemType === "SERVICE" ? (
		<SimpleGrid columns={{ base: 1, md: 2 }} spacing="5">
			{select(serviceText.category, "category", Object.entries(serviceText.categories) as Array<[string, string]>) }
			{field(serviceText.region, "region")}
			{field(serviceText.city, "city")}
			{field(serviceText.serviceArea, "serviceArea")}
		</SimpleGrid>
	) : item.itemType === "HOUSE" ? (
		<SimpleGrid columns={{ base: 1, md: 2 }} spacing="5">
			{field("Area", "area", "number", "Leave blank if the area is not available.")}
			{field("Rooms", "room", "number", "Leave blank if the room count is not available.")}
			{select("House type", "type", [["RENT", "For rent"], ["FORSALE", "For sale"]])}
			{field("Region", "region")}
			{field("City", "city")}
		</SimpleGrid>
	) : item.itemType === "CAR" ? (
		<SimpleGrid columns={{ base: 1, md: 2 }} spacing="5">
			{field("Manufacturer", "manufacturer")}
			{field("Model", "model")}
			{field("Year", "year", "number", "Leave blank if the year is unknown.")}
			{select("Condition", "status", [["USED", "Used"], ["NEW", "Brand new"], ["NEW_ETH", "New in Ethiopia"]])}
			{select("Transmission", "transmition", [["AUTO", "Automatic"], ["MANUAL", "Manual"]])}
			{field("Color", "color")}
			{field("Cylinder size", "cylinder", "number", "Leave blank if not available.")}
			{field("Fuel consumption", "fuel", "number", "Leave blank if not available.")}
		</SimpleGrid>
	) : (
		<SimpleGrid columns={{ base: 1, md: 2 }} spacing="5">
			{select("Space type", "spaceType", [["SHOP", "Shop"], ["OFFICE", "Office"], ["WAREHOUSE", "Warehouse"], ["MARKET_STALL", "Market stall"], ["WORKSHOP", "Workshop"], ["LAND", "Commercial land"]])}
			{select("Availability", "type", [["RENT", "For rent"], ["FORSALE", "For sale"]])}
			{values.specificProps.type === "RENT" && select("Rent frequency", "priceFrequency", [["DAILY", "Daily"], ["WEEKLY", "Weekly"], ["MONTHLY", "Monthly"], ["YEARLY", "Yearly"]])}
			{field("Floor area (m²)", "area", "number")}
			{["region", "city", "subcity", "woreda", "neighborhood", "landmark"].map((name) => field(name.replace(/([A-Z])/g, " $1"), name))}
			{["electricity", "water", "roadAccess", "parking"].map((name) => select(name.replace(/([A-Z])/g, " $1"), name, [["true", "Yes"], ["false", "No"]]))}
		</SimpleGrid>
	);

	const statusTone = item.status === "DECLINED" ? "error" : item.status === "APPROVED" ? "success" : "warning";
	const statusCopy = item.status === "APPROVED"
		? "This listing is public. Saving any change sends it back for admin review."
		: item.status === "DECLINED"
			? "This listing was declined. After you update and save it, it will return to the admin review queue."
			: "This listing is waiting for admin review. It stays out of public search until an admin approves it.";

	return (
		<>
			<Head><title>Edit listing - Habesha Brokers</title></Head>
			<Flex direction="column" minH="100vh" bg={pageBg}>
				<Flex bg={surface} borderBottom="1px solid" borderColor={border} minH={MyTheme.size.navbarHeightCompact} alignItems="center" px={MyTheme.paddings.pagePadding} gap="3">
					<Button variant="outline" onClick={() => router.push(`/items/${item.id}`)}>Back to listing</Button>
					<Heading size="md" display={{ base: "none", sm: "block" }}>Edit listing</Heading>
					<Box flex="1" />
					<ColorModeToggle />
				</Flex>

				<Flex direction="column" px={MyTheme.paddings.pagePadding} py={{ base: 6, md: 10 }} maxW="5xl" w="full" mx="auto">
					<Flex align={{ base: "flex-start", sm: "center" }} justify="space-between" gap="4" mb="6" direction={{ base: "column", sm: "row" }}>
						<Box>
							<Badge colorScheme="teal" borderRadius="full" px="3" py="1">{item.itemType.replace(/_/g, " ")}</Badge>
							<Heading mt="3" size="lg">Update your listing</Heading>
							<Text mt="2" color={muted}>Make your changes, then save once when you are ready.</Text>
						</Box>
						<Badge colorScheme={item.status === "APPROVED" ? "green" : item.status === "DECLINED" ? "red" : "orange"} px="3" py="2" borderRadius="full">{item.status}</Badge>
					</Flex>

					<Alert status={statusTone} borderRadius="xl" mb="6" alignItems="flex-start">
						<AlertIcon mt="1" />
						<AlertDescription>{statusCopy}</AlertDescription>
					</Alert>

					{item.images?.length > 0 && (
						<Box bg={surface} border="1px solid" borderColor={border} borderRadius="2xl" p={{ base: 4, md: 6 }} mb="6">
							<Heading size="sm" mb="4">Listing photos</Heading>
							<SimpleGrid columns={{ base: 2, sm: 3, md: 4 }} spacing="3">
								{item.images.map((image: string, index: number) => (
									<ListingImage key={`${image}-${index}`} src={image} alt={`${item.title} photo ${index + 1}`} itemType={item.itemType} h="28" borderRadius="lg" />
								))}
							</SimpleGrid>
						</Box>
					)}

					<form onSubmit={saveChanges}>
						<Box bg={surface} border="1px solid" borderColor={border} borderRadius="2xl" p={{ base: 4, md: 7 }} boxShadow="0 8px 28px rgba(21,42,44,.06)">
							<Heading size="md" mb="5">Listing information</Heading>
							<SimpleGrid columns={{ base: 1, md: 2 }} spacing="5">
								<EditInputField title="Title" name="title" value={values.title} onChange={(value) => updateValue("title", value)} required />
								<EditInputField title="Price (ETB)" name="price" type="number" value={values.price} onChange={(value) => updateValue("price", value)} required />
								<EditInputField title="Price type" name="priceType" value={values.priceType} onChange={(value) => updateValue("priceType", value)} isSelect required>
									<option value="FIXED">Fixed</option>
									<option value="NEGOTIABLE">Negotiable</option>
								</EditInputField>
							</SimpleGrid>
							<Box mt="5">
								<EditInputField title="Description" name="description" value={values.description} onChange={(value) => updateValue("description", value)} isTextarea />
							</Box>

							<Divider my={{ base: 6, md: 8 }} />
							<Heading size="md" mb="5">{item.itemType === "HOUSE" ? "Home details" : item.itemType === "CAR" ? "Vehicle details" : item.itemType === "SERVICE" ? serviceText.category : "Business space details"}</Heading>
							{detailFields}

							<Flex mt="8" pt="5" borderTop="1px solid" borderColor={border} justify="flex-end" gap="3" direction={{ base: "column-reverse", sm: "row" }}>
								<Button type="button" variant="outline" onClick={() => router.push(`/items/${item.id}`)} isDisabled={saving}>Cancel</Button>
								<Button type="submit" colorScheme="orange" leftIcon={<MdSave />} isLoading={saving} isDisabled={!isDirty}>Save changes</Button>
							</Flex>
						</Box>
					</form>
				</Flex>
			</Flex>
		</>
	);
}
