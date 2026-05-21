-- Feature voting: list of requested features users can upvote from /dashboard.

CREATE TABLE "FeatureRequest" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "title" TEXT NOT NULL,
  "description" TEXT,
  "status" TEXT NOT NULL DEFAULT 'open',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "createdByUserId" TEXT,
  CONSTRAINT "FeatureRequest_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "FeatureRequest_status_createdAt_idx" ON "FeatureRequest"("status", "createdAt");

CREATE TABLE "FeatureVote" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "userId" TEXT NOT NULL,
  "featureRequestId" UUID NOT NULL,
  CONSTRAINT "FeatureVote_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "FeatureVote_featureRequestId_fkey" FOREIGN KEY ("featureRequestId")
    REFERENCES "FeatureRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "FeatureVote_featureRequestId_userId_key" ON "FeatureVote"("featureRequestId", "userId");
CREATE INDEX "FeatureVote_userId_idx" ON "FeatureVote"("userId");

-- Seed a few starter items so the widget doesn't open empty.
INSERT INTO "FeatureRequest" ("title", "description", "status") VALUES
  ('Drag-to-reorder dashboard widgets', 'Let users rearrange the Analytics widgets directly instead of just toggling visibility.', 'open'),
  ('Compare actuals vs projections', 'Once an actual project shipped, automatically link it back to its projection and show the delta.', 'open'),
  ('Public scenario sharing', 'Generate a public link for a saved scenario so policymakers can see it without an account.', 'open'),
  ('AI-suggested reusables', 'When entering single-use items, suggest matching reusable replacements with vendor links and lifetime data.', 'planned');
