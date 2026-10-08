/*
  Warnings:

  - A unique constraint covering the columns `[photoStoredName]` on the table `EmployeeProfile` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "EmployeeProfile" ADD COLUMN     "photoMimeType" TEXT,
ADD COLUMN     "photoStoredName" TEXT,
ADD COLUMN     "shareContactDetails" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "verified" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "visibleToEmployers" BOOLEAN NOT NULL DEFAULT true;

-- CreateIndex
CREATE UNIQUE INDEX "EmployeeProfile_photoStoredName_key" ON "EmployeeProfile"("photoStoredName");
