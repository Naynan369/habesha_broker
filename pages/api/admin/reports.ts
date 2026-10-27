import { withSessionApi } from "@config/cookie/cookie";
import { prisma } from "@config/prisma";
import type { NextApiRequest, NextApiResponse } from "next";
import type { IUser } from "@libs/types/user";

type AdminRequest = NextApiRequest & { user?: IUser };
const validId = (value: unknown) => typeof value === "string" && /^[A-Za-z0-9_-]{8,128}$/.test(value);

async function handler(req: AdminRequest, res: NextApiResponse) {
  if (!req.user || req.user.role !== "ADMIN") return res.status(403).json({ err: "Administrator access required" });
  if (req.method === "GET") {
    const page = Math.max(0, Math.min(10000, Math.floor(Number(req.query.page) || 0)));
    const state = typeof req.query.status === "string" ? req.query.status : "OPEN";
    const where: any = state === "ALL" ? {} : { status: ["OPEN", "REVIEWING", "RESOLVED", "DISMISSED"].includes(state) ? state : "OPEN" };
    const [reports, total] = await Promise.all([
      prisma.listingReport.findMany({ where, include: { item: { select: { id: true, title: true, images: true, itemType: true, status: true, user: { select: { firstName: true, lastName: true, email: true } } } }, reporter: { select: { firstName: true, lastName: true, email: true } } }, orderBy: { createdAt: "desc" }, skip: page * 20, take: 20 }),
      prisma.listingReport.count({ where }),
    ]);
    return res.status(200).json({ reports, total, page, pageSize: 20 });
  }
  if (req.method !== "POST") return res.status(405).json({ err: "Method not allowed" });
  const reportId = req.body?.reportId;
  const action = String(req.body?.action || "");
  const note = typeof req.body?.note === "string" ? req.body.note.trim().slice(0, 1000) || null : null;
  if (!validId(reportId)) return res.status(400).json({ err: "Report ID is invalid" });
  const statuses: Record<string, "REVIEWING" | "RESOLVED" | "DISMISSED"> = { review: "REVIEWING", resolve: "RESOLVED", dismiss: "DISMISSED", removeListing: "RESOLVED" };
  const status = statuses[action];
  if (!status) return res.status(400).json({ err: "Report action is invalid" });
  const report = await prisma.listingReport.findUnique({ where: { id: reportId }, select: { id: true, itemId: true, status: true } });
  if (!report) return res.status(404).json({ err: "Report not found" });
  if (!["OPEN", "REVIEWING"].includes(report.status)) return res.status(409).json({ err: "This report has already been closed" });
  await prisma.$transaction(async (tx) => {
    if (action === "removeListing" && report.itemId) {
      await tx.item.updateMany({ where: { id: report.itemId, status: "APPROVED" }, data: { status: "CLOSED", approvedId: null, featured: false } });
    }
    const updated = await tx.listingReport.updateMany({
      where: { id: report.id, status: { in: ["OPEN", "REVIEWING"] } },
      data: { status, reviewedAt: new Date(), reviewerId: req.user!.id, reviewNote: note },
    });
    if (!updated.count) throw new Error("REPORT_ALREADY_CLOSED");
  });
  return res.status(200).json({ ok: true, status });
}

export default withSessionApi(handler);
