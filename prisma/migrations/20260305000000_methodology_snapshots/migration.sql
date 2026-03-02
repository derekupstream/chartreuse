-- Methodology Snapshot governance layer
-- Run with: psql $DIRECT_DATABASE_URL -f this_file.sql

-- MethodologySnapshot
CREATE TABLE IF NOT EXISTS "MethodologySnapshot" (
    "id"          UUID NOT NULL DEFAULT gen_random_uuid(),
    "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy"   UUID NOT NULL,
    "name"        TEXT NOT NULL,
    "notes"       TEXT,
    "status"      TEXT NOT NULL DEFAULT 'draft',
    "publishedAt" TIMESTAMP(3),
    CONSTRAINT "MethodologySnapshot_pkey" PRIMARY KEY ("id")
);

-- MethodologySnapshotFactor (join: snapshot → factor version)
CREATE TABLE IF NOT EXISTS "MethodologySnapshotFactor" (
    "id"              UUID NOT NULL DEFAULT gen_random_uuid(),
    "snapshotId"      UUID NOT NULL,
    "factorVersionId" UUID NOT NULL,
    CONSTRAINT "MethodologySnapshotFactor_pkey" PRIMARY KEY ("id")
);
ALTER TABLE "MethodologySnapshotFactor"
    ADD CONSTRAINT "MethodologySnapshotFactor_snapshotId_fkey"
    FOREIGN KEY ("snapshotId") REFERENCES "MethodologySnapshot"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "MethodologySnapshotFactor"
    ADD CONSTRAINT "MethodologySnapshotFactor_factorVersionId_fkey"
    FOREIGN KEY ("factorVersionId") REFERENCES "FactorVersion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
CREATE UNIQUE INDEX IF NOT EXISTS "MethodologySnapshotFactor_snapshotId_factorVersionId_key"
    ON "MethodologySnapshotFactor"("snapshotId", "factorVersionId");

-- ComputeRun (unified run log)
CREATE TABLE IF NOT EXISTS "ComputeRun" (
    "id"                    UUID NOT NULL DEFAULT gen_random_uuid(),
    "createdAt"             TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "runType"               TEXT NOT NULL,
    "status"                TEXT NOT NULL DEFAULT 'running',
    "orgId"                 UUID,
    "projectId"             UUID,
    "methodologySnapshotId" UUID,
    "startedAt"             TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finishedAt"            TIMESTAMP(3),
    "errorText"             TEXT,
    "metadataJson"          JSONB,
    CONSTRAINT "ComputeRun_pkey" PRIMARY KEY ("id")
);
ALTER TABLE "ComputeRun"
    ADD CONSTRAINT "ComputeRun_orgId_fkey"
    FOREIGN KEY ("orgId") REFERENCES "Org"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ComputeRun"
    ADD CONSTRAINT "ComputeRun_projectId_fkey"
    FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ComputeRun"
    ADD CONSTRAINT "ComputeRun_methodologySnapshotId_fkey"
    FOREIGN KEY ("methodologySnapshotId") REFERENCES "MethodologySnapshot"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- MetricResult (persisted outputs with provenance)
CREATE TABLE IF NOT EXISTS "MetricResult" (
    "id"                    UUID NOT NULL DEFAULT gen_random_uuid(),
    "computedAt"            TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "runId"                 UUID NOT NULL,
    "orgId"                 UUID,
    "projectId"             UUID,
    "metricKey"             TEXT NOT NULL,
    "valueNumeric"          DOUBLE PRECISION,
    "valueJson"             JSONB,
    "units"                 TEXT NOT NULL,
    "methodologySnapshotId" UUID,
    "factorVersionIdsJson"  JSONB,
    CONSTRAINT "MetricResult_pkey" PRIMARY KEY ("id")
);
ALTER TABLE "MetricResult"
    ADD CONSTRAINT "MetricResult_runId_fkey"
    FOREIGN KEY ("runId") REFERENCES "ComputeRun"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Add computeRunId to ProjectMilestone (nullable, no data migration needed)
ALTER TABLE "ProjectMilestone"
    ADD COLUMN IF NOT EXISTS "computeRunId" UUID;
ALTER TABLE "ProjectMilestone"
    ADD CONSTRAINT "ProjectMilestone_computeRunId_fkey"
    FOREIGN KEY ("computeRunId") REFERENCES "ComputeRun"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Add methodologySnapshotId to TestRun (nullable, no data migration needed)
ALTER TABLE "TestRun"
    ADD COLUMN IF NOT EXISTS "methodologySnapshotId" UUID;
ALTER TABLE "TestRun"
    ADD CONSTRAINT "TestRun_methodologySnapshotId_fkey"
    FOREIGN KEY ("methodologySnapshotId") REFERENCES "MethodologySnapshot"("id") ON DELETE SET NULL ON UPDATE CASCADE;
