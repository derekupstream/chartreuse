-- AlterTable: Add org profile fields
ALTER TABLE "Org"
  ADD COLUMN IF NOT EXISTS "orgType" TEXT,
  ADD COLUMN IF NOT EXISTS "country" TEXT,
  ADD COLUMN IF NOT EXISTS "city" TEXT,
  ADD COLUMN IF NOT EXISTS "employeeCount" TEXT,
  ADD COLUMN IF NOT EXISTS "locationCount" TEXT,
  ADD COLUMN IF NOT EXISTS "reuseJourneyStage" TEXT,
  ADD COLUMN IF NOT EXISTS "primaryChallenge" TEXT;

-- AlterTable: Add RSP linkage fields to Account
ALTER TABLE "Account"
  ADD COLUMN IF NOT EXISTS "rspClientId" TEXT,
  ADD COLUMN IF NOT EXISTS "rspOrgId" UUID;

-- AddForeignKey: Account.rspOrgId -> Org.id
ALTER TABLE "Account"
  ADD CONSTRAINT "Account_rspOrgId_fkey"
  FOREIGN KEY ("rspOrgId") REFERENCES "Org"("id")
  ON DELETE SET NULL ON UPDATE CASCADE
  DEFERRABLE INITIALLY DEFERRED;

-- CreateTable: RspApiKey
CREATE TABLE IF NOT EXISTS "RspApiKey" (
  "id"          UUID        NOT NULL DEFAULT gen_random_uuid(),
  "createdAt"   TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"   TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "orgId"       UUID        NOT NULL,
  "label"       TEXT        NOT NULL,
  "keyHash"     TEXT        NOT NULL,
  "keyPrefix"   TEXT        NOT NULL,
  "isActive"    BOOLEAN     NOT NULL DEFAULT TRUE,
  "lastUsedAt"  TIMESTAMPTZ,
  "expiresAt"   TIMESTAMPTZ,
  CONSTRAINT "RspApiKey_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "RspApiKey_keyHash_key" UNIQUE ("keyHash"),
  CONSTRAINT "RspApiKey_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Org"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable: UsageTimePeriod
CREATE TABLE IF NOT EXISTS "UsageTimePeriod" (
  "id"               UUID        NOT NULL DEFAULT gen_random_uuid(),
  "createdAt"        TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"        TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "orgId"            UUID        NOT NULL,
  "accountId"        UUID,
  "clientExternalId" TEXT        NOT NULL,
  "dateMin"          DATE        NOT NULL,
  "dateMax"          DATE        NOT NULL,
  "submittedByKeyId" UUID,
  "status"           TEXT        NOT NULL DEFAULT 'active',
  "supersededById"   UUID,
  "rawPayload"       JSONB,
  "co2AvoidedKg"     DOUBLE PRECISION NOT NULL DEFAULT 0,
  "waterSavedGallons" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "wasteDivertedLbs" DOUBLE PRECISION NOT NULL DEFAULT 0,
  CONSTRAINT "UsageTimePeriod_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "UsageTimePeriod_orgId_fkey"            FOREIGN KEY ("orgId")            REFERENCES "Org"("id")             ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "UsageTimePeriod_accountId_fkey"        FOREIGN KEY ("accountId")        REFERENCES "Account"("id")         ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT "UsageTimePeriod_submittedByKeyId_fkey" FOREIGN KEY ("submittedByKeyId") REFERENCES "RspApiKey"("id")       ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT "UsageTimePeriod_supersededById_fkey"   FOREIGN KEY ("supersededById")   REFERENCES "UsageTimePeriod"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable: UsagePeriodProduct
CREATE TABLE IF NOT EXISTS "UsagePeriodProduct" (
  "id"                 UUID             NOT NULL DEFAULT gen_random_uuid(),
  "periodId"           UUID             NOT NULL,
  "reusableType"       TEXT             NOT NULL,
  "inWarehouseEvents"  INTEGER          NOT NULL,
  "outWarehouseEvents" INTEGER          NOT NULL,
  "co2AvoidedKg"       DOUBLE PRECISION NOT NULL DEFAULT 0,
  "waterSavedGallons"  DOUBLE PRECISION NOT NULL DEFAULT 0,
  "wasteDivertedLbs"   DOUBLE PRECISION NOT NULL DEFAULT 0,
  CONSTRAINT "UsagePeriodProduct_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "UsagePeriodProduct_periodId_fkey" FOREIGN KEY ("periodId") REFERENCES "UsageTimePeriod"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
