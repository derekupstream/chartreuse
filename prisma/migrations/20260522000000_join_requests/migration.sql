-- CreateEnum: JoinRequestStatus
CREATE TYPE "JoinRequestStatus" AS ENUM ('pending', 'approved', 'declined');

-- AlterEnum: add MEMBER role
ALTER TYPE "Role" ADD VALUE 'MEMBER';

-- CreateTable: JoinRequest
CREATE TABLE "JoinRequest" (
    "id" UUID NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "message" TEXT,
    "orgId" UUID NOT NULL,
    "status" "JoinRequestStatus" NOT NULL DEFAULT 'pending',
    "decidedAt" TIMESTAMP(3),
    "decidedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "JoinRequest_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "JoinRequest_orgId_status_idx" ON "JoinRequest"("orgId", "status");
CREATE UNIQUE INDEX "JoinRequest_email_orgId_key" ON "JoinRequest"("email", "orgId");

ALTER TABLE "JoinRequest" ADD CONSTRAINT "JoinRequest_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Org"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "JoinRequest" ADD CONSTRAINT "JoinRequest_decidedById_fkey" FOREIGN KEY ("decidedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
