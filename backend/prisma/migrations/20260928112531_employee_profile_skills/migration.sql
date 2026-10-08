-- CreateEnum
CREATE TYPE "EmploymentStatus" AS ENUM ('EMPLOYED', 'UNEMPLOYED', 'STUDENT', 'FREELANCER');

-- CreateEnum
CREATE TYPE "SkillLevel" AS ENUM ('BEGINNER', 'BASIC', 'INTERMEDIATE', 'ADVANCED', 'EXPERT');

-- CreateTable
CREATE TABLE "EmployeeProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "fullName" TEXT,
    "professionalTitle" TEXT,
    "currentCity" TEXT,
    "currentState" TEXT,
    "totalExperienceMonths" INTEGER,
    "employmentStatus" "EmploymentStatus",
    "expectedSalary" INTEGER,
    "preferredLocation" TEXT,
    "noticePeriodDays" INTEGER,
    "immediateJoining" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EmployeeProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Skill" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Skill_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmployeeSkill" (
    "id" TEXT NOT NULL,
    "employeeProfileId" TEXT NOT NULL,
    "skillId" TEXT NOT NULL,
    "level" "SkillLevel" NOT NULL,

    CONSTRAINT "EmployeeSkill_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "EmployeeProfile_userId_key" ON "EmployeeProfile"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Skill_name_key" ON "Skill"("name");

-- CreateIndex
CREATE INDEX "EmployeeSkill_skillId_idx" ON "EmployeeSkill"("skillId");

-- CreateIndex
CREATE UNIQUE INDEX "EmployeeSkill_employeeProfileId_skillId_key" ON "EmployeeSkill"("employeeProfileId", "skillId");

-- AddForeignKey
ALTER TABLE "EmployeeProfile" ADD CONSTRAINT "EmployeeProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmployeeSkill" ADD CONSTRAINT "EmployeeSkill_employeeProfileId_fkey" FOREIGN KEY ("employeeProfileId") REFERENCES "EmployeeProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmployeeSkill" ADD CONSTRAINT "EmployeeSkill_skillId_fkey" FOREIGN KEY ("skillId") REFERENCES "Skill"("id") ON DELETE CASCADE ON UPDATE CASCADE;
