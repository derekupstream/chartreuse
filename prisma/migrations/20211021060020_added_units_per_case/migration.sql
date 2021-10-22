/*
  Warnings:

  - You are about to drop the `SingleUseProduct` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "SingleUseProduct" DROP CONSTRAINT "SingleUseProduct_projectId_fkey";

-- DropTable
DROP TABLE "SingleUseProduct";

-- CreateTable
CREATE TABLE "SingleUseLineItem" (
    "id" TEXT NOT NULL,
    "caseCost" INTEGER NOT NULL,
    "casesPurchased" INTEGER NOT NULL,
    "frequency" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "newCaseCost" INTEGER NOT NULL,
    "newCasesPurchased" INTEGER NOT NULL,
    "unitsPerCase" INTEGER NOT NULL,
    "projectId" TEXT NOT NULL,

    CONSTRAINT "SingleUseLineItem_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "SingleUseLineItem" ADD CONSTRAINT "SingleUseLineItem_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- RenameIndex
ALTER INDEX "User.email_unique" RENAME TO "User_email_key";
