import { Box, Flex, Heading, VStack, Button, Text, Select, Input, HStack, useColorModeValue } from "@chakra-ui/react";
import { ChevronDownIcon, ChevronUpIcon, MinusIcon } from "@chakra-ui/icons";
import { useFilter } from "@libs/store";
import { useLang } from "@libs/hooks/useLang";
import { FC, ReactNode, useState } from "react";
import { ItemType } from "@prisma/client";

export function FilterNav({ applyFilters }) {
	const filter = useFilter();
	const lang = useLang();
	const text = lang.explore.filters;
	const business = lang.businessListing;
	const service = lang.serviceListing;
	const [expanded, setExpanded] = useState(false);
	const surface = useColorModeValue("#fffdfa", "#111111");
	const textColor = useColorModeValue("#292725", "#f5f0ea");
	const mutedColor = useColorModeValue("#655e58", "#c7c0bb");
	const borderColor = useColorModeValue("#d8d0c6", "whiteAlpha.200");
	const resetFilters = () => {
		filter.setField("itemType", undefined);
		filter.setField("price", undefined);
		filter.setField("priceType", undefined);
		filter.setField("House", { some: {} });
		filter.setField("Car", { some: {} });
		filter.setField("BusinessSpace", { some: {} });
		filter.setField("Service", { some: {} });
		applyFilters();
		setExpanded(false);
	};

	return (
		<Flex direction="column" align="stretch" bg={surface} border="1px solid" borderColor={borderColor} borderRadius="2xl" boxShadow="0 14px 34px rgba(34,25,25,.1)" p={{ base: 4, md: 6 }}>
			<Flex display={{ base: "flex", lg: "none" }} align="center" justify="space-between" gap="4">
				<Box><Heading fontSize="md" color={textColor}>{text.panelTitle}</Heading><Text color={mutedColor} fontSize="sm" mt="1">{text.panelDescription}</Text></Box>
				<Button size="sm" variant="outline" color={textColor} borderColor={borderColor} rightIcon={expanded ? <ChevronUpIcon /> : <ChevronDownIcon />} onClick={() => setExpanded((value) => !value)} aria-expanded={expanded}>{text.filtersButton}</Button>
			</Flex>
			<Box display={{ base: expanded ? "block" : "none", lg: "block" }} mt={{ base: 5, lg: 0 }}>
				<Box display={{ base: "none", lg: "block" }} mb="6"><Text color="#a96145" textTransform="uppercase" letterSpacing=".15em" fontWeight="bold" fontSize="xs">{text.heading}</Text><Heading fontSize="lg" mt="2" color={textColor}>{text.subtitle}</Heading><Text color={mutedColor} fontSize="sm" mt="1">{text.caption}</Text></Box>
				<VStack align="stretch" spacing="5">
					<FilterInput name="price" title={text.price} />
					<FilterInput name="priceType" title={text.priceType} isSelect><option value="">{text.anyPriceType}</option><option value="FIXED">{text.fixed}</option><option value="NEGOTIABLE">{text.negotiable}</option></FilterInput>
					{filter.itemType === "HOUSE" && <><FilterInput name="area" title={text.area} itemType="HOUSE" isSpecific /><FilterInput itemType="HOUSE" isSpecific name="room" title={text.rooms} /><FilterInput name="region" title={text.region} isSingleInput itemType="HOUSE" isSpecific /><FilterInput name="city" title={text.city} isSingleInput itemType="HOUSE" isSpecific /><FilterInput name="type" title={business.rentOrSale} isSelect isSpecific itemType="HOUSE"><option value="">{business.any}</option><option value="RENT">{business.rent}</option><option value="FORSALE">{business.sale}</option></FilterInput></>}
					{filter.itemType === "CAR" && <><FilterInput name="model" title={text.model} isSingleInput isSpecific itemType="CAR" /><FilterInput name="manufacturer" title={text.manufacturer} isSingleInput isSpecific itemType="CAR" /><FilterInput name="status" title={text.condition} isSelect isSpecific itemType="CAR"><option value="">{text.anyCondition}</option><option value="NEW">{text.brandNew}</option><option value="NEW_ETH">{text.newInEthiopia}</option><option value="USED">{text.used}</option></FilterInput><FilterInput name="year" title={text.year} isSpecific itemType="CAR" /><FilterInput name="color" title={text.color} isSingleInput isSpecific itemType="CAR" /></>}
					{filter.itemType === "SERVICE" && <>
						<FilterInput name="category" title={service.category} isSelect isSpecific itemType="SERVICE"><option value="">{service.selectCategory}</option>{Object.entries(service.categories).map(([value, label]) => <option key={value} value={value}>{label as string}</option>)}</FilterInput>
						<FilterInput name="region" title={service.region} isSingleInput itemType="SERVICE" isSpecific />
						<FilterInput name="city" title={service.city} isSingleInput itemType="SERVICE" isSpecific />
					</>}
					{filter.itemType === "BUSINESS_SPACE" && <>
						<FilterInput name="spaceType" title={business.spaceType} isSelect isSpecific itemType="BUSINESS_SPACE"><option value="">{business.anySpaceType}</option>{Object.entries(business.spaceTypes).map(([value, label]) => <option key={value} value={value}>{label as string}</option>)}</FilterInput>
						<FilterInput name="type" title={business.rentOrSale} isSelect isSpecific itemType="BUSINESS_SPACE"><option value="">{business.any}</option><option value="RENT">{business.rent}</option><option value="FORSALE">{business.sale}</option></FilterInput>
						<FilterInput name="priceFrequency" title={business.priceFrequency} isSelect isSpecific itemType="BUSINESS_SPACE"><option value="">{business.any}</option>{Object.entries(business.frequencies).map(([value, label]) => <option key={value} value={value}>{label as string}</option>)}</FilterInput>
						<FilterInput name="area" title={business.floorArea} itemType="BUSINESS_SPACE" isSpecific />
						<FilterInput name="region" title={text.region} isSingleInput itemType="BUSINESS_SPACE" isSpecific />
						<FilterInput name="city" title={text.city} isSingleInput itemType="BUSINESS_SPACE" isSpecific />
						<FilterInput name="subcity" title={business.subcity} isSingleInput itemType="BUSINESS_SPACE" isSpecific />
						<FilterInput name="neighborhood" title={business.neighborhood} isSingleInput itemType="BUSINESS_SPACE" isSpecific />
					</>}
					<Flex direction={{ base: "column", sm: "row", lg: "column" }} gap="2" pt="2">
						<Button onClick={() => { applyFilters(); setExpanded(false); }} bg="#292725" color="white" _hover={{ bg: "#453a34", color: "white" }} size="md" w="full" borderRadius="lg">{text.apply}</Button>
						<Button onClick={resetFilters} variant="outline" color={textColor} borderColor={borderColor} size="md" w="full" borderRadius="lg">{text.clear}</Button>
					</Flex>
				</VStack>
			</Box>
		</Flex>
	);
}

interface IFilterInput {
	name: string;
	title: string;
	isSelect?: boolean;
	isSingleInput?: boolean;
	isSpecific?: boolean;
	itemType?: ItemType;
	children?: ReactNode;
}

const FilterInput: FC<IFilterInput> = ({ name, title, isSingleInput, isSelect, isSpecific, itemType, children }) => {
	const filter: any = useFilter();
	const text = useLang().explore.filters;
	const labelColor = useColorModeValue("#655e58", "#c7c0bb");
	const fieldBg = useColorModeValue("#f8f3ed", "#101010");
	const fieldBorder = useColorModeValue("#d8d0c6", "whiteAlpha.300");
	const fieldText = useColorModeValue("#292725", "#f5f0ea");
	const relation = itemType === "CAR" ? "Car" : itemType === "BUSINESS_SPACE" ? "BusinessSpace" : itemType === "SERVICE" ? "Service" : "House";
	const handleFunction = isSpecific ? filter[`set${relation}`] : filter.setField;
	const fieldName: any = isSpecific ? filter?.[relation]?.some?.[name] : filter[name];

	const updateRange = (bound: "gt" | "lt", rawValue: string) => {
		const next = { ...(fieldName && typeof fieldName === "object" ? fieldName : {}) };
		if (rawValue === "") delete next[bound];
		else {
			const numericValue = Number(rawValue);
			if (Number.isFinite(numericValue) && numericValue >= 0) next[bound] = numericValue;
		}
		handleFunction(name, Object.keys(next).length ? next : undefined);
	};

	const textValue = typeof fieldName === "string" ? fieldName : fieldName?.startsWith || "";

	return (
		<Flex w="full" direction="column">
			<Text color={labelColor} fontSize="xs" fontWeight="semibold" mb="2">{title}</Text>
			{isSelect ? (
				<Select value={fieldName || ""} onChange={(event) => handleFunction(name, event.target.value || undefined)} w="full" bg={fieldBg} color={fieldText} borderColor={fieldBorder} size="sm" borderRadius="lg" aria-label={title}>{children}</Select>
			) : isSingleInput ? (
				<Input value={textValue} onChange={(event) => {
					const value = event.target.value.trimStart();
					handleFunction(name, value ? { startsWith: value.slice(0, 100), mode: "insensitive" } : undefined);
				}} maxLength={100} placeholder={text.inputPlaceholder} size="sm" bg={fieldBg} color={fieldText} borderColor={fieldBorder} borderRadius="lg" aria-label={title} />
			) : (
				<HStack>
					<Input value={fieldName?.gt ?? ""} onChange={(event) => updateRange("gt", event.target.value)} type="number" min="0" step={name === "room" || name === "year" ? 1 : "any"} bg={fieldBg} color={fieldText} borderColor={fieldBorder} placeholder={text.minimum} size="sm" borderRadius="lg" aria-label={`${text.minimum} ${title}`} />
					<MinusIcon flexShrink={0} fontSize="sm" color="gray.400" />
					<Input value={fieldName?.lt ?? ""} onChange={(event) => updateRange("lt", event.target.value)} type="number" min="0" step={name === "room" || name === "year" ? 1 : "any"} bg={fieldBg} color={fieldText} borderColor={fieldBorder} placeholder={text.maximum} size="sm" borderRadius="lg" aria-label={`${text.maximum} ${title}`} />
				</HStack>
			)}
		</Flex>
	);
};
