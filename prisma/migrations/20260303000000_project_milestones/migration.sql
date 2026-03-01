-- CreateTable: ProjectMilestone
CREATE TABLE IF NOT EXISTS "ProjectMilestone" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "projectId" UUID NOT NULL,
    "snapshotDate" DATE NOT NULL,
    "label" TEXT,
    "source" TEXT NOT NULL DEFAULT 'manual',
    "co2AvoidedMtco2e" DOUBLE PRECISION,
    "waterSavedGallons" DOUBLE PRECISION,
    "wasteDivertedLbs" DOUBLE PRECISION,
    "annualCostSavings" DOUBLE PRECISION,
    "paybackMonths" INTEGER,
    "annualROIPct" DOUBLE PRECISION,
    "envBreakEvenMonths" DOUBLE PRECISION,
    "returnRatePct" DOUBLE PRECISION,
    "rawMetrics" JSONB,
    CONSTRAINT "ProjectMilestone_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "ProjectMilestone" ADD CONSTRAINT "ProjectMilestone_projectId_fkey"
    FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Index
CREATE INDEX IF NOT EXISTS "ProjectMilestone_projectId_idx" ON "ProjectMilestone"("projectId");
CREATE INDEX IF NOT EXISTS "ProjectMilestone_snapshotDate_idx" ON "ProjectMilestone"("snapshotDate");
