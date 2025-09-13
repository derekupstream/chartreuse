-- AlterTable
ALTER TABLE "Project" ADD COLUMN     "recommendations" JSONB,
ADD COLUMN     "showRecommendations" BOOLEAN NOT NULL DEFAULT false;
