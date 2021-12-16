/*
  Warnings:

  - Added the required column `newMonthlyCost` to the `WasteHaulingCost` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "WasteHaulingCost" ADD COLUMN     "newMonthlyCost" INTEGER NOT NULL;
