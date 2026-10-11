import { prisma } from "@config/prisma";
import { withSessionApi } from "@config/cookie/cookie";
import { getBaseUrl } from "@libs/helpers/util";
import axios from "axios";
import crypto from "crypto";
import type { NextApiRequest, NextApiResponse } from "next";

type SessionRequest = NextApiRequest & { session?: { user?: { id?: string } } };

async function handler(req: SessionRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).json({ err: "Method not allowed" });

  const userId = req.session?.user?.id;
  if (!userId) return res.status(401).json({ err: "Authentication required" });

  const itemId = typeof req.body?.itemId === "string" ? req.body.itemId : "";
  if (!/^[A-Za-z0-9_-]{8,128}$/.test(itemId)) return res.status(400).json({ err: "Listing ID is invalid" });

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, firstName: true, lastName: true, email: true, verfied: true },
  });
  if (!user) return res.status(401).json({ err: "Authentication required" });
  if (!user.verfied) return res.status(403).json({ err: "Verify your email address before paying for a listing" });

  const item = await prisma.item.findFirst({
    where: { id: itemId, userId: user.id, itemType: "CAR" },
    select: { id: true, title: true, status: true, paymentStatus: true },
  });
  if (!item) return res.status(404).json({ err: "Car listing not found" });
  if (item.status === "APPROVED" || item.status === "SOLD") {
    return res.status(409).json({ err: "This listing is already published or closed" });
  }
  if (item.paymentStatus === "PAID" || item.paymentStatus === "NOT_REQUIRED") {
    return res.status(409).json({ err: "This listing does not need another payment" });
  }

  const secret = process.env.CHAPA_SECRET_KEY?.trim();
  const fee = Number(process.env.CAR_LISTING_FEE_ETB);
  const requestHost = typeof req.headers.host === "string" ? req.headers.host : "";
  const localDevOrigin = process.env.NODE_ENV === "development" && /^localhost(?::[0-9]{1,5})?$/.test(requestHost)
    ? "http://" + requestHost
    : "";
  const baseUrl = localDevOrigin || getBaseUrl();
  if (!secret || !Number.isFinite(fee) || fee <= 0 || !baseUrl) {
    return res.status(503).json({ err: "Online payment is not configured yet. Please contact Habesha Brokers." });
  }

  const latest = await prisma.listingPayment.findFirst({
    where: { itemId: item.id },
    orderBy: { createdAt: "desc" },
    select: { txRef: true, amount: true, status: true, checkoutUrl: true },
  });
  if (latest?.status === "INITIATED" && latest.checkoutUrl && latest.amount === fee) {
    return res.status(200).json({ checkoutUrl: latest.checkoutUrl, txRef: latest.txRef });
  }

  const txRef = "HB-" + Date.now() + "-" + crypto.randomBytes(6).toString("hex");
  const payment = await prisma.$transaction(async (tx) => {
    const created = await tx.listingPayment.create({
      data: { itemId: item.id, txRef, amount: fee, currency: "ETB" },
      select: { id: true, txRef: true },
    });
    await tx.item.update({ where: { id: item.id }, data: { paymentStatus: "PROCESSING" } });
    return created;
  });

  const cleanBaseUrl = baseUrl.replace(/\/$/, "");
  const localePrefix = req.body?.locale === "am" ? "/am" : "";
  const paymentReturnUrl = cleanBaseUrl + localePrefix + "/payments/chapa?tx_ref=" + encodeURIComponent(txRef);
  try {
    const response = await axios.post(
      "https://api.chapa.co/v1/transaction/initialize",
      {
        amount: String(fee),
        currency: "ETB",
        email: user.email,
        first_name: user.firstName,
        last_name: user.lastName,
        tx_ref: txRef,
        callback_url: cleanBaseUrl + "/api/payments/chapa/callback?tx_ref=" + encodeURIComponent(txRef),
        return_url: paymentReturnUrl,
        customization: {
          title: "Habesha Brokers",
          description: "Fixed car listing fee",
        },
        meta: {
          payment_reason: "Car listing publication: " + item.title,
          invoices: [{ key: "Car listing publication", value: "1 car listing" }],
        },
      },
      {
        headers: { Authorization: "Bearer " + secret, "Content-Type": "application/json" },
        timeout: 20000,
      }
    );

    const checkoutUrl = response.data?.data?.checkout_url;
    if (String(response.data?.status || "").toLowerCase() !== "success" || typeof checkoutUrl !== "string" || !checkoutUrl.startsWith("https://")) {
      throw new Error("Chapa did not return a secure checkout link");
    }
    await prisma.listingPayment.update({ where: { id: payment.id }, data: { checkoutUrl } });
    return res.status(201).json({ checkoutUrl, txRef });
  } catch (_error) {
    await prisma.listingPayment.updateMany({
      where: { id: payment.id, status: "INITIATED" },
      data: { status: "FAILED" },
    });
    const newest = await prisma.listingPayment.findFirst({
      where: { itemId: item.id },
      orderBy: { createdAt: "desc" },
      select: { id: true },
    });
    if (newest?.id === payment.id) {
      await prisma.item.updateMany({
        where: { id: item.id, paymentStatus: "PROCESSING" },
        data: { paymentStatus: "DUE" },
      });
    }
    return res.status(502).json({ err: "We could not start the secure payment. Please try again." });
  }
}

export default withSessionApi(handler);
