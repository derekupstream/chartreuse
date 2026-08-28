-- Named, restorable versions of the whole database collection (contents included)
CREATE TABLE "DataRelease" (
    "id" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" UUID,
    "name" TEXT NOT NULL,
    "note" TEXT,
    "tablesJson" JSONB NOT NULL,

    CONSTRAINT "DataRelease_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "DataRelease_name_key" ON "DataRelease"("name");
