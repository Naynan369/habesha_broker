import { prisma } from "@config/prisma";
import { getListingPaymentConfig, LISTING_CURRENCY, LISTING_FEE } from "@config/listingPayment";
import { withSessionApi } from "@config/cookie/cookie";
import { getBaseUrl } from "@libs/helpers/util";
import { createStripeTestCheckout, expireStripeTestCheckoutSession, getStripeTestCheckoutSession, verifyStripeTestCheckout } from "@libs/server/stripeTest";
import { FERRARI_LISTING_ID } from "@config/ferrariListing";
import { closeExpiredFerrariListing, getListingPaymentDeadline } from "@libs/server/unpaidListingExpiration";
import crypto from "crypto";
import type { NextApiRequest, NextApiResponse } from "next";

type SessionRequest = NextApiRequest & { user?: { id: string } };

async function handler(req: SessionRequest, res: NextApiResponse) {
	if (req.method !== "POST") return res.status(405).json({ err: "Method not allowed" });

	const userId = req.user?.id;
	if (!userId) return res.status(401).json({ err: "Authentication required" });

	const itemId = typeof req.body?.itemId === "string" ? req.body.itemId : "";
	if (!/^[A-Za-z0-9_-]{8,128}$/.test(itemId)) return res.status(400).json({ err: "Listing ID is invalid" });

	const user = await prisma.user.findUnique({
		where: { id: userId },
		select: { id: true, firstName: true, lastName: true, email: true, verfied: true },
	});
	if (!user) return res.status(401).json({ err: "Authentication required" });
	if (!user.verfied) return res.status(403).json({ err: "Verify your email address before paying for a listing" });

	await prisma.item.updateMany({
		where: { id: itemId, userId: user.id, status: { in: ["PENDING", "DECLINED"] }, paymentStatus: "NOT_REQUIRED" },
		data: { paymentStatus: "DUE" },
	});

	const item = await prisma.item.findFirst({
		where: { id: itemId, userId: user.id },
		select: { id: true, title: true, status: true, paymentStatus: true, createdAt: true },
	});
	if (!item) return res.status(404).json({ err: "Listing not found" });
	const isFerrariTarget = item.id === FERRARI_LISTING_ID && /ferrari/i.test(item.title);
	const latest = await prisma.listingPayment.findFirst({
		where: { itemId: item.id },
		orderBy: { createdAt: "desc" },
		select: { id: true, txRef: true, amount: true, currency: true, status: true, checkoutUrl: true, providerRef: true, createdAt: true },
	});
	const priorAttempts = isFerrariTarget
		? await prisma.listingPayment.count({ where: { itemId: item.id, providerRef: { startsWith: "cs_test_" } } })
		: 0;
	const paymentDeadline = getListingPaymentDeadline(latest?.createdAt || item.createdAt);
	if (
		isFerrariTarget &&
		item.paymentStatus !== "PAID" &&
		Date.now() >= paymentDeadline.getTime() &&
		(priorAttempts === 0 || priorAttempts >= 2)
	) {
		await closeExpiredFerrariListing();
		return res.status(410).json({ err: "The 24-hour payment window has ended. This listing has been closed." });
	}
	const canRenewClosedFerrari = isFerrariTarget && item.status === "CLOSED" && priorAttempts === 1 && latest?.status === "FAILED";
	if (item.status === "CLOSED" && canRenewClosedFerrari) {
		await prisma.item.updateMany({
			where: { id: item.id, userId: user.id, status: "CLOSED", paymentStatus: { in: ["DUE", "PROCESSING"] } },
			data: { status: "PENDING", paymentStatus: "DUE", paymentLockedAt: null },
		});
	}
	if (["APPROVED", "SOLD"].includes(item.status) || (item.status === "CLOSED" && !canRenewClosedFerrari)) {
		return res.status(409).json({ err: "This listing is already published or closed" });
	}
	if (item.paymentStatus === "PAID" || item.paymentStatus === "NOT_REQUIRED") {
		return res.status(409).json({ err: "This listing does not need another payment" });
	}

	const paymentConfig = getListingPaymentConfig();
	const secret = process.env.STRIPE_SECRET_KEY?.trim();
	if (!paymentConfig.enabled || !secret || !Number.isFinite(LISTING_FEE) || LISTING_FEE <= 0) {
		return res.status(503).json({ err: "Stripe test checkout is not configured. Add an sk_test_ or rk_test_ key to the server environment." });
	}

	const requestHost = typeof req.headers.host === "string" ? req.headers.host : "";
	const localDevOrigin = process.env.NODE_ENV === "development" && /^localhost(?::[0-9]{1,5})?$/.test(requestHost)
		? "http://" + requestHost
		: "";
	const baseUrl = localDevOrigin || getBaseUrl();
	if (!baseUrl) return res.status(503).json({ err: "Set the application domain before starting checkout." });

	if (latest?.status === "INITIATED" && latest.checkoutUrl && latest.amount === LISTING_FEE && latest.currency === LISTING_CURRENCY && latest.txRef.startsWith("HB-STRIPE-")) {
		if (!isFerrariTarget) {
			return res.status(200).json({ checkoutUrl: latest.checkoutUrl, txRef: latest.txRef });
		}
		if (latest.providerRef?.startsWith("cs_test_")) {
			let stripeSession;
			try {
				stripeSession = await getStripeTestCheckoutSession(latest.providerRef);
			} catch (error) {
				const failure = error as { response?: { status?: unknown }; code?: unknown; message?: unknown };
				console.error("[payments] Could not check existing Stripe checkout", {
					providerHttpStatus: failure.response?.status,
					code: typeof failure.code === "string" ? failure.code : undefined,
					message: typeof failure.message === "string" ? failure.message.slice(0, 160) : undefined,
				});
				return res.status(502).json({ err: "We could not check the existing payment link. Please try again shortly." });
			}

			if (stripeSession.status === "complete" && stripeSession.paymentStatus === "paid") {
				await verifyStripeTestCheckout(latest.providerRef);
				return res.status(409).json({ err: "Stripe has already completed this payment. Refresh your listings to see the updated status." });
			}

			const deadlineSeconds = Math.floor(paymentDeadline.getTime() / 1000);
			const nowSeconds = Math.floor(Date.now() / 1000);
			if (stripeSession.status === "open" && stripeSession.expiresAt > nowSeconds && stripeSession.expiresAt <= deadlineSeconds) {
				return res.status(200).json({ checkoutUrl: latest.checkoutUrl, txRef: latest.txRef });
			}

			if (stripeSession.status === "open") {
				try {
					const expired = await expireStripeTestCheckoutSession(latest.providerRef);
					if (expired.status === "complete" && expired.paymentStatus === "paid") {
						await verifyStripeTestCheckout(latest.providerRef);
						return res.status(409).json({ err: "Stripe has already completed this payment. Refresh your listings to see the updated status." });
					}
				} catch (error) {
					const failure = error as { response?: { status?: unknown }; code?: unknown; message?: unknown };
					console.error("[payments] Could not expire the old Stripe checkout", {
						providerHttpStatus: failure.response?.status,
						code: typeof failure.code === "string" ? failure.code : undefined,
						message: typeof failure.message === "string" ? failure.message.slice(0, 160) : undefined,
					});
					return res.status(502).json({ err: "We could not safely replace the old payment link. Please try again shortly." });
				}
			}
		}

		await prisma.$transaction([
			prisma.listingPayment.updateMany({ where: { id: latest.id, status: "INITIATED" }, data: { status: "FAILED" } }),
			prisma.item.updateMany({ where: { id: item.id, paymentStatus: "PROCESSING" }, data: { paymentStatus: "DUE", paymentLockedAt: null } }),
		]);
	}

	if (isFerrariTarget) {
		if (priorAttempts >= 2) {
			return res.status(409).json({ err: "This listing has already used its one payment-link renewal. The original 24-hour payment deadline still applies." });
		}
	}

	const txRef = "HB-STRIPE-" + Date.now() + "-" + crypto.randomBytes(6).toString("hex");
	const lockedAt = new Date();
	const reclaimBefore = new Date(lockedAt.getTime() - 120_000);
	const payment = await prisma.$transaction(async (tx) => {
		const lock = await tx.item.updateMany({
			where: {
				id: item.id,
				userId: user.id,
				status: { in: ["PENDING", "DECLINED"] },
				OR: [
					{ paymentStatus: "DUE" },
					{ paymentStatus: "PROCESSING", OR: [{ paymentLockedAt: null }, { paymentLockedAt: { lt: reclaimBefore } }] },
				],
			},
			data: { paymentStatus: "PROCESSING", paymentLockedAt: lockedAt },
		});
		if (!lock.count) return null;
		return tx.listingPayment.create({
			data: { itemId: item.id, txRef, amount: LISTING_FEE, currency: LISTING_CURRENCY },
			select: { id: true, txRef: true },
		});
	});
	if (!payment) return res.status(409).json({ err: "A payment attempt is already being prepared. Refresh this page in a moment." });

	const cleanBaseUrl = baseUrl.replace(/\/$/, "");
	const localePrefix = req.body?.locale === "am" ? "/am" : "";
	let failureStage = "stripe_request";
	try {
		const session = await createStripeTestCheckout({
			txRef,
			itemId: item.id,
			itemTitle: item.title,
			email: user.email,
			baseUrl: cleanBaseUrl,
			localePrefix,
			...(isFerrariTarget ? { expiresAt: Math.floor(Date.now() / 1000) + 24 * 60 * 60 } : {}),
		});
		failureStage = "save_stripe_session";
		await prisma.listingPayment.update({
			where: { id: payment.id },
			data: { checkoutUrl: session.checkoutUrl, providerRef: session.sessionId },
		});
		await prisma.item.updateMany({
			where: { id: item.id, paymentStatus: "PROCESSING", paymentLockedAt: lockedAt },
			data: { paymentLockedAt: null },
		});
		return res.status(201).json({ checkoutUrl: session.checkoutUrl, txRef });
	} catch (error) {
		const failure = error as { code?: unknown; message?: unknown; response?: { status?: unknown; data?: { error?: { type?: unknown; code?: unknown; message?: unknown } } } };
		console.error("[payments] Stripe test checkout initialization failed", {
			stage: failureStage,
			providerHttpStatus: failure.response?.status,
			providerType: failure.response?.data?.error?.type,
			providerCode: failure.response?.data?.error?.code,
			providerMessage: typeof failure.response?.data?.error?.message === "string" ? failure.response.data.error.message.slice(0, 160) : undefined,
			code: typeof failure.code === "string" ? failure.code : undefined,
			message: typeof failure.message === "string" ? failure.message.slice(0, 160) : undefined,
		});
		await prisma.listingPayment.updateMany({ where: { id: payment.id, status: "INITIATED" }, data: { status: "FAILED" } });
		await prisma.item.updateMany({
			where: { id: item.id, paymentStatus: "PROCESSING", paymentLockedAt: lockedAt },
			data: { paymentStatus: "DUE", paymentLockedAt: null },
		});
		return res.status(502).json({ err: "We could not start Stripe test checkout. Check the server key and try again." });
	}
}

export default withSessionApi(handler);
