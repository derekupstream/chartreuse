-- CreateEnum
CREATE TYPE "UserEventType" AS ENUM ('completed_first_project');

-- CreateTable
CREATE TABLE "UserEvent" (
    "id" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "type" "UserEventType" NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "UserEvent_pkey" PRIMARY KEY ("id")
);
