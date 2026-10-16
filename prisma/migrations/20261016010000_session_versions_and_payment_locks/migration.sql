ALTER TABLE "User" ADD COLUMN "sessionVersion" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "Item" ADD COLUMN "paymentLockedAt" TIMESTAMP(3);
UPDATE "Item"
SET "paymentStatus" = 'DUE'
WHERE "status" IN ('PENDING', 'DECLINED') AND "paymentStatus" = 'NOT_REQUIRED';
