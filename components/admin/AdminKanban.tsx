"use client";

import { useState } from "react";
import Link from "next/link";

type KProject = {
  id: string;
  name: string;
  teamId: string;
  progress: number;
  stage: string;
  ownerName: string | null;
  ownerImage: string | null;
  companyName: string | null;
  taskCount: number;
};

const DEPT_COLS: { id: string; label: string; color: string }[] = [
  { id: "SALES", label: "Sales", color: "#f59e0b" },
  { id: "CRM",   label: "CRM",   color: "#7c3aed" },
  { id: "APPS",  label: "Development", color: "#4318ff" },
  { id: "GLOBAL", label: "Cross-Dept", color: "#94a3b8" },
];

export function AdminKanbanSection({ projects }: { projects: KProject[] }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: `repeat(${DEPT_COLS.length}, minmax(0, 1fr))`, gap: "0.65rem", overflowX: "auto" }}>
      {DEPT_COLS.map((col) => {
        const items = projects.filter((p) => p.teamId === col.id);
        return (
          <div key={col.id} style={{ background: "var(--bg-base)", borderRadius: 12, padding: "0.6rem", border: "1px solid var(--border-color)", minHeight: 180 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.5rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, fontWeight: 800, fontSize: "0.75rem" }}>
                <span style={{ width: 8, height: 8, borderRadius: 999, background: col.color }} />
                {col.label}
              </div>
              <span style={{ fontSize: "0.7rem", color: "var(--text-muted)", fontWeight: 700 }}>{items.length}</span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {items.map((p) => (
                <Link key={p.id} href={`/records/project/${p.id}`} style={{ padding: "0.55rem 0.65rem", background: "var(--bg-surface)", border: "1px solid var(--border-color)", borderRadius: 10, fontSize: "0.8rem", textDecoration: "none", display: "block" }}>
                  <div style={{ fontWeight: 700, lineHeight: 1.25, marginBottom: 4, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{p.companyName || p.name}</div>
                  <div style={{ fontSize: "0.68rem", color: "var(--text-muted)", marginBottom: 6, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{p.name} · {p.taskCount} tasks</div>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <div style={{ flex: 1, height: 4, background: "var(--bg-base)", borderRadius: 999, overflow: "hidden" }}>
                      <div style={{ height: "100%", width: `${p.progress}%`, background: col.color, borderRadius: 999 }} />
                    </div>
                    <span style={{ fontSize: "0.65rem", fontWeight: 700, color: "var(--text-muted)", minWidth: 28, textAlign: "right" }}>{p.progress}%</span>
                    {p.ownerImage ? <img src={p.ownerImage} alt="" style={{ width: 18, height: 18, borderRadius: "50%" }} /> : null}
                  </div>
                </Link>
              ))}
              {items.length === 0 && <div style={{ fontSize: "0.7rem", color: "var(--text-muted)", padding: "0.5rem 0.25rem" }}>No projects</div>}
            </div>
          </div>
        );
      })}
    </div>
  );
}
