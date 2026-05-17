-- CreateTable
CREATE TABLE "WorkSession" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "dateCST" TEXT NOT NULL,
    "startedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endedAt" DATETIME,
    "endReason" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "lastActivityAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "totalWorkMs" INTEGER NOT NULL DEFAULT 0,
    "totalBreakMs" INTEGER NOT NULL DEFAULT 0,
    "breakCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "WorkSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "SessionInterval" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sessionId" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "source" TEXT NOT NULL DEFAULT 'SYSTEM',
    "startedAt" DATETIME NOT NULL,
    "endedAt" DATETIME,
    "note" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SessionInterval_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "WorkSession" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ServicePricing" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "serviceType" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "onboardingFee" REAL NOT NULL DEFAULT 0,
    "monthlyFee" REAL NOT NULL DEFAULT 0,
    "cost" REAL NOT NULL DEFAULT 0,
    "effectiveFrom" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "effectiveTo" DATETIME,
    "updatedById" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ServicePricing_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "CommissionRate" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "rate" REAL NOT NULL DEFAULT 0.20,
    "basis" TEXT NOT NULL DEFAULT 'ONBOARDING',
    "note" TEXT,
    "effectiveFrom" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "effectiveTo" DATETIME,
    "updatedById" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CommissionRate_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Commission" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "contactId" TEXT,
    "leadId" TEXT,
    "projectId" TEXT,
    "serviceType" TEXT,
    "source" TEXT,
    "onboardingAmount" REAL NOT NULL,
    "rate" REAL NOT NULL,
    "commissionAmount" REAL NOT NULL,
    "earnedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dateCST" TEXT NOT NULL,
    "weekOfCST" TEXT NOT NULL,
    "monthOfCST" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "paidAt" DATETIME,
    "notes" TEXT,
    "createdById" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Commission_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Commission_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "Contact" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Commission_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Commission_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Commission_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Project" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "teamId" TEXT NOT NULL DEFAULT 'GLOBAL',
    "stage" TEXT NOT NULL DEFAULT 'SALES',
    "priority" TEXT NOT NULL DEFAULT 'MEDIUM',
    "categoryTag" TEXT,
    "serviceType" TEXT,
    "crmStage" TEXT NOT NULL DEFAULT 'ONBOARDED',
    "onboarded" BOOLEAN NOT NULL DEFAULT false,
    "onboardedAt" DATETIME,
    "mrr" REAL NOT NULL DEFAULT 0,
    "onboardingFee" REAL NOT NULL DEFAULT 0,
    "progress" INTEGER NOT NULL DEFAULT 0,
    "dueDate" DATETIME,
    "ownerId" TEXT,
    "projectManagerId" TEXT,
    "prd" TEXT,
    "companyId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Project_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Project_projectManagerId_fkey" FOREIGN KEY ("projectManagerId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Project_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Project" ("categoryTag", "companyId", "createdAt", "crmStage", "description", "dueDate", "id", "mrr", "name", "onboarded", "onboardedAt", "ownerId", "prd", "priority", "progress", "projectManagerId", "serviceType", "stage", "teamId", "updatedAt") SELECT "categoryTag", "companyId", "createdAt", "crmStage", "description", "dueDate", "id", "mrr", "name", "onboarded", "onboardedAt", "ownerId", "prd", "priority", "progress", "projectManagerId", "serviceType", "stage", "teamId", "updatedAt" FROM "Project";
DROP TABLE "Project";
ALTER TABLE "new_Project" RENAME TO "Project";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "WorkSession_dateCST_idx" ON "WorkSession"("dateCST");

-- CreateIndex
CREATE INDEX "WorkSession_userId_startedAt_idx" ON "WorkSession"("userId", "startedAt");

-- CreateIndex
CREATE UNIQUE INDEX "WorkSession_userId_dateCST_key" ON "WorkSession"("userId", "dateCST");

-- CreateIndex
CREATE INDEX "SessionInterval_sessionId_startedAt_idx" ON "SessionInterval"("sessionId", "startedAt");

-- CreateIndex
CREATE INDEX "ServicePricing_serviceType_effectiveFrom_idx" ON "ServicePricing"("serviceType", "effectiveFrom");

-- CreateIndex
CREATE INDEX "CommissionRate_effectiveFrom_idx" ON "CommissionRate"("effectiveFrom");

-- CreateIndex
CREATE INDEX "Commission_userId_earnedAt_idx" ON "Commission"("userId", "earnedAt");

-- CreateIndex
CREATE INDEX "Commission_weekOfCST_idx" ON "Commission"("weekOfCST");

-- CreateIndex
CREATE INDEX "Commission_monthOfCST_idx" ON "Commission"("monthOfCST");

-- CreateIndex
CREATE INDEX "Commission_status_idx" ON "Commission"("status");
