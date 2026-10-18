import {
	Alert,
	AlertDescription,
	AlertIcon,
	AlertTitle,
	Box,
	Button,
	FormControl,
	FormLabel,
	Input,
	Select,
	SimpleGrid,
	Spinner,
	Text,
	useColorModeValue,
} from "@chakra-ui/react";
import { useLang } from "@libs/hooks/useLang";
import axios from "axios";
import { useEffect, useState } from "react";

type SellerContactInfo = {
	id: string;
	contactType: "PHONE_NUMBER" | "WHATSAPP" | "TELEGRAM";
	value: string;
};

const sellerContactTypes = ["PHONE_NUMBER", "WHATSAPP", "TELEGRAM"] as const;
const phoneCountries = [
	["Ethiopia", "+251"], ["Eritrea", "+291"], ["Djibouti", "+253"], ["Somalia", "+252"],
	["Kenya", "+254"], ["Sudan", "+249"], ["South Sudan", "+211"], ["Uganda", "+256"],
	["Tanzania", "+255"], ["Rwanda", "+250"], ["Egypt", "+20"], ["South Africa", "+27"],
	["United Arab Emirates", "+971"], ["Saudi Arabia", "+966"], ["Qatar", "+974"],
	["United Kingdom", "+44"], ["United States", "+1"], ["Canada", "+1"], ["Germany", "+49"],
	["Italy", "+39"], ["France", "+33"], ["India", "+91"],
] as const;

export function useSellerContact(userId: string) {
	const copy = useLang().sellerContact;
	const [contacts, setContacts] = useState<SellerContactInfo[]>([]);
	const [loading, setLoading] = useState(true);
	const [loadError, setLoadError] = useState(false);
	const [reloadKey, setReloadKey] = useState(0);
	const [contactType, setContactType] = useState<(typeof sellerContactTypes)[number]>("PHONE_NUMBER");
	const [countryCode, setCountryCode] = useState("+251");
	const [value, setValue] = useState("");

	useEffect(() => {
		let active = true;
		if (!userId) {
			setLoading(false);
			return () => { active = false; };
		}
		setLoading(true);
		setLoadError(false);
		axios.get(`/api/user/contactInfo/${userId}`)
			.then((response) => {
				if (active) setContacts(Array.isArray(response.data) ? response.data.filter((info: SellerContactInfo) => sellerContactTypes.includes(info.contactType)) : []);
			})
			.catch(() => { if (active) setLoadError(true); })
			.finally(() => { if (active) setLoading(false); });
		return () => { active = false; };
	}, [userId, reloadKey]);

	const ensureContact = async () => {
		if (!userId) throw new Error(copy.saveErrorHelp);
		if (loading) throw new Error(copy.loading);
		if (loadError) throw new Error(copy.loadErrorDescription);
		if (contacts.length) return;
		if (!value.trim()) throw new Error(copy.valueRequired);
		const rawValue = value.trim();
		const digits = rawValue.replace(/\D/g, "");
		const normalizedValue = contactType === "TELEGRAM"
			? rawValue
			: rawValue.startsWith("+")
				? "+" + digits
				: countryCode + digits.replace(/^0/, "");
		const response = await axios.post("/api/user/contactInfo/add", {
			infos: [{ contactType, value: normalizedValue }],
		});
		const added = Array.isArray(response.data) ? response.data : [];
		setContacts((current) => [...current, ...added]);
	};

	return {
		contacts,
		loading,
		loadError,
		contactType,
		setContactType,
		countryCode,
		setCountryCode,
		value,
		setValue,
		retry: () => setReloadKey((current) => current + 1),
		ensureContact,
	};
}

export function SellerContactStep({ contact }: { contact: ReturnType<typeof useSellerContact> }) {
	const copy = useLang().sellerContact;
	const surface = useColorModeValue("white", "#0c0c0c");
	const border = useColorModeValue("orange.200", "orange.900");
	const subtle = useColorModeValue("gray.600", "gray.400");
	const fieldBorder = useColorModeValue("gray.300", "whiteAlpha.300");
	const hintSurface = useColorModeValue("orange.50", "whiteAlpha.100");

	return (
		<Box bg={surface} border="1px solid" borderColor={border} borderRadius="2xl" p={{ base: 4, md: 6 }}>
			<Text fontWeight="bold" fontSize="lg" mb="5">{copy.stepTitle}</Text>
			<Alert status="info" borderRadius="xl" mb="5" bg={hintSurface}>
				<AlertIcon />
				<Box><AlertTitle fontSize="sm">{copy.publicTitle}</AlertTitle><AlertDescription fontSize="sm">{copy.publicDescription}</AlertDescription></Box>
			</Alert>

			{contact.loading ? (
				<Box display="flex" alignItems="center" gap="3" py="3" color={subtle}><Spinner size="sm" color="mainorange" /><Text>{copy.loading}</Text></Box>
			) : contact.loadError ? (
				<Alert status="error" borderRadius="xl">
					<AlertIcon />
					<Box><AlertTitle fontSize="sm">{copy.loadErrorTitle}</AlertTitle><AlertDescription fontSize="sm">{copy.loadErrorDescription}</AlertDescription></Box>
					<Button type="button" ml="auto" size="sm" variant="outline" onClick={contact.retry}>{copy.retry}</Button>
				</Alert>
			) : contact.contacts.length ? (
				<Box p="4" border="1px solid" borderColor={fieldBorder} borderRadius="xl">
					<Text fontSize="sm" fontWeight="semibold" mb="2">{copy.existingContactTitle}</Text>
					{contact.contacts.map((info) => <Text key={info.id} color={subtle} fontSize="sm">{info.contactType === "PHONE_NUMBER" ? copy.phone : info.contactType === "WHATSAPP" ? "WhatsApp" : "Telegram"}: {info.value}</Text>)}
				</Box>
			) : (
				<Box>
					<FormControl isRequired>
						<FormLabel htmlFor="seller-contact-method" fontSize="sm" fontWeight="semibold">{copy.contactMethodLabel}</FormLabel>
						<Select id="seller-contact-method" value={contact.contactType} onChange={(event) => contact.setContactType(event.target.value as (typeof sellerContactTypes)[number])} borderRadius="xl" bg={surface} borderColor={fieldBorder}>
							<option value="PHONE_NUMBER">{copy.phone}</option>
							<option value="WHATSAPP">WhatsApp</option>
							<option value="TELEGRAM">Telegram</option>
						</Select>
					</FormControl>
					<FormControl isRequired mt="4">
						<FormLabel htmlFor={contact.contactType === "TELEGRAM" ? "seller-contact-value" : "seller-contact-phone"} fontSize="sm" fontWeight="semibold">
							{contact.contactType === "TELEGRAM" ? copy.contactValueLabel : copy.phoneNumberLabel}
						</FormLabel>
						{contact.contactType === "TELEGRAM" ? (
							<Input id="seller-contact-value" isRequired value={contact.value} onChange={(event) => contact.setValue(event.target.value)} placeholder={copy.telegramPlaceholder} borderRadius="xl" bg={surface} borderColor={fieldBorder} _placeholder={{ color: subtle }} />
						) : (
							<SimpleGrid columns={{ base: 1, sm: 2 }} spacing="3">
								<Select id="seller-contact-country" aria-label={copy.countryCodeLabel} value={contact.countryCode} onChange={(event) => contact.setCountryCode(event.target.value)} borderRadius="xl" bg={surface} borderColor={fieldBorder}>
									{phoneCountries.map(([country, code]) => <option key={`${country}-${code}`} value={code}>{country} ({code})</option>)}
								</Select>
								<Input id="seller-contact-phone" type="tel" inputMode="tel" isRequired value={contact.value} onChange={(event) => contact.setValue(event.target.value)} placeholder={copy.phonePlaceholder} borderRadius="xl" bg={surface} borderColor={fieldBorder} _placeholder={{ color: subtle }} />
							</SimpleGrid>
						)}
					</FormControl>
					<Text mt="2" color={subtle} fontSize="xs">{contact.contactType === "TELEGRAM" ? copy.telegramHint : copy.phoneHint}</Text>
				</Box>
			)}
		</Box>
	);
}
