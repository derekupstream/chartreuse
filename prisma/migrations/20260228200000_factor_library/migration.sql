-- CreateTable FactorCategory
CREATE TABLE "FactorCategory" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "FactorCategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable FactorSource
CREATE TABLE "FactorSource" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" TEXT NOT NULL,
    "description" TEXT,
    "version" TEXT NOT NULL,
    "url" TEXT,
    "lastChecked" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    CONSTRAINT "FactorSource_pkey" PRIMARY KEY ("id")
);

-- CreateTable Factor
CREATE TABLE "Factor" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "categoryId" UUID NOT NULL,
    "sourceId" UUID NOT NULL,
    "currentValue" DOUBLE PRECISION NOT NULL,
    "unit" TEXT NOT NULL,
    "region" TEXT,
    "notes" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "effectiveFrom" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "effectiveTo" TIMESTAMP(3),
    "createdBy" UUID NOT NULL,
    "approvedBy" UUID,
    "approvalNotes" TEXT,
    "calculatorConstantKey" TEXT,
    CONSTRAINT "Factor_pkey" PRIMARY KEY ("id")
);

-- CreateTable FactorVersion
CREATE TABLE "FactorVersion" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "factorId" UUID NOT NULL,
    "value" DOUBLE PRECISION NOT NULL,
    "unit" TEXT NOT NULL,
    "notes" TEXT,
    "changedBy" UUID NOT NULL,
    "changeReason" TEXT NOT NULL,
    "sourceVersion" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "approvedBy" UUID,
    "approvedAt" TIMESTAMP(3),
    "approvalNotes" TEXT,
    CONSTRAINT "FactorVersion_pkey" PRIMARY KEY ("id")
);

-- CreateTable FactorDependency
CREATE TABLE "FactorDependency" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "factorId" UUID NOT NULL,
    "dependsOnId" UUID NOT NULL,
    "calculationPath" TEXT,
    "strength" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    CONSTRAINT "FactorDependency_pkey" PRIMARY KEY ("id")
);

-- CreateTable ChangeRequest
CREATE TABLE "ChangeRequest" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "type" TEXT NOT NULL,
    "factorId" UUID,
    "factorName" TEXT NOT NULL,
    "proposedValue" DOUBLE PRECISION,
    "proposedUnit" TEXT,
    "proposedSource" TEXT,
    "proposedNotes" TEXT,
    "proposedCategory" TEXT,
    "requestedBy" UUID NOT NULL,
    "reason" TEXT NOT NULL,
    "priority" TEXT NOT NULL DEFAULT 'medium',
    "status" TEXT NOT NULL DEFAULT 'pending',
    "reviewedBy" UUID,
    "reviewedAt" TIMESTAMP(3),
    "reviewNotes" TEXT,
    "implementedBy" UUID,
    "implementedAt" TIMESTAMP(3),
    CONSTRAINT "ChangeRequest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "FactorCategory_name_key" ON "FactorCategory"("name");
CREATE UNIQUE INDEX "FactorSource_name_key" ON "FactorSource"("name");
CREATE UNIQUE INDEX "Factor_name_categoryId_key" ON "Factor"("name", "categoryId");
CREATE UNIQUE INDEX "FactorDependency_factorId_dependsOnId_key" ON "FactorDependency"("factorId", "dependsOnId");

-- AddForeignKey
ALTER TABLE "Factor" ADD CONSTRAINT "Factor_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "FactorCategory"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Factor" ADD CONSTRAINT "Factor_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "FactorSource"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "FactorVersion" ADD CONSTRAINT "FactorVersion_factorId_fkey" FOREIGN KEY ("factorId") REFERENCES "Factor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "FactorDependency" ADD CONSTRAINT "FactorDependency_dependsOnId_fkey" FOREIGN KEY ("dependsOnId") REFERENCES "Factor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "FactorDependency" ADD CONSTRAINT "FactorDependency_factorId_fkey" FOREIGN KEY ("factorId") REFERENCES "Factor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ChangeRequest" ADD CONSTRAINT "ChangeRequest_factorId_fkey" FOREIGN KEY ("factorId") REFERENCES "Factor"("id") ON DELETE SET NULL ON UPDATE CASCADE;
