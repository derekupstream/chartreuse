-- AlterTable
ALTER TABLE "Project" ADD COLUMN     "templateId" UUID;

-- AddForeignKey
ALTER TABLE "Project" ADD CONSTRAINT "Project_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "Project"("id") ON DELETE SET NULL ON UPDATE CASCADE;
