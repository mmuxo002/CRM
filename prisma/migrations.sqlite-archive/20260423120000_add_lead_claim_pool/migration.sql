-- Add claim-pool model and start clean on Lead data.
-- All previously discovered Leads (and their Personas / Outreaches / PreCallBriefs / Notes / Activities /
-- Proposals / IntroOffers) are removed. Existing SalesProjects are kept but reset to CREATED so agents
-- can re-kick them off against the new global dedup + cooldown pool.

-- Wipe Lead rows. ON DELETE CASCADE on dependents handles Persona, Outreach, PreCallBrief,
-- Proposal, IntroOffer, Activity, Note. Commission.leadId is SET NULL.
DELETE FROM "Lead";

-- Reset sales projects back to the kickoff state.
UPDATE "SalesProject"
SET    "status"          = 'CREATED',
       "currentPhase"    = 1,
       "discoveredCount" = 0,
       "qualifiedCount"  = 0,
       "completedAt"     = NULL;

-- Add `niche` snapshot column (matches open-pool queries without joining back to SalesProject).
ALTER TABLE "Lead" ADD COLUMN "niche" TEXT;

-- CreateTable
CREATE TABLE "LeadClaim" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "leadId" TEXT NOT NULL,
    "projectId" TEXT,
    "projectNameSnapshot" TEXT NOT NULL,
    "claimedByUserId" TEXT,
    "claimedByNameSnapshot" TEXT,
    "claimedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "releasedAt" DATETIME,
    "releaseReason" TEXT,
    "lastActivityAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "LeadClaim_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "LeadClaim_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "SalesProject" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "LeadClaim_claimedByUserId_fkey" FOREIGN KEY ("claimedByUserId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE INDEX "LeadClaim_leadId_releasedAt_idx" ON "LeadClaim"("leadId", "releasedAt");
CREATE INDEX "LeadClaim_projectId_idx" ON "LeadClaim"("projectId");
CREATE INDEX "LeadClaim_releasedAt_lastActivityAt_idx" ON "LeadClaim"("releasedAt", "lastActivityAt");

-- Global dedup: at most one Lead per Google Place.
-- SQLite treats NULLs as distinct in UNIQUE indexes, so multiple unknown placeIds are fine.
CREATE UNIQUE INDEX "Lead_googlePlaceId_key" ON "Lead"("googlePlaceId");

-- Faster lookup during discover-time dedup fallback.
CREATE INDEX "Lead_phone_idx" ON "Lead"("phone");
