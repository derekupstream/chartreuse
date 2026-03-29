-- CreateTable
CREATE TABLE "DataProductDefinition" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "productType" TEXT NOT NULL DEFAULT 'calculator',
    "audience" TEXT NOT NULL DEFAULT 'internal',
    "status" TEXT NOT NULL DEFAULT 'draft',
    "projectType" TEXT,
    "inputSchemaJson" JSONB,
    "outputSchemaJson" JSONB,
    "flowDefinitionJson" JSONB,
    "methodologyDocumentId" UUID,
    "version" INTEGER NOT NULL DEFAULT 1,
    "publishedVersion" INTEGER,
    "isPublic" BOOLEAN NOT NULL DEFAULT false,
    "createdByUserId" TEXT NOT NULL,
    "updatedByUserId" TEXT,

    CONSTRAINT "DataProductDefinition_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "DataProductDefinition_slug_key" ON "DataProductDefinition"("slug");
