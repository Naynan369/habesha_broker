import {
	Alert,
	AlertDescription,
	AlertIcon,
	Badge,
	Box,
	Button,
	Checkbox,
	CheckboxGroup,
	Divider,
	Flex,
	FormControl,
	Heading,
	SimpleGrid,
	Text,
	useColorModeValue,
	useToast,
} from "@chakra-ui/react";
import { EditInputField } from "@components/dashboard/forms/EditInputField";
import { getSellerTypeOptions } from "@components/dashboard/forms/SellerTypeField";
import { ColorModeToggle } from "@components/shared/ColorModeToggle";
import { ListingImage } from "@components/shared/ListingImage";
import { withSessionSsr } from "@config/cookie/cookie";
import { MyTheme } from "@config/theme/MyTheme";
import { prisma } from "@config/prisma";
import { useLang } from "@libs/hooks/useLang";
import { getMediaUrl } from "@libs/helpers/media";
import { sellerPhoneCountries } from "@libs/helpers/phoneCountries";
import axios from "axios";
import Head from "next/head";
import { useRouter } from "next/router";
import { FormEvent, useState } from "react";
import { MdSave } from "react-icons/md";

export const getServerSideProps = withSessionSsr(async ({ req, params, locale }) => {
	const user = req.user;
	if (!user) return { redirect: { destination: locale === "am" ? "/am/auth/login" : "/auth/login" }, props: {} };
	if (!user.verfied) return { redirect: { destination: locale === "am" ? "/am/dashboard/verify-account" : "/dashboard/verify-account" }, props: {} };
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
			sellerType: true,
			sellerAttested: true,
			status: true,
			images: true,
			House: { select: { area: true, room: true, type: true, propertyType: true, priceFrequency: true, bedrooms: true, bathrooms: true, floor: true, totalFloors: true, furnishing: true, video: true, region: true, city: true, subcity: true, woreda: true, neighborhood: true, landmark: true, features: true } },
			Car: { select: { model: true, status: true, manufacturer: true, year: true, transmition: true, color: true, cylinder: true, fuel: true, fuelType: true, bodyType: true, driveType: true, mileage: true, seats: true, doors: true, region: true, city: true, subcity: true, neighborhood: true, landmark: true, features: true } },
			Service: { select: { category: true, region: true, city: true, serviceArea: true, availability: true } },
			BusinessSpace: { select: { spaceType: true, type: true, priceFrequency: true, area: true, region: true, city: true, subcity: true, woreda: true, neighborhood: true, landmark: true, electricity: true, water: true, roadAccess: true, parking: true } },
		},
	});
	if (!item || item.userId !== user.id) return { notFound: true };
	const sellerPhone = await prisma.contactInfo.findFirst({
		where: { userId: user.id, contactType: "PHONE_NUMBER" },
		select: { value: true },
	});

	return { props: { item, sellerPhone: sellerPhone?.value || "" } };
});

function editValuesForItem(item: any) {
	const detail = item.itemType === "HOUSE" ? item.House : item.itemType === "CAR" ? item.Car : item.itemType === "BUSINESS_SPACE" ? item.BusinessSpace : item.Service;
	const specificProps = Object.fromEntries(
		Object.entries(detail || {}).map(([key, value]) => [key, value == null ? "" : Array.isArray(value) ? value : String(value)])
	);
	return {
		title: item.title || "",
		description: item.description || "",
		price: String(item.price ?? ""),
		priceType: item.priceType || "FIXED",
		sellerType: item.sellerType || "",
		sellerAttested: item.sellerAttested === true,
		specificProps,
	};
}

function splitSellerPhone(value: string) {
	const match = sellerPhoneCountries
		.slice()
		.sort((first, second) => second[1].length - first[1].length)
		.find(([, code]) => value.startsWith(code));
	if (!match) return { countryCode: "+251", number: value };
	return { countryCode: match[1], number: value.slice(match[1].length).replace(/^0+/, "") };
}

function normalizeSellerPhone(countryCode: string, number: string) {
	const digits = number.replace(/\D/g, "").replace(/^0+/, "");
	return digits ? `${countryCode}${digits}` : "";
}

export default function EditItemPage({ item, sellerPhone = "" }) {
	const pageBg = useColorModeValue("#f5f5f1", "#000000");
	const surface = useColorModeValue("white", "#0c0c0c");
	const border = useColorModeValue("gray.200", "whiteAlpha.200");
	const muted = useColorModeValue("gray.600", "gray.400");
	const router = useRouter();
	const toast = useToast();
	const lang = useLang();
	const sellerTypeText = lang.sellerType;
	const sellerContactText = lang.sellerContact;
	const serviceText = lang.serviceListing;
	const homeText = lang.businessListing;
	const carText = lang.vehicleListing;
	const panelBorder = useColorModeValue("gray.200", "whiteAlpha.200");
	const panelBg = useColorModeValue("gray.50", "whiteAlpha.50");
	const [initialValues] = useState(() => editValuesForItem(item));
	const [values, setValues] = useState(initialValues);
	const initialPhoneParts = splitSellerPhone(sellerPhone);
	const [phoneCountryCode, setPhoneCountryCode] = useState<string>(initialPhoneParts.countryCode);
	const [phoneNumber, setPhoneNumber] = useState<string>(initialPhoneParts.number);
	const [saving, setSaving] = useState(false);
	const normalizedSellerPhone = normalizeSellerPhone(phoneCountryCode, phoneNumber);
	const initialNormalizedSellerPhone = normalizeSellerPhone(initialPhoneParts.countryCode, initialPhoneParts.number);
	const sellerPhoneChanged = Boolean(phoneNumber.trim()) && normalizedSellerPhone !== initialNormalizedSellerPhone;
	const isDirty = JSON.stringify(values) !== JSON.stringify(initialValues) || sellerPhoneChanged;

	const updateValue = (name: string, value: string | boolean) => {
		setValues((current) => ({ ...current, [name]: value }));
	};
	const updateSpecific = (name: string, value: string | string[]) => {
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
			const payload: Record<string, any> = {
				itemId: item.id,
				title: values.title,
				description: values.description,
				price: values.price,
				priceType: values.priceType,
				sellerType: values.sellerType,
				sellerAttested: values.sellerAttested,
				specificProps: values.specificProps,
			};
			if (sellerPhoneChanged) payload.sellerPhone = normalizedSellerPhone;
			await axios.post("/api/items/edit", payload);
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

	const field = (title: string, name: string, type?: string, helpText?: string, placeholder?: string) => (
		<EditInputField
			key={name}
			title={title}
			name={name}
			type={type}
			value={Array.isArray(values.specificProps[name]) ? values.specificProps[name].join(", ") : String(values.specificProps[name] ?? "")}
			onChange={(value) => updateSpecific(name, value)}
			helpText={helpText}
			placeholder={placeholder}
		/>
	);
	const select = (title: string, name: string, options: Array<[string, string]>, required = true) => (
		<EditInputField
			key={name}
			title={title}
			name={name}
			value={Array.isArray(values.specificProps[name]) ? values.specificProps[name].join(", ") : String(values.specificProps[name] ?? "")}
			onChange={(value) => updateSpecific(name, value)}
			isSelect
			required={required}
		>
			{required && <option value="" disabled>Choose {title.toLowerCase()}</option>}
			{options.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
		</EditInputField>
	);
	const sellerContactFields = (
		<Box mt="5" p={{ base: 4, md: 5 }} border="1px solid" borderColor={panelBorder} borderRadius="xl" bg={panelBg}>
			<Heading size="sm" mb="2">{sellerContactText.stepTitle}</Heading>
			<Text mb="5" fontSize="sm" color={muted}>{sellerContactText.publicDescription}</Text>
			<SimpleGrid columns={{ base: 1, md: 2 }} spacing="5" alignItems="start">
				<EditInputField
					title={sellerContactText.countryCodeLabel}
					name="sellerPhoneCountryCode"
					value={phoneCountryCode}
					onChange={setPhoneCountryCode}
					isSelect
				>
					{sellerPhoneCountries.map(([country, code]) => <option key={`${country}-${code}`} value={code}>{country} ({code})</option>)}
				</EditInputField>
				<EditInputField
					title={sellerContactText.phoneNumberLabel}
					name="sellerPhoneNumber"
					value={phoneNumber}
					onChange={setPhoneNumber}
					type="tel"
					placeholder={sellerContactText.phonePlaceholder}
					helpText={sellerContactText.phoneHint}
				/>
			</SimpleGrid>
		</Box>
	);

	const detailFields = item.itemType === "SERVICE" ? (
		<>
			<SimpleGrid columns={{ base: 1, md: 2 }} spacing="5">
				{select(serviceText.category, "category", Object.entries(serviceText.categories) as Array<[string, string]>) }
				{field(serviceText.region, "region")}
				{field(serviceText.city, "city")}
				{field(serviceText.serviceArea, "serviceArea")}
				{field(serviceText.availability, "availability")}
			</SimpleGrid>
			{sellerContactFields}
		</>
	) : item.itemType === "HOUSE" ? (
		<>
			<SimpleGrid columns={{ base: 1, md: 2 }} spacing="5">
				{select(homeText.propertyType, "propertyType", Object.entries(homeText.propertyTypes) as Array<[string, string]>) }
				{select(homeText.rentOrSale, "type", [["RENT", homeText.rent], ["FORSALE", homeText.sale]])}
				{values.specificProps.type === "RENT" && select(homeText.priceFrequency, "priceFrequency", Object.entries(homeText.frequencies) as Array<[string, string]>) }
				{field(homeText.floorArea, "area", "number")}
				{field(homeText.rooms, "room", "number")}
				{field(homeText.bedrooms, "bedrooms", "number")}
				{field(homeText.bathrooms, "bathrooms", "number")}
				{field(homeText.floor, "floor", "number")}
				{field(homeText.totalFloors, "totalFloors", "number")}
				{select(homeText.furnishing, "furnishing", [["", "Not specified"], ...Object.entries(homeText.furnishingTypes)] as Array<[string, string]>, false) }
				{[["region", homeText.region], ["city", homeText.city], ["subcity", homeText.subcity], ["woreda", homeText.woreda], ["neighborhood", homeText.neighborhood], ["landmark", homeText.landmark]].map(([name, label]) => field(label, name))}
			</SimpleGrid>
			{sellerContactFields}
			<Box mt="5" p="4" border="1px solid" borderColor={panelBorder} borderRadius="xl" bg={panelBg}>
				<Text mb="3" fontWeight="semibold">{homeText.features}</Text>
				<CheckboxGroup colorScheme="orange" value={Array.isArray(values.specificProps.features) ? values.specificProps.features : []} onChange={(selected) => updateSpecific("features", selected as string[])}>
					<SimpleGrid columns={{ base: 1, sm: 2, lg: 3 }} spacing="3">
						{Object.entries(homeText.homeFeatures).map(([value, label]) => <Checkbox key={value} value={value}>{label}</Checkbox>)}
					</SimpleGrid>
				</CheckboxGroup>
			</Box>
		</>
	) : item.itemType === "CAR" ? (
		<>
			<SimpleGrid columns={{ base: 1, md: 2 }} spacing="5">
				{field(carText.manufacturer, "manufacturer")}
				{field(carText.model, "model")}
				{field(carText.year, "year", "number")}
				{select(carText.status, "status", [["USED", carText.used], ["NEW", carText.new], ["NEW_ETH", carText.newInEthiopia]])}
				{select(carText.bodyType, "bodyType", Object.entries(carText.bodyTypes) as Array<[string, string]>) }
				{select(carText.transmission, "transmition", [["AUTO", carText.automatic], ["MANUAL", carText.manual]])}
				{select(carText.fuelType, "fuelType", Object.entries(carText.fuelTypes) as Array<[string, string]>) }
				{select(carText.driveType, "driveType", Object.entries(carText.driveTypes) as Array<[string, string]>) }
				{field(carText.color, "color")}
				{field(carText.cylinder, "cylinder", "number")}
				{field(carText.fuel, "fuel", "number")}
				{field(carText.mileage, "mileage", "number")}
				{field(carText.seats, "seats", "number")}
				{field(carText.doors, "doors", "number")}
				{[["region", carText.region], ["city", carText.city], ["subcity", carText.subcity], ["neighborhood", carText.neighborhood], ["landmark", carText.landmark]].map(([name, label]) => field(label, name))}
			</SimpleGrid>
			{sellerContactFields}
			<Box mt="5" p="4" border="1px solid" borderColor={panelBorder} borderRadius="xl" bg={panelBg}>
				<Text mb="3" fontWeight="semibold">{carText.features}</Text>
				<CheckboxGroup colorScheme="orange" value={Array.isArray(values.specificProps.features) ? values.specificProps.features : []} onChange={(selected) => updateSpecific("features", selected as string[])}>
					<SimpleGrid columns={{ base: 1, sm: 2, lg: 3 }} spacing="3">
						{Object.entries(carText.vehicleFeatures).map(([value, label]) => <Checkbox key={value} value={value}>{label}</Checkbox>)}
					</SimpleGrid>
				</CheckboxGroup>
			</Box>
		</>
	) : (
		<>
		<SimpleGrid columns={{ base: 1, md: 2 }} spacing="5">
			{select("Space type", "spaceType", [["SHOP", "Shop"], ["OFFICE", "Office"], ["WAREHOUSE", "Warehouse"], ["MARKET_STALL", "Market stall"], ["WORKSHOP", "Workshop"], ["LAND", "Commercial land"]])}
			{select("Availability", "type", [["RENT", "For rent"], ["FORSALE", "For sale"]])}
			{values.specificProps.type === "RENT" && select("Rent frequency", "priceFrequency", [["DAILY", "Daily"], ["WEEKLY", "Weekly"], ["MONTHLY", "Monthly"], ["YEARLY", "Yearly"]])}
			{field("Floor area (m²)", "area", "number", undefined, "e.g. 80")}
			{[["region", "Region"], ["city", "City"], ["subcity", "Subcity"], ["woreda", "Woreda"], ["neighborhood", "Neighborhood"], ["landmark", "Nearby landmark"]].map(([name, label]) => field(label, name))}
		</SimpleGrid>
		{sellerContactFields}
		<SimpleGrid mt="5" columns={{ base: 1, md: 2 }} spacing="5">
			{[["electricity", "Electricity"], ["water", "Water"], ["roadAccess", "Road access"], ["parking", "Parking"]].map(([name, label]) => select(label, name, [["true", "Yes"], ["false", "No"]]))}
		</SimpleGrid>
		</>
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
			<Flex direction="column" minH="100dvh" bg={pageBg}>
				<Flex bg={surface} borderBottom="1px solid" borderColor={border} minH={MyTheme.size.navbarHeightCompact} alignItems="center" px={{ base: 4, sm: 6, md: 8 }} gap="3">
					<Button variant="outline" onClick={() => router.push(`/items/${item.id}`)}>Back to listing</Button>
					<Heading size="md" display={{ base: "none", sm: "block" }}>Edit listing</Heading>
					<Box flex="1" />
					<ColorModeToggle />
				</Flex>

				<Flex direction="column" px={{ base: 4, sm: 6, md: 8 }} py={{ base: 6, md: 10 }} maxW="5xl" w="full" mx="auto">
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
						<Box bg={surface} border="1px solid" borderColor={border} borderRadius="2xl" p={{ base: 4, md: 6 }} mb="6" boxShadow="0 8px 28px rgba(21,42,44,.06)">
							<Heading size="sm" mb="4">Listing photos</Heading>
							<SimpleGrid columns={{ base: 2, sm: 3, md: 4 }} spacing="3">
								{item.images.map((image: string, index: number) => (
									<ListingImage key={`${image}-${index}`} src={image} alt={`${item.title} photo ${index + 1}`} itemType={item.itemType} h="28" borderRadius="lg" />
								))}
							</SimpleGrid>
						</Box>
					)}
					{item.itemType === "HOUSE" && item.House?.video && (
						<Box bg={surface} border="1px solid" borderColor={border} borderRadius="2xl" p={{ base: 4, md: 6 }} mb="6" boxShadow="0 8px 28px rgba(21,42,44,.06)">
							<Heading size="sm" mb="4">{homeText.video}</Heading>
							<video aria-label={homeText.videoPreview} controls preload="metadata" src={getMediaUrl(item.House.video, "items")} style={{ width: "100%", maxHeight: 400, borderRadius: 12, background: "#000000" }} />
						</Box>
					)}

					<form onSubmit={saveChanges}>
						<Box bg={surface} border="1px solid" borderColor={border} borderRadius="2xl" p={{ base: 4, sm: 6, md: 8 }} boxShadow="0 12px 34px rgba(21,42,44,.08)">
							<Heading size="md">Listing information</Heading>
							<Text mt="2" mb="6" fontSize="sm" color={muted}>Review the labeled fields and save when your changes are ready.</Text>
							<SimpleGrid columns={{ base: 1, md: 2 }} spacing="5" alignItems="start">
								<Box gridColumn={{ base: "auto", md: "1 / -1" }} minW="0">
									<EditInputField title="Title" name="title" value={values.title} onChange={(value) => updateValue("title", value)} placeholder="e.g. 3-bedroom apartment in Bole" required />
								</Box>
								<EditInputField title="Price (ETB)" name="price" type="number" value={values.price} onChange={(value) => updateValue("price", value)} placeholder="e.g. 12,500,000" required />
								<EditInputField title="Price type" name="priceType" value={values.priceType} onChange={(value) => updateValue("priceType", value)} isSelect required>
									<option value="" disabled>Choose a price type</option>
									<option value="FIXED">Fixed</option>
									<option value="NEGOTIABLE">Negotiable</option>
								</EditInputField>
								<EditInputField title={sellerTypeText.label} name="sellerType" value={values.sellerType} onChange={(value) => updateValue("sellerType", value)} isSelect required>
									<option value="" disabled>{sellerTypeText.choose}</option>
									{getSellerTypeOptions(item.itemType, sellerTypeText.options).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
								</EditInputField>
								<FormControl gridColumn={{ base: "auto", md: "1 / -1" }}>
									<Checkbox isChecked={values.sellerAttested} onChange={(event) => updateValue("sellerAttested", event.target.checked)} colorScheme="orange">{sellerTypeText.attestation}</Checkbox>
									<Text mt="2" color={muted} fontSize="sm">{sellerTypeText.attestationHint}</Text>
								</FormControl>
							</SimpleGrid>
							<Box mt="6">
								<EditInputField title="Description" name="description" value={values.description} onChange={(value) => updateValue("description", value)} placeholder="Condition, features, location, and important terms" isTextarea />
							</Box>

							<Divider my={{ base: 6, md: 8 }} />
							<Heading size="md" mb="2">{item.itemType === "HOUSE" ? "Home details" : item.itemType === "CAR" ? "Vehicle details" : item.itemType === "SERVICE" ? serviceText.category : "Business space details"}</Heading>
							<Text mb="6" fontSize="sm" color={muted}>Update the specific information for this listing type.</Text>
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
