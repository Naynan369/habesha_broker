import { Flex, Heading, VStack, Button } from "@chakra-ui/react";
import { useFilter } from "@libs/store";
import { ItemType, CarType } from "@prisma/client";
import { FilterInput } from "./FilterInput";

export function FilterNav({ applyFilters }) {
	const filter = useFilter();

	const handleItemType = (type: ItemType) => {
		if (filter.itemType == type) {
			filter.setField("itemType", null);
		} else {
			filter.setField("itemType", type);
		}
	};
	return (
		<Flex direction="column" flex="1">
			<Flex direction={"column"}>
				<Heading fontSize={"md"} mb="3" textTransform="uppercase">
					SELECT ITEM TYPE
				</Heading>
				<VStack w="full" alignItems={"stretch"}>
					<Button
						colorScheme={"blue"}
						variant={
							filter?.itemType === "HOUSE" ? "solid" : "ghost"
						}
						onClick={() => handleItemType("HOUSE")}
					>
						House
					</Button>
					<Button
						colorScheme={"blue"}
						variant={filter?.itemType == "CAR" ? "solid" : "ghost"}
						onClick={() => handleItemType("CAR")}
					>
						Car
					</Button>
				</VStack>
			</Flex>

			<Flex mt="10" direction={"column"}>
				<Heading fontSize={"md"} mb="6" textTransform="uppercase">
					Filters
				</Heading>
				<VStack spacing="5">
					<FilterInput name="price" title="Price range" />
					<FilterInput name="priceType" title="Price type" isSelect>
						<option value="">--</option>
						<option value="FIXED">Fixed</option>
						<option value="NEGOTIABLE">Negotiable</option>
					</FilterInput>
					{filter.itemType === "HOUSE" && (
						<>
							<FilterInput
								name="area"
								title="Area in Sq. M"
								itemType="HOUSE"
								isSpecific
							/>
							<FilterInput
								itemType="HOUSE"
								isSpecific
								name="room"
								title="Rooms"
							/>
							<FilterInput
								name="region"
								title="Region"
								isSingleInput
								itemType="HOUSE"
								isSpecific
							/>
							<FilterInput
								name="city"
								title="City"
								isSingleInput
								itemType="HOUSE"
								isSpecific
							/>
						</>
					)}

					{filter.itemType === "CAR" && (
						<>
							<FilterInput
								name="model"
								title="Model"
								isSingleInput
								isSpecific
								itemType="CAR"
							/>

							<FilterInput
								name="manufacturer"
								title="manufacturer"
								isSingleInput
								isSpecific
								itemType="CAR"
							/>

							<FilterInput
								name="status"
								title="status"
								isSelect
								isSpecific
								itemType="CAR"
							>
								<option value={CarType.NEW}>Brand New</option>
								<option value={CarType.NEW_ETH}>
									New in Ethiopia
								</option>
								<option value={CarType.USED}>Used</option>
							</FilterInput>

							<FilterInput
								name="year"
								title="year"
								isSpecific
								itemType="CAR"
							/>

							<FilterInput
								name="color"
								title="color"
								isSingleInput
								isSpecific
								itemType="CAR"
							/>
						</>
					)}
					<Button
						onClick={applyFilters}
						colorScheme={"orange"}
						size="sm"
						w="full"
						mt="15"
					>
						Apply Filter
					</Button>
				</VStack>
			</Flex>
		</Flex>
	);
}
