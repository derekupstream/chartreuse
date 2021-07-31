-- DropForeignKey
ALTER TABLE "Invite" DROP CONSTRAINT "Invite_sentByUserId_fkey";

-- AddForeignKey
ALTER TABLE "Invite" ADD FOREIGN KEY ("sentByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
