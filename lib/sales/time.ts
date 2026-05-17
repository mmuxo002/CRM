import { db } from "@/lib/db";
import { cstDateKey, cstMidnightAfter } from "./cst";
import type { WorkSession, SessionInterval } from "@prisma/client";

export const INACTIVITY_MS = 30 * 60 * 1000; // 30 minutes

export type SessionState = {
  session: WorkSession & { intervals: SessionInterval[] };
  totals: { workMs: number; breakMs: number; breakCount: number };
  openInterval: SessionInterval | null;
};

function sumByKind(intervals: SessionInterval[], kind: "WORK" | "BREAK", upTo: Date): number {
  return intervals
    .filter((i) => i.kind === kind)
    .reduce((total, i) => {
      const end = i.endedAt ?? upTo;
      return total + Math.max(0, end.getTime() - i.startedAt.getTime());
    }, 0);
}

export function computeState(session: WorkSession & { intervals: SessionInterval[] }, now: Date = new Date()): SessionState {
  const openInterval = session.intervals.find((i) => !i.endedAt) ?? null;
  const cap = session.endedAt ?? now;
  return {
    session,
    totals: {
      workMs: sumByKind(session.intervals, "WORK", cap),
      breakMs: sumByKind(session.intervals, "BREAK", cap),
      breakCount: session.intervals.filter((i) => i.kind === "BREAK").length,
    },
    openInterval,
  };
}

async function closeOpenIntervals(sessionId: string, endedAt: Date, tx: typeof db = db) {
  await tx.sessionInterval.updateMany({
    where: { sessionId, endedAt: null },
    data: { endedAt },
  });
}

export async function endSession(
  sessionId: string,
  endedAt: Date,
  reason: "MANUAL_END" | "AUTO_MIDNIGHT" | "AUTO_INACTIVE_EOD",
  tx: typeof db = db,
) {
  await closeOpenIntervals(sessionId, endedAt, tx);
  const intervals = await tx.sessionInterval.findMany({ where: { sessionId } });
  const workMs = sumByKind(intervals, "WORK", endedAt);
  const breakMs = sumByKind(intervals, "BREAK", endedAt);
  const breakCount = intervals.filter((i) => i.kind === "BREAK").length;
  return tx.workSession.update({
    where: { id: sessionId },
    data: { status: "ENDED", endedAt, endReason: reason, totalWorkMs: workMs, totalBreakMs: breakMs, breakCount },
    include: { intervals: { orderBy: { startedAt: "asc" } } },
  });
}

// Close any stale sessions (prior-day or >24h old) for a user. Call before
// creating a new day's session.
async function closeStaleSessions(userId: string, todayCST: string) {
  const stale = await db.workSession.findMany({
    where: { userId, status: { not: "ENDED" }, dateCST: { not: todayCST } },
  });
  for (const s of stale) {
    const cutoff = cstMidnightAfter(s.dateCST);
    await endSession(s.id, cutoff, "AUTO_MIDNIGHT");
  }
}

export async function getOrStartTodaysSession(userId: string, now: Date = new Date()) {
  const todayCST = cstDateKey(now);
  await closeStaleSessions(userId, todayCST);

  const existing = await db.workSession.findUnique({
    where: { userId_dateCST: { userId, dateCST: todayCST } },
    include: { intervals: { orderBy: { startedAt: "asc" } } },
  });
  if (existing) return { session: existing, created: false as const };

  const session = await db.workSession.create({
    data: {
      userId,
      dateCST: todayCST,
      startedAt: now,
      lastActivityAt: now,
      status: "ACTIVE",
      intervals: { create: [{ kind: "WORK", source: "SYSTEM", startedAt: now }] },
    },
    include: { intervals: { orderBy: { startedAt: "asc" } } },
  });
  return { session, created: true as const };
}

// Called on every heartbeat. Detects midnight rollover and 30-min inactivity.
// Returns:
//  - { kind: "signOut", reason } when the session has rolled past midnight
//      (client should signOut and force re-login so the new-day rule applies)
//  - { kind: "state", state } otherwise
export async function tickHeartbeat(userId: string, now: Date = new Date()) {
  const todayCST = cstDateKey(now);
  let active = await db.workSession.findFirst({
    where: { userId, status: { not: "ENDED" } },
    include: { intervals: { orderBy: { startedAt: "asc" } } },
    orderBy: { startedAt: "desc" },
  });

  if (active && active.dateCST !== todayCST) {
    const cutoff = cstMidnightAfter(active.dateCST);
    await endSession(active.id, cutoff, "AUTO_MIDNIGHT");
    return { kind: "signOut" as const, reason: "new_day" as const };
  }

  if (!active) return { kind: "needsStart" as const };

  const gapMs = now.getTime() - active.lastActivityAt.getTime();
  if (active.status === "ACTIVE" && gapMs > INACTIVITY_MS) {
    const inactiveFrom = new Date(active.lastActivityAt.getTime() + INACTIVITY_MS);
    await db.sessionInterval.updateMany({
      where: { sessionId: active.id, kind: "WORK", endedAt: null },
      data: { endedAt: inactiveFrom },
    });
    await db.sessionInterval.create({
      data: { sessionId: active.id, kind: "BREAK", source: "SYSTEM", startedAt: inactiveFrom },
    });
    active = await db.workSession.update({
      where: { id: active.id },
      data: { status: "ON_BREAK", breakCount: { increment: 1 }, lastActivityAt: now },
      include: { intervals: { orderBy: { startedAt: "asc" } } },
    });
    return { kind: "state" as const, state: computeState(active, now), transitioned: "inactive_break" as const };
  }

  active = await db.workSession.update({
    where: { id: active.id },
    data: { lastActivityAt: now },
    include: { intervals: { orderBy: { startedAt: "asc" } } },
  });
  return { kind: "state" as const, state: computeState(active, now) };
}

export async function startBreak(userId: string, now: Date = new Date()) {
  const active = await db.workSession.findFirst({
    where: { userId, status: "ACTIVE" },
    include: { intervals: true },
  });
  if (!active) throw new Error("No active work session");

  await db.sessionInterval.updateMany({
    where: { sessionId: active.id, kind: "WORK", endedAt: null },
    data: { endedAt: now },
  });
  await db.sessionInterval.create({
    data: { sessionId: active.id, kind: "BREAK", source: "USER", startedAt: now },
  });
  const updated = await db.workSession.update({
    where: { id: active.id },
    data: { status: "ON_BREAK", lastActivityAt: now, breakCount: { increment: 1 } },
    include: { intervals: { orderBy: { startedAt: "asc" } } },
  });
  return computeState(updated, now);
}

export async function endBreak(userId: string, now: Date = new Date()) {
  const active = await db.workSession.findFirst({
    where: { userId, status: "ON_BREAK" },
    include: { intervals: true },
  });
  if (!active) throw new Error("Not currently on break");

  await db.sessionInterval.updateMany({
    where: { sessionId: active.id, kind: "BREAK", endedAt: null },
    data: { endedAt: now },
  });
  await db.sessionInterval.create({
    data: { sessionId: active.id, kind: "WORK", source: "SYSTEM", startedAt: now },
  });
  const updated = await db.workSession.update({
    where: { id: active.id },
    data: { status: "ACTIVE", lastActivityAt: now },
    include: { intervals: { orderBy: { startedAt: "asc" } } },
  });
  return computeState(updated, now);
}

export async function endTodaysSession(userId: string, now: Date = new Date()) {
  const todayCST = cstDateKey(now);
  const active = await db.workSession.findFirst({
    where: { userId, dateCST: todayCST, status: { not: "ENDED" } },
    include: { intervals: true },
  });
  if (!active) throw new Error("No active work session for today");
  const ended = await endSession(active.id, now, "MANUAL_END");
  return computeState(ended, now);
}

// Rep-side backfill: mark a break inside an existing WORK interval of today's
// session. Used when a rep forgot to click "Going on Break". The backfill
// splits one WORK interval into WORK — BREAK(BACKFILL) — WORK.
export async function backfillBreak(
  userId: string,
  startAt: Date,
  endAt: Date,
  note: string | undefined,
  now: Date = new Date(),
) {
  if (endAt <= startAt) throw new Error("End time must be after start time");
  const todayCST = cstDateKey(now);
  const session = await db.workSession.findUnique({
    where: { userId_dateCST: { userId, dateCST: todayCST } },
    include: { intervals: { orderBy: { startedAt: "asc" } } },
  });
  if (!session) throw new Error("No work session found for today");

  const host = session.intervals.find(
    (i) => i.kind === "WORK" && i.startedAt <= startAt && (i.endedAt ?? now) >= endAt,
  );
  if (!host) throw new Error("Break window must fall inside a single work interval");

  // Close the host WORK at startAt, insert BREAK, reopen/continue WORK from endAt.
  const hostOriginalEnd = host.endedAt;
  await db.$transaction([
    db.sessionInterval.update({
      where: { id: host.id },
      data: { endedAt: startAt },
    }),
    db.sessionInterval.create({
      data: { sessionId: session.id, kind: "BREAK", source: "BACKFILL", startedAt: startAt, endedAt: endAt, note: note ?? null },
    }),
    db.sessionInterval.create({
      data: { sessionId: session.id, kind: "WORK", source: "SYSTEM", startedAt: endAt, endedAt: hostOriginalEnd },
    }),
    db.workSession.update({
      where: { id: session.id },
      data: { breakCount: { increment: 1 } },
    }),
  ]);

  const fresh = await db.workSession.findUnique({
    where: { id: session.id },
    include: { intervals: { orderBy: { startedAt: "asc" } } },
  });
  return computeState(fresh!, now);
}
