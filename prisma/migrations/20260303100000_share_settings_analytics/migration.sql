-- AlterTable: add shareSettings to Project
ALTER TABLE "Project" ADD COLUMN "shareSettings" JSONB;

-- AlterTable: add analyticsSlug to Org
ALTER TABLE "Org" ADD COLUMN "analyticsSlug" TEXT;
CREATE UNIQUE INDEX "Org_analyticsSlug_key" ON "Org"("analyticsSlug");
