"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type KTask = {
  id: string;
  title: string;
  status: string;
  priority: string;
  dueDate: string | null;
  assignee: { id: string; name: string | null; image: string | null } | null;
};

const COLUMNS: { id: string; title: string; color: string }[] = [
  { id: "BACKLOG", title: "Backlog", color: "#94a3b8" },
  { id: "RESEARCH", title: "Scoping", color: "#3b82f6" },
  { id: "IN_PROGRESS", title: "In Progress", color: "#4318ff" },
  { id: "REVIEW", title: "Review", color: "#a855f7" },
  { id: "DONE", title: "Done", color: "#10b981" },
];

export function ProjectKanban({ initial }: { initial: KTask[] }) {
  const [tasks, setTasks] = useState(initial);
  const [dragId, setDragId] = useState<string | null>(null);
  const router = useRouter();

  const move = async (id: string, toStatus: string) => {
    const t = tasks.find((x) => x.id === id);
    if (!t || t.status === toStatus) return;
    setTasks((prev) => prev.map((x) => (x.id === id ? { ...x, status: toStatus } : x)));
    await fetch("/api/crm/tasks", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, status: toStatus }) });
    router.refresh();
  };

  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(5, minmax(0,1fr))", gap: "0.65rem", overflowX: "auto" }}>
      {COLUMNS.map((c) => {
        const items = tasks.filter((t) => t.status === c.id);
        return (
          <div
            key={c.id}
            onDragOver={(e) => { e.preventDefault(); }}
            onDrop={() => { if (dragId) { move(dragId, c.id); setDragId(null); } }}
            style={{ background: "var(--bg-base)", borderRadius: 12, padding: "0.6rem", border: "1px solid var(--border-color)", minHeight: 140 }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.5rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, fontWeight: 800, fontSize: "0.75rem" }}>
                <span style={{ width: 8, height: 8, borderRadius: 2, background: c.color }} />
                {c.title}
              </div>
              <span style={{ fontSize: "0.7rem", color: "var(--text-muted)", fontWeight: 700 }}>{items.length}</span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {items.map((t) => (
                <div
                  key={t.id}
                  draggable
                  onDragStart={() => setDragId(t.id)}
                  onDragEnd={() => setDragId(null)}
                  style={{ padding: "0.55rem 0.65rem", background: "var(--bg-surface)", border: "1px solid var(--border-color)", borderRadius: 10, cursor: "grab", fontSize: "0.8rem" }}
                >
                  <div style={{ fontWeight: 700, lineHeight: 1.25 }}>{t.title}</div>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 4, fontSize: "0.7rem", color: "var(--text-muted)" }}>
                    <span className={`priority-${t.priority.toLowerCase()}`} style={{ fontSize: 10 }}>{t.priority}</span>
                    {t.dueDate && <span>{new Date(t.dueDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span>}
                  </div>
                </div>
              ))}
              {items.length === 0 && <div style={{ fontSize: "0.7rem", color: "var(--text-muted)", padding: "0.5rem 0.25rem" }}>Drop tasks here</div>}
            </div>
          </div>
        );
      })}
    </div>
  );
}
