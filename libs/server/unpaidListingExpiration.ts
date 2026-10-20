import { prisma } from "@config/prisma";
import { FERRARI_LISTING_ID } from "@config/ferrariListing";
import { expireStripeTestCheckoutSession, verifyStripeTestCheckout } from "@libs/server/stripeTest";

export const LISTING_PAYMENT_WINDOW_MS = 24 * 60 * 60 * 1000;

export function getListingPaymentDeadline(createdAt: Date) {
	return new Date(createdAt.getTime() + LISTING_PAYMENT_WINDOW_MS);
}

/**
 * Close the specified unpaid Ferrari listing after its current checkout window.
 * The row stays in the owner's history but can no longer be paid or published.
 */
export async function closeExpiredFerrariListing(now = new Date()) {
	const item = await prisma.item.findFirst({
		where: {
			id: FERRARI_LISTING_ID,
			title: { contains: "Ferrari", mode: "insensitive" },
			status: { in: ["PENDING", "DECLINED"] },
			paymentStatus: { in: ["DUE", "PROCESSING"] },
		},
		select: {
			id: true,
			createdAt: true,
			ListingPayments: { take: 1, orderBy: { createdAt: "desc" }, select: { createdAt: true, status: true, providerRef: true } },
		},
	});
	if (!item) return { closedCount: 0, failedPaymentCount: 0 };
	const latestPayment = item.ListingPayments[0];
	const deadline = getListingPaymentDeadline(latestPayment?.createdAt || item.createdAt);
	if (now.getTime() < deadline.getTime()) return { closedCount: 0, failedPaymentCount: 0 };
	if (latestPayment?.status === "INITIATED" && latestPayment.providerRef?.startsWith("cs_test_")) {
		try {
			const session = await expireStripeTestCheckoutSession(latestPayment.providerRef);
			if (session.status === "complete" && session.paymentStatus === "paid") {
				await verifyStripeTestCheckout(latestPayment.providerRef);
				return { closedCount: 0, failedPaymentCount: 0 };
			}
		} catch (error) {
			const failure = error as { code?: unknown; message?: unknown };
			console.error("[payments] Could not expire Ferrari checkout at its deadline", {
				code: typeof failure.code === "string" ? failure.code : undefined,
				message: typeof failure.message === "string" ? failure.message.slice(0, 160) : undefined,
			});
			return { closedCount: 0, failedPaymentCount: 0 };
		}
	}

	const [payments, items] = await prisma.$transaction([
		prisma.listingPayment.updateMany({
			where: { itemId: item.id, status: "INITIATED" },
			data: { status: "FAILED" },
		}),
		prisma.item.updateMany({
			where: {
				id: item.id,
				title: { contains: "Ferrari", mode: "insensitive" },
				status: { in: ["PENDING", "DECLINED"] },
				paymentStatus: { in: ["DUE", "PROCESSING"] },
			},
			data: { status: "CLOSED", paymentStatus: "DUE", paymentLockedAt: null },
		}),
	]);

	return { closedCount: items.count, failedPaymentCount: payments.count };
}
