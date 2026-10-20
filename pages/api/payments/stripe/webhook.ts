import { FERRARI_LISTING_ID } from "@config/ferrariListing";
import { closeExpiredFerrariListing } from "@libs/server/unpaidListingExpiration";
import { verifyStripeTestCheckout } from "@libs/server/stripeTest";
import crypto from "crypto";
import type { NextApiRequest, NextApiResponse } from "next";

export const config = { api: { bodyParser: false } };

async function readRawBody(req: NextApiRequest) {
	const chunks: Buffer[] = [];
	for await (const chunk of req) {
		chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
	}
	return Buffer.concat(chunks);
}

function hasValidStripeSignature(rawBody: Buffer, signatureHeader: string, secret: string) {
	const parts = signatureHeader.split(",").map((part) => part.trim().split("=", 2));
	const timestamp = parts.find(([key]) => key === "t")?.[1];
	const signatures = parts.filter(([key]) => key === "v1").map(([, value]) => value).filter(Boolean);
	if (!timestamp || !/^\d+$/.test(timestamp) || signatures.length === 0) return false;
	if (Math.abs(Math.floor(Date.now() / 1000) - Number(timestamp)) > 5 * 60) return false;

	const expected = crypto.createHmac("sha256", secret).update(timestamp + ".").update(rawBody).digest();
	return signatures.some((signature) => {
		if (!/^[a-f0-9]{64}$/i.test(signature)) return false;
		const supplied = Buffer.from(signature, "hex");
		return supplied.length === expected.length && crypto.timingSafeEqual(supplied, expected);
	});
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
	if (req.method !== "POST") return res.status(405).json({ err: "Method not allowed" });
	const secret = process.env.STRIPE_WEBHOOK_SECRET?.trim();
	const signature = req.headers["stripe-signature"];
	if (!secret) return res.status(503).json({ err: "Stripe webhook signing secret is not configured" });
	if (typeof signature !== "string") return res.status(400).json({ err: "Stripe signature is missing" });

	let event: any;
	try {
		const rawBody = await readRawBody(req);
		if (!hasValidStripeSignature(rawBody, signature, secret)) return res.status(400).json({ err: "Stripe signature is invalid" });
		event = JSON.parse(rawBody.toString("utf8"));
	} catch (_error) {
		return res.status(400).json({ err: "Stripe event payload is invalid" });
	}

	if (!["checkout.session.expired", "checkout.session.completed"].includes(event?.type)) {
		return res.status(200).json({ received: true });
	}
	const session = event?.data?.object;
	if (
		typeof session?.id !== "string" ||
		!session.id.startsWith("cs_test_") ||
		session.livemode !== false ||
		session.metadata?.itemId !== FERRARI_LISTING_ID
	) {
		return res.status(200).json({ received: true });
	}

	try {
		if (event.type === "checkout.session.completed" && session.payment_status === "paid") {
			await verifyStripeTestCheckout(session.id);
		} else if (event.type === "checkout.session.expired") {
			await verifyStripeTestCheckout(session.id);
			await closeExpiredFerrariListing();
		}
		return res.status(200).json({ received: true });
	} catch (error) {
		const failure = error as { code?: unknown; message?: unknown };
		console.error("[payments] Ferrari Stripe webhook processing failed", {
			eventType: event?.type,
			code: typeof failure.code === "string" ? failure.code : undefined,
			message: typeof failure.message === "string" ? failure.message.slice(0, 160) : undefined,
		});
		return res.status(500).json({ err: "Could not process the Stripe event" });
	}
}
