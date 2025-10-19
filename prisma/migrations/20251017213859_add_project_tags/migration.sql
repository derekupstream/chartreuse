-- CreateTable
CREATE TABLE "ProjectTag" (
    "id" UUID NOT NULL,
    "label" TEXT NOT NULL,
    "index" INTEGER NOT NULL,
    "orgId" UUID NOT NULL,

    CONSTRAINT "ProjectTag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProjectTagRelation" (
    "projectId" UUID NOT NULL,
    "tagId" UUID NOT NULL,

    CONSTRAINT "ProjectTagRelation_pkey" PRIMARY KEY ("projectId","tagId")
);

-- AddForeignKey
ALTER TABLE "ProjectTag" ADD CONSTRAINT "ProjectTag_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Org"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectTagRelation" ADD CONSTRAINT "ProjectTagRelation_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectTagRelation" ADD CONSTRAINT "ProjectTagRelation_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES "ProjectTag"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
