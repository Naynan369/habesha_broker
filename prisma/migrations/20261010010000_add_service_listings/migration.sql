-- Add a dedicated marketplace type for local service providers.
ALTER TYPE "ItemType" ADD VALUE 'SERVICE';

CREATE TYPE "ServiceCategory" AS ENUM (
    'BROKER_SUPPORT',
    'PROPERTY_PHOTOGRAPHY',
    'MOVING',
    'CLEANING',
    'REPAIRS',
    'PROPERTY_MANAGEMENT'
);

CREATE TABLE "Service" (
    "id" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "category" "ServiceCategory" NOT NULL,
    "region" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "serviceArea" TEXT,
    CONSTRAINT "Service_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Service_itemId_key" ON "Service"("itemId");
CREATE INDEX "Service_category_region_city_idx" ON "Service"("category", "region", "city");

ALTER TABLE "Service" ADD CONSTRAINT "Service_itemId_fkey"
    FOREIGN KEY ("itemId") REFERENCES "Item"("id") ON DELETE CASCADE ON UPDATE CASCADE;
