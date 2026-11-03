import { ListingReportStatus } from "@prisma/client";
import type { Prisma } from "@prisma/client";
import { withSessionApi } from "@config/cookie/cookie";
import { prisma } from "@config/prisma";
import type { IUser } from "@libs/types/user";
import type { NextApiRequest, NextApiResponse } from "next";

type AdminRequest = NextApiRequest & { user?: IUser };

const PAGE_SIZE = 20;
const ACTION_STATUSES = new Map<string, ListingReportStatus>([
  ["review", ListingReportStatus.REVIEWING],
  ["resolve", ListingReportStatus.RESOLVED],
  ["dismiss", ListingReportStatus.DISMISSED],
  ["removeListing", ListingReportStatus.RESOLVED],
]);

const validId = (value: unknown): value is string =>
  typeof value === "string" && /^[A-Za-z0-9_-]{8,128}$/.test(value);

const parsePage = (value: unknown) => {
  const page = Number(value);
  return Number.isFinite(page) ? Math.max(0, Math.min(10000, Math.floor(page))) : 0;
};

async function handler(req: AdminRequest, res: NextApiResponse) {
  const admin = req.user;
  if (!admin || admin.role !== "ADMIN") {
    return res.status(403).json({ err: "Administrator access required" });
  }

  if (req.method === "GET") {
    const page = parsePage(req.query.page);
    const requestedStatus =
      typeof req.query.status === "string" ? req.query.status : "OPEN";
    const status =
      Object.values(ListingReportStatus).find((value) => value === requestedStatus) ??
      ListingReportStatus.OPEN;
    const where: Prisma.ListingReportWhereInput =
      requestedStatus === "ALL" ? {} : { status };

    const [reports, total] = await Promise.all([
      prisma.listingReport.findMany({
        where,
        include: {
          item: {
            select: {
              id: true,
              title: true,
              images: true,
              itemType: true,
              status: true,
              user: {
                select: { firstName: true, lastName: true, email: true },
              },
            },
          },
          reporter: {
            select: { firstName: true, lastName: true, email: true },
          },
        },
        orderBy: { createdAt: "desc" },
        skip: page * PAGE_SIZE,
        take: PAGE_SIZE,
      }),
      prisma.listingReport.count({ where }),
    ]);

    return res.status(200).json({ reports, total, page, pageSize: PAGE_SIZE });
  }

  if (req.method !== "POST") {
    res.setHeader("Allow", "GET, POST");
    return res.status(405).json({ err: "Method not allowed" });
  }

  const reportId = req.body?.reportId;
  if (!validId(reportId)) {
    return res.status(400).json({ err: "Report ID is invalid" });
  }

  const action = typeof req.body?.action === "string" ? req.body.action : "";
  const status = ACTION_STATUSES.get(action);
  if (!status) {
    return res.status(400).json({ err: "Report action is invalid" });
  }

  const note =
    typeof req.body?.note === "string"
      ? req.body.note.trim().slice(0, 1000) || null
      : null;

  const report = await prisma.listingReport.findUnique({
    where: { id: reportId },
    select: { itemId: true, status: true },
  });
  if (!report) {
    return res.status(404).json({ err: "Report not found" });
  }
  if (
    report.status !== ListingReportStatus.OPEN &&
    report.status !== ListingReportStatus.REVIEWING
  ) {
    return res.status(409).json({ err: "This report has already been closed" });
  }

  const updated = await prisma.$transaction(async (tx) => {
    const result = await tx.listingReport.updateMany({
      where: {
        id: reportId,
        status: {
          in: [ListingReportStatus.OPEN, ListingReportStatus.REVIEWING],
        },
      },
      data: {
        status,
        reviewedAt: new Date(),
        reviewerId: admin.id,
        reviewNote: note,
      },
    });
    if (result.count === 0) return false;

    if (action === "removeListing" && report.itemId) {
      await tx.item.updateMany({
        where: { id: report.itemId, status: "APPROVED" },
        data: { status: "CLOSED", approvedId: null, featured: false },
      });
    }
    return true;
  });

  if (!updated) {
    return res.status(409).json({ err: "This report has already been closed" });
  }
  return res.status(200).json({ ok: true, status });
}

export default withSessionApi(handler);
