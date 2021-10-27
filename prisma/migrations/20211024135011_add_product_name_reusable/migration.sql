/*
  Warnings:

  - Added the required column `productName` to the `ReusableLineItem` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "ReusableLineItem" ADD COLUMN     "productName" INTEGER NOT NULL;
