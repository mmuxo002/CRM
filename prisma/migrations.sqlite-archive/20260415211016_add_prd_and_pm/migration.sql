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
    "mrr" REAL NOT NULL DEFAULT 0,
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
INSERT INTO "new_Project" ("categoryTag", "companyId", "createdAt", "crmStage", "description", "dueDate", "id", "mrr", "name", "onboarded", "ownerId", "priority", "progress", "serviceType", "stage", "teamId", "updatedAt") SELECT "categoryTag", "companyId", "createdAt", "crmStage", "description", "dueDate", "id", "mrr", "name", "onboarded", "ownerId", "priority", "progress", "serviceType", "stage", "teamId", "updatedAt" FROM "Project";
DROP TABLE "Project";
ALTER TABLE "new_Project" RENAME TO "Project";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
