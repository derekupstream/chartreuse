/*
  Warnings:

  - Made the column `orgId` on table `Account` required. This step will fail if there are existing NULL values in that column.
  - Made the column `orgId` on table `Project` required. This step will fail if there are existing NULL values in that column.
  - Made the column `accountId` on table `Project` required. This step will fail if there are existing NULL values in that column.
  - Made the column `email` on table `User` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "Account" DROP CONSTRAINT "Account_orgId_fkey";

-- AlterTable
ALTER TABLE "Account" ALTER COLUMN "orgId" SET NOT NULL;

-- AlterTable
ALTER TABLE "Project" ALTER COLUMN "orgId" SET NOT NULL,
ALTER COLUMN "accountId" SET NOT NULL;

-- AlterTable
ALTER TABLE "User" ALTER COLUMN "email" SET NOT NULL;

-- AddForeignKey
ALTER TABLE "Account" ADD CONSTRAINT "Account_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Org"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
