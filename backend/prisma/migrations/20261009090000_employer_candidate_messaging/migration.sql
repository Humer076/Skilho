-- Save candidates independently of job applications.
CREATE TABLE "SavedCandidate" (
    "id" TEXT NOT NULL,
    "employerProfileId" TEXT NOT NULL,
    "employeeProfileId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SavedCandidate_pkey" PRIMARY KEY ("id")
);

-- Tag candidates for specific jobs without requiring an application.
CREATE TABLE "JobCandidateTag" (
    "id" TEXT NOT NULL,
    "employerProfileId" TEXT NOT NULL,
    "jobId" TEXT NOT NULL,
    "employeeProfileId" TEXT NOT NULL,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "JobCandidateTag_pkey" PRIMARY KEY ("id")
);

-- One conversation per employer-technician pair.
CREATE TABLE "Conversation" (
    "id" TEXT NOT NULL,
    "employerProfileId" TEXT NOT NULL,
    "employeeProfileId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Conversation_pkey" PRIMARY KEY ("id")
);

-- Messages can be sent by either participant.
CREATE TABLE "Message" (
    "id" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "senderId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "readAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Message_pkey" PRIMARY KEY ("id")
);

-- Indexes and uniqueness constraints.
CREATE INDEX "SavedCandidate_employeeProfileId_idx"
ON "SavedCandidate"("employeeProfileId");

CREATE UNIQUE INDEX "SavedCandidate_employerProfileId_employeeProfileId_key"
ON "SavedCandidate"("employerProfileId", "employeeProfileId");

CREATE INDEX "JobCandidateTag_employerProfileId_idx"
ON "JobCandidateTag"("employerProfileId");

CREATE INDEX "JobCandidateTag_employeeProfileId_idx"
ON "JobCandidateTag"("employeeProfileId");

CREATE UNIQUE INDEX "JobCandidateTag_jobId_employeeProfileId_key"
ON "JobCandidateTag"("jobId", "employeeProfileId");

CREATE INDEX "Conversation_employeeProfileId_idx"
ON "Conversation"("employeeProfileId");

CREATE UNIQUE INDEX "Conversation_employerProfileId_employeeProfileId_key"
ON "Conversation"("employerProfileId", "employeeProfileId");

CREATE INDEX "Message_conversationId_createdAt_idx"
ON "Message"("conversationId", "createdAt");

CREATE INDEX "Message_senderId_idx"
ON "Message"("senderId");

-- Foreign keys.
ALTER TABLE "SavedCandidate"
ADD CONSTRAINT "SavedCandidate_employerProfileId_fkey"
FOREIGN KEY ("employerProfileId")
REFERENCES "EmployerProfile"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "SavedCandidate"
ADD CONSTRAINT "SavedCandidate_employeeProfileId_fkey"
FOREIGN KEY ("employeeProfileId")
REFERENCES "EmployeeProfile"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "JobCandidateTag"
ADD CONSTRAINT "JobCandidateTag_employerProfileId_fkey"
FOREIGN KEY ("employerProfileId")
REFERENCES "EmployerProfile"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "JobCandidateTag"
ADD CONSTRAINT "JobCandidateTag_jobId_fkey"
FOREIGN KEY ("jobId")
REFERENCES "Job"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "JobCandidateTag"
ADD CONSTRAINT "JobCandidateTag_employeeProfileId_fkey"
FOREIGN KEY ("employeeProfileId")
REFERENCES "EmployeeProfile"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Conversation"
ADD CONSTRAINT "Conversation_employerProfileId_fkey"
FOREIGN KEY ("employerProfileId")
REFERENCES "EmployerProfile"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Conversation"
ADD CONSTRAINT "Conversation_employeeProfileId_fkey"
FOREIGN KEY ("employeeProfileId")
REFERENCES "EmployeeProfile"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Message"
ADD CONSTRAINT "Message_conversationId_fkey"
FOREIGN KEY ("conversationId")
REFERENCES "Conversation"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Message"
ADD CONSTRAINT "Message_senderId_fkey"
FOREIGN KEY ("senderId")
REFERENCES "User"("id")
ON DELETE CASCADE ON UPDATE CASCADE;