-- CreateTable
CREATE TABLE "SingleUseProduct" (
    "id" TEXT NOT NULL,
    "caseCost" INTEGER NOT NULL,
    "casesPurchased" INTEGER NOT NULL,
    "frequency" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "newCaseCost" INTEGER NOT NULL,
    "newCasesPurchased" INTEGER NOT NULL,
    "projectId" TEXT,

    PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "SingleUseProduct" ADD FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;
