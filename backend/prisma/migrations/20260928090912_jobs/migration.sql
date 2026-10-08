-- CreateEnum
CREATE TYPE "JobStatus" AS ENUM ('DRAFT', 'ACTIVE', 'CLOSED');

-- CreateEnum
CREATE TYPE "ExperienceLevel" AS ENUM ('FRESHER', 'Y0_1', 'Y1_3', 'Y3_5', 'Y5_10', 'Y10_PLUS');

-- CreateEnum
CREATE TYPE "JoiningPreference" AS ENUM ('IMMEDIATE', 'WITHIN_7_DAYS', 'WITHIN_15_DAYS', 'WITHIN_30_DAYS', 'NOTICE_PERIOD_FLEXIBLE');

-- CreateEnum
CREATE TYPE "WorkType" AS ENUM ('FULL_TIME', 'PART_TIME', 'CONTRACT', 'INTERNSHIP');

-- AlterTable
ALTER TABLE "VerificationEvent" ALTER COLUMN "adminId" DROP NOT NULL;

-- CreateTable
CREATE TABLE "Job" (
    "id" TEXT NOT NULL,
    "employerProfileId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "vacancies" INTEGER NOT NULL DEFAULT 1,
    "specializations" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "experience" "ExperienceLevel" NOT NULL,
    "salaryMin" INTEGER,
    "salaryMax" INTEGER,
    "salaryNegotiable" BOOLEAN NOT NULL DEFAULT false,
    "city" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "workType" "WorkType" NOT NULL,
    "joiningPreference" "JoiningPreference" NOT NULL,
    "workingHours" TEXT,
    "weeklyHolidays" TEXT,
    "accommodationProvided" BOOLEAN NOT NULL DEFAULT false,
    "foodProvided" BOOLEAN NOT NULL DEFAULT false,
    "travelAllowance" BOOLEAN NOT NULL DEFAULT false,
    "overtimeAvailable" BOOLEAN NOT NULL DEFAULT false,
    "requiredCertificates" TEXT,
    "interviewProcess" TEXT,
    "status" "JobStatus" NOT NULL DEFAULT 'DRAFT',
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Job_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Job_employerProfileId_idx" ON "Job"("employerProfileId");

-- CreateIndex
CREATE INDEX "Job_status_idx" ON "Job"("status");

-- AddForeignKey
ALTER TABLE "Job" ADD CONSTRAINT "Job_employerProfileId_fkey" FOREIGN KEY ("employerProfileId") REFERENCES "EmployerProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
