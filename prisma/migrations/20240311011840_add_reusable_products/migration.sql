-- AlterTable
ALTER TABLE "ReusableLineItem" ADD COLUMN     "productId" TEXT,
ALTER COLUMN "categoryId" DROP NOT NULL,
ALTER COLUMN "productName" DROP NOT NULL;
