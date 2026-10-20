CREATE TYPE "ServiceRequestStatus" AS ENUM ('NEW', 'ACCEPTED', 'DECLINED', 'COMPLETED', 'CANCELLED');

CREATE TABLE "ServiceRequest" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "itemId" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "preferredAt" TIMESTAMP(3),
    "message" TEXT NOT NULL,
    "contactPhone" TEXT,
    "status" "ServiceRequestStatus" NOT NULL DEFAULT 'NEW',
    CONSTRAINT "ServiceRequest_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "ServiceRequest_providerId_status_createdAt_idx" ON "ServiceRequest"("providerId", "status", "createdAt");
CREATE INDEX "ServiceRequest_customerId_createdAt_idx" ON "ServiceRequest"("customerId", "createdAt");
CREATE INDEX "ServiceRequest_itemId_createdAt_idx" ON "ServiceRequest"("itemId", "createdAt");

ALTER TABLE "ServiceRequest" ADD CONSTRAINT "ServiceRequest_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "Item"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ServiceRequest" ADD CONSTRAINT "ServiceRequest_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ServiceRequest" ADD CONSTRAINT "ServiceRequest_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
