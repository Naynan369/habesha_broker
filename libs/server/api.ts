import { prisma } from "@config/prisma";
import { refundStripeTestCheckout } from "@libs/server/stripeTest";
import { userRoutes, providerAuthRoutes } from "@libs/server/accountRoutes";
import { serviceRequestRoutes } from "@libs/server/serviceRequestRoutes";
import { error, isValidRecordId, requireAdmin, requireUser, sellerContactTypes, type SessionRequest } from "@libs/server/apiShared";
import { itemRoutes } from "@libs/server/listingRoutes";
import type { NextApiRequest, NextApiResponse } from "next";

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
			select: { id: true, userId: true, status: true, itemType: true, paymentStatus: true, sellerAttested: true },
		});
		if (!item) return error(res, 404, "Listing not found");
		if (item.status !== "PENDING") return error(res, 409, "Only pending listings can be moderated");
		if (status === "APPROVED" && item.paymentStatus !== "PAID") {
			return error(res, 409, "The listing fee must be confirmed before this listing can be published");
		}
		if (status === "APPROVED" && !item.sellerAttested) {
			return error(res, 409, "The seller must confirm their role and authority before this listing can be published");
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
		if (slug[0] === "auth" && slug[1] === "provider") return await providerAuthRoutes(sessionReq, res, slug);
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
