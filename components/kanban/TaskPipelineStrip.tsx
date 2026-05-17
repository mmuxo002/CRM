import { db } from "@/lib/db";
import { GitBranch } from "lucide-react";

const STAGES: { id: string; label: string; color: string }[] = [
  { id: "BACKLOG", label: "Backlog", color: "#94a3b8" },
  { id: "RESEARCH", label: "Research", color: "#3b82f6" },
  { id: "IN_PROGRESS", label: "In Progress", color: "#4318ff" },
  { id: "REVIEW", label: "Review", color: "#a855f7" },
  { id: "DONE", label: "Done", color: "#10b981" },
];

export async function TaskPipelineStrip({ team }: { team: "APPS" | "CRM" }) {
  const counts = await Promise.all(STAGES.map((s) => db.task.count({ where: { teamId: team, status: s.id } })));
  const max = Math.max(...counts, 1);
  const total = counts.reduce((a, b) => a + b, 0);
  const done = counts[4];
  const velocity = total ? Math.round((done / total) * 100) : 0;
  const accent = team === "APPS" ? "#4318ff" : "#7c3aed";

  return (
    <div className="card" style={{ marginBottom: "1rem" }}>
      <div className="row-between" style={{ marginBottom: "0.75rem" }}>
        <h2 style={{ fontSize: "1rem", fontWeight: 800, display: "flex", alignItems: "center", gap: 6 }}>
          <GitBranch size={16} color={accent} /> Task Pipeline
        </h2>
        <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", fontWeight: 700 }}>
          {total} tasks · {velocity}% complete
        </span>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: "0.75rem" }}>
        {STAGES.map((s, i) => (
          <div key={s.id}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.75rem", marginBottom: 4 }}>
              <span style={{ fontWeight: 700, display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ width: 8, height: 8, borderRadius: 2, background: s.color }} /> {s.label}
              </span>
              <span style={{ color: "var(--text-muted)", fontWeight: 700 }}>{counts[i]}</span>
            </div>
            <div className="progress-bar-bg">
              <div className="progress-bar-fill" style={{ width: `${(counts[i] / max) * 100}%`, background: s.color }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
