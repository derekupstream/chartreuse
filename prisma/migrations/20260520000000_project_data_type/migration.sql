-- Project.dataType: projection vs actual (orthogonal to category).
-- Backfill: every event project is treated as an actual; everything else stays as projection.

CREATE TYPE "ProjectDataType" AS ENUM ('projection', 'actual');

ALTER TABLE "Project"
  ADD COLUMN "dataType" "ProjectDataType" NOT NULL DEFAULT 'projection';

UPDATE "Project" SET "dataType" = 'actual' WHERE category = 'event';
