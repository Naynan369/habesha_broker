import { isValidChapaWebhook, markChapaListingPaymentFailed, verifyChapaListingPayment } from "@libs/server/chapa";
import type { NextApiRequest, NextApiResponse } from "next";

function getReference(value: unknown) {
  if (typeof value === "string") return value;
  if (Array.isArray(value) && typeof value[0] === "string") return value[0];
  return "";
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === "GET") {
    const txRef = getReference(req.query.tx_ref) || getReference(req.query.trx_ref);
    if (!/^[A-Za-z0-9_-]{8,100}$/.test(txRef)) return res.status(400).json({ err: "Payment reference is invalid" });
    try {
      const result = await verifyChapaListingPayment(txRef);
      if (result.status === "NOT_FOUND") return res.status(404).json({ err: "Payment not found" });
      return res.status(200).json({ status: result.status });
    } catch (_error) {
      return res.status(502).json({ err: "Payment verification is temporarily unavailable" });
    }
  }

  if (req.method === "POST") {
    if (!isValidChapaWebhook(req.body, req.headers)) {
      return res.status(401).json({ err: "Invalid Chapa webhook signature" });
    }

    const event = typeof req.body?.event === "string" ? req.body.event.toLowerCase() : "";
    const txRef = getReference(req.body?.tx_ref) || getReference(req.body?.trx_ref);
    if (!/^[A-Za-z0-9_-]{8,100}$/.test(txRef)) return res.status(400).json({ err: "Payment reference is invalid" });

    try {
      if (event === "charge.success") {
        await verifyChapaListingPayment(txRef);
      } else if (event.includes("failed") || event.includes("cancelled") || event.includes("canceled")) {
        await markChapaListingPaymentFailed(txRef);
      }
      return res.status(200).json({ ok: true });
    } catch (_error) {
      return res.status(502).json({ err: "Payment verification is temporarily unavailable" });
    }
  }

  return res.status(405).json({ err: "Method not allowed" });
}
