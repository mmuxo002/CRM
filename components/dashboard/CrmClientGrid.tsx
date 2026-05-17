"use client";

import { useState } from "react";
import Link from "next/link";
import { LayoutGrid, List, Building2, Wrench } from "lucide-react";

type ClientProject = {
  id: string;
  name: string;
  companyName: string | null;
  serviceLabel: string;
  serviceColor: string;
  crmStage: string;
  mrr: number;
  progress: number;
  taskCount: number;
  fileCount: number;
  ownerName: string | null;
  ownerImage: string | null;
  tags: { id: string; label: string; color: string }[];
};

export function CrmClientGrid({ projects }: { projects: ClientProject[] }) {
  const [view, setView] = useState<"grid" | "list">("grid");

  return (
    <div>
      <div className="row-between" style={{ marginBottom: "0.6rem" }}>
        <h2 style={{ fontSize: "1rem", fontWeight: 800, display: "flex", alignItems: "center", gap: 8 }}>
          Clients <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", fontWeight: 500 }}>{projects.length} total</span>
        </h2>
        <div style={{ display: "flex", background: "var(--bg-base)", borderRadius: 8, border: "1px solid var(--border-color)", overflow: "hidden" }}>
          <button
            onClick={() => setView("grid")}
            style={{ padding: "5px 10px", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 4, fontSize: "0.72rem", fontWeight: 700, background: view === "grid" ? "var(--bg-surface)" : "transparent", color: view === "grid" ? "var(--text-primary)" : "var(--text-muted)", borderRight: "1px solid var(--border-color)" }}
          >
            <LayoutGrid size={12} /> Cards
          </button>
          <button
            onClick={() => setView("list")}
            style={{ padding: "5px 10px", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 4, fontSize: "0.72rem", fontWeight: 700, background: view === "list" ? "var(--bg-surface)" : "transparent", color: view === "list" ? "var(--text-primary)" : "var(--text-muted)" }}
          >
            <List size={12} /> List
          </button>
        </div>
      </div>

      {projects.length === 0 && <div style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>No clients yet. Onboard one to get started.</div>}

      {view === "grid" ? <GridView projects={projects} /> : <ListView projects={projects} />}
    </div>
  );
}

function GridView({ projects }: { projects: ClientProject[] }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: "0.6rem" }}>
      {projects.map((p) => (
        <Link
          key={p.id}
          href={`/dev/crm/projects/${p.id}`}
          style={{
            padding: "0.75rem",
            background: "var(--bg-secondary, #f8fafc)",
            border: "1px solid var(--border-color)",
            borderRadius: 12,
            textDecoration: "none",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            aspectRatio: "1 / 1",
            overflow: "hidden",
            transition: "border-color 0.15s, box-shadow 0.15s",
          }}
          className="client-square-card"
        >
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
              <div style={{ width: 28, height: 28, borderRadius: 8, background: p.serviceColor + "22", color: p.serviceColor, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontSize: 11, fontWeight: 900 }}>
                {(p.companyName || p.name).slice(0, 2).toUpperCase()}
              </div>
              {p.mrr > 0 && <span style={{ fontSize: 9, fontWeight: 700, color: "#10b981", marginLeft: "auto", whiteSpace: "nowrap" }}>${p.mrr.toLocaleString()}</span>}
            </div>
            <div style={{ fontWeight: 800, fontSize: "0.82rem", color: "var(--text-primary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", lineHeight: 1.2 }}>{p.companyName || p.name}</div>
            <div style={{ fontSize: "0.65rem", color: "var(--text-muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", marginTop: 1 }}>{p.name}</div>
          </div>

          <div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 3, marginBottom: 6 }}>
              <span style={{ background: p.serviceColor + "22", color: p.serviceColor, fontSize: 9, fontWeight: 700, padding: "1px 5px", borderRadius: 4 }}>{p.serviceLabel}</span>
              <span style={{ background: "#e2e8f0", color: "#475569", fontSize: 9, fontWeight: 700, padding: "1px 5px", borderRadius: 4 }}>{p.crmStage}</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span style={{ fontSize: "0.62rem", color: "var(--text-muted)" }}>{p.taskCount} tasks</span>
              {p.ownerImage ? (
                <img src={p.ownerImage} alt="" style={{ width: 18, height: 18, borderRadius: "50%" }} />
              ) : p.ownerName ? (
                <div style={{ width: 18, height: 18, borderRadius: "50%", background: "#e2e8f0", fontSize: 8, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", color: "#64748b" }}>{p.ownerName[0]}</div>
              ) : null}
            </div>
            {p.progress > 0 && (
              <div style={{ marginTop: 4 }}>
                <div className="progress-bar-bg" style={{ height: 3 }}>
                  <div className="progress-bar-fill" style={{ width: `${p.progress}%`, background: p.serviceColor, height: 3 }} />
                </div>
              </div>
            )}
          </div>
        </Link>
      ))}
    </div>
  );
}

function ListView({ projects }: { projects: ClientProject[] }) {
  return (
    <div style={{ border: "1px solid var(--border-color)", borderRadius: 10, overflow: "hidden" }}>
      <div style={{ display: "grid", gridTemplateColumns: "2fr 1.2fr 0.8fr 0.8fr 0.8fr 0.6fr", padding: "0.5rem 0.75rem", background: "var(--bg-base)", fontSize: "0.65rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", borderBottom: "1px solid var(--border-color)" }}>
        <span>Client</span>
        <span>Service</span>
        <span>Stage</span>
        <span>MRR</span>
        <span>Tasks</span>
        <span>Owner</span>
      </div>
      {projects.map((p) => (
        <Link
          key={p.id}
          href={`/dev/crm/projects/${p.id}`}
          style={{ display: "grid", gridTemplateColumns: "2fr 1.2fr 0.8fr 0.8fr 0.8fr 0.6fr", padding: "0.55rem 0.75rem", borderBottom: "1px solid var(--border-color)", textDecoration: "none", alignItems: "center", fontSize: "0.82rem", transition: "background 0.1s" }}
          className="list-row-hover"
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
            <div style={{ width: 24, height: 24, borderRadius: 6, background: p.serviceColor + "22", color: p.serviceColor, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontSize: 9, fontWeight: 900 }}>
              {(p.companyName || p.name).slice(0, 2).toUpperCase()}
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontWeight: 700, color: "var(--text-primary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontSize: "0.82rem" }}>{p.companyName || p.name}</div>
              <div style={{ fontSize: "0.65rem", color: "var(--text-muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.name}</div>
            </div>
          </div>
          <span style={{ fontSize: "0.75rem", fontWeight: 600, color: p.serviceColor }}>{p.serviceLabel}</span>
          <span className="badge" style={{ background: "#e2e8f0", color: "#475569", fontSize: 10, fontWeight: 700, justifySelf: "start" }}>{p.crmStage}</span>
          <span style={{ fontSize: "0.8rem", fontWeight: 700, color: p.mrr > 0 ? "#10b981" : "var(--text-muted)" }}>{p.mrr > 0 ? `$${p.mrr.toLocaleString()}` : "—"}</span>
          <span style={{ fontSize: "0.78rem", color: "var(--text-secondary)" }}>{p.taskCount}</span>
          <div>
            {p.ownerImage ? (
              <img src={p.ownerImage} alt="" style={{ width: 22, height: 22, borderRadius: "50%" }} />
            ) : p.ownerName ? (
              <div style={{ width: 22, height: 22, borderRadius: "50%", background: "#e2e8f0", fontSize: 9, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", color: "#64748b" }}>{p.ownerName[0]}</div>
            ) : <span style={{ color: "var(--text-muted)", fontSize: "0.7rem" }}>—</span>}
          </div>
        </Link>
      ))}
    </div>
  );
}
