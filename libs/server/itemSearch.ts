import type { IUser } from "@libs/types/user";

function numberBound(value: any): number | undefined {
	if (typeof value === "number" && Number.isFinite(value) && value >= 0) return value;
	if (typeof value === "string" && value.trim() !== "") {
		const parsed = Number(value);
		if (Number.isFinite(parsed) && parsed >= 0) return parsed;
	}
	return undefined;
}

function safeNumberRange(value: any) {
	if (!value || typeof value !== "object") return undefined;
	const range: any = {};
	const gt = numberBound(value.gt);
	const lt = numberBound(value.lt);
	if (gt !== undefined) range.gt = gt;
	if (lt !== undefined) range.lt = lt;
	return Object.keys(range).length ? range : undefined;
}

function safeStringFilter(value: any) {
	if (typeof value === "string") return value.slice(0, 100);
	if (!value || typeof value !== "object") return undefined;
	const condition: any = {};
	for (const operator of ["startsWith", "contains", "endsWith"]) {
		if (typeof value[operator] === "string" && value[operator].trim()) {
			condition[operator] = value[operator].trim().slice(0, 100);
		}
	}
	if (Object.keys(condition).length && value.mode === "insensitive") condition.mode = "insensitive";
	return Object.keys(condition).length ? condition : undefined;
}

export function safeItemWhere(body: any, user: IUser | null, isAdmin: boolean) {
	const where: any = {};
	if (isAdmin) {
		where.status = ["PENDING", "APPROVED", "DECLINED", "SOLD", "CLOSED", "RENTED"].includes(body.status)
			? body.status
			: "PENDING";
		if (typeof body.id === "string" && body.id) where.id = body.id;
		if (body.paymentFilter === "AWAITING") {
			where.paymentStatus = { in: ["DUE", "PROCESSING"] };
		} else if (where.status === "PENDING") {
			where.paymentStatus = "PAID";
		}
		return where;
	}

	if (user && body.userId === user.id) where.userId = user.id;
	else {
		where.status = "APPROVED";
	}

	const validTypes = ["HOUSE", "CAR", "BUSINESS_SPACE", "SERVICE"];
	if (validTypes.includes(body.itemType)) where.itemType = body.itemType;
	else if (Array.isArray(body.itemType?.in)) {
		const types = body.itemType.in.filter((type: unknown) => validTypes.includes(String(type)));
		if (types.length) where.itemType = { in: types };
	}
	if (body.priceType === "FIXED" || body.priceType === "NEGOTIABLE") where.priceType = body.priceType;
	const price = safeNumberRange(body.price);
	if (price) where.price = price;

	if (body.title && typeof body.title === "object") {
		const title = safeStringFilter(body.title);
		if (title) where.title = title;
	} else if (typeof body.title === "string" && body.title.trim()) {
		where.title = { contains: body.title.trim().slice(0, 120) };
	}

	const relationRules: Record<string, { numeric: string[]; strings: string[]; enums: Record<string, string[]>; features?: string[] }> = {
		House: {
			numeric: ["area", "room", "bedrooms", "bathrooms", "floor", "totalFloors"],
			strings: ["region", "city", "subcity", "woreda", "neighborhood", "landmark"],
			enums: {
				type: ["RENT", "FORSALE"],
				propertyType: ["APARTMENT", "DETACHED_HOUSE", "VILLA", "CONDOMINIUM", "TOWNHOUSE", "LAND", "OTHER"],
				priceFrequency: ["DAILY", "WEEKLY", "MONTHLY", "YEARLY"],
				furnishing: ["FURNISHED", "SEMI_FURNISHED", "UNFURNISHED"],
			},
			features: ["PARKING", "ELECTRICITY", "WATER", "INTERNET", "SECURITY", "ELEVATOR", "BALCONY", "COMPOUND", "GENERATOR", "GYM", "SWIMMING_POOL", "GARDEN"],
		},
		Car: {
			numeric: ["year", "cylinder", "fuel", "mileage", "seats", "doors"],
			strings: ["model", "manufacturer", "color", "transmition", "region", "city", "subcity", "neighborhood", "landmark"],
			enums: {
				status: ["USED", "NEW", "NEW_ETH"],
				fuelType: ["PETROL", "DIESEL", "HYBRID", "ELECTRIC", "LPG", "OTHER"],
				bodyType: ["SEDAN", "SUV", "HATCHBACK", "PICKUP", "VAN", "MINIBUS", "COUPE", "WAGON", "TRUCK", "OTHER"],
				driveType: ["FWD", "RWD", "AWD", "FOUR_WD", "OTHER"],
			},
			features: ["AIR_CONDITIONING", "AIRBAGS", "ABS", "REAR_CAMERA", "PARKING_SENSORS", "SUNROOF", "ALLOY_WHEELS", "CRUISE_CONTROL", "POWER_WINDOWS", "POWER_STEERING", "BLUETOOTH", "SPARE_TIRE"],
		},
		BusinessSpace: { numeric: ["area"], strings: ["region", "city", "subcity", "neighborhood"], enums: { spaceType: ["SHOP", "OFFICE", "WAREHOUSE", "MARKET_STALL", "WORKSHOP", "LAND"], type: ["RENT", "FORSALE"], priceFrequency: ["DAILY", "WEEKLY", "MONTHLY", "YEARLY"] } },
		Service: { numeric: [], strings: ["region", "city", "serviceArea"], enums: { category: ["BROKER_SUPPORT", "PROPERTY_PHOTOGRAPHY", "MOVING", "CLEANING", "REPAIRS", "PROPERTY_MANAGEMENT"] } },
	};
	for (const [relation, rules] of Object.entries(relationRules)) {
		const input = body[relation]?.some;
		if (!input || typeof input !== "object") continue;
		const details: any = {};
		for (const key of rules.numeric) {
			const range = safeNumberRange(input[key]);
			const scalar = numberBound(input[key]);
			if (range) details[key] = range;
			else if (scalar !== undefined) details[key] = scalar;
		}
		for (const key of rules.strings) {
			const condition = safeStringFilter(input[key]);
			if (condition) details[key] = condition;
		}
		for (const [key, options] of Object.entries(rules.enums)) {
			if (options.includes(input[key])) details[key] = input[key];
		}
		if (rules.features && Array.isArray(input.features)) {
			const features = input.features.filter((value: unknown) => typeof value === "string" && rules.features?.includes(value));
			if (features.length) details.features = { hasSome: [...new Set(features)] };
		}
		where[relation] = { is: details };
	}
	return where;
}

export function searchableText(term: string, fields: string[]) {
	return fields.map((field) => ({ [field]: { contains: term, mode: "insensitive" } }));
}

