-- Trust and safety reports plus a fuller service request and review lifecycle.
ALTER TYPE "ServiceRequestStatus" ADD VALUE IF NOT EXISTS 'QUOTED';
ALTER TYPE "ServiceRequestStatus" ADD VALUE IF NOT EXISTS 'SCHEDULED';

ALTER TABLE "Service" ADD COLUMN "availability" TEXT;
ALTER TABLE "ServiceRequest"
  ADD COLUMN "quoteAmount" DOUBLE PRECISION,
  ADD COLUMN "quoteNote" TEXT,
  ADD COLUMN "appointmentAt" TIMESTAMP(3);

CREATE TYPE "ListingReportReason" AS ENUM (
  'SUSPECTED_FRAUD', 'MISLEADING_INFORMATION', 'UNAUTHORIZED_LISTING',
  'PROHIBITED_CONTENT', 'HARASSMENT', 'OTHER'
);
CREATE TYPE "ListingReportStatus" AS ENUM ('OPEN', 'REVIEWING', 'RESOLVED', 'DISMISSED');

CREATE TABLE "ListingReport" (
  "id" TEXT NOT NULL,
  "itemId" TEXT,
  "reporterId" TEXT,
  "reason" "ListingReportReason" NOT NULL,
  "details" TEXT,
  "status" "ListingReportStatus" NOT NULL DEFAULT 'OPEN',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "reviewedAt" TIMESTAMP(3),
  "reviewerId" TEXT,
  "reviewNote" TEXT,
  CONSTRAINT "ListingReport_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "ListingReport_status_createdAt_idx" ON "ListingReport"("status", "createdAt");
CREATE INDEX "ListingReport_itemId_status_idx" ON "ListingReport"("itemId", "status");
CREATE INDEX "ListingReport_reporterId_itemId_status_idx" ON "ListingReport"("reporterId", "itemId", "status");
ALTER TABLE "ListingReport" ADD CONSTRAINT "ListingReport_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "Item"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ListingReport" ADD CONSTRAINT "ListingReport_reporterId_fkey" FOREIGN KEY ("reporterId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ListingReport" ADD CONSTRAINT "ListingReport_reviewerId_fkey" FOREIGN KEY ("reviewerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE "ServiceReview" (
  "id" TEXT NOT NULL,
  "requestId" TEXT NOT NULL,
  "itemId" TEXT NOT NULL,
  "reviewerId" TEXT NOT NULL,
  "providerId" TEXT NOT NULL,
  "rating" INTEGER NOT NULL,
  "comment" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ServiceReview_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "ServiceReview_requestId_key" ON "ServiceReview"("requestId");
CREATE INDEX "ServiceReview_itemId_createdAt_idx" ON "ServiceReview"("itemId", "createdAt");
CREATE INDEX "ServiceReview_providerId_createdAt_idx" ON "ServiceReview"("providerId", "createdAt");
ALTER TABLE "ServiceReview" ADD CONSTRAINT "ServiceReview_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "ServiceRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ServiceReview" ADD CONSTRAINT "ServiceReview_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "Item"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ServiceReview" ADD CONSTRAINT "ServiceReview_reviewerId_fkey" FOREIGN KEY ("reviewerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ServiceReview" ADD CONSTRAINT "ServiceReview_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
