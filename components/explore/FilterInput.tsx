import { MinusIcon } from "@chakra-ui/icons";
import { Flex, Select, Input, HStack, Text, useColorModeValue } from "@chakra-ui/react";
import { useFilter } from "@libs/store";
import { useLang } from "@libs/hooks/useLang";
import { ItemType } from "@prisma/client";
import { ReactNode, FC } from "react";

export interface IFilterInput {
	name: string;
	title: string;
	isSelect?: boolean;
	isSingleInput?: boolean;
	isSpecific?: boolean;
	itemType?: ItemType;
	children?: ReactNode;
}

export const FilterInput: FC<IFilterInput> = ({ name, title, isSingleInput, isSelect, isSpecific, itemType, children }) => {
	const filter: any = useFilter();
	const text = useLang().explore.filters;
	const labelColor = useColorModeValue("gray.600", "gray.300");
	const fieldBg = useColorModeValue("gray.50", "#101010");
	const fieldBorder = useColorModeValue("gray.200", "whiteAlpha.300");
	const fieldText = useColorModeValue("#25383d", "#e7eff0");
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
				<HStack w="full" spacing="2">
					<Input flex="1" minW="0" value={fieldName?.gt ?? ""} onChange={(event) => updateRange("gt", event.target.value)} type="number" min="0" step={name === "room" || name === "year" ? 1 : "any"} bg={fieldBg} color={fieldText} borderColor={fieldBorder} placeholder={text.minimum} size="sm" borderRadius="lg" aria-label={`${text.minimum} ${title}`} />
					<MinusIcon flexShrink={0} fontSize="sm" color="gray.400" />
					<Input flex="1" minW="0" value={fieldName?.lt ?? ""} onChange={(event) => updateRange("lt", event.target.value)} type="number" min="0" step={name === "room" || name === "year" ? 1 : "any"} bg={fieldBg} color={fieldText} borderColor={fieldBorder} placeholder={text.maximum} size="sm" borderRadius="lg" aria-label={`${text.maximum} ${title}`} />
				</HStack>
			)}
		</Flex>
	);
};
