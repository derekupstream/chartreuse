/*
  Warnings:

  - Added the required column `description` to the `WasteHaulingCost` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "WasteHaulingCost" ADD COLUMN     "description" TEXT NOT NULL;
