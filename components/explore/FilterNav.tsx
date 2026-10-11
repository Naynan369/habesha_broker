import { Box, Flex, Heading, VStack, Button, Text, useColorModeValue } from "@chakra-ui/react";
import { ChevronDownIcon, ChevronUpIcon } from "@chakra-ui/icons";
import { useFilter } from "@libs/store";
import { useLang } from "@libs/hooks/useLang";
import { useState } from "react";
import { FilterInput } from "./FilterInput";

export function FilterNav({ applyFilters }) {
	const filter = useFilter();
	const lang = useLang();
	const text = lang.explore.filters;
	const business = lang.businessListing;
	const service = lang.serviceListing;
	const [expanded, setExpanded] = useState(false);
	const surface = useColorModeValue("white", "#1b2a30");
	const textColor = useColorModeValue("#21383e", "#e7eff0");
	const mutedColor = useColorModeValue("gray.500", "gray.300");
	const borderColor = useColorModeValue("gray.200", "whiteAlpha.200");
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
		<Flex direction="column" align="stretch" bg={surface} border="1px solid" borderColor={borderColor} borderRadius="2xl" boxShadow="0 14px 34px rgba(27,47,48,.12)" p={{ base: 4, md: 6 }}>
			<Flex display={{ base: "flex", lg: "none" }} align="center" justify="space-between" gap="4">
				<Box><Heading fontSize="md" color={textColor}>{text.panelTitle}</Heading><Text color={mutedColor} fontSize="sm" mt="1">{text.panelDescription}</Text></Box>
				<Button size="sm" variant="outline" color={textColor} borderColor={borderColor} rightIcon={expanded ? <ChevronUpIcon /> : <ChevronDownIcon />} onClick={() => setExpanded((value) => !value)} aria-expanded={expanded}>{text.filtersButton}</Button>
			</Flex>
			<Box display={{ base: expanded ? "block" : "none", lg: "block" }} mt={{ base: 5, lg: 0 }}>
				<Box display={{ base: "none", lg: "block" }} mb="6"><Text color="#ad6348" textTransform="uppercase" letterSpacing=".15em" fontWeight="bold" fontSize="xs">{text.heading}</Text><Heading fontSize="lg" mt="2" color={textColor}>{text.subtitle}</Heading><Text color={mutedColor} fontSize="sm" mt="1">{text.caption}</Text></Box>
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
						<Button onClick={() => { applyFilters(); setExpanded(false); }} bg="#21383e" color="white" _hover={{ bg: "#142a30" }} size="md" w="full" borderRadius="lg">{text.apply}</Button>
						<Button onClick={resetFilters} variant="outline" color={textColor} borderColor={borderColor} size="md" w="full" borderRadius="lg">{text.clear}</Button>
					</Flex>
				</VStack>
			</Box>
		</Flex>
	);
}
