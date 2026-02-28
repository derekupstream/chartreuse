-- CreateTable
CREATE TABLE "GoldenDataset" (
    "id" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT NOT NULL DEFAULT 'default',
    "inputs" JSONB NOT NULL,
    "expectedOutputs" JSONB NOT NULL,
    "tolerance" DOUBLE PRECISION NOT NULL DEFAULT 0.02,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sourceProjectId" UUID,
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],

    CONSTRAINT "GoldenDataset_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TestRun" (
    "id" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ranByUserId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'running',
    "totalTests" INTEGER NOT NULL DEFAULT 0,
    "passed" INTEGER NOT NULL DEFAULT 0,
    "failed" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "TestRun_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TestRunResult" (
    "id" UUID NOT NULL,
    "testRunId" UUID NOT NULL,
    "datasetId" UUID NOT NULL,
    "passed" BOOLEAN NOT NULL,
    "actualOutputs" JSONB,
    "diff" JSONB,
    "errorMessage" TEXT,

    CONSTRAINT "TestRunResult_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "TestRunResult" ADD CONSTRAINT "TestRunResult_testRunId_fkey" FOREIGN KEY ("testRunId") REFERENCES "TestRun"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TestRunResult" ADD CONSTRAINT "TestRunResult_datasetId_fkey" FOREIGN KEY ("datasetId") REFERENCES "GoldenDataset"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
