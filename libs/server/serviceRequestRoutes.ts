import { prisma } from "@config/prisma";
import { error, isValidRecordId, requireUser, type SessionRequest } from "@libs/server/apiShared";
import type { NextApiResponse } from "next";

export async function serviceRequestRoutes(req: SessionRequest, res: NextApiResponse, slug: string[]) {
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
					review: { select: { id: true, rating: true, comment: true, createdAt: true } },
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
		try {
			const outcome = await prisma.$transaction(async (tx) => {
				const item = await tx.item.findUnique({ where: { id: itemId }, select: { id: true, userId: true, itemType: true, status: true } });
				if (!item || item.itemType !== "SERVICE" || item.status !== "APPROVED") return { kind: "NOT_FOUND" as const };
				if (item.userId === verifiedUser.id) return { kind: "OWN_SERVICE" as const };
				const openRequest = await tx.serviceRequest.findFirst({
					where: { itemId: item.id, customerId: verifiedUser.id, status: { in: ["NEW", "QUOTED", "ACCEPTED", "SCHEDULED"] } },
					select: { id: true },
				});
				if (openRequest) return { kind: "ALREADY_OPEN" as const };
				const request = await tx.serviceRequest.create({
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
				return { kind: "CREATED" as const, request };
			}, { isolationLevel: "Serializable" });
			if (outcome.kind === "NOT_FOUND") return error(res, 404, "Published service not found");
			if (outcome.kind === "OWN_SERVICE") return error(res, 409, "You cannot request your own service");
			if (outcome.kind === "ALREADY_OPEN") return error(res, 409, "You already have an open request for this service");
			return res.status(201).json({ request: outcome.request });
		} catch (caught) {
			if ((caught as any)?.code === "P2034") return error(res, 409, "A request for this service was just submitted. Refresh your requests to see it.");
			throw caught;
		}
	}

	if (slug[1] === "update" && req.method === "POST") {
		const requestId = String(body.requestId || "");
		const action = String(body.action || "");
		if (!isValidRecordId(requestId)) return error(res, 400, "Service request is invalid");
		const existing = await prisma.serviceRequest.findUnique({ where: { id: requestId }, select: { id: true, itemId: true, customerId: true, providerId: true, status: true } });
		if (!existing) return error(res, 404, "Service request not found");
		if (action === "quote") {
			if (existing.providerId !== user.id) return error(res, 403, "Only this service provider can quote this request");
			if (!["NEW", "ACCEPTED"].includes(existing.status)) return error(res, 409, "This request is no longer open for a quote");
			const amount = Number(body.quoteAmount);
			const note = typeof body.quoteNote === "string" ? body.quoteNote.trim().slice(0, 1000) : "";
			if (!Number.isFinite(amount) || amount <= 0 || amount > 1_000_000_000) return error(res, 400, "Enter a valid quote amount in ETB");
			let appointmentAt: Date | null = null;
			if (body.appointmentAt) {
				appointmentAt = new Date(String(body.appointmentAt));
				const latest = new Date(Date.now() + 180 * 24 * 60 * 60 * 1000);
				if (!Number.isFinite(appointmentAt.getTime()) || appointmentAt <= new Date() || appointmentAt > latest) return error(res, 400, "Choose a proposed appointment within the next 180 days");
			}
			const changed = await prisma.serviceRequest.updateMany({
				where: { id: existing.id, providerId: user.id, status: existing.status },
				data: { status: "QUOTED", quoteAmount: amount, quoteNote: note || null, appointmentAt },
			});
			if (!changed.count) return error(res, 409, "This request has already changed. Refresh and try again.");
			return res.status(200).json({ ok: true, status: "QUOTED" });
		}
		if (action === "acceptQuote" || action === "declineQuote") {
			if (existing.customerId !== user.id) return error(res, 403, "Only the customer can respond to this quote");
			if (existing.status !== "QUOTED") return error(res, 409, "There is no current quote to respond to");
			const status = action === "acceptQuote" ? "ACCEPTED" : "DECLINED";
			const changed = await prisma.serviceRequest.updateMany({ where: { id: existing.id, customerId: user.id, status: "QUOTED" }, data: { status } });
			if (!changed.count) return error(res, 409, "This request has already changed. Refresh and try again.");
			return res.status(200).json({ ok: true, status });
		}
		if (action === "schedule") {
			if (existing.providerId !== user.id) return error(res, 403, "Only this service provider can schedule this request");
			if (existing.status !== "ACCEPTED") return error(res, 409, "The customer must accept the quote before scheduling");
			const appointmentAt = new Date(String(body.appointmentAt || ""));
			const latest = new Date(Date.now() + 180 * 24 * 60 * 60 * 1000);
			if (!Number.isFinite(appointmentAt.getTime()) || appointmentAt <= new Date() || appointmentAt > latest) return error(res, 400, "Choose an appointment within the next 180 days");
			const changed = await prisma.serviceRequest.updateMany({ where: { id: existing.id, providerId: user.id, status: "ACCEPTED" }, data: { appointmentAt, status: "SCHEDULED" } });
			if (!changed.count) return error(res, 409, "This request has already changed. Refresh and try again.");
			return res.status(200).json({ ok: true, status: "SCHEDULED" });
		}
		if (action === "cancel") {
			if (existing.customerId !== user.id) return error(res, 403, "Only the customer can cancel this request");
			const changed = await prisma.serviceRequest.updateMany({ where: { id: existing.id, customerId: user.id, status: { in: ["NEW", "QUOTED"] } }, data: { status: "CANCELLED" } });
			if (!changed.count) return error(res, 409, "This request has already changed. Refresh and try again.");
			return res.status(200).json({ ok: true, status: "CANCELLED" });
		}
		if (existing.providerId !== user.id) return error(res, 403, "Only this service provider can update the request");
		if (action === "accept" || action === "decline") {
			const status = action === "accept" ? "ACCEPTED" : "DECLINED";
			const changed = await prisma.serviceRequest.updateMany({ where: { id: existing.id, providerId: user.id, status: "NEW" }, data: { status } });
			if (!changed.count) return error(res, 409, "This request has already changed. Refresh and try again.");
			return res.status(200).json({ ok: true, status });
		}
		if (action === "complete") {
			const changed = await prisma.serviceRequest.updateMany({ where: { id: existing.id, providerId: user.id, status: { in: ["ACCEPTED", "SCHEDULED"] } }, data: { status: "COMPLETED" } });
			if (!changed.count) return error(res, 409, "Only an accepted request can be completed");
			return res.status(200).json({ ok: true, status: "COMPLETED" });
		}
		if (action === "review") {
			return error(res, 403, "Only the customer can review a completed service");
		}
		return error(res, 400, "Action is invalid");
	}

	if (slug[1] === "review" && req.method === "POST") {
		const requestId = String(body.requestId || "");
		const rating = Number(body.rating);
		const comment = typeof body.comment === "string" ? body.comment.trim().slice(0, 1000) : "";
		if (!isValidRecordId(requestId)) return error(res, 400, "Service request is invalid");
		if (!Number.isInteger(rating) || rating < 1 || rating > 5) return error(res, 400, "Choose a rating from 1 to 5");
		const request = await prisma.serviceRequest.findUnique({ where: { id: requestId }, select: { id: true, itemId: true, customerId: true, providerId: true, status: true, review: { select: { id: true } } } });
		if (!request || request.customerId !== user.id) return error(res, 404, "Completed service request not found");
		if (request.status !== "COMPLETED") return error(res, 409, "A review is available after the provider marks the service completed");
		if (request.review) return error(res, 409, "You have already reviewed this service");
		try {
			const review = await prisma.serviceReview.create({ data: { requestId: request.id, itemId: request.itemId, reviewerId: user.id, providerId: request.providerId, rating, comment: comment || null } });
			return res.status(201).json({ review: { id: review.id, rating: review.rating, comment: review.comment, createdAt: review.createdAt } });
		} catch (caught) {
			if ((caught as any)?.code === "P2002") return error(res, 409, "You have already reviewed this service");
			throw caught;
		}
	}

	return error(res, 404, "Route not found");
}

