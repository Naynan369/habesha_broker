import { prisma } from "@config/prisma";
import { withSessionApi } from "@config/cookie/cookie";
import type { NextApiRequest, NextApiResponse } from "next";
import multer from "multer";
import fs from "fs";
import path from "path";
import { v4 as uuid } from "uuid";

class ListingInputError extends Error {}

type SessionRequest = NextApiRequest & {
	session: { user?: { id: string; verfied: boolean }; save: () => Promise<void> };
	files?: Record<string, Express.Multer.File[]>;
	body: Record<string, string>;
};

const uploadDir = path.join(process.cwd(), "public", "items");
const MAX_IMAGE_SIZE = 8 * 1024 * 1024;
const MAX_VIDEO_SIZE = 25 * 1024 * 1024;
const upload = multer({
	storage: multer.diskStorage({
		destination: (_req, _file, callback) => callback(null, uploadDir),
		filename: (_req, file, callback) => {
			const extension = {
				"image/jpeg": ".jpg",
				"image/png": ".png",
				"image/webp": ".webp",
				"image/gif": ".gif",
				"video/mp4": ".mp4",
				"video/webm": ".webm",
				"video/quicktime": ".mov",
			}[file.mimetype] || ".img";
			callback(null, uuid() + extension);
		},
	}),
	fileFilter: (_req, file, callback) => {
		const imageTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
		const videoTypes = ["video/mp4", "video/webm", "video/quicktime"];
		if (file.fieldname === "files" && !imageTypes.includes(file.mimetype)) {
			return callback(new ListingInputError("Use a JPEG, PNG, WebP, or GIF image"));
		}
		if (file.fieldname === "video" && !videoTypes.includes(file.mimetype)) {
			return callback(new ListingInputError("Use an MP4, WebM, or MOV video"));
		}
		if (!["files", "video"].includes(file.fieldname)) return callback(new ListingInputError("Unexpected upload field"));
		callback(null, true);
	},
	limits: { files: 11, fileSize: MAX_VIDEO_SIZE },
}).fields([{ name: "files", maxCount: 10 }, { name: "video", maxCount: 1 }]);

function parseNumber(value: string, field: string, optional = false) {
	if (optional && (value === undefined || value === "")) return undefined;
	const number = Number(value);
	if (!Number.isFinite(number)) throw new ListingInputError("Invalid " + field);
	return number;
}

function optionalText(value: unknown, maxLength: number) {
	const text = String(value ?? "").trim().slice(0, maxLength);
	return text || null;
}

function parseFeatures(value: string | undefined, allowed: string[]) {
	if (!value) return [];
	let parsed: unknown;
	try { parsed = JSON.parse(value); } catch (_error) { throw new ListingInputError("Invalid features selection"); }
	if (!Array.isArray(parsed) || parsed.some((feature) => typeof feature !== "string" || !allowed.includes(feature))) {
		throw new ListingInputError("Invalid features selection");
	}
	return [...new Set(parsed)];
}

function parseOptionalInteger(value: string | undefined, field: string, minimum = 0) {
	const number = parseNumber(value || "", field, true);
	if (number === undefined) return undefined;
	if (!Number.isInteger(number) || number < minimum) throw new ListingInputError("Invalid " + field);
	return number;
}

function handleUpload(req: any, res: any) {
	return new Promise<void>((resolve, reject) => {
		upload(req, res, (err: any) => (err ? reject(err) : resolve()));
	});
}

async function handler(req: NextApiRequest, res: NextApiResponse) {
	if (req.method !== "POST") return res.status(405).json({ err: "Method not allowed" });
	const sessionReq = req as SessionRequest;
	const user = sessionReq.session?.user;
	if (!user) return res.status(401).json({ err: "Authentication required" });
	if (!user.verfied) return res.status(403).json({ err: "Verify your email address first" });

	let uploadedFiles: Express.Multer.File[] = [];
	try {
		fs.mkdirSync(uploadDir, { recursive: true });
		await handleUpload(req, res);
		const groupedFiles = sessionReq.files || {};
		const files = groupedFiles.files || [];
		const video = groupedFiles.video?.[0];
		uploadedFiles = [...files, ...(video ? [video] : [])];
		if (files.some((file) => file.size > MAX_IMAGE_SIZE)) throw new ListingInputError("Each photo must be 8 MB or smaller");
		if (video && video.size > MAX_VIDEO_SIZE) throw new ListingInputError("The video must be 25 MB or smaller");
		if (!files.length) throw new ListingInputError("Add at least one photo to your listing");
		const body = sessionReq.body || {};
		const title = String(body.title || "").trim();
		const price = parseNumber(body.price, "price");
		const priceType = body.priceType;
		const itemType = body.itemType;
		if (!title || title.length < 5 || title.length > 300) throw new ListingInputError("Title must be between 5 and 300 characters");
		if (price < 0) throw new ListingInputError("Price must be non-negative");
		if (!["FIXED", "NEGOTIABLE"].includes(priceType)) throw new ListingInputError("Invalid price type");
		if (!["HOUSE", "CAR", "BUSINESS_SPACE", "SERVICE"].includes(itemType)) throw new ListingInputError("Invalid listing type");
		if (["HOUSE", "CAR"].includes(itemType) && price === 0) throw new ListingInputError("Price must be greater than zero");
		if (video && itemType !== "HOUSE") throw new ListingInputError("Videos can only be added to home listings");

		const common = {
			title,
			description: String(body.description || "").slice(0, 10000),
			price,
			priceType,
			itemType,
			paymentStatus: "DUE",
			images: files.map((file) => file.filename),
			user: { connect: { id: user.id } },
		} as any;

		if (itemType === "HOUSE") {
			const area = parseNumber(body.area, "area");
			const room = parseOptionalInteger(body.room, "room", 1);
			const bedrooms = parseOptionalInteger(body.bedrooms, "bedrooms");
			const bathrooms = parseOptionalInteger(body.bathrooms, "bathrooms");
			const floor = parseOptionalInteger(body.floor, "floor");
			const totalFloors = parseOptionalInteger(body.totalFloors, "total floors", 1);
			if (area <= 0) throw new ListingInputError("House area must be greater than zero");
			if ((bedrooms !== undefined && bedrooms > 100) || (bathrooms !== undefined && bathrooms > 100) || (floor !== undefined && floor > 1000) || (totalFloors !== undefined && totalFloors > 200)) throw new ListingInputError("Check the property room or floor counts");
			if (!body.region?.trim() || !body.city?.trim()) throw new ListingInputError("Region and city are required");
			if (!["RENT", "FORSALE"].includes(body.type)) throw new ListingInputError("Invalid house type");
			const propertyTypes = ["APARTMENT", "DETACHED_HOUSE", "VILLA", "CONDOMINIUM", "TOWNHOUSE", "LAND", "OTHER"];
			if (!propertyTypes.includes(body.propertyType)) throw new ListingInputError("Choose a valid property type");
			const frequencies = ["DAILY", "WEEKLY", "MONTHLY", "YEARLY"];
			if (body.type === "RENT" && !frequencies.includes(body.priceFrequency)) throw new ListingInputError("Choose how often the rent is charged");
			const furnishingOptions = ["FURNISHED", "SEMI_FURNISHED", "UNFURNISHED"];
			if (body.furnishing && !furnishingOptions.includes(body.furnishing)) throw new ListingInputError("Choose a valid furnishing status");
			const homeFeatures = ["PARKING", "ELECTRICITY", "WATER", "INTERNET", "SECURITY", "ELEVATOR", "BALCONY", "COMPOUND", "GENERATOR", "GYM", "SWIMMING_POOL", "GARDEN"];
			common.House = { create: {
				area,
				room: room ?? null,
				type: body.type,
				propertyType: body.propertyType,
				priceFrequency: body.type === "RENT" ? body.priceFrequency : null,
				bedrooms: bedrooms ?? null,
				bathrooms: bathrooms ?? null,
				floor: floor ?? null,
				totalFloors: totalFloors ?? null,
				furnishing: body.furnishing || null,
				region: body.region.trim().slice(0, 100),
				city: body.city.trim().slice(0, 100),
				subcity: optionalText(body.subcity, 100),
				woreda: optionalText(body.woreda, 100),
				neighborhood: optionalText(body.neighborhood, 120),
				landmark: optionalText(body.landmark, 120),
				features: parseFeatures(body.features, homeFeatures),
				video: video?.filename || null,
			} };
		} else if (itemType === "CAR") {
			const year = parseNumber(body.year, "year", true);
			const cylinder = parseNumber(body.cylinder, "cylinder", true);
			const fuel = parseNumber(body.fuel, "fuel", true);
			const mileage = parseOptionalInteger(body.mileage, "mileage");
			const seats = parseOptionalInteger(body.seats, "seats", 1);
			const doors = parseOptionalInteger(body.doors, "doors", 1);
			if ((mileage !== undefined && mileage > 10000000) || (seats !== undefined && seats > 100) || (doors !== undefined && doors > 10)) throw new ListingInputError("Check the vehicle mileage, seat, or door count");
			if (!["USED", "NEW", "NEW_ETH"].includes(body.status)) throw new ListingInputError("Invalid car condition");
			if (!String(body.manufacturer || "").trim() || !String(body.model || "").trim()) throw new ListingInputError("Manufacturer and model are required");
			if (year === undefined || !Number.isInteger(year) || year < 1950 || year > new Date().getFullYear() + 2) throw new ListingInputError("Enter a valid vehicle year");
			if (!body.region?.trim() || !body.city?.trim()) throw new ListingInputError("Region and city are required");
			if (!["AUTO", "MANUAL"].includes(body.transmition)) throw new ListingInputError("Choose a valid transmission");
			const vehicleEnums: Record<string, string[]> = {
				fuelType: ["PETROL", "DIESEL", "HYBRID", "ELECTRIC", "LPG", "OTHER"],
				bodyType: ["SEDAN", "SUV", "HATCHBACK", "PICKUP", "VAN", "MINIBUS", "COUPE", "WAGON", "TRUCK", "OTHER"],
				driveType: ["FWD", "RWD", "AWD", "FOUR_WD", "OTHER"],
			};
			for (const [field, allowed] of Object.entries(vehicleEnums)) {
				if (!allowed.includes(body[field])) throw new ListingInputError("Choose a valid " + field);
			}
			if (cylinder !== undefined && cylinder < 0 || fuel !== undefined && fuel < 0) throw new ListingInputError("Engine size and fuel consumption cannot be negative");
			const carFeatures = ["AIR_CONDITIONING", "AIRBAGS", "ABS", "REAR_CAMERA", "PARKING_SENSORS", "SUNROOF", "ALLOY_WHEELS", "CRUISE_CONTROL", "POWER_WINDOWS", "POWER_STEERING", "BLUETOOTH", "SPARE_TIRE"];
			common.Car = { create: {
				model: String(body.model || "").slice(0, 100),
				status: body.status,
				manufacturer: String(body.manufacturer || "").slice(0, 100),
				year,
				transmition: body.transmition,
				color: String(body.color || "").slice(0, 50) || null,
				cylinder: cylinder === undefined ? null : cylinder,
				fuel: fuel === undefined ? null : fuel,
				fuelType: body.fuelType,
				bodyType: body.bodyType,
				driveType: body.driveType,
				mileage: mileage ?? null,
				seats: seats ?? null,
				doors: doors ?? null,
				region: body.region.trim().slice(0, 100),
				city: body.city.trim().slice(0, 100),
				subcity: optionalText(body.subcity, 100),
				neighborhood: optionalText(body.neighborhood, 120),
				landmark: optionalText(body.landmark, 120),
				features: parseFeatures(body.features, carFeatures),
			} };
		} else if (itemType === "SERVICE") {
			const categories = ["BROKER_SUPPORT", "PROPERTY_PHOTOGRAPHY", "MOVING", "CLEANING", "REPAIRS", "PROPERTY_MANAGEMENT"];
			if (!categories.includes(body.category)) throw new ListingInputError("Choose a valid service category");
			if (!body.region?.trim() || !body.city?.trim()) throw new ListingInputError("Region and city are required");
			common.Service = { create: {
				category: body.category,
				region: body.region.trim().slice(0, 100),
				city: body.city.trim().slice(0, 100),
				serviceArea: String(body.serviceArea || "").trim().slice(0, 240) || null,
			} };
		} else {
			const area = parseNumber(body.area, "area");
			const spaceTypes = ["SHOP", "OFFICE", "WAREHOUSE", "MARKET_STALL", "WORKSHOP", "LAND"];
			if (!spaceTypes.includes(body.spaceType)) throw new ListingInputError("Choose a valid commercial space type");
			if (!["RENT", "FORSALE"].includes(body.type)) throw new ListingInputError("Choose rent or sale");
			if (area <= 0) throw new ListingInputError("Floor area must be greater than zero");
			if (!body.region?.trim() || !body.city?.trim()) throw new ListingInputError("Region and city are required");
			const frequencies = ["DAILY", "WEEKLY", "MONTHLY", "YEARLY"];
			if (body.type === "RENT" && !frequencies.includes(body.priceFrequency)) throw new ListingInputError("Choose how often the rent is charged");
			const facilityFields = ["electricity", "water", "roadAccess", "parking"];
			for (const field of facilityFields) {
				if (body[field] !== "true" && body[field] !== "false") throw new ListingInputError("Invalid facility selection");
			}
			const optionalText = (value: unknown) => String(value || "").trim().slice(0, 120) || null;
			common.BusinessSpace = { create: {
				spaceType: body.spaceType,
				type: body.type,
				priceFrequency: body.type === "RENT" ? body.priceFrequency : null,
				area,
				region: body.region.trim().slice(0, 100),
				city: body.city.trim().slice(0, 100),
				subcity: optionalText(body.subcity),
				woreda: optionalText(body.woreda),
				neighborhood: optionalText(body.neighborhood),
				landmark: optionalText(body.landmark),
				electricity: body.electricity === "true",
				water: body.water === "true",
				roadAccess: body.roadAccess === "true",
				parking: body.parking === "true",
			} };
		}
		const created = await prisma.item.create({ data: common, select: { id: true, userId: true } });
		try {
			await prisma.recentActions.create({
				data: { userId: created.userId, itemId: created.id, actionType: "ADDED" },
			});
		} catch (_activityError) {}
		const listingFee = Number(process.env.LISTING_FEE_ETB ?? process.env.CAR_LISTING_FEE_ETB);
		const feeLabel = Number.isFinite(listingFee) && listingFee > 0 ? "ETB " + listingFee.toLocaleString("en-US") : "the listing fee";
		const message = "Listing created. Pay " + feeLabel + " from the listing page. Admin review starts after payment is confirmed.";
		return res.status(201).json({ msg: message, itemId: created.id });
	} catch (err: any) {
		for (const file of uploadedFiles) {
			try { fs.unlinkSync(file.path); } catch (_cleanupError) {}
		}
		const isUploadInputError = err instanceof ListingInputError;
		const isMulterError = err instanceof multer.MulterError;
		const status = isUploadInputError ? 400 : isMulterError ? (err.code === "LIMIT_FILE_SIZE" ? 413 : 400) : 500;
		const message = status >= 500 ? "Unable to save this listing. Please try again." : err?.message || "Unable to add listing";
		return res.status(status).json({ err: message });
	}
}

export const config = { api: { bodyParser: false } };
export default withSessionApi(handler);
