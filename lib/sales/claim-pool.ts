// Lead claim-pool helpers.
//
// Leads are globally de-duplicated (one Lead per business, keyed by googlePlaceId →
// phone → name+zip). Each time an agent pulls a lead into a project, a LeadClaim row
// is written. Only one claim per Lead may be active (releasedAt IS NULL) at a time —
// enforced here in a transaction because SQLite doesn't support partial unique indexes.
//
// When 15 days pass with no agent activity (outreach sent, status changed, note added,
// etc.), the cooldown cron releases the claim and the lead flips back to the open pool.

import { db } from "@/lib/db";
import type { Prisma } from "@prisma/client";

export const COOLDOWN_DAYS = 15;

export type ReleaseReason = "COOLDOWN_EXPIRED" | "MANUAL_RELEASE" | "PROJECT_DELETED";

export interface LeadIdentity {
  googlePlaceId: string | null;
  phone: string | null;
  businessName: string;
  zip: string | null;
}

// Normalize phone to digits only for fallback matching.
function normalizePhone(phone: string | null): string | null {
  if (!phone) return null;
  const digits = phone.replace(/\D/g, "");
  return digits.length >= 7 ? digits : null;
}

// Extract a 5-digit ZIP from a freeform address or location string.
export function extractZip(text: string | null | undefined): string | null {
  if (!text) return null;
  const m = text.match(/\b(\d{5})(?:-\d{4})?\b/);
  return m ? m[1] : null;
}

// Find an existing Lead matching this identity. Strongest signal first.
export async function findExistingLead(identity: LeadIdentity): Promise<{ id: string; salesProjectId: string | null } | null> {
  if (identity.googlePlaceId) {
    const byPlace = await db.lead.findUnique({
      where: { googlePlaceId: identity.googlePlaceId },
      select: { id: true, salesProjectId: true },
    });
    if (byPlace) return byPlace;
  }

  const normalizedPhone = normalizePhone(identity.phone);
  if (normalizedPhone) {
    // Phone column may hold formatted numbers — compare loosely by fetching candidates
    // and matching normalized digits. The index on phone keeps this cheap.
    const candidates = await db.lead.findMany({
      where: { phone: { not: null } },
      select: { id: true, salesProjectId: true, phone: true },
      take: 50,
    });
    for (const c of candidates) {
      if (normalizePhone(c.phone) === normalizedPhone) {
        return { id: c.id, salesProjectId: c.salesProjectId };
      }
    }
  }

  if (identity.zip) {
    const nameLower = identity.businessName.trim().toLowerCase();
    const candidates = await db.lead.findMany({
      where: { name: { equals: identity.businessName } },
      select: { id: true, salesProjectId: true, name: true, address: true, location: true },
    });
    for (const c of candidates) {
      if (c.name.trim().toLowerCase() !== nameLower) continue;
      const candidateZip = extractZip(c.address) ?? extractZip(c.location);
      if (candidateZip === identity.zip) return { id: c.id, salesProjectId: c.salesProjectId };
    }
  }

  return null;
}

// Is this lead currently claimed (active LeadClaim)?
export async function hasActiveClaim(leadId: string): Promise<boolean> {
  const active = await db.leadClaim.findFirst({
    where: { leadId, releasedAt: null },
    select: { id: true },
  });
  return !!active;
}

// Claim an open-pool (or newly created) lead for a project. Idempotent: if the lead
// is already actively claimed by the same project, returns the existing claim.
// Throws if the lead is actively claimed by a *different* project — caller should
// have filtered via findExistingLead + hasActiveClaim first.
export async function claimLead(params: {
  leadId: string;
  projectId: string;
  projectName: string;
  userId: string;
  userName: string | null;
  tx?: Prisma.TransactionClient;
}) {
  const client = params.tx ?? db;

  const active = await client.leadClaim.findFirst({
    where: { leadId: params.leadId, releasedAt: null },
    select: { id: true, projectId: true },
  });

  if (active) {
    if (active.projectId === params.projectId) return active.id;
    throw new Error(`Lead ${params.leadId} is already claimed by project ${active.projectId}`);
  }

  const claim = await client.leadClaim.create({
    data: {
      leadId: params.leadId,
      projectId: params.projectId,
      projectNameSnapshot: params.projectName,
      claimedByUserId: params.userId,
      claimedByNameSnapshot: params.userName,
    },
    select: { id: true },
  });

  await client.lead.update({
    where: { id: params.leadId },
    data: { salesProjectId: params.projectId, assignedTo: params.userId },
  });

  return claim.id;
}

// Release a specific claim (e.g. admin deleting a project, cooldown cron, manual release).
// Updates the Lead's denormalized pointers when releasing the active claim.
export async function releaseClaim(params: {
  claimId: string;
  reason: ReleaseReason;
  tx?: Prisma.TransactionClient;
}) {
  const client = params.tx ?? db;
  const claim = await client.leadClaim.findUnique({
    where: { id: params.claimId },
    select: { id: true, leadId: true, releasedAt: true },
  });
  if (!claim || claim.releasedAt) return;

  await client.leadClaim.update({
    where: { id: params.claimId },
    data: { releasedAt: new Date(), releaseReason: params.reason },
  });

  await client.lead.update({
    where: { id: claim.leadId },
    data: { salesProjectId: null, assignedTo: null },
  });
}

// Bump the active claim's lastActivityAt. Called from outreach-send, status change,
// note-create, call-outcome save. No-op if the lead has no active claim (open pool).
export async function recordLeadActivity(leadId: string, tx?: Prisma.TransactionClient) {
  const client = tx ?? db;
  await client.leadClaim.updateMany({
    where: { leadId, releasedAt: null },
    data: { lastActivityAt: new Date() },
  });
}
