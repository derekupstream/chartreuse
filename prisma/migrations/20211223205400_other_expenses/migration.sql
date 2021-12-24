/*
  Warnings:

  - You are about to drop the `AdditionalCost` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "AdditionalCost" DROP CONSTRAINT "AdditionalCost_projectId_fkey";

-- DropTable
DROP TABLE "AdditionalCost";

-- CreateTable
CREATE TABLE "OtherExpense" (
    "id" UUID NOT NULL,
    "categoryId" TEXT NOT NULL,
    "cost" INTEGER NOT NULL,
    "description" TEXT NOT NULL,
    "frequency" TEXT NOT NULL,
    "projectId" UUID NOT NULL,

    CONSTRAINT "OtherExpense_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "OtherExpense" ADD CONSTRAINT "OtherExpense_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;
