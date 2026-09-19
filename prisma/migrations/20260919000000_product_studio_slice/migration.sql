-- Product Studio thin slice: composed-product screens + the submission store
-- (docs/CR2-PRODUCT-STUDIO-SPEC.md §4, §6-8)

ALTER TABLE "DataProductDefinition" ADD COLUMN "screensJson" JSONB;

CREATE TABLE "ProductSubmission" (
    "id" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "productId" UUID NOT NULL,
    "productVersion" INTEGER NOT NULL,
    "valuesJson" JSONB NOT NULL,
    "resultsJson" JSONB,
    "createdByUserId" TEXT,

    CONSTRAINT "ProductSubmission_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "ProductSubmission_productId_idx" ON "ProductSubmission"("productId");

ALTER TABLE "ProductSubmission" ADD CONSTRAINT "ProductSubmission_productId_fkey"
    FOREIGN KEY ("productId") REFERENCES "DataProductDefinition"("id") ON DELETE CASCADE ON UPDATE CASCADE;
