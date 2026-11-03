import { prisma } from "@config/prisma";
import { currentUser, error, isValidRecordId, requireAdmin, requireUser, type SessionRequest } from "@libs/server/apiShared";
import { safeItemWhere, searchableText } from "@libs/server/itemSearch";
import type { IUser } from "@libs/types/user";
import type { NextApiResponse } from "next";

const itemInclude = {
	Car: true,
	House: true,
	BusinessSpace: true,
	Service: true,
	user: {
		select: {
			id: true,
			firstName: true,
			lastName: true,
			profile_url: true,
			bio: true,
		},
	},
};

async function listItems(req: SessionRequest, res: NextApiResponse) {
	const adminView = Boolean(
		req.user?.role === "ADMIN" &&
		(typeof req.body?.id === "string" || ["PENDING", "APPROVED", "DECLINED", "SOLD", "CLOSED", "RENTED"].includes(req.body?.status))
	);
	const user = adminView ? req.user : await currentUser(req);
	const isAdmin = adminView;
	if (isAdmin && req.body?.id && !isValidRecordId(req.body.id)) {
		return error(res, 400, "Listing ID is invalid");
	}
	if (isAdmin && !(await requireAdmin(req, res))) return;
	const body = req.body || {};
	const requestedPage = Number(req.query.page) || 0;
	const page = Math.max(0, Math.min(10000, Math.floor(requestedPage)));
	const orderBy = body.orderBy && typeof body.orderBy === "object" ? body.orderBy : { createdAt: "desc" };
	const orderKey = Object.keys(orderBy)[0];
	const sort: any = ["createdAt", "title", "price"].includes(orderKey) && ["asc", "desc"].includes(orderBy[orderKey])
		? { [orderKey]: orderBy[orderKey] }
		: { createdAt: "desc" };
	const where = safeItemWhere(body, user as IUser | null, isAdmin);
	if (!isAdmin && body.featured === true) where.featured = true;
	const keyword = typeof body.keyword === "string" ? body.keyword.trim().slice(0, 120) : "";
	if (keyword && !isAdmin) {
		where.OR = [
			{ title: { contains: keyword, mode: "insensitive" } },
			{ House: { is: { OR: searchableText(keyword, ["region", "city", "subcity", "neighborhood", "landmark"]) } } },
			{ Car: { is: { OR: searchableText(keyword, ["manufacturer", "model", "region", "city", "subcity", "neighborhood", "landmark"]) } } },
			{ BusinessSpace: { is: { OR: searchableText(keyword, ["region", "city", "subcity", "neighborhood", "landmark"]) } } },
			{ Service: { is: { OR: searchableText(keyword, ["region", "city", "serviceArea"]) } } },
		];
	}
	const [items, total] = await Promise.all([
		prisma.item.findMany({
			where,
			include: isAdmin || Boolean(user && body.userId === user.id) ? {
				...itemInclude,
				ListingPayments: {
					take: 1,
					orderBy: { createdAt: "desc" },
					select: {
						id: true,
						txRef: true,
						amount: true,
						currency: true,
						status: true,
						paymentMethod: true,
						providerRef: true,
						createdAt: true,
						verifiedAt: true,
						refundStatus: true,
						refundedAt: true,
						refundRequestStatus: true,
						refundRequestedAt: true,
						refundRequestReason: true,
						refundReviewedAt: true,
						refundReviewNote: true,
					},
				},
			} : itemInclude,
			orderBy: sort,
			skip: page * 30,
			take: 30,
		}),
		prisma.item.count({ where }),
	]);
	return res.status(200).json({ items, total, page, pageSize: 30 });
}

export async function itemRoutes(req: SessionRequest, res: NextApiResponse, slug: string[]) {
	const route = slug.slice(1).join("/");
	const body = req.body || {};

	if (route === "" && req.method === "POST") return listItems(req, res);

	if (route === "save" && req.method === "GET") {
		const user = await requireUser(req, res);
		if (!user) return;
		const page = Math.max(0, Math.min(10000, Math.floor(Number(req.query.page) || 0)));
		const where = { userId: user.id, item: { status: "APPROVED" as const } };
		const [items, total] = await Promise.all([
			prisma.savedItems.findMany({
				where,
				include: { item: { include: itemInclude } },
				orderBy: { savedAt: "desc" },
				skip: page * 30,
				take: 30,
			}),
			prisma.savedItems.count({ where }),
		]);
		return res.status(200).json({ items, total, page, pageSize: 30 });
	}

	if (route === "save/check" && req.method === "GET") {
		const user = await requireUser(req, res);
		if (!user) return;
		const itemId = String(req.query.itemId || "");
		if (!isValidRecordId(itemId)) return res.status(200).json({ saved: false });
		const saved = await prisma.savedItems.findFirst({ where: { userId: user.id, itemId } });
		return res.status(200).json({ saved: Boolean(saved) });
	}

	if (route === "save" && req.method === "POST") {
		const user = await requireUser(req, res);
		if (!user) return;
		const itemId = String(body.itemId || "");
		if (!isValidRecordId(itemId)) return error(res, 404, "Listing not found");
		const item = await prisma.item.findUnique({ where: { id: itemId }, select: { id: true, status: true } });
		if (!item || item.status !== "APPROVED") return error(res, 404, "Listing not found");
		const existing = await prisma.savedItems.findFirst({ where: { userId: user.id, itemId } });
		if (!existing) {
			await prisma.savedItems.create({ data: { userId: user.id, itemId } });
			try {
				await prisma.recentActions.create({ data: { userId: user.id, itemId, actionType: "SAVED" } });
			} catch (_activityError) {}
		}
		return res.status(200).json({ ok: true });
	}

	if (route === "save" && req.method === "DELETE") {
		const user = await requireUser(req, res);
		if (!user) return;
		const itemId = String(body.itemId || "");
		if (!isValidRecordId(itemId)) return res.status(200).json({ ok: true });
		await prisma.savedItems.deleteMany({ where: { userId: user.id, itemId } });
		return res.status(200).json({ ok: true });
	}

	if (route === "close" && req.method === "POST") {
		const user = await requireUser(req, res, true);
		if (!user) return;
		const itemId = String(body.itemId || "");
		const action = body.action;
		if (!isValidRecordId(itemId) || !["close", "reopen", "sold", "rented", "available"].includes(action)) return error(res, 400, "Listing ID or action is invalid");
		const item = await prisma.item.findUnique({ where: { id: itemId }, select: { id: true, userId: true, status: true, paymentStatus: true, itemType: true, House: { select: { type: true } }, BusinessSpace: { select: { type: true } } } });
		if (!item || item.userId !== user.id) return error(res, 404, "Listing not found");
		const isRentalListing = (item.itemType === "HOUSE" && item.House?.type === "RENT")
			|| (item.itemType === "BUSINESS_SPACE" && item.BusinessSpace?.type === "RENT");
		if (action === "rented") {
			if (!isRentalListing) return error(res, 409, "Only rental listings can be marked as rented");
			if (item.status !== "APPROVED") return error(res, 409, "Only published rental listings can be marked as rented");
			const changed = await prisma.item.updateMany({ where: { id: item.id, userId: user.id, status: "APPROVED" }, data: { status: "RENTED", featured: false } });
			if (!changed.count) return error(res, 409, "This listing changed. Refresh and try again.");
			return res.status(200).json({ ok: true, status: "RENTED" });
		}
		if (action === "available") {
			if (!isRentalListing || item.status !== "RENTED") return error(res, 409, "Only rented listings can be marked available");
			if (item.paymentStatus !== "PAID") return error(res, 409, "A confirmed listing fee is required before relisting");
			const changed = await prisma.item.updateMany({ where: { id: item.id, userId: user.id, status: "RENTED", paymentStatus: "PAID" }, data: { status: "APPROVED" } });
			if (!changed.count) return error(res, 409, "This listing changed. Refresh and try again.");
			return res.status(200).json({ ok: true, status: "APPROVED" });
		}
		if (action === "sold") {
			if (item.status !== "APPROVED") return error(res, 409, "Only published listings can be marked sold");
			const isSaleListing = item.itemType === "CAR"
				|| (item.itemType === "HOUSE" && item.House?.type === "FORSALE")
				|| (item.itemType === "BUSINESS_SPACE" && item.BusinessSpace?.type === "FORSALE");
			if (!isSaleListing) return error(res, 409, "Only listings offered for sale can be marked sold");
			const changed = await prisma.item.updateMany({ where: { id: item.id, userId: user.id, status: "APPROVED" }, data: { status: "SOLD" } });
			if (!changed.count) return error(res, 409, "This listing changed. Refresh and try again.");
			return res.status(200).json({ ok: true, status: "SOLD" });
		}
		if (action === "close") {
			if (item.status !== "APPROVED") return error(res, 409, "Only published listings can be closed");
			const changed = await prisma.item.updateMany({ where: { id: item.id, userId: user.id, status: "APPROVED" }, data: { status: "CLOSED" } });
			if (!changed.count) return error(res, 409, "This listing changed. Refresh and try again.");
			return res.status(200).json({ ok: true, status: "CLOSED" });
		}
		if (item.status !== "CLOSED") return error(res, 409, "Only closed listings can be reopened");
		if (item.paymentStatus !== "PAID") return error(res, 409, "A confirmed listing fee is required before reopening");
		const changed = await prisma.item.updateMany({ where: { id: item.id, userId: user.id, status: "CLOSED", paymentStatus: "PAID" }, data: { status: "PENDING", approvedId: null } });
		if (!changed.count) return error(res, 409, "This listing changed. Refresh and try again.");
		return res.status(200).json({ ok: true, status: "PENDING" });
	}

	if (route === "edit" && req.method === "POST") {
		const user = await requireUser(req, res, true);
		if (!user) return;
		if (!isValidRecordId(body.itemId)) return error(res, 400, "Listing ID is invalid");
		const item = await prisma.item.findUnique({ where: { id: body.itemId }, select: { id: true, userId: true, itemType: true, paymentStatus: true } });
		if (!item || item.userId !== user.id) return error(res, 404, "Listing not found");
		if (body.sellerType !== undefined) {
			const sellerTypesByItemType: Record<string, string[]> = {
				HOUSE: ["OWNER", "AUTHORIZED_AGENT", "BROKER"],
				CAR: ["OWNER", "DEALER_RETAILER", "BROKER"],
				BUSINESS_SPACE: ["OWNER", "AUTHORIZED_AGENT", "BROKER"],
				SERVICE: ["SERVICE_PROVIDER", "SERVICE_COMPANY"],
			};
			if (!sellerTypesByItemType[item.itemType]?.includes(body.sellerType)) {
				return error(res, 400, "Choose a valid seller role for this listing");
			}
		}
		if (body.sellerAttested !== true) return error(res, 400, "Confirm that you are authorized to post this listing");
		let sellerPhoneToSave: string | undefined;
		if (body.sellerPhone !== undefined) {
			if (typeof body.sellerPhone !== "string") return error(res, 400, "Phone number is invalid");
			const phone = body.sellerPhone.trim();
			if (phone) {
				const digits = phone.replace(/\D/g, "");
				if (!/^\+\d{7,15}$/.test(phone) || digits.length < 7 || digits.length > 15) return error(res, 400, "Enter a valid phone number with its country code");
				sellerPhoneToSave = phone;
			}
		}
		const data: any = {};
		if (body.sellerType !== undefined) data.sellerType = body.sellerType;
		data.sellerAttested = true;
		for (const key of ["title", "description", "price", "priceType"]) {
			if (body[key] === undefined) continue;
			if (key === "price") {
				if (body.price === "" || body.price === null) return error(res, 400, "Price is required");
				const price = Number(body.price);
				if (!Number.isFinite(price) || price < 0) return error(res, 400, "Price must be a non-negative number");
				if (["HOUSE", "CAR"].includes(item.itemType) && price === 0) return error(res, 400, "Price must be greater than zero");
				data.price = price;
			} else if (key === "priceType") {
				if (!["FIXED", "NEGOTIABLE"].includes(body.priceType)) return error(res, 400, "Invalid price type");
				data.priceType = body.priceType;
			} else if (key === "title") {
				const title = typeof body.title === "string" ? body.title.trim() : "";
				if (title.length < 5 || title.length > 300) return error(res, 400, "Title must be between 5 and 300 characters");
				data.title = title;
			} else if (typeof body.description === "string") {
				data.description = body.description.slice(0, 10000);
			}
		}
		let specific: Record<string, any> = {};
		if (body.specificProps && typeof body.specificProps === "object" && !Array.isArray(body.specificProps)) {
			const allowedByType: Record<string, string[]> = {
				HOUSE: ["area", "room", "type", "propertyType", "priceFrequency", "bedrooms", "bathrooms", "floor", "totalFloors", "furnishing", "region", "city", "subcity", "woreda", "neighborhood", "landmark", "features"],
				CAR: ["model", "status", "manufacturer", "year", "transmition", "color", "cylinder", "fuel", "fuelType", "bodyType", "driveType", "mileage", "seats", "doors", "region", "city", "subcity", "neighborhood", "landmark", "features"],
				BUSINESS_SPACE: ["spaceType", "type", "priceFrequency", "area", "region", "city", "subcity", "woreda", "neighborhood", "landmark", "electricity", "water", "roadAccess", "parking"],
				SERVICE: ["category", "region", "city", "serviceArea", "availability"],
			};
			const allowed = allowedByType[item.itemType] || [];
			for (const key of allowed) {
				const value = body.specificProps[key];
				if (value === undefined) continue;
				if (["area", "room", "year", "cylinder", "fuel", "bedrooms", "bathrooms", "floor", "totalFloors", "mileage", "seats", "doors"].includes(key)) {
					if (value === "" || value === null) {
						if ((["HOUSE", "BUSINESS_SPACE"].includes(item.itemType) && key === "area") || (item.itemType === "CAR" && key === "year")) return error(res, 400, "This listing detail is required");
						specific[key] = null;
						continue;
					}
					const number = Number(value);
					const integerFields = ["room", "year", "bedrooms", "bathrooms", "floor", "totalFloors", "mileage", "seats", "doors"];
					if (!Number.isFinite(number) || number < 0 || (integerFields.includes(key) && !Number.isInteger(number))) {
						return error(res, 400, "A listing detail has an invalid number");
					}
					if (item.itemType === "HOUSE" && key === "room" && number < 1) return error(res, 400, "Room count must be at least one");
					if (item.itemType === "HOUSE" && key === "area" && number === 0) return error(res, 400, "Area must be greater than zero");
					if (item.itemType === "BUSINESS_SPACE" && key === "area" && number === 0) return error(res, 400, "Floor area must be greater than zero");
					if (["seats", "doors"].includes(key) && number < 1) return error(res, 400, "Vehicle seats and doors must be at least one");
					if (item.itemType === "CAR" && key === "year" && (number < 1950 || number > new Date().getFullYear() + 2)) return error(res, 400, "Vehicle year is not valid");
					if (item.itemType === "HOUSE" && key === "totalFloors" && number < 1) return error(res, 400, "Building must have at least one floor");
					if (item.itemType === "HOUSE" && ((["bedrooms", "bathrooms"].includes(key) && number > 100) || (key === "floor" && number > 1000) || (key === "totalFloors" && number > 200))) return error(res, 400, "Check the property room or floor counts");
					if (item.itemType === "CAR" && ((key === "mileage" && number > 10000000) || (key === "seats" && number > 100) || (key === "doors" && number > 10))) return error(res, 400, "Check the vehicle mileage, seat, or door count");
					specific[key] = number;
				} else if (key === "type") {
					if (!["RENT", "FORSALE"].includes(value)) return error(res, 400, "Invalid listing purpose");
					specific[key] = value;
				} else if (key === "propertyType") {
					if (value === "" || value === null) return error(res, 400, "Choose a property type");
					else if (!["APARTMENT", "DETACHED_HOUSE", "VILLA", "CONDOMINIUM", "TOWNHOUSE", "LAND", "OTHER"].includes(value)) return error(res, 400, "Invalid property type");
					else specific[key] = value;
				} else if (key === "furnishing") {
					if (value === "" || value === null) specific[key] = null;
					else if (!["FURNISHED", "SEMI_FURNISHED", "UNFURNISHED"].includes(value)) return error(res, 400, "Invalid furnishing status");
					else specific[key] = value;
				} else if (["fuelType", "bodyType", "driveType"].includes(key) && item.itemType === "CAR") {
					const choices: Record<string, string[]> = {
						fuelType: ["PETROL", "DIESEL", "HYBRID", "ELECTRIC", "LPG", "OTHER"],
						bodyType: ["SEDAN", "SUV", "HATCHBACK", "PICKUP", "VAN", "MINIBUS", "COUPE", "WAGON", "TRUCK", "OTHER"],
						driveType: ["FWD", "RWD", "AWD", "FOUR_WD", "OTHER"],
					};
					if (value === "" || value === null) return error(res, 400, "Choose a vehicle " + key);
					else if (!choices[key].includes(value)) return error(res, 400, "Invalid vehicle " + key);
					else specific[key] = value;
				} else if (key === "spaceType") {
					if (!["SHOP", "OFFICE", "WAREHOUSE", "MARKET_STALL", "WORKSHOP", "LAND"].includes(value)) return error(res, 400, "Invalid commercial space type");
					specific[key] = value;
				} else if (key === "category" && item.itemType === "SERVICE") {
					if (!["BROKER_SUPPORT", "PROPERTY_PHOTOGRAPHY", "MOVING", "CLEANING", "REPAIRS", "PROPERTY_MANAGEMENT"].includes(value)) return error(res, 400, "Invalid service category");
					specific[key] = value;
				} else if (key === "priceFrequency") {
					if (value === "" || value === null) specific[key] = null;
					else {
						if (!["DAILY", "WEEKLY", "MONTHLY", "YEARLY"].includes(value)) return error(res, 400, "Invalid rent frequency");
						specific[key] = value;
					}
				} else if (["electricity", "water", "roadAccess", "parking"].includes(key)) {
					if (value !== "true" && value !== "false" && typeof value !== "boolean") return error(res, 400, "Invalid facility value");
					specific[key] = value === true || value === "true";
				} else if (key === "status" && item.itemType === "CAR") {
					if (!["USED", "NEW", "NEW_ETH"].includes(value)) return error(res, 400, "Invalid car condition");
					specific[key] = value;
				} else if (key === "transmition") {
					if (!["AUTO", "MANUAL"].includes(value)) return error(res, 400, "Invalid transmission");
					specific[key] = value;
				} else if (key === "features") {
					const choices = item.itemType === "HOUSE"
						? ["PARKING", "ELECTRICITY", "WATER", "INTERNET", "SECURITY", "ELEVATOR", "BALCONY", "COMPOUND", "GENERATOR", "GYM", "SWIMMING_POOL", "GARDEN"]
						: ["AIR_CONDITIONING", "AIRBAGS", "ABS", "REAR_CAMERA", "PARKING_SENSORS", "SUNROOF", "ALLOY_WHEELS", "CRUISE_CONTROL", "POWER_WINDOWS", "POWER_STEERING", "BLUETOOTH", "SPARE_TIRE"];
					if (!Array.isArray(value) || value.some((feature) => typeof feature !== "string" || !choices.includes(feature))) return error(res, 400, "Invalid listing features");
					specific[key] = [...new Set(value)];
				} else if (typeof value === "string") {
					const normalized = value.trim().slice(0, 500);
					const requiredStrings: Record<string, string[]> = {
						HOUSE: ["region", "city"],
						CAR: ["model", "manufacturer", "region", "city"],
						SERVICE: ["category", "region", "city"],
						BUSINESS_SPACE: ["region", "city"],
					};
					if (!normalized && (requiredStrings[item.itemType] || []).includes(key)) return error(res, 400, `${key} is required`);
					specific[key] = normalized || (item.itemType === "CAR" && ["model", "manufacturer"].includes(key) ? "" : null);
				}
			}
			if (item.itemType === "BUSINESS_SPACE") {
				if (body.specificProps.type === "RENT" && !specific.priceFrequency) return error(res, 400, "Choose a rent frequency");
				if (body.specificProps.type === "FORSALE") specific.priceFrequency = null;
			}
			if (item.itemType === "HOUSE") {
				if (body.specificProps.type === "RENT" && !specific.priceFrequency && !body.specificProps.priceFrequency) return error(res, 400, "Choose a rent frequency");
				if (body.specificProps.type === "FORSALE") specific.priceFrequency = null;
			}
			if (item.itemType === "CAR") {
				const requiredStrings = ["manufacturer", "model"];
				for (const key of requiredStrings) {
					if (body.specificProps[key] !== undefined && !String(body.specificProps[key]).trim()) return error(res, 400, `${key} is required`);
				}
			}
		}
		const hasSpecificChanges = Object.keys(specific).length > 0;
		if (!Object.keys(data).length && !hasSpecificChanges && !sellerPhoneToSave) return error(res, 400, "No listing changes were provided");
		data.status = "PENDING";
		data.approvedId = null;
		if (item.paymentStatus === "NOT_REQUIRED") data.paymentStatus = "DUE";
		if (hasSpecificChanges) {
			const relation = item.itemType === "HOUSE" ? "House" : item.itemType === "CAR" ? "Car" : item.itemType === "BUSINESS_SPACE" ? "BusinessSpace" : "Service";
			data[relation] = { update: specific };
		}
		await prisma.$transaction(async (tx) => {
			await tx.item.update({ where: { id: item.id }, data });
			if (sellerPhoneToSave) {
				const existingPhone = await tx.contactInfo.findFirst({
					where: { userId: user.id, contactType: "PHONE_NUMBER" },
					select: { id: true },
				});
				if (existingPhone) {
					await tx.contactInfo.update({ where: { id: existingPhone.id }, data: { value: sellerPhoneToSave } });
				} else {
					await tx.contactInfo.create({ data: { userId: user.id, contactType: "PHONE_NUMBER", value: sellerPhoneToSave } });
				}
			}
		});
		return res.status(200).json({ ok: true });
	}

	const itemId = route;
	if (req.method === "GET" && itemId && !itemId.includes("/")) {
		if (!isValidRecordId(itemId)) return error(res, 404, "Listing not found");
		const item = await prisma.item.findUnique({
			where: { id: itemId },
			include: {
				...itemInclude,
				ServiceReviews: {
					take: 10,
					orderBy: { createdAt: "desc" },
					include: { reviewer: { select: { firstName: true, lastName: true } } },
				},
			},
		});
		const user = await currentUser(req);
		if (!item || (item.status !== "APPROVED" && item.userId !== user?.id && user?.role !== "ADMIN")) {
			return error(res, 404, "Listing not found");
		}
		const serviceRatingData = item.itemType === "SERVICE"
			? await prisma.serviceReview.aggregate({ where: { itemId: item.id }, _avg: { rating: true }, _count: { _all: true } })
			: null;
		return res.status(200).json({
			...item,
			serviceRating: { average: serviceRatingData?._avg.rating || 0, count: serviceRatingData?._count._all || 0 },
		});
	}

	return error(res, 404, "Route not found");
}

