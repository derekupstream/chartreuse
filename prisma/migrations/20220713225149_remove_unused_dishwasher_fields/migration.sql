/*
  Warnings:

  - You are about to drop the column `additionalRacksPerDay` on the `Dishwasher` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Dishwasher" DROP COLUMN "additionalRacksPerDay",
ALTER COLUMN "newOperatingDays" DROP DEFAULT,
ALTER COLUMN "newRacksPerDay" DROP DEFAULT,
ALTER COLUMN "racksPerDay" DROP DEFAULT;
