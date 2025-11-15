-- AlterTable
ALTER TABLE "Org" ADD COLUMN "orgInviteCode" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Org_orgInviteCode_key" ON "Org"("orgInviteCode");

