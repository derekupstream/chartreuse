-- Reusable metric logic: a named equation built from variables that resolve to
-- database factors, user inputs, or other smart fields.
CREATE TABLE "SmartField" (
    "id" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "unit" TEXT,
    "equation" JSONB NOT NULL,
    "testInputs" JSONB,
    "isPublished" BOOLEAN NOT NULL DEFAULT false,
    "createdBy" UUID,
    CONSTRAINT "SmartField_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "SmartField_name_key" ON "SmartField"("name");
