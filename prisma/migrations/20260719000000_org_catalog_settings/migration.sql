-- Curated product catalog per org: { reusableProductIds?: string[], singleUseProductIds?: string[] }
-- Null/empty = full catalog.
ALTER TABLE "Org" ADD COLUMN "catalogSettings" JSONB;
