-- Add personal fields to EmployeeProfile
ALTER TABLE "EmployeeProfile"
ADD COLUMN "bio" TEXT,
ADD COLUMN "dateOfBirth" TEXT,
ADD COLUMN "gender" TEXT;

-- Recreate the already-existing PendingEmployeeRegistration table
CREATE TABLE "PendingEmployeeRegistration" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "mobile" TEXT,
    "passwordHash" TEXT NOT NULL,
    "displayName" TEXT,
    "otpHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "requestsToday" INTEGER NOT NULL DEFAULT 1,
    "requestDay" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PendingEmployeeRegistration_pkey" PRIMARY KEY ("id")
);

-- Indexes
CREATE UNIQUE INDEX "PendingEmployeeRegistration_email_key"
ON "PendingEmployeeRegistration"("email");

CREATE INDEX "PendingEmployeeRegistration_expiresAt_idx"
ON "PendingEmployeeRegistration"("expiresAt");

CREATE UNIQUE INDEX "PendingEmployeeRegistration_mobile_key"
ON "PendingEmployeeRegistration"("mobile");