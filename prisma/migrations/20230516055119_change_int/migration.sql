/*
  Warnings:

  - You are about to alter the column `budget` on the `Project` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Integer`.
  - You are about to alter the column `singleUseReductionPercentage` on the `Project` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Integer`.

*/
-- AlterTable
ALTER TABLE "Project" ALTER COLUMN "budget" SET DATA TYPE INTEGER,
ALTER COLUMN "singleUseReductionPercentage" SET DATA TYPE INTEGER;
