import { prisma } from "@config/prisma";
import { LISTING_FEE_ETB } from "@config/listingPayment";
import { withSessionApi } from "@config/cookie/cookie";
import crypto from "crypto";
import type { NextApiRequest, NextApiResponse } from "next";

type SessionRequest = NextApiRequest & { user?: { id: string } };

async function handler(req: SessionRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).json({ err: "Method not allowed" });
  if (process.env.NODE_ENV !== "development" || process.env.ENABLE_TEST_LISTING_PAYMENTS !== "true") {
    return res.status(404).json({ err: "Not found" });
  }

  const userId = req.user?.id;
  if (!userId) return res.status(401).json({ err: "Authentication required" });
  const itemId = typeof req.body?.itemId === "string" ? req.body.itemId : "";
  if (!/^[A-Za-z0-9_-]{8,128}$/.test(itemId)) return res.status(400).json({ err: "Listing ID is invalid" });

  const user = await prisma.user.findUnique({ where: { id: userId }, select: { id: true, verfied: true } });
  if (!user) return res.status(401).json({ err: "Authentication required" });
  if (!user.verfied) return res.status(403).json({ err: "Verify your email address before paying for a listing" });

  const item = await prisma.item.findFirst({
    where: { id: itemId, userId: user.id },
    select: { id: true, status: true, paymentStatus: true },
  });
  if (!item) return res.status(404).json({ err: "Listing not found" });
  if (item.status === "APPROVED" || item.status === "SOLD") {
    return res.status(409).json({ err: "This listing is already published or closed" });
  }
  if (item.paymentStatus === "PAID") return res.status(200).json({ ok: true, paymentStatus: "PAID" });
  if (item.paymentStatus === "NOT_REQUIRED") {
    return res.status(409).json({ err: "This listing does not require another payment" });
  }

  const fee = LISTING_FEE_ETB;
  if (!Number.isFinite(fee) || fee <= 0) {
    return res.status(503).json({ err: "Set a valid listing fee before simulating payment" });
  }

  const txRef = "HB-TEST-" + Date.now() + "-" + crypto.randomBytes(5).toString("hex");
  await prisma.$transaction(async (tx) => {
    await tx.listingPayment.create({
      data: {
        itemId: item.id,
        txRef,
        amount: fee,
        currency: "ETB",
        status: "PAID",
        providerRef: "DEVELOPMENT-SIMULATION",
        paymentMethod: "Development simulation",
        verifiedAt: new Date(),
      },
    });
    const changed = await tx.item.updateMany({
      where: {
        id: item.id,
        userId: user.id,
        status: { in: ["PENDING", "DECLINED"] },
        paymentStatus: { in: ["DUE", "PROCESSING"] },
      },
      data: { paymentStatus: "PAID", paymentLockedAt: null },
    });
    if (!changed.count) throw new Error("Listing payment status changed. Refresh and try again.");
  });

  return res.status(200).json({ ok: true, paymentStatus: "PAID", txRef });
}

export default withSessionApi(handler);
