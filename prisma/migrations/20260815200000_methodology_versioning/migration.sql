-- Snapshots capture the database versions they were cut from; projects pin the
-- methodology their numbers were computed under.
ALTER TABLE "MethodologySnapshot" ADD COLUMN "databaseVersionsJson" JSONB;
ALTER TABLE "Project" ADD COLUMN "methodologyVersion" TEXT NOT NULL DEFAULT '1.0';
