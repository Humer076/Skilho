ALTER TYPE "NotificationType" ADD VALUE 'SYSTEM';
ALTER TYPE "NotificationType" ADD VALUE 'JOB';
ALTER TYPE "NotificationType" ADD VALUE 'APPLICATION';
ALTER TYPE "NotificationType" ADD VALUE 'VERIFICATION';
ALTER TYPE "NotificationType" ADD VALUE 'MESSAGE';

ALTER TABLE "User"
  ADD COLUMN "displayName" TEXT,
  ADD COLUMN "adminStatus" TEXT NOT NULL DEFAULT 'ACTIVE',
  ADD COLUMN "adminAccess" TEXT NOT NULL DEFAULT 'SUPER_ADMIN';

ALTER TABLE "Notification" ADD COLUMN "title" TEXT;

CREATE TABLE "SiteArticle" (
  "id" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "excerpt" TEXT,
  "content" TEXT NOT NULL,
  "featuredImage" TEXT,
  "category" TEXT NOT NULL DEFAULT 'Industry',
  "tags" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "status" TEXT NOT NULL DEFAULT 'DRAFT',
  "isFeatured" BOOLEAN NOT NULL DEFAULT false,
  "publishedAt" TIMESTAMP(3),
  "scheduledAt" TIMESTAMP(3),
  "seoTitle" TEXT,
  "metaDescription" TEXT,
  "seoKeywords" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "canonicalUrl" TEXT,
  "ogTitle" TEXT,
  "ogDescription" TEXT,
  "ogImage" TEXT,
  "authorId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "SiteArticle_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AdminAuditLog" (
  "id" TEXT NOT NULL,
  "action" TEXT NOT NULL,
  "entityType" TEXT NOT NULL,
  "entityId" TEXT,
  "summary" TEXT NOT NULL,
  "metadata" JSONB,
  "ipAddress" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "actorId" TEXT,
  CONSTRAINT "AdminAuditLog_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "SiteArticle_slug_key" ON "SiteArticle"("slug");
CREATE INDEX "SiteArticle_status_category_idx" ON "SiteArticle"("status", "category");
CREATE INDEX "SiteArticle_publishedAt_idx" ON "SiteArticle"("publishedAt");
CREATE INDEX "AdminAuditLog_action_entityType_idx" ON "AdminAuditLog"("action", "entityType");
CREATE INDEX "AdminAuditLog_createdAt_idx" ON "AdminAuditLog"("createdAt");
CREATE INDEX "AdminAuditLog_actorId_idx" ON "AdminAuditLog"("actorId");

ALTER TABLE "SiteArticle" ADD CONSTRAINT "SiteArticle_authorId_fkey"
  FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "AdminAuditLog" ADD CONSTRAINT "AdminAuditLog_actorId_fkey"
  FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
