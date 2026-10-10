import { prisma } from "@config/prisma";
import { withSessionApi } from "@config/cookie/cookie";
import type { NextApiRequest, NextApiResponse } from "next";
import multer from "multer";
import fs from "fs";
import path from "path";
import { v4 as uuid } from "uuid";

type SessionRequest = NextApiRequest & {
	session: { user?: { id: string; verfied: boolean }; save: () => Promise<void> };
	files?: Express.Multer.File[];
	body: Record<string, string>;
};

const uploadDir = path.join(process.cwd(), "public", "items");
const upload = multer({
	storage: multer.diskStorage({
		destination: (_req, _file, callback) => callback(null, uploadDir),
		filename: (_req, file, callback) => {
			const extension = {
				"image/jpeg": ".jpg",
				"image/png": ".png",
				"image/webp": ".webp",
				"image/gif": ".gif",
			}[file.mimetype] || ".img";
			callback(null, uuid() + extension);
		},
	}),
	fileFilter: (_req, file, callback) => {
		if (!["image/jpeg", "image/png", "image/webp", "image/gif"].includes(file.mimetype)) {
			return callback(new Error("Use a JPEG, PNG, WebP, or GIF image"));
		}
		callback(null, true);
	},
	limits: { files: 10, fileSize: 8 * 1024 * 1024 },
}).array("files", 10);

function parseNumber(value: string, field: string, optional = false) {
	if (optional && (value === undefined || value === "")) return undefined;
	const number = Number(value);
	if (!Number.isFinite(number)) throw new Error("Invalid " + field);
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

	let files: Express.Multer.File[] = [];
	try {
		fs.mkdirSync(uploadDir, { recursive: true });
		await handleUpload(req, res);
		files = (sessionReq.files || []) as Express.Multer.File[];
		if (!files.length) throw new Error("Add at least one photo to your listing");
		const body = sessionReq.body || {};
		const title = String(body.title || "").trim();
		const price = parseNumber(body.price, "price");
		const priceType = body.priceType;
		const itemType = body.itemType;
		if (!title || title.length < 5 || title.length > 300) throw new Error("Title must be between 5 and 300 characters");
		if (price < 0) throw new Error("Price must be non-negative");
		if (!["FIXED", "NEGOTIABLE"].includes(priceType)) throw new Error("Invalid price type");
		if (!["HOUSE", "CAR", "BUSINESS_SPACE", "SERVICE"].includes(itemType)) throw new Error("Invalid listing type");

		const common = {
			title,
			description: String(body.description || "").slice(0, 10000),
			price,
			priceType,
			itemType,
			images: files.map((file) => file.filename),
			user: { connect: { id: user.id } },
		} as any;

		if (itemType === "HOUSE") {
			const area = parseNumber(body.area, "area");
			const room = parseNumber(body.room, "room");
			if (area < 0 || room < 1 || !Number.isInteger(room)) throw new Error("House area or room count is invalid");
			if (!body.region?.trim() || !body.city?.trim()) throw new Error("Region and city are required");
			if (!["RENT", "FORSALE"].includes(body.type)) throw new Error("Invalid house type");
			common.House = { create: {
				area,
				room,
				type: body.type,
				region: body.region.trim().slice(0, 100),
				city: body.city.trim().slice(0, 100),
			} };
		} else if (itemType === "CAR") {
			const year = parseNumber(body.year, "year", true);
			const cylinder = parseNumber(body.cylinder, "cylinder", true);
			const fuel = parseNumber(body.fuel, "fuel", true);
			if (!["USED", "NEW", "NEW_ETH"].includes(body.status)) throw new Error("Invalid car condition");
			common.Car = { create: {
				model: String(body.model || "").slice(0, 100),
				status: body.status,
				manufacturer: String(body.manufacturer || "").slice(0, 100),
				year: year === undefined ? null : year,
				transmition: ["AUTO", "MANUAL"].includes(body.transmition) ? body.transmition : "AUTO",
				color: String(body.color || "").slice(0, 50) || null,
				cylinder: cylinder === undefined ? null : cylinder,
				fuel: fuel === undefined ? null : fuel,
			} };
		} else if (itemType === "SERVICE") {
			const categories = ["BROKER_SUPPORT", "PROPERTY_PHOTOGRAPHY", "MOVING", "CLEANING", "REPAIRS", "PROPERTY_MANAGEMENT"];
			if (!categories.includes(body.category)) throw new Error("Choose a valid service category");
			if (!body.region?.trim() || !body.city?.trim()) throw new Error("Region and city are required");
			common.Service = { create: {
				category: body.category,
				region: body.region.trim().slice(0, 100),
				city: body.city.trim().slice(0, 100),
				serviceArea: String(body.serviceArea || "").trim().slice(0, 240) || null,
			} };
		} else {
			const area = parseNumber(body.area, "area");
			const spaceTypes = ["SHOP", "OFFICE", "WAREHOUSE", "MARKET_STALL", "WORKSHOP", "LAND"];
			if (!spaceTypes.includes(body.spaceType)) throw new Error("Choose a valid commercial space type");
			if (!["RENT", "FORSALE"].includes(body.type)) throw new Error("Choose rent or sale");
			if (area <= 0) throw new Error("Floor area must be greater than zero");
			if (!body.region?.trim() || !body.city?.trim()) throw new Error("Region and city are required");
			const frequencies = ["DAILY", "WEEKLY", "MONTHLY", "YEARLY"];
			if (body.type === "RENT" && !frequencies.includes(body.priceFrequency)) throw new Error("Choose how often the rent is charged");
			const facilityFields = ["electricity", "water", "roadAccess", "parking"];
			for (const field of facilityFields) {
				if (body[field] !== "true" && body[field] !== "false") throw new Error("Invalid facility selection");
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
		return res.status(201).json({ msg: "Listing submitted for approval" });
	} catch (err: any) {
		for (const file of files) {
			try { fs.unlinkSync(file.path); } catch (_cleanupError) {}
		}
		return res.status(400).json({ err: err?.message || "Unable to add listing" });
	}
}

export const config = { api: { bodyParser: false } };
export default withSessionApi(handler);
