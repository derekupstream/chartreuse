-- Change requests can reference a 2.0 database cell and the page where the issue was seen
ALTER TABLE "ChangeRequest" ADD COLUMN "databaseId" UUID;
ALTER TABLE "ChangeRequest" ADD COLUMN "columnKey" TEXT;
ALTER TABLE "ChangeRequest" ADD COLUMN "rowKey" TEXT;
ALTER TABLE "ChangeRequest" ADD COLUMN "contextUrl" TEXT;
