-- CreateEnum
CREATE TYPE "VerificationAction" AS ENUM ('STATUS_CHANGE', 'NOTE', 'DOCUMENT_REQUEST');

-- CreateTable
CREATE TABLE "VerificationEvent" (
    "id" TEXT NOT NULL,
    "employerProfileId" TEXT NOT NULL,
    "adminId" TEXT NOT NULL,
    "action" "VerificationAction" NOT NULL,
    "fromStatus" "VerificationStatus",
    "toStatus" "VerificationStatus",
    "note" TEXT,
    "visibleToEmployer" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VerificationEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "VerificationEvent_employerProfileId_idx" ON "VerificationEvent"("employerProfileId");

-- AddForeignKey
ALTER TABLE "VerificationEvent" ADD CONSTRAINT "VerificationEvent_employerProfileId_fkey" FOREIGN KEY ("employerProfileId") REFERENCES "EmployerProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
