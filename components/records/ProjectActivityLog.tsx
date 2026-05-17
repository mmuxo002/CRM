"use client";

import { useState, useEffect } from "react";
import { Activity, User2, FileText, MessageSquare, Mail, Phone, Settings } from "lucide-react";

type ActivityEntry = {
  id: string;
  kind: string;
  title: string;
  body: string | null;
  createdAt: string;
  actor: { id: string; name: string | null; image: string | null } | null;
};

const KIND_META: Record<string, { icon: React.ReactNode; color: string }> = {
  TASK:    { icon: <FileText size={14} />, color: "#4318ff" },
  NOTE:    { icon: <MessageSquare size={14} />, color: "#7c3aed" },
  CALL:    { icon: <Phone size={14} />, color: "#10b981" },
  EMAIL:   { icon: <Mail size={14} />, color: "#3b82f6" },
  MEETING: { icon: <User2 size={14} />, color: "#f59e0b" },
  SYSTEM:  { icon: <Settings size={14} />, color: "#94a3b8" },
};

export function ProjectActivityLog({ projectId }: { projectId: string }) {
  const [entries, setEntries] = useState<ActivityEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/projects/${projectId}/activity`)
      .then((r) => r.json())
      .then((d) => { setEntries(d.activities || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, [projectId]);

  if (loading) return <div style={{ padding: "2rem", textAlign: "center", color: "var(--text-muted)", fontSize: "0.85rem" }}>Loading activity…</div>;
  if (entries.length === 0) return <div style={{ padding: "2rem", textAlign: "center", color: "var(--text-muted)", fontSize: "0.85rem" }}>No activity recorded yet.</div>;

  const grouped = groupByDate(entries);

  return (
    <div style={{ maxHeight: "min(600px, 70vh)", overflowY: "auto" }}>
      {grouped.map(({ date, items }) => (
        <div key={date}>
          <div style={{ position: "sticky", top: 0, zIndex: 2, textAlign: "center", padding: "0.5rem 0", background: "var(--bg-surface)" }}>
            <span style={{ fontSize: "0.65rem", fontWeight: 700, color: "var(--text-muted)", background: "var(--bg-base)", padding: "4px 12px", borderRadius: 999, textTransform: "uppercase", letterSpacing: "0.05em" }}>{date}</span>
          </div>
          <div style={{ position: "relative", paddingLeft: "2rem" }}>
            <div style={{ position: "absolute", left: 15, top: 0, bottom: 0, width: 2, background: "var(--border-color)" }} />
            {items.map((entry) => {
              const meta = KIND_META[entry.kind] || KIND_META.SYSTEM;
              return (
                <div key={entry.id} style={{ display: "flex", gap: "0.75rem", padding: "0.6rem 0", position: "relative" }}>
                  <div style={{
                    position: "absolute",
                    left: -25,
                    top: "0.6rem",
                    width: 28,
                    height: 28,
                    borderRadius: "50%",
                    background: meta.color + "18",
                    color: meta.color,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    border: "2px solid var(--bg-surface)",
                    zIndex: 1,
                  }}>
                    {meta.icon}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 2 }}>
                      {entry.actor?.image ? (
                        <img src={entry.actor.image} alt="" style={{ width: 20, height: 20, borderRadius: "50%" }} />
                      ) : (
                        <div style={{ width: 20, height: 20, borderRadius: "50%", background: "#e2e8f0" }} />
                      )}
                      <span style={{ fontWeight: 700, fontSize: "0.8rem" }}>{entry.actor?.name || "System"}</span>
                      <span style={{ fontSize: "0.65rem", color: "var(--text-muted)" }}>
                        {new Date(entry.createdAt).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}
                      </span>
                    </div>
                    <div style={{ fontSize: "0.85rem", color: "var(--text-primary)" }}>{entry.title}</div>
                    {entry.body && <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: 2, whiteSpace: "pre-wrap" }}>{entry.body}</div>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

function groupByDate(entries: ActivityEntry[]) {
  const groups: { date: string; items: ActivityEntry[] }[] = [];
  for (const e of entries) {
    const d = new Date(e.createdAt).toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric", year: "numeric" });
    const last = groups[groups.length - 1];
    if (last && last.date === d) {
      last.items.push(e);
    } else {
      groups.push({ date: d, items: [e] });
    }
  }
  return groups;
}
