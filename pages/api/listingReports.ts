import { withSessionApi } from "@config/cookie/cookie";
import { prisma } from "@config/prisma";
import type { NextApiRequest, NextApiResponse } from "next";
import type { IUser } from "@libs/types/user";

type ReportRequest = NextApiRequest & { user?: IUser };
const reasons = ["SUSPECTED_FRAUD", "MISLEADING_INFORMATION", "UNAUTHORIZED_LISTING", "PROHIBITED_CONTENT", "HARASSMENT", "OTHER"] as const;
const validId = (value: unknown) => typeof value === "string" && /^[A-Za-z0-9_-]{8,128}$/.test(value);

async function handler(req: ReportRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).json({ err: "Method not allowed" });
  const user = req.user;
  if (!user) return res.status(401).json({ err: "Sign in to report a listing" });
  if (!user.verfied) return res.status(403).json({ err: "Verify your email before submitting a report" });
  const itemId = req.body?.itemId;
  const reason = req.body?.reason;
  const details = typeof req.body?.details === "string" ? req.body.details.trim().slice(0, 1200) : "";
  if (!validId(itemId)) return res.status(400).json({ err: "Listing ID is invalid" });
  if (!reasons.includes(reason)) return res.status(400).json({ err: "Choose a report reason" });
  if (reason === "OTHER" && details.length < 10) return res.status(400).json({ err: "Please add at least 10 characters of detail" });
  const item = await prisma.item.findUnique({ where: { id: itemId }, select: { id: true, userId: true, status: true } });
  if (!item || item.status !== "APPROVED") return res.status(404).json({ err: "Published listing not found" });
  if (item.userId === user.id) return res.status(409).json({ err: "You cannot report your own listing" });
  const active = await prisma.listingReport.findFirst({ where: { itemId, reporterId: user.id, status: { in: ["OPEN", "REVIEWING"] } }, select: { id: true } });
  if (active) return res.status(409).json({ err: "You already have an open report for this listing" });
  const report = await prisma.listingReport.create({ data: { itemId, reporterId: user.id, reason, details: details || null } });
  return res.status(201).json({ ok: true, id: report.id });
}

export default withSessionApi(handler);
