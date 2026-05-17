import { db } from "@/lib/db";
import { cstDateKey, cstMonthKey, cstWeekKey } from "./cst";
import type { SessionInterval, WorkSession } from "@prisma/client";

export type Period = { kind: "week"; weekOf: string } | { kind: "month"; monthOf: string };

function sumByKind(intervals: SessionInterval[], kind: "WORK" | "BREAK", upTo: Date): number {
  return intervals
    .filter((i) => i.kind === kind)
    .reduce((total, i) => total + Math.max(0, (i.endedAt ?? upTo).getTime() - i.startedAt.getTime()), 0);
}

export type RepTotals = {
  workMs: number;
  breakMs: number;
  breakCount: number;
  sessionCount: number;
  daysWorked: number;
};

export function totalsForSessions(sessions: (WorkSession & { intervals: SessionInterval[] })[], now: Date = new Date()): RepTotals {
  const days = new Set<string>();
  let workMs = 0;
  let breakMs = 0;
  let breakCount = 0;
  for (const s of sessions) {
    const cap = s.endedAt ?? now;
    workMs += sumByKind(s.intervals, "WORK", cap);
    breakMs += sumByKind(s.intervals, "BREAK", cap);
    breakCount += s.intervals.filter((i) => i.kind === "BREAK").length;
    days.add(s.dateCST);
  }
  return { workMs, breakMs, breakCount, sessionCount: sessions.length, daysWorked: days.size };
}

function matchesPeriod(s: WorkSession, period: Period): boolean {
  return period.kind === "week"
    ? cstWeekKey(s.startedAt) === period.weekOf
    : cstMonthKey(s.startedAt) === period.monthOf;
}

// Earliest UTC start we need to pull to cover a given CST week/month.
// A CST week runs Mon 00:00 CST → Sun 23:59 CST. In UTC that's +6h. We pad
// generously (±2 days) and then filter in-memory by the key.
function periodWindow(period: Period): { since: Date; until: Date } {
  const now = new Date();
  if (period.kind === "month") {
    const [yy, mm] = period.monthOf.split("-").map(Number);
    const since = new Date(Date.UTC(yy, mm - 1, 1));
    since.setUTCDate(since.getUTCDate() - 2);
    const until = new Date(Date.UTC(yy, mm, 1));
    until.setUTCDate(until.getUTCDate() + 2);
    return { since, until };
  }
  // For a week, pull ±9 days around today and let the filter do the rest.
  const since = new Date(now);
  since.setUTCDate(since.getUTCDate() - 9);
  const until = new Date(now);
  until.setUTCDate(until.getUTCDate() + 9);
  return { since, until };
}

export async function timesheetForUsers(userIds: string[], period: Period): Promise<Map<string, RepTotals>> {
  if (userIds.length === 0) return new Map();
  const { since, until } = periodWindow(period);
  const sessions = await db.workSession.findMany({
    where: { userId: { in: userIds }, startedAt: { gte: since, lt: until } },
    include: { intervals: { orderBy: { startedAt: "asc" } } },
  });

  const byUser = new Map<string, (WorkSession & { intervals: SessionInterval[] })[]>();
  for (const s of sessions) {
    if (!matchesPeriod(s, period)) continue;
    const list = byUser.get(s.userId) ?? [];
    list.push(s);
    byUser.set(s.userId, list);
  }

  const result = new Map<string, RepTotals>();
  for (const id of userIds) {
    result.set(id, totalsForSessions(byUser.get(id) ?? []));
  }
  return result;
}

export async function commissionTotalsForUsers(userIds: string[], period: Period) {
  if (userIds.length === 0) return new Map<string, { commissionTotal: number; onboardingTotal: number; paidTotal: number; pendingTotal: number; count: number }>();
  const where = period.kind === "week"
    ? { userId: { in: userIds }, weekOfCST: period.weekOf }
    : { userId: { in: userIds }, monthOfCST: period.monthOf };
  const rows = await db.commission.findMany({ where });

  const result = new Map<string, { commissionTotal: number; onboardingTotal: number; paidTotal: number; pendingTotal: number; count: number }>();
  for (const id of userIds) result.set(id, { commissionTotal: 0, onboardingTotal: 0, paidTotal: 0, pendingTotal: 0, count: 0 });
  for (const c of rows) {
    const t = result.get(c.userId);
    if (!t) continue;
    t.commissionTotal += c.commissionAmount;
    t.onboardingTotal += c.onboardingAmount;
    if (c.status === "PAID") t.paidTotal += c.commissionAmount;
    if (c.status === "PENDING") t.pendingTotal += c.commissionAmount;
    t.count += 1;
  }
  return result;
}

export function defaultPeriod(searchParams: URLSearchParams): Period {
  const weekOf = searchParams.get("weekOf");
  const monthOf = searchParams.get("monthOf");
  if (weekOf) return { kind: "week", weekOf };
  if (monthOf) return { kind: "month", monthOf };
  return { kind: "week", weekOf: cstWeekKey() };
}

export function todayCST() { return cstDateKey(); }
export function thisWeekCST() { return cstWeekKey(); }
export function thisMonthCST() { return cstMonthKey(); }
