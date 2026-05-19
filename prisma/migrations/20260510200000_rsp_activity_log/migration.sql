ALTER TABLE "RspApiKey" ADD COLUMN "isSimulated" BOOLEAN NOT NULL DEFAULT false;

CREATE TABLE "RspApiActivityLog" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "apiKeyId" UUID,
    "orgId" UUID,
    "endpoint" TEXT NOT NULL,
    "httpStatus" INTEGER NOT NULL,
    "outcome" TEXT NOT NULL,
    "errorMessage" TEXT,
    "errorCode" TEXT,
    "latencyMs" INTEGER,
    "requestSummary" JSONB,
    "responseSummary" JSONB,
    "clientIp" TEXT,
    CONSTRAINT "RspApiActivityLog_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "RspApiActivityLog_createdAt_idx" ON "RspApiActivityLog" ("createdAt");
CREATE INDEX "RspApiActivityLog_apiKeyId_createdAt_idx" ON "RspApiActivityLog" ("apiKeyId", "createdAt");
CREATE INDEX "RspApiActivityLog_orgId_createdAt_idx" ON "RspApiActivityLog" ("orgId", "createdAt");
CREATE INDEX "RspApiActivityLog_outcome_createdAt_idx" ON "RspApiActivityLog" ("outcome", "createdAt");

ALTER TABLE "RspApiActivityLog" ADD CONSTRAINT "RspApiActivityLog_apiKeyId_fkey"
    FOREIGN KEY ("apiKeyId") REFERENCES "RspApiKey"("id") ON DELETE SET NULL ON UPDATE CASCADE;
