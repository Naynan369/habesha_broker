CREATE TYPE "ListingRefundStatus" AS ENUM ('NOT_REFUNDED', 'PROCESSING', 'REFUNDED');

ALTER TABLE "ListingPayment"
ADD COLUMN "refundStatus" "ListingRefundStatus" NOT NULL DEFAULT 'NOT_REFUNDED',
ADD COLUMN "refundAttempt" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN "refundRef" TEXT,
ADD COLUMN "refundStartedAt" TIMESTAMP(3),
ADD COLUMN "refundedAt" TIMESTAMP(3),
ADD COLUMN "refundedById" TEXT;

CREATE UNIQUE INDEX "ListingPayment_refundRef_key" ON "ListingPayment"("refundRef");
CREATE INDEX "ListingPayment_refundStatus_createdAt_idx" ON "ListingPayment"("refundStatus", "createdAt");
