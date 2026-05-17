"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Calendar, Repeat, Plus } from "lucide-react";
import { MEETING_KIND_META, type MeetingKind, type RecurrenceKind } from "@/lib/meetings";

type Item = {
  occurrenceId: string;
  title: string;
  kind: MeetingKind;
  startAt: string;
  durationMinutes: number;
  isRecurring: boolean;
  recurrence: RecurrenceKind;
};

export function ProjectMeetingsCard({ projectId }: { projectId: string }) {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const from = new Date().toISOString();
    const to = new Date(Date.now() + 60 * 86400000).toISOString();
    fetch(`/api/meetings?projectId=${projectId}&from=${from}&to=${to}`)
      .then((r) => r.json())
      .then((d) => Array.isArray(d) && setItems(d.slice(0, 5)))
      .finally(() => setLoading(false));
  }, [projectId]);

  return (
    <div className="card">
      <div className="row-between" style={{ marginBottom: "0.75rem" }}>
        <h4 style={{ fontSize: "0.7rem", textTransform: "uppercase", color: "var(--text-secondary)", letterSpacing: "0.05em", fontWeight: 700, margin: 0 }}>Upcoming Meetings</h4>
        <Link href="/schedule" className="btn btn-ghost" style={{ padding: "0.25rem 0.55rem", fontSize: "0.7rem" }}><Plus size={11} /> Add</Link>
      </div>
      {loading && <div style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>Loading…</div>}
      {!loading && items.length === 0 && <div style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>No meetings scheduled.</div>}
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {items.map((m) => {
          const meta = MEETING_KIND_META[m.kind];
          return (
            <div key={m.occurrenceId} style={{ padding: "0.5rem 0.6rem", border: "1px solid var(--border-color)", borderRadius: 8 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: "0.65rem", color: meta.color, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.04em" }}>
                <Calendar size={10} /> {meta.label}
                {m.isRecurring && <Repeat size={10} />}
              </div>
              <div style={{ fontSize: "0.8rem", fontWeight: 700, marginTop: 2 }}>{m.title}</div>
              <div style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>
                {new Date(m.startAt).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })} · {m.durationMinutes}m
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
