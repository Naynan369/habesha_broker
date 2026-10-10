-- CreateEnum
CREATE TYPE "ItemType" AS ENUM ('HOUSE', 'CAR', 'BUSINESS_SPACE');

-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN', 'USER');

-- CreateEnum
CREATE TYPE "ItemStatus" AS ENUM ('PENDING', 'APPROVED', 'DECLINED', 'SOLD');

-- CreateEnum
CREATE TYPE "ContactType" AS ENUM ('TELEGRAM', 'FACEBOOK', 'INSTAGRAM', 'PHONE_NUMBER', 'ADDRESS', 'EMAIL');

-- CreateEnum
CREATE TYPE "HouseType" AS ENUM ('RENT', 'FORSALE');

-- CreateEnum
CREATE TYPE "CommercialSpaceType" AS ENUM ('SHOP', 'OFFICE', 'WAREHOUSE', 'MARKET_STALL', 'WORKSHOP', 'LAND');

-- CreateEnum
CREATE TYPE "PriceFrequency" AS ENUM ('DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY');

-- CreateEnum
CREATE TYPE "CarType" AS ENUM ('USED', 'NEW', 'NEW_ETH');

-- CreateEnum
CREATE TYPE "ActionType" AS ENUM ('ADDED', 'SAVED', 'APPROVED');

-- CreateEnum
CREATE TYPE "PriceType" AS ENUM ('FIXED', 'NEGOTIABLE');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "bio" TEXT,
    "profile_url" TEXT,
    "role" "Role" NOT NULL DEFAULT 'USER',
    "verfied" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContactInfo" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "contactType" "ContactType" NOT NULL,
    "value" TEXT NOT NULL,

    CONSTRAINT "ContactInfo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Verification" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "requestTime" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Verification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PasswordReset" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "link" TEXT NOT NULL,
    "requestTime" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PasswordReset_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Item" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "description" TEXT,
    "price" DOUBLE PRECISION NOT NULL,
    "priceType" "PriceType" NOT NULL,
    "images" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "itemType" "ItemType" NOT NULL,
    "status" "ItemStatus" NOT NULL DEFAULT 'PENDING',
    "userId" TEXT NOT NULL,
    "approvedId" TEXT,

    CONSTRAINT "Item_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "House" (
    "id" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "area" DOUBLE PRECISION,
    "room" INTEGER,
    "type" "HouseType",
    "region" TEXT,
    "city" TEXT,

    CONSTRAINT "House_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Car" (
    "id" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "status" "CarType" NOT NULL,
    "manufacturer" TEXT NOT NULL,
    "year" INTEGER,
    "transmition" TEXT NOT NULL,
    "color" TEXT,
    "cylinder" DOUBLE PRECISION,
    "fuel" DOUBLE PRECISION,

    CONSTRAINT "Car_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BusinessSpace" (
    "id" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "spaceType" "CommercialSpaceType" NOT NULL,
    "type" "HouseType" NOT NULL,
    "priceFrequency" "PriceFrequency",
    "area" DOUBLE PRECISION NOT NULL,
    "region" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "subcity" TEXT,
    "woreda" TEXT,
    "neighborhood" TEXT,
    "landmark" TEXT,
    "electricity" BOOLEAN NOT NULL DEFAULT false,
    "water" BOOLEAN NOT NULL DEFAULT false,
    "roadAccess" BOOLEAN NOT NULL DEFAULT false,
    "parking" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "BusinessSpace_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SavedItems" (
    "id" TEXT NOT NULL,
    "savedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,

    CONSTRAINT "SavedItems_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RecentActions" (
    "id" TEXT NOT NULL,
    "actionType" "ActionType" NOT NULL,
    "actionTime" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,

    CONSTRAINT "RecentActions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "PasswordReset_link_key" ON "PasswordReset"("link");

-- CreateIndex
CREATE INDEX "Item_status_createdAt_idx" ON "Item"("status", "createdAt");

-- CreateIndex
CREATE INDEX "Item_itemType_status_idx" ON "Item"("itemType", "status");

-- CreateIndex
CREATE UNIQUE INDEX "House_itemId_key" ON "House"("itemId");

-- CreateIndex
CREATE UNIQUE INDEX "Car_itemId_key" ON "Car"("itemId");

-- CreateIndex
CREATE UNIQUE INDEX "BusinessSpace_itemId_key" ON "BusinessSpace"("itemId");

-- CreateIndex
CREATE UNIQUE INDEX "SavedItems_userId_itemId_key" ON "SavedItems"("userId", "itemId");

-- CreateIndex
CREATE INDEX "RecentActions_actionTime_idx" ON "RecentActions"("actionTime");

-- AddForeignKey
ALTER TABLE "ContactInfo" ADD CONSTRAINT "ContactInfo_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Verification" ADD CONSTRAINT "Verification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PasswordReset" ADD CONSTRAINT "PasswordReset_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Item" ADD CONSTRAINT "Item_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Item" ADD CONSTRAINT "Item_approvedId_fkey" FOREIGN KEY ("approvedId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "House" ADD CONSTRAINT "House_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "Item"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Car" ADD CONSTRAINT "Car_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "Item"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BusinessSpace" ADD CONSTRAINT "BusinessSpace_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "Item"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SavedItems" ADD CONSTRAINT "SavedItems_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SavedItems" ADD CONSTRAINT "SavedItems_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "Item"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecentActions" ADD CONSTRAINT "RecentActions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecentActions" ADD CONSTRAINT "RecentActions_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "Item"("id") ON DELETE CASCADE ON UPDATE CASCADE;
