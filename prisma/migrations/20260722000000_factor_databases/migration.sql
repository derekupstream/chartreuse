-- Reference-data "databases": named, versioned tables kept in their native column
-- structure, as distinct from Factor which holds a single scalar value.
CREATE TABLE "FactorDatabase" (
    "id" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "sourceName" TEXT,
    "sourceUrl" TEXT,
    "version" TEXT NOT NULL DEFAULT '1',
    "columns" JSONB NOT NULL,
    "keyColumn" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "uploadedBy" UUID,
    CONSTRAINT "FactorDatabase_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "FactorDatabase_name_key" ON "FactorDatabase"("name");

CREATE TABLE "FactorDatabaseRow" (
    "id" UUID NOT NULL,
    "databaseId" UUID NOT NULL,
    "rowIndex" INTEGER NOT NULL,
    "data" JSONB NOT NULL,
    CONSTRAINT "FactorDatabaseRow_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "FactorDatabaseRow_databaseId_rowIndex_idx" ON "FactorDatabaseRow"("databaseId", "rowIndex");

ALTER TABLE "FactorDatabaseRow" ADD CONSTRAINT "FactorDatabaseRow_databaseId_fkey"
  FOREIGN KEY ("databaseId") REFERENCES "FactorDatabase"("id") ON DELETE CASCADE ON UPDATE CASCADE;
