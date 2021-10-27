/*
  Warnings:

  - Added the required column `unitCost` to the `ReusableLineItem` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "ReusableLineItem" ADD COLUMN     "unitCost" INTEGER NOT NULL,
ALTER COLUMN "productName" SET DATA TYPE TEXT;
