-- Migration: DataHealthIssue table
-- Created: 2026-03-05

CREATE TABLE IF NOT EXISTS "DataHealthIssue" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "issueType" TEXT NOT NULL,
    "severity" TEXT NOT NULL,
    "entity" TEXT NOT NULL,
    "entityId" UUID NOT NULL,
    "details" JSONB,
    "status" TEXT NOT NULL DEFAULT 'open',
    "acknowledgedAt" TIMESTAMP(3),
    "acknowledgedByUserId" TEXT,
    "note" TEXT,
    CONSTRAINT "DataHealthIssue_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "DataHealthIssue_issueType_entityId_key"
    ON "DataHealthIssue"("issueType", "entityId");
