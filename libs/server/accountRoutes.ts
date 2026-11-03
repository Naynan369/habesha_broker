import { prisma } from "@config/prisma";
import { getBaseUrl } from "@libs/helpers/util";
import { getPasswordRestLink, getVerificationHtml, sendMail } from "@libs/email";
import { currentUser, error, isValidRecordId, requireUser, sellerContactTypes, type SessionRequest } from "@libs/server/apiShared";
import bcrypt from "bcrypt";
import crypto from "crypto";
import { createRemoteJWKSet, jwtVerify } from "jose";
import type { NextApiResponse } from "next";

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

export async function userRoutes(req: SessionRequest, res: NextApiResponse, slug: string[]) {
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
		try {
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
		} catch (caught) {
			if ((caught as any)?.code === "P2002") return error(res, 409, "An account with that email already exists");
			throw caught;
		}
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
		let mailInfo: Awaited<ReturnType<typeof sendMail>>;
		try {
			mailInfo = await sendMail(user.email, "Verify your Email", getVerificationHtml(user.firstName, code));
		} catch (mailError) {
			await prisma.verification.deleteMany({ where: { userId: user.id, code } });
			throw mailError;
		}
		const acceptedRecipients = Array.isArray(mailInfo?.accepted) ? mailInfo.accepted : [];
		const recipientAccepted = acceptedRecipients.some((recipient) => {
			const address = typeof recipient === "string" ? recipient : recipient?.address;
			return typeof address === "string" && address.trim().toLowerCase() === user.email.trim().toLowerCase();
		});
		if (!recipientAccepted) {
			await prisma.verification.deleteMany({ where: { userId: user.id, code } });
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
			const appLink = "habeshabrokers://reset-password?token=" + encodeURIComponent(resetToken);
			await sendMail(user.email, "Reset your password", getPasswordRestLink(user.firstName, link, appLink));
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
		if (!canViewAllContacts) {
			const publishedItem = await prisma.item.findFirst({
				where: { userId: contactMatch[1], status: "APPROVED" },
				select: { id: true },
			});
			if (!publishedItem) return res.status(200).json([]);
		}
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
			if (!info || typeof info !== "object" || Array.isArray(info) || !allowed.includes(info.contactType) || typeof info.value !== "string" || !info.value.trim()) {
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
		const created = await prisma.$transaction(infos.map((info: any) => prisma.contactInfo.create({
			data: { userId: user.id, contactType: info.contactType, value: info.value.trim().slice(0, 500) },
			select: { id: true, contactType: true, value: true },
		})));
		return res.status(201).json(created);
	}

	if (route === "contactInfo/delete" && req.method === "POST") {
		const user = await requireUser(req, res);
		if (!user) return;
		if (typeof body.id !== "string") return error(res, 400, "Contact method ID is required");
		const contact = await prisma.contactInfo.findUnique({ where: { id: body.id }, select: { id: true, userId: true, contactType: true } });
		if (!contact || contact.userId !== user.id) return error(res, 404, "Contact method not found");
		if (sellerContactTypes.includes(contact.contactType as (typeof sellerContactTypes)[number]) && await prisma.contactInfo.count({ where: { userId: user.id, contactType: { in: [...sellerContactTypes] }, id: { not: contact.id } } }) === 0 && await prisma.item.count({ where: { userId: user.id, status: "APPROVED" } }) > 0) {
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

const googleProviderKeys = createRemoteJWKSet(new URL("https://www.googleapis.com/oauth2/v3/certs"));
const appleProviderKeys = createRemoteJWKSet(new URL("https://appleid.apple.com/auth/keys"));

function secureStringEqual(first: string, second: string) {
	const firstBytes = Buffer.from(first);
	const secondBytes = Buffer.from(second);
	return firstBytes.length === secondBytes.length && crypto.timingSafeEqual(firstBytes, secondBytes);
}

export async function providerAuthRoutes(req: SessionRequest, res: NextApiResponse, slug: string[]) {
	if (slug[1] !== "provider") return error(res, 404, "Route not found");

	if (slug[2] === "nonce") {
		if (req.method !== "GET") return methodNotAllowed(res);
		const provider = typeof req.query.provider === "string" ? req.query.provider : "";
		if (provider !== "google" && provider !== "apple") return error(res, 400, "Choose a valid sign-in provider");
		const nonce = crypto.randomBytes(32).toString("base64url");
		req.session.oauthChallenges = req.session.oauthChallenges || {};
		req.session.oauthChallenges[provider] = { nonce, expiresAt: Date.now() + 5 * 60 * 1000 };
		await req.session.save();
		res.setHeader("Cache-Control", "no-store, private");
		return res.status(200).json({ nonce });
	}

	if (slug.length !== 2) return error(res, 404, "Route not found");
	if (req.method !== "POST") return methodNotAllowed(res);

	const provider = req.body?.provider;
	const identityToken = String(req.body?.identityToken || "");
	const isWebClient = req.body?.clientType === "web";
	if ((provider !== "google" && provider !== "apple") || !identityToken || identityToken.length > 20_000) {
		return error(res, 400, "The sign-in request is invalid");
	}

	const nonce = String(req.body?.nonce || "");
	if (isWebClient) {
		const challenges = { ...(req.session.oauthChallenges || {}) };
		const challenge = challenges[provider];
		delete challenges[provider];
		req.session.oauthChallenges = Object.keys(challenges).length ? challenges : undefined;
		await req.session.save();
		if (!challenge || challenge.expiresAt < Date.now() || !nonce || !secureStringEqual(challenge.nonce, nonce)) {
			return error(res, 401, "The sign-in session expired. Please try again.");
		}
	}

	let payload: Record<string, any>;
	if (provider === "google") {
		const audiences = [
			process.env.NEXT_PUBLIC_GOOGLE_WEB_CLIENT_ID?.trim(),
			process.env.GOOGLE_IOS_CLIENT_ID?.trim(),
		].filter((value): value is string => Boolean(value));
		if (!audiences.length) return error(res, 503, "Google sign-in has not been configured yet");
		try {
			const verified = await jwtVerify(identityToken, googleProviderKeys, {
				issuer: ["https://accounts.google.com", "accounts.google.com"],
				audience: audiences,
				clockTolerance: 60,
			});
			payload = verified.payload;
			if (payload.azp && !audiences.includes(String(payload.azp))) return error(res, 401, "Google could not verify this sign-in");
			if (isWebClient && !secureStringEqual(String(payload.nonce || ""), nonce)) return error(res, 401, "Google could not verify this sign-in");
		} catch {
			return error(res, 401, "Google could not verify this sign-in");
		}
	} else {
		const audiences = [
			process.env.NEXT_PUBLIC_APPLE_SERVICE_ID?.trim(),
			process.env.APPLE_APP_BUNDLE_ID?.trim() || "com.habeshabrokers.app",
		].filter((value): value is string => Boolean(value));
		if (!nonce || nonce.length > 256) return error(res, 400, "The Apple sign-in request is invalid");
		try {
			const verified = await jwtVerify(identityToken, appleProviderKeys, {
				issuer: "https://appleid.apple.com",
				audience: audiences,
				clockTolerance: 60,
			});
			payload = verified.payload;
			const expectedNonce = crypto.createHash("sha256").update(nonce).digest("hex");
			const tokenNonce = typeof payload.nonce === "string" ? payload.nonce : "";
			if (!secureStringEqual(tokenNonce, expectedNonce)) return error(res, 401, "Apple could not verify this sign-in");
		} catch {
			return error(res, 401, "Apple could not verify this sign-in");
		}
	}

	const email = typeof payload.email === "string" ? payload.email.trim().toLowerCase() : "";
	const verifiedEmail = payload.email_verified === true || payload.email_verified === "true";
	if (!verifiedEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || typeof payload.sub !== "string" || !payload.sub || payload.sub.length > 255) {
		return error(res, 401, "The provider did not return a verified email address");
	}

	const cleanName = (value: unknown) => typeof value === "string"
		? value.replace(/[\u0000-\u001f\u007f]/g, "").trim().slice(0, 100)
		: "";
	const appleName = req.body?.fullName || {};
	const firstName = cleanName(provider === "google" ? payload.given_name : appleName.givenName)
		|| cleanName(email.split("@")[0]).split(/[._-]/)[0].slice(0, 100)
		|| "Habesha";
	const lastName = cleanName(provider === "google" ? payload.family_name : appleName.familyName) || "Member";
	const providerUserSelect = { ...publicUserSelect, sessionVersion: true };
	const providerKey: "GOOGLE" | "APPLE" = provider === "google" ? "GOOGLE" : "APPLE";
	const identityWhere = { provider_providerAccountId: { provider: providerKey, providerAccountId: payload.sub } };
	const knownIdentity = await prisma.externalIdentity.findUnique({ where: identityWhere, select: { userId: true } });
	let identityLinked = Boolean(knownIdentity);
	let user = knownIdentity
		? await prisma.user.findUnique({ where: { id: knownIdentity.userId }, select: providerUserSelect })
		: await prisma.user.findUnique({ where: { email }, select: providerUserSelect });

	if (!user && req.body?.createAccount !== true) return error(res, 404, "No account exists for this email. Create an account first.");
	if (!user && req.body?.termsAccepted !== true) return error(res, 400, "Accept the terms before creating an account");

	if (!user) {
		try {
			user = await prisma.$transaction(async (tx) => {
				const createdUser = await tx.user.create({
					data: {
						firstName,
						lastName,
						email,
						password: await bcrypt.hash(crypto.randomBytes(48).toString("base64url"), 12),
						verfied: true,
					},
					select: providerUserSelect,
				});
				await tx.externalIdentity.create({
					data: { provider: providerKey, providerAccountId: payload.sub, userId: createdUser.id },
				});
				return createdUser;
			});
			identityLinked = true;
		} catch (caught) {
			if ((caught as any)?.code !== "P2002") throw caught;
			const linkedIdentity = await prisma.externalIdentity.findUnique({ where: identityWhere, select: { userId: true } });
			if (linkedIdentity) {
				identityLinked = true;
				user = await prisma.user.findUnique({ where: { id: linkedIdentity.userId }, select: providerUserSelect });
			} else {
				user = await prisma.user.findUnique({ where: { email }, select: providerUserSelect });
			}
		}
	}

	if (!user) return error(res, 500, "The account could not be created");
	if (!identityLinked) {
		try {
			await prisma.externalIdentity.create({
				data: { provider: providerKey, providerAccountId: payload.sub, userId: user.id },
			});
			identityLinked = true;
		} catch (caught) {
			if ((caught as any)?.code !== "P2002") throw caught;
			const linkedIdentity = await prisma.externalIdentity.findUnique({ where: identityWhere, select: { userId: true } });
			if (!linkedIdentity || linkedIdentity.userId !== user.id) return error(res, 409, "This provider account is linked to another account");
		}
	}
	if (!user.verfied) user = await prisma.user.update({ where: { id: user.id }, data: { verfied: true }, select: providerUserSelect });
	const { sessionVersion, ...safeUser } = user;
	req.session.userId = user.id;
	req.session.sessionVersion = sessionVersion;
	await req.session.save();
	return res.status(200).json({ user: safeUser });
}

export function methodNotAllowed(res: NextApiResponse) {
	return res.status(405).json({ err: "Method not allowed" });
}
