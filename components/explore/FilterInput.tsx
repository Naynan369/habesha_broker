import { MinusIcon } from "@chakra-ui/icons";
import { Flex, Select, Input, HStack, Text } from "@chakra-ui/react";
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
			<Text color="gray.600" fontSize="xs" fontWeight="semibold" mb="2">{title}</Text>
			{isSelect ? (
				<Select value={fieldName || ""} onChange={(event) => handleFunction(name, event.target.value || undefined)} w="full" bg="gray.50" borderColor="gray.200" size="sm" borderRadius="lg" aria-label={title}>{children}</Select>
			) : isSingleInput ? (
				<Input value={textValue} onChange={(event) => {
					const value = event.target.value.trimStart();
					handleFunction(name, value ? { startsWith: value.slice(0, 100), mode: "insensitive" } : undefined);
				}} maxLength={100} placeholder={text.inputPlaceholder} size="sm" bg="gray.50" borderColor="gray.200" borderRadius="lg" aria-label={title} />
			) : (
				<HStack>
					<Input value={fieldName?.gt ?? ""} onChange={(event) => updateRange("gt", event.target.value)} type="number" min="0" step={name === "room" || name === "year" ? 1 : "any"} bg="gray.50" borderColor="gray.200" placeholder={text.minimum} size="sm" borderRadius="lg" aria-label={`${text.minimum} ${title}`} />
					<MinusIcon flexShrink={0} fontSize="sm" color="gray.400" />
					<Input value={fieldName?.lt ?? ""} onChange={(event) => updateRange("lt", event.target.value)} type="number" min="0" step={name === "room" || name === "year" ? 1 : "any"} bg="gray.50" borderColor="gray.200" placeholder={text.maximum} size="sm" borderRadius="lg" aria-label={`${text.maximum} ${title}`} />
				</HStack>
			)}
		</Flex>
	);
};
