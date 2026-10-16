import { prisma } from "@config/prisma";
import { verifyChapaListingPayment } from "@libs/server/chapa";
import { withSessionApi } from "@config/cookie/cookie";
import type { NextApiRequest, NextApiResponse } from "next";

type SessionRequest = NextApiRequest & { user?: { id: string; role?: "USER" | "ADMIN" } };

async function handler(req: SessionRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).json({ err: "Method not allowed" });
  const userId = req.user?.id;
  if (!userId) return res.status(401).json({ err: "Authentication required" });

  const txRef = typeof req.body?.txRef === "string" ? req.body.txRef.trim() : "";
  if (!/^[A-Za-z0-9_-]{8,100}$/.test(txRef)) return res.status(400).json({ err: "Payment reference is invalid" });

  const payment = await prisma.listingPayment.findUnique({
    where: { txRef },
    select: { itemId: true, item: { select: { userId: true } } },
  });
  if (!payment) return res.status(404).json({ err: "Payment not found" });
  if (payment.item.userId !== userId && req.user?.role !== "ADMIN") {
    return res.status(404).json({ err: "Payment not found" });
  }

  try {
    const result = await verifyChapaListingPayment(txRef);
    return res.status(200).json({ status: result.status, itemId: result.itemId });
  } catch (_error) {
    return res.status(502).json({ err: "We could not verify payment right now. Please check again shortly." });
  }
}

export default withSessionApi(handler);
