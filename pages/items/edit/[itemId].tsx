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

export const getServerSideProps = withSessionSsr(async ({ req, params }) => {
	const user = req.session.user;
	if (!user) return { redirect: { destination: "/auth/login" }, props: {} };
	const itemId = params?.itemId;
	if (typeof itemId !== "string" || !/^[a-f0-9]{24}$/i.test(itemId)) return { notFound: true };

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
		},
	});
	if (!item || item.userId !== user.id) return { notFound: true };

	return { props: { item } };
});

export default function EditItemPage({ item }) {
	const router = useRouter();
	const detail = item.itemType === "HOUSE" ? item.House?.[0] : item.Car?.[0];

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
					<Heading size="md" mb="5">{item.itemType === "HOUSE" ? "House details" : "Car details"}</Heading>
					{item.itemType === "HOUSE" ? (
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
					) : (
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
					)}
				</Flex>
			</Flex>
		</>
	);
}
