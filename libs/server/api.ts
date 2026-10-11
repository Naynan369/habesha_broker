import { prisma } from "@config/prisma";
import { getBaseUrl } from "@libs/helpers/util";
import { getPasswordRestLink } from "@libs/email/passwordReset";
import { getVerificationHtml } from "@libs/email/verification";
import { sendMail } from "@libs/email/sendMail";
import bcrypt from "bcrypt";
import crypto from "crypto";
import type { NextApiRequest, NextApiResponse } from "next";
import type { IUser } from "@libs/types/user";

type SessionRequest = NextApiRequest & {
	session: {
		user?: IUser;
		save: () => Promise<void>;
		destroy: () => void;
	};
};

const publicUserSelect = {
	id: true,
	firstName: true,
	lastName: true,
	email: true,
	bio: true,
	profile_url: true,
	role: true,
	verfied: true,
};

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

const error = (res: NextApiResponse, status: number, err: string) =>
	res.status(status).json({ err });

const isValidRecordId = (value: unknown): value is string =>
	typeof value === "string" && /^[A-Za-z0-9_-]{8,128}$/.test(value);

async function currentUser(req: SessionRequest) {
	if (!req.session?.user?.id) return null;
	const user = await prisma.user.findUnique({
		where: { id: req.session.user.id },
		select: publicUserSelect,
	});
	if (user) {
		req.session.user = user as IUser;
	}
	return user;
}

async function requireUser(req: SessionRequest, res: NextApiResponse, verified = false) {
	const user = await currentUser(req);
	if (!user) {
		error(res, 401, "Authentication required");
		return null;
	}
	if (verified && !user.verfied) {
		error(res, 403, "Verify your email address first");
		return null;
	}
	return user;
}

async function requireAdmin(req: SessionRequest, res: NextApiResponse) {
	const user = await requireUser(req, res);
	if (!user) return null;
	if (user.role !== "ADMIN") {
		error(res, 403, "Administrator access required");
		return null;
	}
	return user;
}

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

function safeItemWhere(body: any, user: IUser | null, isAdmin: boolean) {
	const where: any = {};
	if (isAdmin) {
		where.status = ["PENDING", "APPROVED", "DECLINED", "SOLD"].includes(body.status)
			? body.status
			: "PENDING";
		if (typeof body.id === "string" && body.id) where.id = body.id;
		if (body.paymentFilter === "AWAITING") {
			where.itemType = "CAR";
			where.paymentStatus = { in: ["DUE", "PROCESSING"] };
		} else if (where.status === "PENDING") {
			where.OR = [
				{ itemType: { not: "CAR" } },
				{ itemType: "CAR", paymentStatus: { in: ["PAID", "NOT_REQUIRED"] } },
			];
		}
		return where;
	}

	if (user && body.userId === user.id) where.userId = user.id;
	else where.status = "APPROVED";

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

	const relationRules: Record<string, { numeric: string[]; strings: string[]; enums: Record<string, string[]> }> = {
		House: { numeric: ["area", "room"], strings: ["region", "city"], enums: { type: ["RENT", "FORSALE"] } },
		Car: { numeric: ["year", "cylinder", "fuel"], strings: ["model", "manufacturer", "color"], enums: { status: ["USED", "NEW", "NEW_ETH"] } },
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
		where[relation] = { is: details };
	}
	return where;
}
async function listItems(req: SessionRequest, res: NextApiResponse) {
	const adminView = Boolean(
		req.session?.user?.role === "ADMIN" &&
		(req.query.page !== undefined || typeof req.body?.id === "string" || req.body?.status === "PENDING")
	);
	const user = adminView ? req.session.user : await currentUser(req);
	const isAdmin = adminView;
	if (isAdmin && req.body?.id && !isValidRecordId(req.body.id)) {
		return error(res, 400, "Listing ID is invalid");
	}
	if (isAdmin && !(await requireAdmin(req, res))) return;
	const body = req.body || {};
	const page = Math.max(0, Number(req.query.page) || 0);
	const orderBy = body.orderBy && typeof body.orderBy === "object" ? body.orderBy : { createdAt: "desc" };
	const orderKey = Object.keys(orderBy)[0];
	const sort: any = ["createdAt", "title", "price"].includes(orderKey) && ["asc", "desc"].includes(orderBy[orderKey])
		? { [orderKey]: orderBy[orderKey] }
		: { createdAt: "desc" };
	const items = await prisma.item.findMany({
		where: safeItemWhere(body, user as IUser | null, isAdmin),
		include: isAdmin ? {
			...itemInclude,
			ListingPayments: {
				take: 1,
				orderBy: { createdAt: "desc" },
				select: { id: true, txRef: true, amount: true, currency: true, status: true, paymentMethod: true, providerRef: true, createdAt: true, verifiedAt: true },
			},
		} : itemInclude,
		orderBy: sort,
		skip: page * 30,
		take: 30,
	});
	return res.status(200).json(items);
}

async function userRoutes(req: SessionRequest, res: NextApiResponse, slug: string[]) {
	const route = slug.slice(1).join("/");
	const body = req.body || {};

	if (route === "signUp" && req.method === "POST") {
		const firstName = String(body.firstName || "").trim();
		const lastName = String(body.lastName || "").trim();
		const email = String(body.email || "").trim().toLowerCase();
		const password = String(body.password || "");
		if (body.termsAccepted !== true) return error(res, 400, "Accept the terms before creating an account");
		if (body.confirmation !== password) return error(res, 400, "Passwords must match");
		if (!firstName || !lastName || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || password.length < 8 || password.length > 128) {
			return error(res, 400, "Provide valid names, email, and a password of at least 8 characters");
		}
		const exists = await prisma.user.findUnique({ where: { email }, select: { id: true } });
		if (exists) return error(res, 409, "An account with that email already exists");
		const user = await prisma.user.create({
			data: {
				firstName: firstName.slice(0, 100),
				lastName: lastName.slice(0, 100),
				email,
				password: await bcrypt.hash(password, 12),
			},
			select: publicUserSelect,
		});
		return res.status(201).json({ user });
	}

	if (route === "login" && req.method === "POST") {
		const email = String(body.email || "").trim().toLowerCase();
		const password = String(body.password || "");
		const user = await prisma.user.findUnique({ where: { email } });
		if (!user || !(await bcrypt.compare(password, user.password))) {
			return error(res, 401, "Email or password is incorrect");
		}
		const { password: _password, ...safeUser } = user;
		req.session.user = safeUser as IUser;
		await req.session.save();
		return res.status(200).json({ user: safeUser });
	}

	if (route === "logout" && req.method === "POST") {
		req.session.destroy();
		return res.status(200).json({ ok: true });
	}

	if (route === "editProfile" && req.method === "POST") {
		const user = await requireUser(req, res);
		if (!user) return;
		if (body.oldPassword || body.newPassword) {
			if (!body.oldPassword || typeof body.newPassword !== "string" || body.newPassword.length < 8 || body.newPassword.length > 128 || body.confirmPassword !== body.newPassword) {
				return error(res, 400, "Enter your current password and a new password of at least 8 characters");
			}
			const record = await prisma.user.findUnique({ where: { id: user.id } });
			if (!record || !(await bcrypt.compare(body.oldPassword, record.password))) {
				return res.status(400).json({ fieldError: true, field: "oldPassword", msg: "Current password is incorrect" });
			}
			await prisma.user.update({
				where: { id: user.id },
				data: { password: await bcrypt.hash(body.newPassword, 12) },
			});
			return res.status(200).json({ ok: true });
		}
		const data: any = {};
		if (typeof body.firstName === "string" && body.firstName.trim()) data.firstName = body.firstName.trim().slice(0, 100);
		if (typeof body.lastName === "string" && body.lastName.trim()) data.lastName = body.lastName.trim().slice(0, 100);
		if (typeof body.bio === "string") data.bio = body.bio.slice(0, 2000);
		if (!Object.keys(data).length) return error(res, 400, "No profile changes were provided");
		const updated = await prisma.user.update({ where: { id: user.id }, data, select: publicUserSelect });
		req.session.user = updated as IUser;
		await req.session.save();
		return res.status(200).json({ user: updated });
	}

	if (route === "requestVerification" && req.method === "POST") {
		const user = await requireUser(req, res);
		if (!user) return;
		if (user.verfied) return res.status(200).json({ ok: true, alreadyVerified: true });
		const prior = await prisma.verification.findFirst({ where: { userId: user.id } });
		if (prior && Date.now() - prior.requestTime.getTime() < 60 * 1000) {
			return error(res, 429, "Wait one minute before requesting another code");
		}
		const code = String(crypto.randomInt(100000, 1000000));
		if (prior) {
			await prisma.verification.update({ where: { id: prior.id }, data: { code, requestTime: new Date() } });
		} else {
			await prisma.verification.create({ data: { userId: user.id, code } });
		}
		await sendMail(user.email, "Verify your Email", getVerificationHtml(user.firstName, code));
		return res.status(200).json({ ok: true });
	}

	if (route === "verifyAccount" && req.method === "POST") {
		const user = await requireUser(req, res);
		if (!user) return;
		const code = String(body.code || "").trim();
		const verification = await prisma.verification.findFirst({ where: { userId: user.id } });
		if (!verification || verification.code !== code || Date.now() - verification.requestTime.getTime() > 15 * 60 * 1000) {
			return error(res, 400, "The verification code is invalid or expired");
		}
		const updated = await prisma.user.update({
			where: { id: user.id },
			data: { verfied: true },
			select: publicUserSelect,
		});
		await prisma.verification.delete({ where: { id: verification.id } });
		req.session.user = updated as IUser;
		await req.session.save();
		return res.status(200).json({ user: updated });
	}

	if (route === "forgotPassword/requestLink" && req.method === "POST") {
		const email = String(body.email || "").trim().toLowerCase();
		const user = await prisma.user.findUnique({ where: { email } });
		// Use the same response whether an account exists or not.
		if (user) {
			const resetToken = crypto.randomBytes(32).toString("hex");
			await prisma.passwordReset.deleteMany({ where: { userId: user.id } });
			await prisma.passwordReset.create({ data: { userId: user.id, link: resetToken } });
			const baseUrl = getBaseUrl();
			if (!baseUrl) throw new Error("DOMAIN is required to build password reset links");
			const link = baseUrl.replace(/\/$/, "") + "/auth/reset_password?token=" + encodeURIComponent(resetToken);
			await sendMail(user.email, "Reset your password", getPasswordRestLink(user.firstName, link));
		}
		return res.status(200).json({ ok: true });
	}

	if (route === "forgotPassword/reset" && req.method === "POST") {
		const resetToken = String(body.token || "");
		const password = String(body.password || "");
		if (body.confirmation !== password) return error(res, 400, "Passwords must match");
		if (password.length < 8 || password.length > 128) return error(res, 400, "Password must be at least 8 characters");
		const reset = await prisma.passwordReset.findUnique({ where: { link: resetToken } });
		if (!reset || Date.now() - reset.requestTime.getTime() > 60 * 60 * 1000) {
			return error(res, 400, "This reset link is invalid or expired");
		}
		await prisma.user.update({ where: { id: reset.userId }, data: { password: await bcrypt.hash(password, 12) } });
		await prisma.passwordReset.delete({ where: { id: reset.id } });
		return res.status(200).json({ ok: true });
	}

	const contactMatch = route.match(/^contactInfo\/([^/]+)$/);
	if (contactMatch && req.method === "GET") {
		const infos = await prisma.contactInfo.findMany({
			where: { userId: contactMatch[1] },
			select: { id: true, contactType: true, value: true },
		});
		return res.status(200).json(infos);
	}

	if (route === "contactInfo/add" && req.method === "POST") {
		const user = await requireUser(req, res);
		if (!user) return;
		const infos = Array.isArray(body.infos) ? body.infos.slice(0, 10) : [];
		if (!infos.length) return error(res, 400, "Add at least one contact method");
		const allowed = ["TELEGRAM", "FACEBOOK", "INSTAGRAM", "PHONE_NUMBER", "ADDRESS", "EMAIL"];
		for (const info of infos) {
			if (!allowed.includes(info.contactType) || typeof info.value !== "string" || !info.value.trim()) {
				return error(res, 400, "Contact information is invalid");
			}
		}
		const created = await Promise.all(infos.map((info: any) => prisma.contactInfo.create({
			data: { userId: user.id, contactType: info.contactType, value: info.value.trim().slice(0, 500) },
			select: { id: true, contactType: true, value: true },
		})));
		return res.status(201).json(created);
	}

	if (route === "contactInfo/delete" && req.method === "POST") {
		const user = await requireUser(req, res);
		if (!user) return;
		if (typeof body.id !== "string") return error(res, 400, "Contact method ID is required");
		const contact = await prisma.contactInfo.findUnique({ where: { id: body.id }, select: { id: true, userId: true } });
		if (!contact || contact.userId !== user.id) return error(res, 404, "Contact method not found");
		await prisma.contactInfo.delete({ where: { id: contact.id } });
		return res.status(200).json({ msg: "Deleted" });
	}

	if (route === "uploadProfile") {
		return error(res, 404, "Profile image uploads are handled by the upload route");
	}

	return error(res, 404, "Route not found");
}

async function itemRoutes(req: SessionRequest, res: NextApiResponse, slug: string[]) {
	const route = slug.slice(1).join("/");
	const body = req.body || {};

	if (route === "" && req.method === "POST") return listItems(req, res);

	if (route === "save" && req.method === "GET") {
		const user = await requireUser(req, res);
		if (!user) return;
		const saved = await prisma.savedItems.findMany({
			where: { userId: user.id, item: { status: "APPROVED" } },
			include: { item: { include: itemInclude } },
			orderBy: { savedAt: "desc" },
		});
		return res.status(200).json(saved);
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

	if (route === "edit" && req.method === "POST") {
		const user = await requireUser(req, res, true);
		if (!user) return;
		if (!isValidRecordId(body.itemId)) return error(res, 400, "Listing ID is invalid");
		const item = await prisma.item.findUnique({ where: { id: body.itemId }, select: { id: true, userId: true, itemType: true } });
		if (!item || item.userId !== user.id) return error(res, 404, "Listing not found");
		const data: any = {};
		for (const key of ["title", "description", "price", "priceType"]) {
			if (body[key] === undefined) continue;
			if (key === "price") {
				if (body.price === "" || body.price === null) return error(res, 400, "Price is required");
				const price = Number(body.price);
				if (!Number.isFinite(price) || price < 0) return error(res, 400, "Price must be a non-negative number");
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
				HOUSE: ["area", "room", "type", "region", "city"],
				CAR: ["model", "status", "manufacturer", "year", "transmition", "color", "cylinder", "fuel"],
				BUSINESS_SPACE: ["spaceType", "type", "priceFrequency", "area", "region", "city", "subcity", "woreda", "neighborhood", "landmark", "electricity", "water", "roadAccess", "parking"],
				SERVICE: ["category", "region", "city", "serviceArea"],
			};
			const allowed = allowedByType[item.itemType] || [];
			for (const key of allowed) {
				const value = body.specificProps[key];
				if (value === undefined) continue;
				if (["area", "room", "year", "cylinder", "fuel"].includes(key)) {
					if (value === "" || value === null) {
						if (item.itemType === "BUSINESS_SPACE" && key === "area") return error(res, 400, "Floor area is required");
						specific[key] = null;
						continue;
					}
					const number = Number(value);
					if (!Number.isFinite(number) || number < 0 || (["room", "year"].includes(key) && !Number.isInteger(number))) {
						return error(res, 400, "A listing detail has an invalid number");
					}
					if (item.itemType === "HOUSE" && key === "room" && number < 1) return error(res, 400, "Room count must be at least one");
					if (item.itemType === "HOUSE" && key === "area" && number === 0) return error(res, 400, "Area must be greater than zero");
					if (item.itemType === "BUSINESS_SPACE" && key === "area" && number === 0) return error(res, 400, "Floor area must be greater than zero");
					if (item.itemType === "CAR" && key === "year" && number > new Date().getFullYear() + 2) return error(res, 400, "Vehicle year is not valid");
					specific[key] = number;
				} else if (key === "type") {
					if (!["RENT", "FORSALE"].includes(value)) return error(res, 400, "Invalid listing purpose");
					specific[key] = value;
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
				} else if (typeof value === "string") {
					const normalized = value.trim().slice(0, 500);
					const requiredStrings: Record<string, string[]> = {
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
		}
		const hasSpecificChanges = Object.keys(specific).length > 0;
		if (!Object.keys(data).length && !hasSpecificChanges) return error(res, 400, "No listing changes were provided");
		data.status = "PENDING";
		data.approvedId = null;
		if (hasSpecificChanges) {
			const relation = item.itemType === "HOUSE" ? "House" : item.itemType === "CAR" ? "Car" : item.itemType === "BUSINESS_SPACE" ? "BusinessSpace" : "Service";
			data[relation] = { update: specific };
		}
		await prisma.$transaction(async (tx) => {
			await tx.item.update({ where: { id: item.id }, data });
			await tx.savedItems.deleteMany({ where: { itemId: item.id } });
		});
		return res.status(200).json({ ok: true });
	}

	const itemId = route;
	if (req.method === "GET" && itemId && !itemId.includes("/")) {
		if (!isValidRecordId(itemId)) return error(res, 404, "Listing not found");
		const item = await prisma.item.findUnique({ where: { id: itemId }, include: itemInclude });
		const user = await currentUser(req);
		if (!item || (item.status !== "APPROVED" && item.userId !== user?.id && user?.role !== "ADMIN")) {
			return error(res, 404, "Listing not found");
		}
		return res.status(200).json(item);
	}

	return error(res, 404, "Route not found");
}

async function adminRoutes(req: SessionRequest, res: NextApiResponse, slug: string[]) {
	const route = slug.slice(1).join("/");
	const admin = await requireAdmin(req, res);
	if (!admin) return;

	if (route === "stat" && req.method === "GET") {
		const [users, approvedItems, waitingItems, houses, cars, businessSpaces, services] = await Promise.all([
			prisma.user.count(),
			prisma.item.count({ where: { status: "APPROVED" } }),
			prisma.item.count({
				where: {
					status: "PENDING",
					OR: [
						{ itemType: { not: "CAR" } },
						{ itemType: "CAR", paymentStatus: { in: ["PAID", "NOT_REQUIRED"] } },
					],
				},
			}),
			prisma.item.count({ where: { itemType: "HOUSE" } }),
			prisma.item.count({ where: { itemType: "CAR" } }),
			prisma.item.count({ where: { itemType: "BUSINESS_SPACE" } }),
			prisma.item.count({ where: { itemType: "SERVICE" } }),
		]);
		return res.status(200).json({ users, approvedItems, waitingItems, houses, cars, businessSpaces, services });
	}

	if (route === "changeItemStatus" && req.method === "POST") {
		const itemId = String(req.body?.itemId || "");
		const status = req.body?.status;
		if (!isValidRecordId(itemId)) return error(res, 400, "Listing ID is invalid");
		if (!itemId || !["APPROVED", "DECLINED"].includes(status)) return error(res, 400, "Listing ID or status is invalid");
		const item = await prisma.item.findUnique({
			where: { id: itemId },
			select: { id: true, userId: true, status: true, itemType: true, paymentStatus: true },
		});
		if (!item) return error(res, 404, "Listing not found");
		if (item.status !== "PENDING") return error(res, 409, "Only pending listings can be moderated");
		if (status === "APPROVED" && item.itemType === "CAR" && !["PAID", "NOT_REQUIRED"].includes(item.paymentStatus)) {
			return error(res, 409, "Chapa must confirm the car listing payment before it can be published");
		}
		const changed = await prisma.$transaction(async (tx) => {
			const result = await tx.item.updateMany({
				where: {
					id: itemId,
					status: "PENDING",
					...(status === "APPROVED" && item.itemType === "CAR"
						? { paymentStatus: { in: ["PAID", "NOT_REQUIRED"] } }
						: {}),
				},
				data: { status, approvedId: status === "APPROVED" ? admin.id : null },
			});
			if (!result.count) return false;
			if (status === "APPROVED") {
				await tx.recentActions.create({ data: { userId: item.userId, itemId, actionType: "APPROVED" } });
			} else {
				await tx.savedItems.deleteMany({ where: { itemId } });
			}
			return true;
		});
		if (!changed) return error(res, 409, "This listing was already reviewed. Refresh the queue and try again.");
		return res.status(200).json({ ok: true });
	}

	return error(res, 404, "Route not found");
}

export async function apiHandler(req: NextApiRequest, res: NextApiResponse) {
	const sessionReq = req as SessionRequest;
	const slug = Array.isArray(req.query.slug) ? req.query.slug : [];
	try {
		if (slug[0] === "user") return await userRoutes(sessionReq, res, slug);
		if (slug[0] === "items") return await itemRoutes(sessionReq, res, slug);
		if (slug[0] === "admin") return await adminRoutes(sessionReq, res, slug);
		if (slug[0] === "recentActions" && req.method === "GET") {
			const user = await requireUser(sessionReq, res);
			if (!user) return;
			const actions = await prisma.recentActions.findMany({
				where: { userId: user.id },
				include: { item: { select: { id: true, title: true, itemType: true, status: true } } },
				orderBy: { actionTime: "desc" },
				take: 30,
			});
			return res.status(200).json(actions);
		}
		if (slug[0] === "auth" && slug[1] === "authenticate" && req.method === "POST") {
			const user = await requireUser(sessionReq, res);
			if (!user) return;
			return res.status(200).json(user);
		}
		return error(res, 404, "Route not found");
	} catch (err) {
		if (process.env.NODE_ENV !== "production") {
			const details = err && typeof err === "object" ? (err as any) : {};
			const message = String(details.message || err || "Unknown error")
				.replace(/postgres(?:ql)?:\/\/[^\s\"'`<>]+/gi, "postgresql://[credentials redacted]")
				.replace(/(password|pwd)=([^&\s]+)/gi, "$1=[redacted]");
			console.error("[api] Request failed", {
				route: slug.join("/"),
				name: details.name || "Error",
				code: details.code,
				message,
			});
		}
		return error(res, 500, "The request could not be completed");
	}
}

export function methodNotAllowed(res: NextApiResponse) {
	return res.status(405).json({ err: "Method not allowed" });
}
