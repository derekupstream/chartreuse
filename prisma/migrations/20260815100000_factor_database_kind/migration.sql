-- 'factors' tables carry the data version: changing them bumps it.
-- 'reference' tables (product directories) grow without a version change.
ALTER TABLE "FactorDatabase" ADD COLUMN "kind" TEXT NOT NULL DEFAULT 'reference';
