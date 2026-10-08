-- CreateEnum
CREATE TYPE "CareerStage" AS ENUM ('STUDENT', 'JUNIOR_TECHNICIAN', 'EXPERIENCED_TECHNICIAN');

-- CreateEnum
CREATE TYPE "CareerEmploymentType" AS ENUM ('TRAINING', 'INTERNSHIP', 'APPRENTICESHIP', 'FULL_TIME', 'PART_TIME', 'CONTRACT', 'FREELANCE');

-- CreateTable
CREATE TABLE "CareerEntry" (
    "id" TEXT NOT NULL,
    "employeeProfileId" TEXT NOT NULL,
    "organization" TEXT NOT NULL,
    "position" TEXT NOT NULL,
    "stage" "CareerStage" NOT NULL,
    "employmentType" "CareerEmploymentType" NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3),
    "location" TEXT,
    "skills" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "responsibilities" TEXT,
    "certificateObtained" TEXT,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CareerEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Education" (
    "id" TEXT NOT NULL,
    "employeeProfileId" TEXT NOT NULL,
    "institution" TEXT NOT NULL,
    "qualification" TEXT NOT NULL,
    "fieldOfStudy" TEXT,
    "startYear" INTEGER,
    "endYear" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Education_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Certificate" (
    "id" TEXT NOT NULL,
    "employeeProfileId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "issuer" TEXT,
    "issuedYear" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Certificate_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CareerEntry_employeeProfileId_idx" ON "CareerEntry"("employeeProfileId");

-- CreateIndex
CREATE INDEX "Education_employeeProfileId_idx" ON "Education"("employeeProfileId");

-- CreateIndex
CREATE INDEX "Certificate_employeeProfileId_idx" ON "Certificate"("employeeProfileId");

-- AddForeignKey
ALTER TABLE "CareerEntry" ADD CONSTRAINT "CareerEntry_employeeProfileId_fkey" FOREIGN KEY ("employeeProfileId") REFERENCES "EmployeeProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Education" ADD CONSTRAINT "Education_employeeProfileId_fkey" FOREIGN KEY ("employeeProfileId") REFERENCES "EmployeeProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Certificate" ADD CONSTRAINT "Certificate_employeeProfileId_fkey" FOREIGN KEY ("employeeProfileId") REFERENCES "EmployeeProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
