-- Source files stored verbatim so a database's "source" is inspectable/downloadable
CREATE TABLE "DataSourceFile" (
    "id" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fileName" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "sizeBytes" INTEGER NOT NULL,
    "bytes" BYTEA NOT NULL,
    "uploadedBy" UUID,

    CONSTRAINT "DataSourceFile_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "FactorDatabase" ADD COLUMN "sourceFileId" UUID;

ALTER TABLE "FactorDatabase" ADD CONSTRAINT "FactorDatabase_sourceFileId_fkey"
    FOREIGN KEY ("sourceFileId") REFERENCES "DataSourceFile"("id") ON DELETE SET NULL ON UPDATE CASCADE;
