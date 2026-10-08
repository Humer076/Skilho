-- CreateEnum
CREATE TYPE "Role" AS ENUM ('EMPLOYER', 'EMPLOYEE', 'ADMIN');

-- CreateEnum
CREATE TYPE "VerificationStatus" AS ENUM ('REGISTRATION_SUBMITTED', 'PENDING_VERIFICATION', 'UNDER_REVIEW', 'APPROVED', 'REJECTED', 'SUSPENDED');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT,
    "mobile" TEXT,
    "passwordHash" TEXT NOT NULL,
    "role" "Role" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmployerProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "companyName" TEXT NOT NULL,
    "legalName" TEXT,
    "gstNumber" TEXT,
    "city" TEXT,
    "state" TEXT,
    "verificationStatus" "VerificationStatus" NOT NULL DEFAULT 'PENDING_VERIFICATION',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EmployerProfile_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_mobile_key" ON "User"("mobile");

-- CreateIndex
CREATE UNIQUE INDEX "EmployerProfile_userId_key" ON "EmployerProfile"("userId");

-- AddForeignKey
ALTER TABLE "EmployerProfile" ADD CONSTRAINT "EmployerProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
