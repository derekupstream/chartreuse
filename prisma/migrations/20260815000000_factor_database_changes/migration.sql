-- Append-only changelog for reference databases: one row per upload/merge,
-- recording the version bump and what changed. Never updated in place.
CREATE TABLE "FactorDatabaseChange" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "databaseId" UUID NOT NULL,
    "changedBy" UUID,
    "action" TEXT NOT NULL,
    "versionBefore" TEXT,
    "versionAfter" TEXT NOT NULL,
    "rowsAdded" INTEGER NOT NULL DEFAULT 0,
    "rowsUpdated" INTEGER NOT NULL DEFAULT 0,
    "rowsRemoved" INTEGER NOT NULL DEFAULT 0,
    "rowCountAfter" INTEGER NOT NULL DEFAULT 0,
    "columnsTouched" JSONB,
    "sourceNote" TEXT,

    CONSTRAINT "FactorDatabaseChange_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "FactorDatabaseChange_databaseId_createdAt_idx" ON "FactorDatabaseChange"("databaseId", "createdAt");

ALTER TABLE "FactorDatabaseChange" ADD CONSTRAINT "FactorDatabaseChange_databaseId_fkey" FOREIGN KEY ("databaseId") REFERENCES "FactorDatabase"("id") ON DELETE CASCADE ON UPDATE CASCADE;
