-- CreateTable
CREATE TABLE "LaborCost" (
    "id" UUID NOT NULL,
    "categoryId" TEXT NOT NULL,
    "cost" INTEGER NOT NULL,
    "description" TEXT NOT NULL,
    "frequency" TEXT NOT NULL,
    "projectId" UUID NOT NULL,

    CONSTRAINT "LaborCost_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WasteHaulingCost" (
    "id" UUID NOT NULL,
    "monthlyCost" INTEGER NOT NULL,
    "wasteStream" TEXT NOT NULL,
    "serviceType" TEXT NOT NULL,
    "projectId" UUID NOT NULL,

    CONSTRAINT "WasteHaulingCost_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Dishwasher" (
    "id" UUID NOT NULL,
    "additionalRacksPerDay" INTEGER NOT NULL,
    "boosterWaterHeaterFuelType" TEXT NOT NULL,
    "buildingWaterHeaterFuelType" TEXT NOT NULL,
    "energyStarCertified" BOOLEAN NOT NULL,
    "operatingDays" INTEGER NOT NULL,
    "temperature" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "projectId" UUID NOT NULL,

    CONSTRAINT "Dishwasher_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "LaborCost" ADD CONSTRAINT "LaborCost_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WasteHaulingCost" ADD CONSTRAINT "WasteHaulingCost_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Dishwasher" ADD CONSTRAINT "Dishwasher_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;
