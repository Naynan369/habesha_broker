import {
	Box,
	Button,
	Divider,
	Flex,
	Heading,
	SimpleGrid,
	Text,
} from "@chakra-ui/react";
import { EditInputField } from "@components/dashboard/forms/EditInputField";
import { withSessionSsr } from "@config/cookie/cookie";
import { MyTheme } from "@config/theme/MyTheme";
import { prisma } from "@config/prisma";
import Head from "next/head";
import { useRouter } from "next/router";
import { useLang } from "@libs/hooks/useLang";

export const getServerSideProps = withSessionSsr(async ({ req, params }) => {
	const user = req.session.user;
	if (!user) return { redirect: { destination: "/auth/login" }, props: {} };
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
			House: { select: { area: true, room: true, type: true, region: true, city: true } },
			Car: { select: { model: true, status: true, manufacturer: true, year: true, transmition: true, color: true, cylinder: true, fuel: true } },
			Service: { select: { category: true, region: true, city: true, serviceArea: true } },
			BusinessSpace: { select: { spaceType: true, type: true, priceFrequency: true, area: true, region: true, city: true, subcity: true, woreda: true, neighborhood: true, landmark: true, electricity: true, water: true, roadAccess: true, parking: true } },
		},
	});
	if (!item || item.userId !== user.id) return { notFound: true };

	return { props: { item } };
});

export default function EditItemPage({ item }) {
	const router = useRouter();
	const detail = item.itemType === "HOUSE" ? item.House : item.itemType === "CAR" ? item.Car : item.itemType === "BUSINESS_SPACE" ? item.BusinessSpace : item.Service;
	const serviceText = useLang().serviceListing;

	return (
		<>
			<Head><title>Edit listing - Habesha Brokers</title></Head>
			<Flex direction="column">
				<Flex
					height={MyTheme.size.navbarHeightCompact}
					alignItems="center"
					px={MyTheme.paddings.pagePadding}
					boxShadow="md"
				>
					<Button mr="5" onClick={() => router.push("/items/" + item.id)}>Back to listing</Button>
					<Heading size="md">Edit listing</Heading>
				</Flex>
				<Flex direction="column" px={MyTheme.paddings.pagePadding} py="8" maxW="5xl" w="full" mx="auto">
					<Text mb="5" color="gray.600">
						Changes send the listing back for approval.
					</Text>
					<SimpleGrid columns={[1, 2]} spacing="5">
						<EditInputField title="Title" name="title" defaultValues={item.title} />
						<EditInputField title="Price" name="price" type="number" defaultValues={String(item.price)} />
						<EditInputField
							title="Price type"
							name="priceType"
							defaultValues={item.priceType}
							isSelect
						>
							<option value="FIXED">Fixed</option>
							<option value="NEGOTIABLE">Negotiable</option>
						</EditInputField>
					</SimpleGrid>
					<Box mt="5">
						<EditInputField title="Description" name="description" defaultValues={item.description || ""} isTextarea />
					</Box>
					<Divider my="8" />
					<Heading size="md" mb="5">{item.itemType === "HOUSE" ? "House details" : item.itemType === "CAR" ? "Car details" : item.itemType === "SERVICE" ? serviceText.category : "Business space details"}</Heading>
					{item.itemType === "SERVICE" ? (
						<SimpleGrid columns={[1, 2]} spacing="5">
							<EditInputField title={serviceText.category} name="category" defaultValues={detail?.category || "BROKER_SUPPORT"} isProductSpecific isSelect>
								{Object.entries(serviceText.categories).map(([value, label]) => <option key={value} value={value}>{label as string}</option>)}
							</EditInputField>
							<EditInputField title={serviceText.region} name="region" defaultValues={detail?.region || ""} isProductSpecific />
							<EditInputField title={serviceText.city} name="city" defaultValues={detail?.city || ""} isProductSpecific />
							<EditInputField title={serviceText.serviceArea} name="serviceArea" defaultValues={detail?.serviceArea || ""} isProductSpecific />
						</SimpleGrid>
					) : item.itemType === "HOUSE" ? (
						<SimpleGrid columns={[1, 2]} spacing="5">
							<EditInputField title="Area" name="area" type="number" defaultValues={String(detail?.area ?? "")} isProductSpecific />
							<EditInputField title="Rooms" name="room" type="number" defaultValues={String(detail?.room ?? "")} isProductSpecific />
							<EditInputField title="House type" name="type" defaultValues={detail?.type || ""} isProductSpecific isSelect>
								<option value="RENT">For rent</option>
								<option value="FORSALE">For sale</option>
							</EditInputField>
							<EditInputField title="Region" name="region" defaultValues={detail?.region || ""} isProductSpecific />
							<EditInputField title="City" name="city" defaultValues={detail?.city || ""} isProductSpecific />
						</SimpleGrid>
					) : item.itemType === "CAR" ? (
						<SimpleGrid columns={[1, 2]} spacing="5">
							<EditInputField title="Manufacturer" name="manufacturer" defaultValues={detail?.manufacturer || ""} isProductSpecific />
							<EditInputField title="Model" name="model" defaultValues={detail?.model || ""} isProductSpecific />
							<EditInputField title="Year" name="year" type="number" defaultValues={String(detail?.year ?? "")} isProductSpecific />
							<EditInputField title="Condition" name="status" defaultValues={detail?.status || ""} isProductSpecific isSelect>
								<option value="USED">Used</option>
								<option value="NEW">Brand new</option>
								<option value="NEW_ETH">New in Ethiopia</option>
							</EditInputField>
							<EditInputField title="Transmission" name="transmition" defaultValues={detail?.transmition || ""} isProductSpecific isSelect>
								<option value="AUTO">Automatic</option>
								<option value="MANUAL">Manual</option>
							</EditInputField>
							<EditInputField title="Color" name="color" defaultValues={detail?.color || ""} isProductSpecific />
							<EditInputField title="Cylinder size" name="cylinder" type="number" defaultValues={String(detail?.cylinder ?? "")} isProductSpecific />
							<EditInputField title="Fuel consumption" name="fuel" type="number" defaultValues={String(detail?.fuel ?? "")} isProductSpecific />
						</SimpleGrid>
					) : (
						<SimpleGrid columns={[1, 2]} spacing="5">
							<EditInputField title="Space type" name="spaceType" defaultValues={detail?.spaceType || "SHOP"} isProductSpecific isSelect><option value="SHOP">Shop</option><option value="OFFICE">Office</option><option value="WAREHOUSE">Warehouse</option><option value="MARKET_STALL">Market stall</option><option value="WORKSHOP">Workshop</option><option value="LAND">Commercial land</option></EditInputField>
							<EditInputField title="Availability" name="type" defaultValues={detail?.type || "RENT"} isProductSpecific isSelect><option value="RENT">For rent</option><option value="FORSALE">For sale</option></EditInputField>
							<EditInputField title="Rent frequency" name="priceFrequency" defaultValues={detail?.priceFrequency || "MONTHLY"} isProductSpecific isSelect><option value="DAILY">Daily</option><option value="WEEKLY">Weekly</option><option value="MONTHLY">Monthly</option><option value="YEARLY">Yearly</option></EditInputField>
							<EditInputField title="Floor area (m²)" name="area" type="number" defaultValues={String(detail?.area ?? "")} isProductSpecific />
							{["region", "city", "subcity", "woreda", "neighborhood", "landmark"].map((field) => <EditInputField key={field} title={field.replace(/([A-Z])/g, " $1")} name={field} defaultValues={detail?.[field] || ""} isProductSpecific />)}
							{["electricity", "water", "roadAccess", "parking"].map((field) => <EditInputField key={field} title={field.replace(/([A-Z])/g, " $1")} name={field} defaultValues={String(detail?.[field] ?? false)} isProductSpecific isSelect><option value="true">Yes</option><option value="false">No</option></EditInputField>)}
						</SimpleGrid>
					)}
				</Flex>
			</Flex>
		</>
	);
}
