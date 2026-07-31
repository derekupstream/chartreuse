-- Group smart fields so they can be filtered by what they measure.
ALTER TABLE "SmartField" ADD COLUMN "category" TEXT NOT NULL DEFAULT 'Other';
