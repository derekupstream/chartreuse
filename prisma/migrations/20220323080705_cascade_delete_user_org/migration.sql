-- DropForeignKey
ALTER TABLE "Account" DROP CONSTRAINT "Account_orgId_fkey";

-- DropForeignKey
ALTER TABLE "User" DROP CONSTRAINT "User_orgId_fkey";

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Org"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Account" ADD CONSTRAINT "Account_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Org"("id") ON DELETE CASCADE ON UPDATE CASCADE;
