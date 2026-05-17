export type RecurrenceKind = "NONE" | "DAILY" | "WEEKLY" | "BIWEEKLY" | "MONTHLY";
export type MeetingKind = "INTERNAL_CALL" | "CLIENT_STANDUP";

export const MEETING_KIND_META: Record<MeetingKind, { label: string; color: string }> = {
  INTERNAL_CALL: { label: "Internal call", color: "#7c3aed" },
  CLIENT_STANDUP: { label: "Client stand-up", color: "#f59e0b" },
};

export const RECURRENCE_OPTIONS: { value: RecurrenceKind; label: string }[] = [
  { value: "NONE", label: "Does not repeat" },
  { value: "DAILY", label: "Daily" },
  { value: "WEEKLY", label: "Weekly" },
  { value: "BIWEEKLY", label: "Every 2 weeks" },
  { value: "MONTHLY", label: "Monthly" },
];

export function nextOccurrence(date: Date, kind: RecurrenceKind): Date | null {
  if (kind === "NONE") return null;
  const next = new Date(date);
  if (kind === "DAILY") next.setDate(next.getDate() + 1);
  else if (kind === "WEEKLY") next.setDate(next.getDate() + 7);
  else if (kind === "BIWEEKLY") next.setDate(next.getDate() + 14);
  else if (kind === "MONTHLY") next.setMonth(next.getMonth() + 1);
  return next;
}

export type MeetingSeed = {
  id: string;
  startAt: Date;
  recurrence: string;
  recurrenceUntil: Date | null;
};

// Expands a meeting (and its recurring instances) into concrete dated slots that fall within [windowStart, windowEnd].
// Returns the original id paired with the occurrence date — so the UI can link back to the parent.
export function expandRecurrence<T extends MeetingSeed>(
  m: T,
  windowStart: Date,
  windowEnd: Date,
  hardCap = 200,
): { source: T; occurrenceStart: Date; isRecurring: boolean }[] {
  const out: { source: T; occurrenceStart: Date; isRecurring: boolean }[] = [];
  const kind = m.recurrence as RecurrenceKind;
  const recurring = kind !== "NONE";
  let cursor = new Date(m.startAt);
  const stop = m.recurrenceUntil ? new Date(Math.min(windowEnd.getTime(), m.recurrenceUntil.getTime())) : windowEnd;

  let safety = 0;
  while (cursor.getTime() <= stop.getTime() && safety < hardCap) {
    if (cursor.getTime() >= windowStart.getTime()) {
      out.push({ source: m, occurrenceStart: new Date(cursor), isRecurring: recurring });
    }
    if (!recurring) break;
    const next = nextOccurrence(cursor, kind);
    if (!next) break;
    cursor = next;
    safety++;
  }
  return out;
}
