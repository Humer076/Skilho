-- CreateEnum
CREATE TYPE "CompanyDocumentType" AS ENUM ('REGISTRATION_CERTIFICATE', 'GST_CERTIFICATE', 'SHOP_ESTABLISHMENT_CERTIFICATE', 'BUSINESS_ADDRESS_PROOF', 'AUTHORIZED_PERSON_ID', 'OTHER');

-- CreateTable
CREATE TABLE "CompanyDocument" (
    "id" TEXT NOT NULL,
    "employerProfileId" TEXT NOT NULL,
    "type" "CompanyDocumentType" NOT NULL,
    "originalName" TEXT NOT NULL,
    "storedName" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CompanyDocument_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CompanyDocument_storedName_key" ON "CompanyDocument"("storedName");

-- CreateIndex
CREATE INDEX "CompanyDocument_employerProfileId_idx" ON "CompanyDocument"("employerProfileId");

-- AddForeignKey
ALTER TABLE "CompanyDocument" ADD CONSTRAINT "CompanyDocument_employerProfileId_fkey" FOREIGN KEY ("employerProfileId") REFERENCES "EmployerProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
