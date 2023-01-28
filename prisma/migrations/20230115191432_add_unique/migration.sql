/*
  Warnings:

  - A unique constraint covering the columns `[singleUseLineItemId,entryDate]` on the table `SingleUseLineItemRecord` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "SingleUseLineItemRecord_singleUseLineItemId_entryDate_key" ON "SingleUseLineItemRecord"("singleUseLineItemId", "entryDate");
