import { CarType, ItemType, ServiceCategory } from "@prisma/client";
import create from "zustand";

export interface FilterState {
	itemType?: ItemType;
	price?: NumberRange;
	priceType?: "FIXED" | "NEGOTIABLE";
	House?: { some: HouseFilter };
	Car?: { some: CarFilter };
	BusinessSpace?: { some: BusinessSpaceFilter };
	Service?: { some: ServiceFilter };
	status: "APPROVED";

	setField: (field: string, value: any) => void;
	setHouse: (field: string, value: any) => void;
	setCar: (field: string, value: any) => void;
	setBusinessSpace: (field: string, value: any) => void;
	setService: (field: string, value: any) => void;
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
	manufacturer?: string;
	year?: NumberRange;
	color?: string;
	cylinder?: NumberRange;
	fuel?: NumberRange;
}

interface BusinessSpaceFilter {
	area?: NumberRange;
	spaceType?: string;
	type?: "RENT" | "FORSALE";
	priceFrequency?: string;
	region?: string;
	city?: string;
	subcity?: string;
	neighborhood?: string;
}

interface ServiceFilter {
	category?: ServiceCategory;
	region?: string;
	city?: string;
}

interface NumberRange {
	gt?: number;
	lt?: number;
}

const updateRelation = (state: any, relation: "House" | "Car" | "BusinessSpace" | "Service", field: string, value: any) => {
	const relationState = { ...(state[relation] || { some: {} }), some: { ...(state[relation]?.some || {}) } };
	if (value === undefined || value === null || value === "") delete relationState.some[field];
	else relationState.some[field] = value;
	return { ...state, [relation]: relationState };
};

const useFilter = create<FilterState>((set) => ({
	status: "APPROVED",
	Car: { some: {} },
	House: { some: {} },
	BusinessSpace: { some: {} },
	Service: { some: {} },

	setField: (field, value) => set((state) => ({ ...state, [field]: value })),
	setHouse: (field, value) => set((state) => updateRelation(state, "House", field, value)),
	setCar: (field, value) => set((state) => updateRelation(state, "Car", field, value)),
	setBusinessSpace: (field, value) => set((state) => updateRelation(state, "BusinessSpace", field, value)),
	setService: (field, value) => set((state) => updateRelation(state, "Service", field, value)),
	removeField: (field) => set((state) => {
		const next = { ...state } as any;
		delete next[field];
		return next;
	}),
}));

export const organizeFilters = (filter: FilterState) => {
	const filterCopy: any = { ...filter };
	const relations = ["House", "Car", "BusinessSpace", "Service"];
	const selectedRelation = filterCopy.itemType === "HOUSE"
		? "House"
		: filterCopy.itemType === "CAR"
			? "Car"
			: filterCopy.itemType === "BUSINESS_SPACE"
				? "BusinessSpace"
				: filterCopy.itemType === "SERVICE"
					? "Service"
					: undefined;

	for (const relation of relations) {
		if (relation !== selectedRelation) delete filterCopy[relation];
	}

	const newFilter = Object.fromEntries(Object.entries(filterCopy).filter(([, value]) => value != null));
	return JSON.parse(JSON.stringify(newFilter));
};

export default useFilter;
