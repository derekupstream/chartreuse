CREATE TABLE IF NOT EXISTS "AdminInsight" (
    "id"          UUID NOT NULL DEFAULT gen_random_uuid(),
    "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "content"     JSONB NOT NULL,
    "modelUsed"   TEXT NOT NULL DEFAULT 'claude-haiku-4-5-20251001',
    CONSTRAINT "AdminInsight_pkey" PRIMARY KEY ("id")
);
