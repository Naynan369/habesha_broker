import { verifyStripeTestCheckout } from "@libs/server/stripeTest";
import { getListingPaymentConfig } from "@config/listingPayment";
import type { NextApiRequest, NextApiResponse } from "next";

function first(value: string | string[] | undefined) {
	return Array.isArray(value) ? value[0] || "" : value || "";
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
	if (req.method !== "GET") return res.status(405).json({ err: "Method not allowed" });
	if (!getListingPaymentConfig().enabled) return res.status(503).json({ err: "Stripe test checkout is not configured" });

	const sessionId = first(req.query.session_id);
	if (!/^cs_test_[A-Za-z0-9_]+$/.test(sessionId)) return res.status(400).json({ err: "Stripe test session is invalid" });

	try {
		const result = await verifyStripeTestCheckout(sessionId);
		if (result.status === "NOT_FOUND") return res.status(404).json({ err: "Payment not found" });
		return res.status(200).json({ status: result.status, itemId: result.itemId });
	} catch (error) {
		const failure = error as { response?: { status?: unknown; data?: { error?: { type?: unknown; code?: unknown } } }; code?: unknown; message?: unknown };
		console.error("[payments] Stripe test checkout verification failed", {
			providerHttpStatus: failure.response?.status,
			providerType: failure.response?.data?.error?.type,
			providerCode: failure.response?.data?.error?.code,
			code: typeof failure.code === "string" ? failure.code : undefined,
			message: typeof failure.message === "string" ? failure.message.slice(0, 160) : undefined,
		});
		return res.status(502).json({ err: "We could not verify the Stripe test payment right now. Please check again." });
	}
}
