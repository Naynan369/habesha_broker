CREATE TYPE "ListingPaymentStatus" AS ENUM ('NOT_REQUIRED', 'DUE', 'PROCESSING', 'PAID');
CREATE TYPE "ListingPaymentState" AS ENUM ('INITIATED', 'PAID', 'FAILED');

ALTER TABLE "Item"
ADD COLUMN "paymentStatus" "ListingPaymentStatus" NOT NULL DEFAULT 'NOT_REQUIRED';

-- Existing unpublished car listings must pay before they can be approved.
UPDATE "Item"
SET "paymentStatus" = 'DUE'
WHERE "itemType" = 'CAR' AND "status" <> 'APPROVED';

CREATE TABLE "ListingPayment" (
    "id" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "txRef" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'ETB',
    "status" "ListingPaymentState" NOT NULL DEFAULT 'INITIATED',
    "checkoutUrl" TEXT,
    "providerRef" TEXT,
    "paymentMethod" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "verifiedAt" TIMESTAMP(3),
    CONSTRAINT "ListingPayment_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ListingPayment_txRef_key" ON "ListingPayment"("txRef");
CREATE INDEX "ListingPayment_itemId_createdAt_idx" ON "ListingPayment"("itemId", "createdAt");

ALTER TABLE "ListingPayment"
ADD CONSTRAINT "ListingPayment_itemId_fkey"
FOREIGN KEY ("itemId") REFERENCES "Item"("id") ON DELETE CASCADE ON UPDATE CASCADE;
