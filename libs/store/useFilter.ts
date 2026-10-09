import { CarType, ItemType } from "@prisma/client";
import create from "zustand";

export interface FilterState {
	itemType?: "HOUSE" | "CAR";
	price?: NumberRange;
	priceType?: "FIXED" | "NEGOTIABLE";
	House?: { some: HouseFilter };
	Car?: { some: CarFilter };
	status: "APPROVED";

	setField: (field: string, value: any) => void;
	setHouse: (field: string, value: any) => void;
	setCar: (field: string, value: any) => void;

	removeField: (field: string) => void;
}

interface HouseFilter {
	area?: NumberRange;
	room?: NumberRange;
	region?: string;
	city?: string;
}

interface CarFilter {
	model?: string;
	status?: CarType;
	manufacturer?: String;
	year?: NumberRange;
	color?: string;
	cylinder?: NumberRange;
	fuel?: NumberRange;
}

interface NumberRange {
	gt?: number;
	lt?: number;
}

const useFilter = create<FilterState>((set) => ({
	status: "APPROVED",
	Car: { some: {} },
	House: { some: {} },

	setField: (field: string, value: any) =>
		set((state) => {
			let newState = { ...state };
			newState[field] = value;
			return newState;
		}),

	setHouse: (field: string, value: any) =>
		set((state) => {
			let houseState = { ...state.House };
			houseState.some[field] = value;
			return { ...state, House: houseState };
		}),

	setCar: (field: string, value: any) =>
		set((state) => {
			let carState = { ...state.Car };
			carState.some[field] = value;
			return { ...state, Car: carState };
		}),

	removeField: (field: string) =>
		set((state) => {
			let newState = { ...state };
			delete newState[field];
			return newState;
		}),
}));

export const organizeFilters = (filter: FilterState) => {
	const filterCopy = { ...filter };
	if (filterCopy.itemType == "CAR") {
		delete filterCopy["House"];
	} else if (filterCopy.itemType === "HOUSE") {
		delete filterCopy["Car"];
	} else {
		delete filterCopy["Car"];
		delete filterCopy["House"];
	}

	const newFilter = Object.fromEntries(
		Object.entries(filterCopy).filter(([, value]) => value != null)
	);

	return JSON.parse(JSON.stringify(newFilter));
};

export default useFilter;
