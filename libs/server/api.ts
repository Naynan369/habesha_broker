import { prisma } from "@config/prisma";
import { getBaseUrl } from "@libs/helpers/util";
import { getPasswordRestLink } from "@libs/email/passwordReset";
import { getVerificationHtml } from "@libs/email/verification";
import { sendMail } from "@libs/email/sendMail";
import { refundStripeTestCheckout } from "@libs/server/stripeTest";
import { FERRARI_LISTING_ID } from "@config/ferrariListing";
import bcrypt from "bcrypt";
import crypto from "crypto";
import type { NextApiRequest, NextApiResponse } from "next";
import type { IUser } from "@libs/types/user";

type SessionRequest = NextApiRequest & {
	user?: IUser;
	session: { userId?: string; sessionVersion?: number; save: () => Promise<void>; destroy: () => void };
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

const sellerContactTypes = ["PHONE_NUMBER", "WHATSAPP", "TELEGRAM"] as const;

async function currentUser(req: SessionRequest) {
	return req.user || null;
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
		where.status = ["PENDING", "APPROVED", "DECLINED", "SOLD", "CLOSED"].includes(body.status)
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

function searchableText(term: string, fields: string[]) {
	return fields.map((field) => ({ [field]: { contains: term, mode: "insensitive" } }));
}

async function listItems(req: SessionRequest, res: NextApiResponse) {
	const adminView = Boolean(
		req.user?.role === "ADMIN" &&
		(typeof req.body?.id === "string" || ["PENDING", "APPROVED", "DECLINED", "SOLD", "CLOSED"].includes(req.body?.status))
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
	const [items, total, ferrariPaymentSessionCount] = await Promise.all([
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
		isAdmin || Boolean(user && body.userId === user.id)
			? prisma.listingPayment.count({ where: { itemId: FERRARI_LISTING_ID, providerRef: { startsWith: "cs_test_" } } })
			: Promise.resolve(0),
	]);
	const itemsWithPaymentRetry = items.map((item) => item.id === FERRARI_LISTING_ID ? { ...item, ferrariPaymentSessionCount } : item);
	return res.status(200).json({ items: itemsWithPaymentRetry, total, page, pageSize: 30 });
}

async function userRoutes(req: SessionRequest, res: NextApiResponse, slug: string[]) {
	const route = slug.slice(1).join("/");
	const body = req.body || {};

	if (route === "requestRefund" && req.method === "POST") {
		const user = await requireUser(req, res);
		if (!user) return;
		const paymentId = String(body.paymentId || "");
		const reason = typeof body.reason === "string" ? body.reason.trim().slice(0, 1000) : "";
		if (!isValidRecordId(paymentId)) return error(res, 400, "Payment ID is invalid");
		if (reason.length < 10) return error(res, 400, "Please explain why you are requesting a refund (at least 10 characters)");
		const payment = await prisma.listingPayment.findUnique({
			where: { id: paymentId },
			select: {
				id: true,
				txRef: true,
				providerRef: true,
				status: true,
				refundStatus: true,
				refundRequestStatus: true,
				item: { select: { userId: true } },
			},
		});
		if (!payment || payment.item.userId !== user.id) return error(res, 404, "Payment not found");
		if (payment.status !== "PAID" || payment.refundStatus !== "NOT_REFUNDED" || !payment.txRef.startsWith("HB-STRIPE-") || !payment.providerRef?.startsWith("cs_test_")) {
			return error(res, 409, "This payment is not eligible for a refund request");
		}
		if (payment.refundRequestStatus === "PENDING" || payment.refundRequestStatus === "APPROVED") {
			return error(res, 409, "A refund request already exists for this payment");
		}
		const requestedAt = new Date();
		const request = await prisma.listingPayment.updateMany({
			where: {
				id: payment.id,
				status: "PAID",
				refundStatus: "NOT_REFUNDED",
				refundRequestStatus: { in: ["NONE", "DECLINED"] },
			},
			data: {
				refundRequestStatus: "PENDING",
				refundRequestedAt: requestedAt,
				refundRequestReason: reason,
				refundReviewedAt: null,
				refundReviewedById: null,
				refundReviewNote: null,
			},
		});
		if (!request.count) return error(res, 409, "This payment can no longer receive a refund request");
		return res.status(201).json({ ok: true, status: "PENDING", requestedAt });
	}

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
		const { password: _password, sessionVersion, ...safeUser } = user;
		req.session.userId = user.id;
		req.session.sessionVersion = sessionVersion;
		await req.session.save();
		return res.status(200).json({ user: safeUser });
	}

	if (route === "logout" && req.method === "POST") {
		req.session.destroy();
		return res.status(200).json({ ok: true });
	}

	if (route === "changeEmail" && req.method === "POST") {
		const user = await requireUser(req, res);
		if (!user) return;
		const email = String(body.email || "").trim().toLowerCase();
		const password = String(body.password || "");
		if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
			return error(res, 400, "Enter a valid email address");
		}
		if (email === user.email.toLowerCase()) return error(res, 400, "That is already your email address");
		const account = await prisma.user.findUnique({ where: { id: user.id }, select: { password: true } });
		if (!account || !(await bcrypt.compare(password, account.password))) {
			return error(res, 400, "Current password is incorrect");
		}
		const existing = await prisma.user.findUnique({ where: { email }, select: { id: true } });
		if (existing && existing.id !== user.id) return error(res, 409, "An account with that email already exists");
		try {
			const updated = await prisma.user.update({
				where: { id: user.id },
				data: { email, verfied: false, sessionVersion: { increment: 1 } },
				select: { ...publicUserSelect, sessionVersion: true },
			});
			await prisma.verification.deleteMany({ where: { userId: user.id } });
			await prisma.passwordReset.deleteMany({ where: { userId: user.id } });
			const { sessionVersion, ...safeUser } = updated;
			req.session.sessionVersion = sessionVersion;
			await req.session.save();
			return res.status(200).json({ user: safeUser });
		} catch (caught) {
			if ((caught as any)?.code === "P2002") return error(res, 409, "An account with that email already exists");
			throw caught;
		}
	}

	if (route === "deleteAccount" && req.method === "POST") {
		const user = await requireUser(req, res);
		if (!user) return;
		if (body.confirmation !== "DELETE MY ACCOUNT") return error(res, 400, "Type DELETE MY ACCOUNT to confirm");
		const account = await prisma.user.findUnique({ where: { id: user.id }, select: { password: true, role: true } });
		if (!account || !(await bcrypt.compare(String(body.password || ""), account.password))) {
			return error(res, 400, "Current password is incorrect");
		}
		if (account.role === "ADMIN" && await prisma.user.count({ where: { role: "ADMIN" } }) <= 1) {
			return error(res, 409, "The last administrator account cannot be deleted");
		}
		await prisma.user.delete({ where: { id: user.id } });
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
			const updated = await prisma.user.update({
				where: { id: user.id },
				data: { password: await bcrypt.hash(body.newPassword, 12), sessionVersion: { increment: 1 } },
				select: { sessionVersion: true },
			});
			req.session.sessionVersion = updated.sessionVersion;
			await req.session.save();
			return res.status(200).json({ ok: true });
		}
		const data: any = {};
		if (typeof body.firstName === "string" && body.firstName.trim()) data.firstName = body.firstName.trim().slice(0, 100);
		if (typeof body.lastName === "string" && body.lastName.trim()) data.lastName = body.lastName.trim().slice(0, 100);
		if (typeof body.bio === "string") data.bio = body.bio.slice(0, 2000);
		if (!Object.keys(data).length) return error(res, 400, "No profile changes were provided");
		const updated = await prisma.user.update({ where: { id: user.id }, data, select: publicUserSelect });
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
		const mailInfo = await sendMail(user.email, "Verify your Email", getVerificationHtml(user.firstName, code));
		const acceptedRecipients = Array.isArray(mailInfo?.accepted) ? mailInfo.accepted : [];
		const recipientAccepted = acceptedRecipients.some((recipient) => {
			const address = typeof recipient === "string" ? recipient : recipient?.address;
			return typeof address === "string" && address.trim().toLowerCase() === user.email.trim().toLowerCase();
		});
		if (!recipientAccepted) {
			console.error("[email] Verification recipient was not accepted by SMTP", {
				acceptedCount: acceptedRecipients.length,
				rejectedCount: Array.isArray(mailInfo?.rejected) ? mailInfo.rejected.length : 0,
			});
			return error(res, 502, "The mail provider did not accept the verification email");
		}
		return res.status(200).json({ ok: true, deliveryAccepted: true });
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
		await prisma.user.update({ where: { id: reset.userId }, data: { password: await bcrypt.hash(password, 12), sessionVersion: { increment: 1 } } });
		await prisma.passwordReset.delete({ where: { id: reset.id } });
		return res.status(200).json({ ok: true });
	}

	const contactMatch = route.match(/^contactInfo\/([^/]+)$/);
	if (contactMatch && req.method === "GET") {
		const viewer = await currentUser(req);
		const canViewAllContacts = viewer?.id === contactMatch[1] || viewer?.role === "ADMIN";
		const infos = await prisma.contactInfo.findMany({
			where: {
				userId: contactMatch[1],
				...(!canViewAllContacts ? { contactType: { in: [...sellerContactTypes] } } : {}),
			},
			select: { id: true, contactType: true, value: true },
		});
		return res.status(200).json(infos);
	}

	if (route === "contactInfo/add" && req.method === "POST") {
		const user = await requireUser(req, res);
		if (!user) return;
		const infos = Array.isArray(body.infos) ? body.infos.slice(0, 10) : [];
		if (!infos.length) return error(res, 400, "Add at least one contact method");
		const allowed = ["TELEGRAM", "WHATSAPP", "FACEBOOK", "INSTAGRAM", "PHONE_NUMBER", "ADDRESS", "EMAIL"];
		for (const info of infos) {
			if (!allowed.includes(info.contactType) || typeof info.value !== "string" || !info.value.trim()) {
				return error(res, 400, "Contact information is invalid");
			}
			const value = info.value.trim();
			if (["PHONE_NUMBER", "WHATSAPP"].includes(info.contactType)) {
				const digits = value.replace(/\D/g, "");
				if (!/^\+?[\d\s().-]{7,24}$/.test(value) || digits.length < 7 || digits.length > 15) return error(res, 400, "Enter a valid phone number with its country code");
			}
			if (info.contactType === "TELEGRAM") {
				const username = value.match(/(?:https?:\/\/)?(?:www\.)?t\.me\/([A-Za-z0-9_]{5,32})\/?$/i)?.[1] || value.replace(/^@/, "");
				if (!/^[A-Za-z0-9_]{5,32}$/.test(username)) return error(res, 400, "Enter a Telegram username or t.me link");
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
		if (await prisma.contactInfo.count({ where: { userId: user.id, contactType: { in: [...sellerContactTypes] }, id: { not: contact.id } } }) === 0 && await prisma.item.count({ where: { userId: user.id, status: "APPROVED" } }) > 0) {
			return error(res, 409, "Add another phone, WhatsApp, or Telegram contact before removing your last contact from published listings");
		}
		await prisma.contactInfo.delete({ where: { id: contact.id } });
		return res.status(200).json({ msg: "Deleted" });
	}

	if (route === "uploadProfile") {
		return error(res, 404, "Profile image uploads are handled by the upload route");
	}

	return error(res, 404, "Route not found");
}

async function serviceRequestRoutes(req: SessionRequest, res: NextApiResponse, slug: string[]) {
	const user = await requireUser(req, res);
	if (!user) return;
	const body = req.body || {};

	if (slug.length === 1 && req.method === "GET") {
		const view = req.query.view === "sent" ? "sent" : "received";
		const page = Math.max(0, Math.min(10000, Math.floor(Number(req.query.page) || 0)));
		const where = view === "sent" ? { customerId: user.id } : { providerId: user.id };
		const [requests, total] = await Promise.all([
			prisma.serviceRequest.findMany({
				where,
				include: {
					item: { select: { id: true, title: true, images: true, itemType: true, status: true, price: true, priceType: true } },
					customer: { select: { id: true, firstName: true, lastName: true, email: true } },
					provider: { select: { id: true, firstName: true, lastName: true } },
				},
				orderBy: { createdAt: "desc" },
				skip: page * 20,
				take: 20,
			}),
			prisma.serviceRequest.count({ where }),
		]);
		return res.status(200).json({ requests, total, page, pageSize: 20, view });
	}

	if (slug.length === 1 && req.method === "POST") {
		const verifiedUser = await requireUser(req, res, true);
		if (!verifiedUser) return;
		const itemId = String(body.itemId || "");
		const message = typeof body.message === "string" ? body.message.trim() : "";
		const phone = typeof body.contactPhone === "string" ? body.contactPhone.trim() : "";
		if (!isValidRecordId(itemId)) return error(res, 400, "Service listing is invalid");
		if (message.length < 10 || message.length > 2000) return error(res, 400, "Please provide a message between 10 and 2,000 characters");
		if (phone.length > 40) return error(res, 400, "Phone number is too long");
		let preferredAt: Date | null = null;
		if (body.preferredAt) {
			if (typeof body.preferredAt !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(body.preferredAt)) return error(res, 400, "Preferred date is invalid");
			const selectedDay = new Date(`${body.preferredAt}T00:00:00.000Z`);
			if (!Number.isFinite(selectedDay.getTime()) || selectedDay.toISOString().slice(0, 10) !== body.preferredAt) return error(res, 400, "Preferred date is invalid");
			preferredAt = new Date(`${body.preferredAt}T12:00:00.000Z`);
			const today = new Date(); today.setUTCHours(0, 0, 0, 0);
			const latest = new Date(today); latest.setUTCDate(latest.getUTCDate() + 180); latest.setUTCHours(23, 59, 59, 999);
			if (preferredAt < today || preferredAt > latest) return error(res, 400, "Choose a date within the next 180 days");
		}
		const item = await prisma.item.findUnique({ where: { id: itemId }, select: { id: true, userId: true, itemType: true, status: true } });
		if (!item || item.itemType !== "SERVICE" || item.status !== "APPROVED") return error(res, 404, "Published service not found");
		if (item.userId === verifiedUser.id) return error(res, 409, "You cannot request your own service");
		const openRequest = await prisma.serviceRequest.findFirst({
			where: { itemId: item.id, customerId: verifiedUser.id, status: { in: ["NEW", "ACCEPTED"] } },
			select: { id: true },
		});
		if (openRequest) return error(res, 409, "You already have an open request for this service");
		const request = await prisma.serviceRequest.create({
			data: {
				itemId: item.id,
				customerId: verifiedUser.id,
				providerId: item.userId,
				message,
				preferredAt,
				contactPhone: phone || null,
			},
			select: { id: true, status: true, createdAt: true },
		});
		return res.status(201).json({ request });
	}

	if (slug[1] === "update" && req.method === "POST") {
		const requestId = String(body.requestId || "");
		const action = String(body.action || "");
		if (!isValidRecordId(requestId)) return error(res, 400, "Service request is invalid");
		const existing = await prisma.serviceRequest.findUnique({ where: { id: requestId }, select: { id: true, customerId: true, providerId: true, status: true } });
		if (!existing) return error(res, 404, "Service request not found");
		let where: any;
		let status: "ACCEPTED" | "DECLINED" | "COMPLETED" | "CANCELLED";
		if (action === "cancel") {
			if (existing.customerId !== user.id) return error(res, 403, "Only the customer can cancel this request");
			where = { id: existing.id, customerId: user.id, status: "NEW" };
			status = "CANCELLED";
		} else {
			if (existing.providerId !== user.id) return error(res, 403, "Only this service provider can update the request");
			if (action === "accept" || action === "decline") {
				where = { id: existing.id, providerId: user.id, status: "NEW" };
				status = action === "accept" ? "ACCEPTED" : "DECLINED";
			} else if (action === "complete") {
				where = { id: existing.id, providerId: user.id, status: "ACCEPTED" };
				status = "COMPLETED";
			} else return error(res, 400, "Action is invalid");
		}
		const changed = await prisma.serviceRequest.updateMany({ where, data: { status } });
		if (!changed.count) return error(res, 409, "This request has already changed. Refresh and try again.");
		return res.status(200).json({ ok: true, status });
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
		if (!isValidRecordId(itemId) || !["close", "reopen", "sold"].includes(action)) return error(res, 400, "Listing ID or action is invalid");
		const item = await prisma.item.findUnique({ where: { id: itemId }, select: { id: true, userId: true, status: true, paymentStatus: true, itemType: true, House: { select: { type: true } }, BusinessSpace: { select: { type: true } } } });
		if (!item || item.userId !== user.id) return error(res, 404, "Listing not found");
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
		const data: any = {};
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
				SERVICE: ["category", "region", "city", "serviceArea"],
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
		if (!Object.keys(data).length && !hasSpecificChanges) return error(res, 400, "No listing changes were provided");
		data.status = "PENDING";
		data.approvedId = null;
		if (item.paymentStatus === "NOT_REQUIRED") data.paymentStatus = "DUE";
		if (hasSpecificChanges) {
			const relation = item.itemType === "HOUSE" ? "House" : item.itemType === "CAR" ? "Car" : item.itemType === "BUSINESS_SPACE" ? "BusinessSpace" : "Service";
			data[relation] = { update: specific };
		}
		await prisma.item.update({ where: { id: item.id }, data });
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
		const [users, approvedItems, waitingItems, houses, cars, businessSpaces, services, listings, paidPayments, initiatedPayments, failedPayments, refundedPayments, pendingRefundRequests, revenueByCurrency, refundsByCurrency] = await Promise.all([
			prisma.user.count(),
			prisma.item.count({ where: { status: "APPROVED" } }),
			prisma.item.count({
				where: {
					status: "PENDING",
					paymentStatus: "PAID",
				},
			}),
			prisma.item.count({ where: { itemType: "HOUSE" } }),
			prisma.item.count({ where: { itemType: "CAR" } }),
			prisma.item.count({ where: { itemType: "BUSINESS_SPACE" } }),
			prisma.item.count({ where: { itemType: "SERVICE" } }),
			prisma.item.count(),
			prisma.listingPayment.count({ where: { status: "PAID", refundStatus: { not: "REFUNDED" } } }),
			prisma.listingPayment.count({ where: { status: "INITIATED" } }),
			prisma.listingPayment.count({ where: { status: "FAILED" } }),
			prisma.listingPayment.count({ where: { status: "PAID", refundStatus: "REFUNDED" } }),
			prisma.listingPayment.count({ where: { refundRequestStatus: "PENDING", refundStatus: "NOT_REFUNDED" } }),
			prisma.listingPayment.groupBy({
				by: ["currency"],
				where: { status: "PAID", refundStatus: { not: "REFUNDED" } },
				_sum: { amount: true },
			}),
			prisma.listingPayment.groupBy({
				by: ["currency"],
				where: { status: "PAID", refundStatus: "REFUNDED" },
				_sum: { amount: true },
			}),
		]);
		return res.status(200).json({ users, approvedItems, waitingItems, houses, cars, businessSpaces, services, listings, paidPayments, initiatedPayments, failedPayments, refundedPayments, pendingRefundRequests, revenueByCurrency: revenueByCurrency.map((entry) => ({ currency: entry.currency, amount: entry._sum.amount || 0 })), refundsByCurrency: refundsByCurrency.map((entry) => ({ currency: entry.currency, amount: entry._sum.amount || 0 })) });
	}

	if (route === "users" && req.method === "GET") {
		const requestedPage = Number(req.query.page) || 0;
		const page = Math.max(0, Math.min(10000, Math.floor(requestedPage)));
		const role = typeof req.query.role === "string" ? req.query.role : "ALL";
		const query = typeof req.query.query === "string" ? req.query.query.trim().slice(0, 100) : "";
		const where: any = {};
		if (role === "ADMIN" || role === "USER") where.role = role;
		if (query) {
			where.OR = [
				{ email: { contains: query, mode: "insensitive" } },
				{ firstName: { contains: query, mode: "insensitive" } },
				{ lastName: { contains: query, mode: "insensitive" } },
			];
		}
		const [users, total] = await Promise.all([
			prisma.user.findMany({
				where,
				select: {
					id: true,
					firstName: true,
					lastName: true,
					email: true,
					role: true,
					verfied: true,
					_count: { select: { AddedItem: true } },
				},
				orderBy: [{ role: "asc" }, { email: "asc" }],
				skip: page * 25,
				take: 25,
			}),
			prisma.user.count({ where }),
		]);
		return res.status(200).json({ users, total, page, pageSize: 25 });
	}

	if (route === "payments" && req.method === "GET") {
		const requestedPage = Number(req.query.page) || 0;
		const page = Math.max(0, Math.min(10000, Math.floor(requestedPage)));
		const status = typeof req.query.status === "string" ? req.query.status : "ALL";
		const query = typeof req.query.query === "string" ? req.query.query.trim().slice(0, 100) : "";
		const where: any = {};
		if (status === "REFUND_REQUESTED") where.refundRequestStatus = "PENDING";
		else if (["INITIATED", "PAID", "FAILED"].includes(status)) where.status = status;
		if (query) {
			where.OR = [
				{ txRef: { contains: query, mode: "insensitive" } },
				{ providerRef: { contains: query, mode: "insensitive" } },
				{ itemId: { contains: query, mode: "insensitive" } },
				{ item: { is: { title: { contains: query, mode: "insensitive" } } } },
				{ item: { is: { user: { is: { email: { contains: query, mode: "insensitive" } } } } } },
			];
		}
		const [payments, total] = await Promise.all([
			prisma.listingPayment.findMany({
				where,
				select: {
					id: true,
					txRef: true,
					providerRef: true,
					amount: true,
					currency: true,
					status: true,
					paymentMethod: true,
					createdAt: true,
					verifiedAt: true,
					refundStatus: true,
					refundAttempt: true,
					refundRef: true,
					refundStartedAt: true,
					refundedAt: true,
					refundedById: true,
					refundRequestStatus: true,
					refundRequestedAt: true,
					refundRequestReason: true,
					refundReviewedAt: true,
					refundReviewedById: true,
					refundReviewNote: true,
					item: {
						select: {
							id: true,
							title: true,
							itemType: true,
							user: { select: { email: true, firstName: true, lastName: true } },
						},
					},
				},
				orderBy: { createdAt: "desc" },
				skip: page * 25,
				take: 25,
			}),
			prisma.listingPayment.count({ where }),
		]);
		return res.status(200).json({ payments, total, page, pageSize: 25 });
	}

	if (route === "declineRefundRequest" && req.method === "POST") {
		const paymentId = String(req.body?.paymentId || "");
		if (!isValidRecordId(paymentId)) return error(res, 400, "Payment ID is invalid");
		const reviewedAt = new Date();
		const result = await prisma.listingPayment.updateMany({
			where: { id: paymentId, status: "PAID", refundStatus: "NOT_REFUNDED", refundRequestStatus: "PENDING" },
			data: {
				refundRequestStatus: "DECLINED",
				refundReviewedAt: reviewedAt,
				refundReviewedById: admin.id,
				refundReviewNote: typeof req.body?.note === "string" ? req.body.note.trim().slice(0, 500) || null : null,
			},
		});
		if (!result.count) return error(res, 409, "There is no pending refund request for this payment");
		return res.status(200).json({ ok: true, status: "DECLINED" });
	}

	if (route === "refundPayment" && req.method === "POST") {
		const paymentId = String(req.body?.paymentId || "");
		if (!isValidRecordId(paymentId)) return error(res, 400, "Payment ID is invalid");
		const payment = await prisma.listingPayment.findUnique({
			where: { id: paymentId },
			select: {
				id: true,
				txRef: true,
				providerRef: true,
				amount: true,
				currency: true,
				status: true,
				refundStatus: true,
				refundAttempt: true,
				refundRef: true,
				refundStartedAt: true,
				refundRequestStatus: true,
				item: { select: { id: true, status: true } },
			},
		});
		if (!payment) return error(res, 404, "Payment not found");
		if (payment.status !== "PAID") return error(res, 409, "Only confirmed payments can be refunded");
		if (payment.refundStatus === "REFUNDED") return error(res, 409, "This payment has already been refunded");
		if (!payment.txRef.startsWith("HB-STRIPE-") || !payment.providerRef?.startsWith("cs_test_")) {
			return error(res, 409, "This payment is not an eligible Stripe test-mode payment");
		}

		const now = new Date();
		const reclaimBefore = new Date(now.getTime() - 120_000);
		const claim = await prisma.listingPayment.updateMany({
			where: {
				id: payment.id,
				status: "PAID",
				refundRequestStatus: payment.refundRequestStatus,
				OR: [
					{ refundStatus: "NOT_REFUNDED" },
					{ refundStatus: "PROCESSING", refundStartedAt: null },
					{ refundStatus: "PROCESSING", refundStartedAt: { lt: reclaimBefore } },
				],
			},
			data: {
				refundStatus: "PROCESSING",
				refundStartedAt: now,
				refundedById: admin.id,
				...(payment.refundStatus === "NOT_REFUNDED" ? { refundAttempt: { increment: 1 } } : {}),
			},
		});
		if (!claim.count) return error(res, 409, "A refund is already processing or this payment has already been refunded");

		try {
			const amountMinor = Math.round(Number(payment.amount) * 100);
			const attemptNumber = payment.refundStatus === "PROCESSING" ? Math.max(1, payment.refundAttempt) : payment.refundAttempt + 1;
			const refund = await refundStripeTestCheckout({
				sessionId: payment.providerRef,
				paymentId: payment.id,
				expectedAmountMinor: amountMinor,
				expectedCurrency: payment.currency,
				idempotencyKey: `habesha-listing-refund-${payment.id}-${attemptNumber}`,
				existingRefundId: payment.refundRef,
			});
			if (refund.status === "failed" || refund.status === "canceled") {
				await prisma.listingPayment.updateMany({
					where: { id: payment.id, refundStatus: "PROCESSING", refundStartedAt: now },
					data: { refundStatus: "NOT_REFUNDED", refundRef: null, refundStartedAt: null, refundedById: null },
				});
				return error(res, 502, "Stripe did not complete the refund. You can retry after reviewing the payment.");
			}
			if (refund.status !== "succeeded" && refund.status !== "pending" && refund.status !== "requires_action") {
				throw new Error(`Stripe returned refund status ${refund.status || "unknown"}`);
			}
			const refundIsComplete = refund.status === "succeeded";
			await prisma.$transaction(async (tx) => {
				await tx.listingPayment.update({
					where: { id: payment.id },
					data: {
						refundStatus: refundIsComplete ? "REFUNDED" : "PROCESSING",
						refundRef: refund.refundId,
						refundedAt: refundIsComplete ? new Date() : null,
						refundStartedAt: refundIsComplete ? null : now,
						refundedById: admin.id,
						...(payment.refundRequestStatus === "PENDING" || payment.refundRequestStatus === "DECLINED" ? {
							refundRequestStatus: "APPROVED",
							refundReviewedAt: new Date(),
							refundReviewedById: admin.id,
						} : {}),
					},
				});
				if (refundIsComplete) {
					const currentItem = await tx.item.findUnique({ where: { id: payment.item.id }, select: { status: true } });
					await tx.item.updateMany({
						where: { id: payment.item.id },
						data: {
							paymentStatus: "DUE",
							paymentLockedAt: null,
							...(currentItem?.status === "APPROVED" ? { status: "DECLINED", approvedId: null } : {}),
						},
					});
				}
			});
			return res.status(refundIsComplete ? 200 : 202).json({ ok: true, status: refundIsComplete ? "REFUNDED" : "PROCESSING", refundRef: refund.refundId });
		} catch (refundError: any) {
			console.error("[payments] Admin refund failed", {
				paymentId: payment.id,
				providerHttpStatus: refundError?.response?.status,
				providerType: refundError?.response?.data?.error?.type,
				providerCode: refundError?.response?.data?.error?.code,
				code: typeof refundError?.code === "string" ? refundError.code : undefined,
				message: typeof refundError?.message === "string" ? refundError.message.slice(0, 160) : undefined,
			});
			await prisma.listingPayment.updateMany({
				where: { id: payment.id, refundStatus: "PROCESSING", refundStartedAt: now },
				data: { refundStartedAt: reclaimBefore },
			});
			return error(res, 502, "Stripe has not confirmed the refund yet. Check the payment and retry safely; the same refund request will be reused.");
		}
	}

	if (route === "changeUserRole" && req.method === "POST") {
		const userId = String(req.body?.userId || "");
		const role = req.body?.role;
		if (!isValidRecordId(userId) || !["ADMIN", "USER"].includes(role)) return error(res, 400, "User or role is invalid");
		if (userId === admin.id) return error(res, 409, "You cannot change your own administrator role");
		const target = await prisma.user.findUnique({ where: { id: userId }, select: { id: true, role: true } });
		if (!target) return error(res, 404, "User not found");
		if (target.role === role) return res.status(200).json({ ok: true, unchanged: true });
		let outcome: "UPDATED" | "MISSING" | "LAST_ADMIN" | "CHANGED";
		try {
			outcome = await prisma.$transaction(async (tx) => {
				const current = await tx.user.findUnique({ where: { id: userId }, select: { id: true, role: true } });
				if (!current) return "MISSING";
				if (current.role === role) return "UPDATED";
				if (current.role === "ADMIN" && role === "USER" && await tx.user.count({ where: { role: "ADMIN" } }) <= 1) return "LAST_ADMIN";
				const changed = await tx.user.updateMany({ where: { id: userId, role: current.role }, data: { role } });
				return changed.count ? "UPDATED" : "CHANGED";
			}, { isolationLevel: "Serializable" });
		} catch (transactionError: any) {
			if (transactionError?.code === "P2034") return error(res, 409, "Account roles changed at the same time. Refresh and try again.");
			throw transactionError;
		}
		if (outcome === "MISSING") return error(res, 404, "User not found");
		if (outcome === "LAST_ADMIN") return error(res, 409, "At least one administrator account must remain");
		if (outcome === "CHANGED") return error(res, 409, "This account changed while you were editing it. Refresh and try again.");
		return res.status(200).json({ ok: true });
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
		if (status === "APPROVED" && item.paymentStatus !== "PAID") {
			return error(res, 409, "The listing fee must be confirmed before this listing can be published");
		}
		if (status === "APPROVED") {
			const sellerContact = await prisma.contactInfo.findFirst({
				where: { userId: item.userId, contactType: { in: [...sellerContactTypes] } },
				select: { id: true },
			});
			if (!sellerContact) return error(res, 409, "The seller must add a phone, WhatsApp, or Telegram contact before this listing can be published");
		}
		const changed = await prisma.$transaction(async (tx) => {
			const result = await tx.item.updateMany({
				where: {
					id: itemId,
					status: "PENDING",
					...(status === "APPROVED" ? { paymentStatus: "PAID" } : {}),
				},
				data: { status, approvedId: status === "APPROVED" ? admin.id : null },
			});
			if (!result.count) return false;
			if (status === "APPROVED") {
				await tx.recentActions.create({ data: { userId: item.userId, itemId, actionType: "APPROVED" } });
			}
			return true;
		});
		if (!changed) return error(res, 409, "This listing was already reviewed. Refresh the queue and try again.");
		return res.status(200).json({ ok: true });
	}

	if (route === "setFeatured" && req.method === "POST") {
		const itemId = String(req.body?.itemId || "");
		const featured = req.body?.featured;
		if (!isValidRecordId(itemId) || typeof featured !== "boolean") return error(res, 400, "Listing ID or featured state is invalid");
		const item = await prisma.item.findUnique({ where: { id: itemId }, select: { id: true, status: true, featured: true } });
		if (!item) return error(res, 404, "Listing not found");
		if (featured && item.status !== "APPROVED") return error(res, 409, "Only published listings can be featured");
		const changed = await prisma.item.updateMany({
			where: { id: itemId, ...(featured ? { status: "APPROVED" } : {}) },
			data: { featured },
		});
		if (!changed.count) return error(res, 409, "This listing changed. Refresh and try again.");
		return res.status(200).json({ ok: true, featured });
	}

	return error(res, 404, "Route not found");
}

export async function apiHandler(req: NextApiRequest, res: NextApiResponse) {
	const sessionReq = req as SessionRequest;
	const slug = Array.isArray(req.query.slug) ? req.query.slug : [];
	try {
		if (slug[0] === "user") return await userRoutes(sessionReq, res, slug);
		if (slug[0] === "items") return await itemRoutes(sessionReq, res, slug);
		if (slug[0] === "serviceRequests") return await serviceRequestRoutes(sessionReq, res, slug);
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
		const details = err && typeof err === "object" ? (err as any) : {};
		const message = String(details.message || err || "Unknown error")
			.replace(/postgres(?:ql)?:\/\/[^\s\"'`<>]+/gi, "postgresql://[credentials redacted]")
			.replace(/(password|pwd)=([^&\s]+)/gi, "$1=[redacted]")
			.slice(0, 1000);
		console.error("[api] Request failed", {
			route: slug.join("/"),
			name: details.name || "Error",
			code: details.code,
			message,
		});
		return error(res, 500, "The request could not be completed");
	}
}

export function methodNotAllowed(res: NextApiResponse) {
	return res.status(405).json({ err: "Method not allowed" });
}
