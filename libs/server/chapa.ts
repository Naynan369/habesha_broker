import axios from "axios";
import { createHmac, timingSafeEqual } from "crypto";
import { prisma } from "@config/prisma";

function safeEqualHex(left: string, right: string) {
  if (!/^[a-f0-9]+$/i.test(left) || !/^[a-f0-9]+$/i.test(right)) return false;
  const leftBuffer = Buffer.from(left, "hex");
  const rightBuffer = Buffer.from(right, "hex");
  return leftBuffer.length === rightBuffer.length && timingSafeEqual(leftBuffer, rightBuffer);
}

export function isValidChapaWebhook(body: unknown, headers: Record<string, string | string[] | undefined>) {
  const webhookSecret = process.env.CHAPA_WEBHOOK_SECRET;
  if (!webhookSecret) return false;

  const bodySignature = createHmac("sha256", webhookSecret).update(JSON.stringify(body)).digest("hex");
  const secretSignature = createHmac("sha256", webhookSecret).update(webhookSecret).digest("hex");
  const receivedBody = headers["x-chapa-signature"];
  const receivedSecret = headers["chapa-signature"];
  const bodyValue = Array.isArray(receivedBody) ? receivedBody[0] : receivedBody;
  const secretValue = Array.isArray(receivedSecret) ? receivedSecret[0] : receivedSecret;

  return Boolean(
    (bodyValue && safeEqualHex(bodyValue, bodySignature)) ||
    (secretValue && safeEqualHex(secretValue, secretSignature))
  );
}

async function markPaymentFailed(paymentId: string, itemId: string) {
  await prisma.$transaction(async (tx) => {
    await tx.listingPayment.updateMany({
      where: { id: paymentId, status: { not: "PAID" } },
      data: { status: "FAILED" },
    });
    const latest = await tx.listingPayment.findFirst({
      where: { itemId },
      orderBy: { createdAt: "desc" },
      select: { id: true },
    });
    if (latest?.id === paymentId) {
      await tx.item.updateMany({
        where: { id: itemId, paymentStatus: "PROCESSING" },
        data: { paymentStatus: "DUE", paymentLockedAt: null },
      });
    }
  });
}

export async function markChapaListingPaymentFailed(txRef: string) {
  const payment = await prisma.listingPayment.findUnique({
    where: { txRef },
    select: { id: true, itemId: true },
  });
  if (!payment) return;
  await markPaymentFailed(payment.id, payment.itemId);
}

export async function verifyChapaListingPayment(txRef: string) {
  const secret = process.env.CHAPA_SECRET_KEY;
  if (!secret) throw new Error("Chapa is not configured");

  const payment = await prisma.listingPayment.findUnique({
    where: { txRef },
    select: { id: true, itemId: true, txRef: true, amount: true, currency: true, status: true },
  });
  if (!payment) return { status: "NOT_FOUND" as const, itemId: null };
  if (payment.status === "PAID") return { status: "PAID" as const, itemId: payment.itemId };

  let response;
  try {
    response = await axios.get(
      "https://api.chapa.co/v1/transaction/verify/" + encodeURIComponent(txRef),
      { headers: { Authorization: "Bearer " + secret } }
    );
  } catch (error: any) {
    if (error?.response?.status === 404) return { status: "PENDING" as const, itemId: payment.itemId };
    throw error;
  }

  const data = response.data?.data;
  const transactionStatus = String(data?.status || "").toLowerCase();
  if (transactionStatus !== "success" || String(response.data?.status || "").toLowerCase() !== "success") {
    if (["failed", "cancelled", "canceled", "reversed"].includes(transactionStatus)) {
      await markPaymentFailed(payment.id, payment.itemId);
      return { status: "FAILED" as const, itemId: payment.itemId };
    }
    return { status: "PENDING" as const, itemId: payment.itemId };
  }

  if (String(data?.tx_ref || "") !== txRef) throw new Error("Chapa returned a different transaction reference");
  if (String(data?.currency || "").toUpperCase() !== payment.currency) throw new Error("Chapa returned a different currency");
  const amount = Number(data?.amount);
  if (!Number.isFinite(amount) || Math.round(amount * 100) !== Math.round(payment.amount * 100)) {
    throw new Error("Chapa returned a different payment amount");
  }

  await prisma.$transaction(async (tx) => {
    const current = await tx.listingPayment.findUnique({
      where: { id: payment.id },
      select: { status: true },
    });
    if (!current || current.status === "PAID") return;

    await tx.listingPayment.update({
      where: { id: payment.id },
      data: {
        status: "PAID",
        providerRef: typeof data.reference === "string" ? data.reference : null,
        paymentMethod: typeof data.method === "string" ? data.method : typeof data.payment_method === "string" ? data.payment_method : null,
        verifiedAt: new Date(),
      },
    });
    await tx.item.updateMany({
      where: { id: payment.itemId },
      data: { paymentStatus: "PAID", paymentLockedAt: null },
    });
  });

  return { status: "PAID" as const, itemId: payment.itemId };
}
