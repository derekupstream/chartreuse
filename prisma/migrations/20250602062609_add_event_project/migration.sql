/*
  Warnings:

  - A unique constraint covering the columns `[publicSlug]` on the table `Project` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "ProjectCategory" AS ENUM ('default', 'event', 'eugene');

-- AlterTable
ALTER TABLE "Project" ADD COLUMN     "category" "ProjectCategory" NOT NULL DEFAULT 'default',
ADD COLUMN     "eventGuestCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "projectionsDescription" TEXT,
ADD COLUMN     "projectionsTitle" TEXT,
ADD COLUMN     "publicSlug" TEXT;

-- CreateTable
CREATE TABLE "EventFoodwareLineItem" (
    "id" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "singleUseProductId" TEXT NOT NULL,
    "reusableProductId" TEXT NOT NULL,
    "reusableItemCount" INTEGER NOT NULL DEFAULT 0,
    "reusableReturnPercentage" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "projectId" UUID NOT NULL,

    CONSTRAINT "EventFoodwareLineItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TruckTransportationCost" (
    "id" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "distanceInMiles" DOUBLE PRECISION NOT NULL,
    "projectId" UUID NOT NULL,

    CONSTRAINT "TruckTransportationCost_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DishwasherSimple" (
    "id" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "electricUsage" DOUBLE PRECISION NOT NULL,
    "waterUsage" DOUBLE PRECISION NOT NULL,
    "fuelType" TEXT NOT NULL,
    "projectId" UUID NOT NULL,

    CONSTRAINT "DishwasherSimple_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Project_publicSlug_key" ON "Project"("publicSlug");

-- AddForeignKey
ALTER TABLE "EventFoodwareLineItem" ADD CONSTRAINT "EventFoodwareLineItem_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TruckTransportationCost" ADD CONSTRAINT "TruckTransportationCost_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DishwasherSimple" ADD CONSTRAINT "DishwasherSimple_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;
