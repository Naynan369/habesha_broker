import { Box, Flex, Heading, VStack, Button, Text } from "@chakra-ui/react";
import { ChevronDownIcon, ChevronUpIcon } from "@chakra-ui/icons";
import { useFilter } from "@libs/store";
import { useLang } from "@libs/hooks/useLang";
import { CarType } from "@prisma/client";
import { useState } from "react";
import { FilterInput } from "./FilterInput";

export function FilterNav({ applyFilters }) {
	const filter = useFilter();
	const lang = useLang();
	const text = lang.explore.filters;
	const [expanded, setExpanded] = useState(false);
	const resetFilters = () => {
		filter.setField("itemType", null);
		filter.setField("price", null);
		filter.setField("priceType", null);
		filter.setField("House", { some: {} });
		filter.setField("Car", { some: {} });
		applyFilters();
		setExpanded(false);
	};

	return (
		<Flex direction="column" align="stretch" bg="white" border="1px solid" borderColor="gray.200" borderRadius="2xl" boxShadow="0 14px 34px rgba(27,47,48,.06)" p={{ base: 4, md: 6 }}>
			<Flex display={{ base: "flex", lg: "none" }} align="center" justify="space-between" gap="4">
				<Box><Heading fontSize="md" color="#21383e">{text.panelTitle}</Heading><Text color="gray.500" fontSize="sm" mt="1">{text.panelDescription}</Text></Box>
				<Button size="sm" variant="outline" color="#21383e" borderColor="gray.300" rightIcon={expanded ? <ChevronUpIcon /> : <ChevronDownIcon />} onClick={() => setExpanded((value) => !value)} aria-expanded={expanded}>{text.filtersButton}</Button>
			</Flex>
			<Box display={{ base: expanded ? "block" : "none", lg: "block" }} mt={{ base: 5, lg: 0 }}>
				<Box display={{ base: "none", lg: "block" }} mb="6">
					<Text color="#ad6348" textTransform="uppercase" letterSpacing=".15em" fontWeight="bold" fontSize="xs">{text.heading}</Text>
					<Heading fontSize="lg" mt="2" color="#21383e">{text.subtitle}</Heading>
					<Text color="gray.500" fontSize="sm" mt="1">{text.caption}</Text>
				</Box>
				<VStack align="stretch" spacing="5">
					<FilterInput name="price" title={text.price} />
					<FilterInput name="priceType" title={text.priceType} isSelect><option value="">{text.anyPriceType}</option><option value="FIXED">{text.fixed}</option><option value="NEGOTIABLE">{text.negotiable}</option></FilterInput>
					{filter.itemType === "HOUSE" && <><FilterInput name="area" title={text.area} itemType="HOUSE" isSpecific /><FilterInput itemType="HOUSE" isSpecific name="room" title={text.rooms} /><FilterInput name="region" title={text.region} isSingleInput itemType="HOUSE" isSpecific /><FilterInput name="city" title={text.city} isSingleInput itemType="HOUSE" isSpecific /></>}
					{filter.itemType === "CAR" && <><FilterInput name="model" title={text.model} isSingleInput isSpecific itemType="CAR" /><FilterInput name="manufacturer" title={text.manufacturer} isSingleInput isSpecific itemType="CAR" /><FilterInput name="status" title={text.condition} isSelect isSpecific itemType="CAR"><option value="">{text.anyCondition}</option><option value={CarType.NEW}>{text.brandNew}</option><option value={CarType.NEW_ETH}>{text.newInEthiopia}</option><option value={CarType.USED}>{text.used}</option></FilterInput><FilterInput name="year" title={text.year} isSpecific itemType="CAR" /><FilterInput name="color" title={text.color} isSingleInput isSpecific itemType="CAR" /></>}
					<Flex direction={{ base: "column", sm: "row", lg: "column" }} gap="2" pt="2">
						<Button onClick={() => { applyFilters(); setExpanded(false); }} bg="#21383e" color="white" _hover={{ bg: "#142a30" }} size="md" w="full" borderRadius="lg">{text.apply}</Button>
						<Button onClick={resetFilters} variant="outline" color="#21383e" borderColor="gray.300" size="md" w="full" borderRadius="lg">{text.clear}</Button>
					</Flex>
				</VStack>
			</Box>
		</Flex>
	);
}
