-- CreateTable
CREATE TABLE "SalesProject" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "niche" TEXT NOT NULL,
    "targetLocation" TEXT NOT NULL,
    "targetLeadCount" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'CREATED',
    "currentPhase" INTEGER NOT NULL DEFAULT 1,
    "discoveredCount" INTEGER NOT NULL DEFAULT 0,
    "qualifiedCount" INTEGER NOT NULL DEFAULT 0,
    "completedAt" DATETIME,
    "createdBy" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "SalesProject_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Persona" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "leadId" TEXT NOT NULL,
    "businessSummary" TEXT,
    "digitalPresence" TEXT,
    "decisionMakerName" TEXT,
    "decisionMakerTitle" TEXT,
    "decisionMakerStyle" TEXT,
    "painPoints" TEXT,
    "opportunities" TEXT,
    "competitors" TEXT,
    "challenges" TEXT,
    "toolsUsed" TEXT,
    "estimatedAge" TEXT,
    "demographics" TEXT,
    "rawAnalysis" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Persona_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Outreach" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "leadId" TEXT NOT NULL,
    "platform" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "subject" TEXT,
    "body" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "sentAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Outreach_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "PreCallBrief" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "leadId" TEXT NOT NULL,
    "headline" TEXT,
    "talkingPoints" TEXT,
    "recommendedServices" TEXT,
    "openingLines" TEXT,
    "qualificationQuestions" TEXT,
    "objectionHandlers" TEXT,
    "pricingGuidance" TEXT,
    "roiProjections" TEXT,
    "callScript" TEXT,
    "callNotes" TEXT,
    "callOutcome" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "PreCallBrief_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Lead" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "title" TEXT,
    "location" TEXT,
    "languages" TEXT,
    "score" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'NEW',
    "source" TEXT,
    "projectedValue" REAL,
    "probability" INTEGER NOT NULL DEFAULT 0,
    "nextAction" DATETIME,
    "summary" TEXT,
    "companyId" TEXT,
    "ghlContactId" TEXT,
    "assignedTo" TEXT,
    "salesProjectId" TEXT,
    "website" TEXT,
    "address" TEXT,
    "instagramHandle" TEXT,
    "linkedinUrl" TEXT,
    "facebookUrl" TEXT,
    "twitterHandle" TEXT,
    "googlePlaceId" TEXT,
    "googleRating" REAL,
    "googleReviewCount" INTEGER,
    "qualified" BOOLEAN NOT NULL DEFAULT false,
    "qualificationScore" INTEGER NOT NULL DEFAULT 0,
    "qualificationReason" TEXT,
    "recommendedServices" TEXT,
    "pipelinePhase" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Lead_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Lead_assignedTo_fkey" FOREIGN KEY ("assignedTo") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Lead_salesProjectId_fkey" FOREIGN KEY ("salesProjectId") REFERENCES "SalesProject" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Lead" ("assignedTo", "companyId", "createdAt", "email", "ghlContactId", "id", "languages", "location", "name", "nextAction", "phone", "probability", "projectedValue", "score", "source", "status", "summary", "title", "updatedAt") SELECT "assignedTo", "companyId", "createdAt", "email", "ghlContactId", "id", "languages", "location", "name", "nextAction", "phone", "probability", "projectedValue", "score", "source", "status", "summary", "title", "updatedAt" FROM "Lead";
DROP TABLE "Lead";
ALTER TABLE "new_Lead" RENAME TO "Lead";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "Persona_leadId_key" ON "Persona"("leadId");

-- CreateIndex
CREATE UNIQUE INDEX "PreCallBrief_leadId_key" ON "PreCallBrief"("leadId");
