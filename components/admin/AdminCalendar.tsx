"use client";

import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Clock } from "lucide-react";

type MeetingItem = {
  id: string;
  title: string;
  startAt: string;
  teamId: string;
  kind: string;
  durationMinutes: number;
  owner: { name: string | null } | null;
  project: { name: string } | null;
};

const TEAM_COLOR: Record<string, string> = { SALES: "#f59e0b", CRM: "#10b981", APPS: "#7c3aed", GLOBAL: "#94a3b8" };

function startOfMonth(d: Date) { const x = new Date(d); x.setDate(1); x.setHours(0, 0, 0, 0); return x; }
function startOfGrid(d: Date) { const s = startOfMonth(d); s.setDate(s.getDate() - s.getDay()); return s; }
function addDays(d: Date, n: number) { const x = new Date(d); x.setDate(x.getDate() + n); return x; }
function isSameDay(a: Date, b: Date) { return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate(); }

export function AdminCalendarSection() {
  const [cursor, setCursor] = useState(() => startOfMonth(new Date()));
  const [meetings, setMeetings] = useState<MeetingItem[]>([]);
  const [selectedDay, setSelectedDay] = useState<Date | null>(new Date());
  const [view, setView] = useState<"month" | "week">("month");

  const gridStart = useMemo(() => startOfGrid(cursor), [cursor]);
  const gridDays = useMemo(() => Array.from({ length: 42 }, (_, i) => addDays(gridStart, i)), [gridStart]);
  const today = useMemo(() => new Date(), []);

  useEffect(() => {
    const from = gridStart.toISOString();
    const to = addDays(gridStart, 42).toISOString();
    fetch(`/api/meetings?from=${from}&to=${to}`)
      .then((r) => r.json())
      .then((d) => setMeetings(d.meetings || []))
      .catch(() => {});
  }, [gridStart]);

  const dayMeetings = selectedDay
    ? meetings.filter((m) => isSameDay(new Date(m.startAt), selectedDay)).sort((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime())
    : [];

  return (
    <div>
      <div className="row-between" style={{ marginBottom: "0.5rem" }}>
        <div className="flex-gap">
          <button onClick={() => setCursor((c) => { const n = new Date(c); n.setMonth(n.getMonth() - 1); return startOfMonth(n); })} className="btn btn-ghost" style={{ padding: "4px 8px" }}><ChevronLeft size={14} /></button>
          <span style={{ fontWeight: 800, fontSize: "0.9rem", minWidth: 140, textAlign: "center" }}>{cursor.toLocaleString("en-US", { month: "long", year: "numeric" })}</span>
          <button onClick={() => setCursor((c) => { const n = new Date(c); n.setMonth(n.getMonth() + 1); return startOfMonth(n); })} className="btn btn-ghost" style={{ padding: "4px 8px" }}><ChevronRight size={14} /></button>
        </div>
        <button onClick={() => { setCursor(startOfMonth(new Date())); setSelectedDay(new Date()); }} className="btn btn-ghost" style={{ fontSize: "0.72rem" }}>Today</button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 1, marginBottom: "0.5rem" }}>
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
          <div key={d} style={{ textAlign: "center", fontSize: "0.62rem", fontWeight: 700, color: "var(--text-muted)", padding: "4px 0", textTransform: "uppercase" }}>{d}</div>
        ))}
        {gridDays.map((day, i) => {
          const isMonth = day.getMonth() === cursor.getMonth();
          const isToday = isSameDay(day, today);
          const isSelected = selectedDay && isSameDay(day, selectedDay);
          const dayMeets = meetings.filter((m) => isSameDay(new Date(m.startAt), day));
          return (
            <button
              key={i}
              onClick={() => setSelectedDay(day)}
              style={{
                padding: "4px 2px",
                minHeight: 40,
                background: isSelected ? "#4318ff10" : "transparent",
                border: isSelected ? "1px solid #4318ff40" : "1px solid transparent",
                borderRadius: 6,
                cursor: "pointer",
                opacity: isMonth ? 1 : 0.3,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 2,
              }}
            >
              <span style={{ fontSize: "0.72rem", fontWeight: isToday ? 900 : 600, color: isToday ? "#4318ff" : "var(--text-primary)", background: isToday ? "#4318ff18" : "transparent", borderRadius: 999, width: 20, height: 20, display: "flex", alignItems: "center", justifyContent: "center" }}>
                {day.getDate()}
              </span>
              {dayMeets.length > 0 && (
                <div style={{ display: "flex", gap: 2 }}>
                  {dayMeets.slice(0, 3).map((m, j) => (
                    <span key={j} style={{ width: 5, height: 5, borderRadius: 999, background: TEAM_COLOR[m.teamId] || "#94a3b8" }} />
                  ))}
                  {dayMeets.length > 3 && <span style={{ fontSize: 7, color: "var(--text-muted)", fontWeight: 700 }}>+{dayMeets.length - 3}</span>}
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Day detail panel */}
      <div style={{ borderTop: "1px solid var(--border-color)", paddingTop: "0.6rem" }}>
        <div style={{ fontSize: "0.72rem", fontWeight: 700, color: "var(--text-muted)", marginBottom: "0.4rem", textTransform: "uppercase" }}>
          {selectedDay ? selectedDay.toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" }) : "Select a day"}
        </div>
        {dayMeetings.length === 0 && <div style={{ fontSize: "0.8rem", color: "var(--text-muted)", padding: "0.5rem 0" }}>Nothing scheduled.</div>}
        {dayMeetings.map((m) => {
          const color = TEAM_COLOR[m.teamId] || "#94a3b8";
          const time = new Date(m.startAt).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
          return (
            <div key={m.id} style={{ display: "flex", gap: "0.5rem", padding: "0.4rem 0", borderBottom: "1px solid var(--border-color)", alignItems: "center" }}>
              <span style={{ width: 4, height: 28, borderRadius: 2, background: color, flexShrink: 0 }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 700, fontSize: "0.8rem", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{m.title}</div>
                <div style={{ fontSize: "0.68rem", color: "var(--text-muted)" }}>
                  {time} · {m.durationMinutes}min
                  {m.project && ` · ${m.project.name}`}
                  {m.owner?.name && ` · ${m.owner.name}`}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
