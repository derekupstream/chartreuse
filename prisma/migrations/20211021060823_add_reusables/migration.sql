-- CreateTable
CREATE TABLE "ReusableLineItem" (
    "id" TEXT NOT NULL,
    "annualRepurchasePercentage" INTEGER NOT NULL,
    "caseCost" INTEGER NOT NULL,
    "casesPurchased" INTEGER NOT NULL,
    "categoryId" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,

    CONSTRAINT "ReusableLineItem_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "ReusableLineItem" ADD CONSTRAINT "ReusableLineItem_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;
