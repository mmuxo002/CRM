-- CreateTable
CREATE TABLE "IntroOffer" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "token" TEXT NOT NULL,
    "leadId" TEXT NOT NULL,
    "sentByUserId" TEXT NOT NULL,
    "sentAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" DATETIME NOT NULL,
    "schedulingLink" TEXT NOT NULL,
    "sentToEmail" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "openedAt" DATETIME,
    "redeemedAt" DATETIME,
    "emailMessageId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "IntroOffer_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "IntroOffer_sentByUserId_fkey" FOREIGN KEY ("sentByUserId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "IntroOffer_token_key" ON "IntroOffer"("token");

-- CreateIndex
CREATE INDEX "IntroOffer_leadId_idx" ON "IntroOffer"("leadId");

-- CreateIndex
CREATE INDEX "IntroOffer_status_idx" ON "IntroOffer"("status");
