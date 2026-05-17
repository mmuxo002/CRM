// Central Standard Time helpers.
// All sales reps are in Guatemala / El Salvador (UTC-6 year-round, no DST),
// so we can hard-offset instead of pulling in a tz library.

const CST_OFFSET_MS = 6 * 60 * 60 * 1000;

function toCST(d: Date): Date {
  return new Date(d.getTime() - CST_OFFSET_MS);
}

export function cstDateKey(d: Date = new Date()): string {
  const c = toCST(d);
  const y = c.getUTCFullYear();
  const m = String(c.getUTCMonth() + 1).padStart(2, "0");
  const day = String(c.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function cstMonthKey(d: Date = new Date()): string {
  return cstDateKey(d).slice(0, 7);
}

// ISO week (Mon-Sun) key in CST: YYYY-Www
export function cstWeekKey(d: Date = new Date()): string {
  const c = toCST(d);
  const t = new Date(Date.UTC(c.getUTCFullYear(), c.getUTCMonth(), c.getUTCDate()));
  const dayNum = t.getUTCDay() || 7;
  t.setUTCDate(t.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(t.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil(((t.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return `${t.getUTCFullYear()}-W${String(weekNo).padStart(2, "0")}`;
}

// UTC Date at 00:00 CST on the *next* calendar day after the given CST date-key.
// Used to close sessions that rolled past midnight.
export function cstMidnightAfter(dateCST: string): Date {
  const [y, m, d] = dateCST.split("-").map((n) => parseInt(n, 10));
  // 00:00 CST on (dateCST + 1) === 06:00 UTC on (dateCST + 1)
  return new Date(Date.UTC(y, m - 1, d + 1, 6, 0, 0, 0));
}
