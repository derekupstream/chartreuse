-- CreateTable
CREATE TABLE "AdditionalCost" (
    "id" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "cost" INTEGER NOT NULL,
    "frequency" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,

    CONSTRAINT "AdditionalCost_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "AdditionalCost" ADD CONSTRAINT "AdditionalCost_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;
