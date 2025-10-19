-- DropForeignKey
ALTER TABLE "ProjectTag" DROP CONSTRAINT "ProjectTag_orgId_fkey";

-- DropForeignKey
ALTER TABLE "ProjectTagRelation" DROP CONSTRAINT "ProjectTagRelation_projectId_fkey";

-- DropForeignKey
ALTER TABLE "ProjectTagRelation" DROP CONSTRAINT "ProjectTagRelation_tagId_fkey";

-- AddForeignKey
ALTER TABLE "ProjectTag" ADD CONSTRAINT "ProjectTag_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Org"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectTagRelation" ADD CONSTRAINT "ProjectTagRelation_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectTagRelation" ADD CONSTRAINT "ProjectTagRelation_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES "ProjectTag"("id") ON DELETE CASCADE ON UPDATE CASCADE;
