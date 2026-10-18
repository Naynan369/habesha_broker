CREATE TYPE "ListingRefundRequestStatus" AS ENUM ('NONE', 'PENDING', 'APPROVED', 'DECLINED');

ALTER TABLE "ListingPayment"
ADD COLUMN "refundRequestStatus" "ListingRefundRequestStatus" NOT NULL DEFAULT 'NONE',
ADD COLUMN "refundRequestedAt" TIMESTAMP(3),
ADD COLUMN "refundRequestReason" TEXT,
ADD COLUMN "refundReviewedAt" TIMESTAMP(3),
ADD COLUMN "refundReviewedById" TEXT,
ADD COLUMN "refundReviewNote" TEXT;

CREATE INDEX "ListingPayment_refundRequestStatus_refundRequestedAt_idx"
ON "ListingPayment"("refundRequestStatus", "refundRequestedAt");
