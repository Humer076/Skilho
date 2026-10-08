-- CreateEnum
CREATE TYPE "ApplicationStatus" AS ENUM ('APPLIED', 'UNDER_REVIEW', 'SHORTLISTED', 'INTERVIEW_SCHEDULED', 'SELECTED', 'REJECTED', 'WITHDRAWN', 'HIRED');

-- CreateTable
CREATE TABLE "JobApplication" (
    "id" TEXT NOT NULL,
    "jobId" TEXT NOT NULL,
    "employeeProfileId" TEXT NOT NULL,
    "status" "ApplicationStatus" NOT NULL DEFAULT 'APPLIED',
    "coverNote" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "JobApplication_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SavedJob" (
    "id" TEXT NOT NULL,
    "jobId" TEXT NOT NULL,
    "employeeProfileId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SavedJob_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "JobApplication_jobId_idx" ON "JobApplication"("jobId");

-- CreateIndex
CREATE INDEX "JobApplication_employeeProfileId_idx" ON "JobApplication"("employeeProfileId");

-- CreateIndex
CREATE UNIQUE INDEX "JobApplication_jobId_employeeProfileId_key" ON "JobApplication"("jobId", "employeeProfileId");

-- CreateIndex
CREATE INDEX "SavedJob_employeeProfileId_idx" ON "SavedJob"("employeeProfileId");

-- CreateIndex
CREATE UNIQUE INDEX "SavedJob_jobId_employeeProfileId_key" ON "SavedJob"("jobId", "employeeProfileId");

-- AddForeignKey
ALTER TABLE "JobApplication" ADD CONSTRAINT "JobApplication_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "Job"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JobApplication" ADD CONSTRAINT "JobApplication_employeeProfileId_fkey" FOREIGN KEY ("employeeProfileId") REFERENCES "EmployeeProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SavedJob" ADD CONSTRAINT "SavedJob_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "Job"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SavedJob" ADD CONSTRAINT "SavedJob_employeeProfileId_fkey" FOREIGN KEY ("employeeProfileId") REFERENCES "EmployeeProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
