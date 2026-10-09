import { MinusIcon } from "@chakra-ui/icons";
import { Flex, Select, Input, HStack, Text } from "@chakra-ui/react";
import { useFilter } from "@libs/store";
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
export const FilterInput: FC<IFilterInput> = ({
	name,
	title,
	isSingleInput,
	isSelect,
	isSpecific,
	itemType,
	children,
}) => {
	const filter = useFilter();
	const handleFunction = isSpecific
		? itemType === "CAR"
			? filter.setCar
			: filter.setHouse
		: filter.setField;

	const fieldName = isSpecific
		? itemType === "CAR"
			? filter?.Car?.some[name]
			: filter?.House?.some[name]
		: filter[name];

	return (
		<Flex w="full" direction={"column"}>
			<Text
				color={"gray.600"}
				fontSize={"sm"}
				mb="2"
				textTransform={"uppercase"}
			>
				{title}
			</Text>
			{isSelect ? (
				<Select
					onChange={(e) => handleFunction(name, e.target.value)}
					w="full"
					variant="filled"
					size="sm"
				>
					{children}
				</Select>
			) : isSingleInput ? (
				<Input
					onChange={(e) =>
						handleFunction(name, {
							startsWith: e.target.value,
							mode: "insensitive",
						})
					}
					size="sm"
					variant={"filled"}
				/>
			) : (
				<HStack>
					<Input
						onBlur={(e) => {
							const value = e.target.valueAsNumber;
							const data: any = fieldName?.lt
								? {
										lt: fieldName?.lt,
								  }
								: {};

							if (value) {
								data["gt"] = value;
							}
							handleFunction(name, data);
						}}
						type="number"
						variant={"filled"}
						placeholder="min"
						size={"sm"}
					/>
					<MinusIcon fontSize={"sm"} color="blue.900" />
					<Input
						onBlur={(e) => {
							const value = e.target.valueAsNumber;
							const data: any = fieldName?.gt
								? {
										gt: fieldName?.gt,
								  }
								: {};

							if (value) {
								data["lt"] = value;
							}

							handleFunction(name, data);
						}}
						type="number"
						variant={"filled"}
						placeholder="max"
						size={"sm"}
					/>
				</HStack>
			)}
		</Flex>
	);
};
