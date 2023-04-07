-- AlterTable
ALTER TABLE "Project" ADD COLUMN     "USState" TEXT NOT NULL DEFAULT 'California',
ADD COLUMN     "utilityRates" JSONB;
