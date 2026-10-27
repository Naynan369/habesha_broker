import {
	Box,
	Checkbox,
	FormControl,
	FormErrorMessage,
	FormHelperText,
	FormLabel,
	Select,
	useColorModeValue,
} from "@chakra-ui/react";
import { useLang } from "@libs/hooks/useLang";

type ListingItemType = "HOUSE" | "CAR" | "BUSINESS_SPACE" | "SERVICE";
type SellerType = "OWNER" | "AUTHORIZED_AGENT" | "BROKER" | "DEALER_RETAILER" | "SERVICE_PROVIDER" | "SERVICE_COMPANY";

const sellerTypesByItemType: Record<ListingItemType, SellerType[]> = {
	HOUSE: ["OWNER", "AUTHORIZED_AGENT", "BROKER"],
	CAR: ["OWNER", "DEALER_RETAILER", "BROKER"],
	BUSINESS_SPACE: ["OWNER", "AUTHORIZED_AGENT", "BROKER"],
	SERVICE: ["SERVICE_PROVIDER", "SERVICE_COMPANY"],
};

export function SellerTypeField({ formik, itemType }: { formik: any; itemType: ListingItemType }) {
	const copy = useLang().sellerType;
	const surface = useColorModeValue("white", "#111416");
	const panel = useColorModeValue("gray.50", "whiteAlpha.50");
	const border = useColorModeValue("gray.300", "whiteAlpha.300");
	const labelColor = useColorModeValue("gray.800", "gray.100");
	const hintColor = useColorModeValue("gray.600", "gray.400");
	const options = sellerTypesByItemType[itemType];

	return (
		<Box p={{ base: 4, md: 5 }} border="1px solid" borderColor={border} borderRadius="xl" bg={panel}>
			<FormControl isRequired isInvalid={Boolean(formik.touched.sellerType && formik.errors.sellerType)}>
				<FormLabel htmlFor="sellerType" mb="1" color={labelColor} fontWeight="semibold">{copy.label}</FormLabel>
				<FormHelperText mt="0" mb="3" color={hintColor}>{copy.hint}</FormHelperText>
				<Select
					id="sellerType"
					name="sellerType"
					value={formik.values.sellerType}
					onChange={formik.handleChange}
					onBlur={formik.handleBlur}
					bg={surface}
					borderColor={border}
					borderRadius="lg"
					h="12"
				>
					<option value="">{copy.choose}</option>
					{options.map((type) => <option key={type} value={type}>{copy.options[type]}</option>)}
				</Select>
				<FormErrorMessage>{String(formik.errors.sellerType || "")}</FormErrorMessage>
			</FormControl>
			<FormControl mt="4" isRequired isInvalid={Boolean(formik.touched.sellerAttested && formik.errors.sellerAttested)}>
				<Checkbox name="sellerAttested" isChecked={formik.values.sellerAttested === true} onChange={(event) => formik.setFieldValue("sellerAttested", event.target.checked)} onBlur={() => formik.setFieldTouched("sellerAttested", true)} colorScheme="orange" alignItems="flex-start">
					<Box><Box as="span" fontWeight="semibold">{copy.attestation}</Box><Box mt="1" color={hintColor} fontSize="sm">{copy.attestationHint}</Box></Box>
				</Checkbox>
				<FormErrorMessage>{String(formik.errors.sellerAttested || "")}</FormErrorMessage>
			</FormControl>
		</Box>
	);
}

export const getSellerTypeOptions = (itemType: ListingItemType, labels: Record<SellerType, string>) =>
	sellerTypesByItemType[itemType].map((type) => [type, labels[type]] as [SellerType, string]);
