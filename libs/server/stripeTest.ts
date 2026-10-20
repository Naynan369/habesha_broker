import axios from "axios";
import { prisma } from "@config/prisma";
import { isStripeTestSecret, LISTING_CURRENCY, LISTING_FEE } from "@config/listingPayment";

const STRIPE_API = "https://api.stripe.com/v1";
const STRIPE_TEST_CURRENCY = LISTING_CURRENCY.toLowerCase();
const STRIPE_TEST_AMOUNT_MINOR = Math.round(LISTING_FEE * 100);

function getTestSecret() {
	const secret = process.env.STRIPE_SECRET_KEY?.trim();
	if (!isStripeTestSecret(secret)) {
		throw new Error("Stripe test mode requires a test secret key beginning with sk_test_ or rk_test_");
	}
	return secret;
}

function stripeHeaders(secret: string) {
	return { Authorization: "Basic " + Buffer.from(secret + ":").toString("base64") };
}

export async function createStripeTestCheckout(input: {
	txRef: string;
	itemId: string;
	itemTitle: string;
	email: string;
	baseUrl: string;
	localePrefix: string;
	expiresAt?: number;
}) {
	const secret = getTestSecret();
	const form = new URLSearchParams();
	form.set("mode", "payment");
	if (input.expiresAt) form.set("expires_at", String(input.expiresAt));
	form.set("customer_email", input.email);
	form.set("client_reference_id", input.txRef);
	form.set("metadata[txRef]", input.txRef);
	form.set("metadata[itemId]", input.itemId);
	form.set("line_items[0][price_data][currency]", STRIPE_TEST_CURRENCY);
	form.set("line_items[0][price_data][unit_amount]", String(STRIPE_TEST_AMOUNT_MINOR));
	form.set("line_items[0][price_data][product_data][name]", "Habesha Brokers listing publication fee (test)");
	form.set("line_items[0][price_data][product_data][description]", "EUR 40 listing publication fee. Test mode only. " + input.itemTitle.slice(0, 240));
	form.set("line_items[0][quantity]", "1");
	form.set("success_url", input.baseUrl + input.localePrefix + "/payments/stripe?session_id={CHECKOUT_SESSION_ID}");
	form.set("cancel_url", input.baseUrl + input.localePrefix + "/payments/stripe?cancelled=1&itemId=" + encodeURIComponent(input.itemId));

	const response = await axios.post(STRIPE_API + "/checkout/sessions", form.toString(), {
		headers: { ...stripeHeaders(secret), "Content-Type": "application/x-www-form-urlencoded" },
		timeout: 20000,
	});
	const sessionId = response.data?.id;
	const checkoutUrl = response.data?.url;
	if (typeof sessionId !== "string" || !sessionId.startsWith("cs_test_") || typeof checkoutUrl !== "string" || !checkoutUrl.startsWith("https://checkout.stripe.com/")) {
		throw new Error("Stripe did not return a valid test checkout session");
	}
	return { sessionId, checkoutUrl };
}

export async function getStripeTestCheckoutSession(sessionId: string) {
	if (!/^cs_test_[A-Za-z0-9_]+$/.test(sessionId)) throw new Error("Stripe test checkout session is invalid");
	const response = await axios.get(STRIPE_API + "/checkout/sessions/" + encodeURIComponent(sessionId), {
		headers: stripeHeaders(getTestSecret()),
		timeout: 15000,
	});
	const session = response.data;
	return {
		id: String(session?.id || ""),
		status: String(session?.status || ""),
		paymentStatus: String(session?.payment_status || ""),
		expiresAt: Number(session?.expires_at || 0),
	};
}

export async function expireStripeTestCheckoutSession(sessionId: string) {
	const current = await getStripeTestCheckoutSession(sessionId);
	if (current.status !== "open") return current;
	const response = await axios.post(
		STRIPE_API + "/checkout/sessions/" + encodeURIComponent(sessionId) + "/expire",
		"",
		{ headers: { ...stripeHeaders(getTestSecret()), "Content-Type": "application/x-www-form-urlencoded" }, timeout: 15000 },
	);
	const session = response.data;
	return {
		id: String(session?.id || current.id),
		status: String(session?.status || "expired"),
		paymentStatus: String(session?.payment_status || current.paymentStatus),
		expiresAt: Number(session?.expires_at || current.expiresAt),
	};
}

export async function verifyStripeTestCheckout(sessionId: string) {
	const secret = getTestSecret();
	if (!/^cs_test_[A-Za-z0-9_]+$/.test(sessionId)) {
		return { status: "NOT_FOUND" as const, itemId: null };
	}

	const response = await axios.get(STRIPE_API + "/checkout/sessions/" + encodeURIComponent(sessionId), {
		headers: stripeHeaders(secret),
		timeout: 15000,
	});
	const session = response.data;
	const txRef = typeof session?.metadata?.txRef === "string" ? session.metadata.txRef : "";
	if (!txRef.startsWith("HB-STRIPE-")) return { status: "NOT_FOUND" as const, itemId: null };

	const payment = await prisma.listingPayment.findUnique({
		where: { txRef },
		select: { id: true, itemId: true, amount: true, currency: true, status: true, providerRef: true },
	});
	if (!payment || payment.providerRef !== sessionId) return { status: "NOT_FOUND" as const, itemId: null };

	if (session.mode !== "payment" || session.livemode !== false || payment.currency !== LISTING_CURRENCY || payment.amount !== LISTING_FEE || String(session.currency || "").toLowerCase() !== STRIPE_TEST_CURRENCY || Number(session.amount_total) !== STRIPE_TEST_AMOUNT_MINOR) {
		throw new Error("Stripe checkout details do not match the listing payment");
	}
	if (session.payment_status !== "paid") {
		if (session.status === "expired") {
			await prisma.$transaction(async (tx) => {
				await tx.listingPayment.updateMany({ where: { id: payment.id, status: "INITIATED" }, data: { status: "FAILED" } });
				const latest = await tx.listingPayment.findFirst({ where: { itemId: payment.itemId }, orderBy: { createdAt: "desc" }, select: { id: true } });
				if (latest?.id === payment.id) {
					await tx.item.updateMany({ where: { id: payment.itemId, paymentStatus: "PROCESSING" }, data: { paymentStatus: "DUE", paymentLockedAt: null } });
				}
			});
			return { status: "FAILED" as const, itemId: payment.itemId };
		}
		return { status: "PENDING" as const, itemId: payment.itemId };
	}

	await prisma.$transaction(async (tx) => {
		const current = await tx.listingPayment.findUnique({ where: { id: payment.id }, select: { status: true } });
		if (!current || current.status === "PAID") return;
		await tx.listingPayment.update({
			where: { id: payment.id },
			data: {
				status: "PAID",
				paymentMethod: Array.isArray(session.payment_method_types) ? session.payment_method_types.join(",") : "card",
				verifiedAt: new Date(),
			},
		});
		await tx.item.updateMany({ where: { id: payment.itemId }, data: { paymentStatus: "PAID", paymentLockedAt: null } });
	});

	return { status: "PAID" as const, itemId: payment.itemId };
}

export async function refundStripeTestCheckout(input: {
	sessionId: string;
	paymentId: string;
	expectedAmountMinor: number;
	expectedCurrency: string;
	idempotencyKey: string;
	existingRefundId?: string | null;
}) {
	const secret = getTestSecret();
	if (!/^cs_test_[A-Za-z0-9_]+$/.test(input.sessionId)) throw new Error("Only Stripe test checkout sessions can be refunded");
	if (!Number.isSafeInteger(input.expectedAmountMinor) || input.expectedAmountMinor <= 0) throw new Error("Refund amount is invalid");

	const { data: session } = await axios.get(STRIPE_API + "/checkout/sessions/" + encodeURIComponent(input.sessionId), {
		headers: stripeHeaders(secret),
		params: { "expand[]": "payment_intent" },
		timeout: 15000,
	});
	const paymentIntent = typeof session?.payment_intent === "string"
		? session.payment_intent
		: session?.payment_intent?.id;
	if (
		session?.mode !== "payment" ||
		session?.livemode !== false ||
		session?.payment_status !== "paid" ||
		Number(session?.amount_total) !== input.expectedAmountMinor ||
		String(session?.currency || "").toLowerCase() !== input.expectedCurrency.toLowerCase() ||
		typeof paymentIntent !== "string" ||
		!paymentIntent.startsWith("pi_")
	) {
		throw new Error("Stripe session is not a paid test payment matching this listing record");
	}
	if (input.existingRefundId) {
		if (!/^re_[A-Za-z0-9]+$/.test(input.existingRefundId)) throw new Error("Stripe refund reference is invalid");
		const { data: existingRefund } = await axios.get(STRIPE_API + "/refunds/" + encodeURIComponent(input.existingRefundId), {
			headers: stripeHeaders(secret),
			timeout: 15000,
		});
		const refundPaymentIntent = typeof existingRefund?.payment_intent === "string"
			? existingRefund.payment_intent
			: existingRefund?.payment_intent?.id;
		if (
			existingRefund?.livemode !== false ||
			existingRefund?.amount !== input.expectedAmountMinor ||
			String(existingRefund?.currency || "").toLowerCase() !== input.expectedCurrency.toLowerCase() ||
			refundPaymentIntent !== paymentIntent
		) {
			throw new Error("Stripe refund does not match this listing payment");
		}
		return { refundId: existingRefund.id as string, status: String(existingRefund.status || "") };
	}
	const { data: refundList } = await axios.get(STRIPE_API + "/refunds", {
		headers: stripeHeaders(secret),
		params: { payment_intent: paymentIntent, limit: 100 },
		timeout: 15000,
	});
	const priorRefund = Array.isArray(refundList?.data)
		? refundList.data.find((entry: any) => entry?.metadata?.habesha_payment_id === input.paymentId)
		: null;
	const priorRefundPaymentIntent = typeof priorRefund?.payment_intent === "string"
		? priorRefund.payment_intent
		: priorRefund?.payment_intent?.id;
	// A failed or canceled refund did not return funds, so allow a later admin
	// attempt to create a new refund with its next idempotency key.
	if (priorRefund && priorRefund.status !== "failed" && priorRefund.status !== "canceled") {
		if (
			priorRefund?.livemode !== false ||
			priorRefund?.amount !== input.expectedAmountMinor ||
			String(priorRefund?.currency || "").toLowerCase() !== input.expectedCurrency.toLowerCase() ||
			priorRefundPaymentIntent !== paymentIntent
		) {
			throw new Error("Existing Stripe refund does not match this listing payment");
		}
		return { refundId: priorRefund.id as string, status: String(priorRefund.status || "") };
	}

	const form = new URLSearchParams();
	form.set("payment_intent", paymentIntent);
	form.set("amount", String(input.expectedAmountMinor));
	form.set("metadata[habesha_payment_id]", input.paymentId);
	const { data: refund } = await axios.post(STRIPE_API + "/refunds", form.toString(), {
		headers: {
			...stripeHeaders(secret),
			"Content-Type": "application/x-www-form-urlencoded",
			"Idempotency-Key": input.idempotencyKey,
		},
		timeout: 20000,
	});
	if (typeof refund?.id !== "string" || !refund.id.startsWith("re_")) {
		throw new Error("Stripe did not return a valid refund record");
	}
	return { refundId: refund.id as string, status: String(refund.status || "") };
}
