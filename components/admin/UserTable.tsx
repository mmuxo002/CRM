"use client";

import { useState } from "react";
import { CheckCircle2, XCircle, Pencil } from "lucide-react";
import { DEPARTMENTS, parseAccess } from "@/lib/departments";
import { EditUserModal, type AdminUser } from "./EditUserModal";

const ACTIVE_MIN = 5;
const AWAY_MIN = 60;

function presence(lastSeenAt: string | null): { label: string; color: string } {
  if (!lastSeenAt) return { label: "Offline", color: "#94a3b8" };
  const diff = (Date.now() - new Date(lastSeenAt).getTime()) / 60000;
  if (diff <= ACTIVE_MIN) return { label: "Online", color: "#10b981" };
  if (diff <= AWAY_MIN) return { label: "Away", color: "#f59e0b" };
  return { label: "Offline", color: "#94a3b8" };
}

const GRID = "40px 1.4fr 0.9fr 1.4fr 90px 1.6fr 80px";

export function UserTable({ users }: { users: AdminUser[] }) {
  const [editing, setEditing] = useState<AdminUser | null>(null);
  const activeCount = users.filter((u) => u.isActive).length;

  return (
    <>
      <div className="card">
        <div className="row-between" style={{ marginBottom: "0.75rem" }}>
          <h2 style={{ fontSize: "1rem", fontWeight: 800 }}>All users ({users.length})</h2>
          <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>{activeCount} active</span>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: GRID, gap: "1rem", padding: "0.5rem 0.75rem", fontSize: "0.7rem", textTransform: "uppercase", color: "var(--text-secondary)", fontWeight: 700, letterSpacing: "0.05em", borderBottom: "1px solid var(--border-color)" }}>
          <span />
          <span>Name</span>
          <span>Role</span>
          <span>Department Access</span>
          <span>Status</span>
          <span>Onboarding</span>
          <span />
        </div>

        {users.map((u) => {
          const access = parseAccess(u.accessDepartments);
          const depts = access === "all" ? DEPARTMENTS : DEPARTMENTS.filter((d) => access.has(d.id));
          const p = presence(u.lastSeenAt);
          const approved = !u.mustResetPassword;
          const hasLoggedIn = !!u.lastSeenAt;
          return (
            <div key={u.id} style={{ display: "grid", gridTemplateColumns: GRID, gap: "1rem", padding: "0.75rem", alignItems: "center", borderBottom: "1px solid var(--border-color)" }}>
              <div style={{ position: "relative", width: 32, height: 32 }}>
                {u.image ? (
                  <img src={u.image} alt="" style={{ width: 32, height: 32, borderRadius: "50%", objectFit: "cover" }} />
                ) : (
                  <div style={{ width: 32, height: 32, borderRadius: "50%", background: "linear-gradient(135deg, #4318ff, #7c3aed)", color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.7rem", fontWeight: 800 }}>
                    {(u.name || u.email || "?").slice(0, 1).toUpperCase()}
                  </div>
                )}
                <span title={p.label} style={{ position: "absolute", bottom: -1, right: -1, width: 11, height: 11, borderRadius: "50%", background: p.color, border: "2px solid var(--bg-surface)" }} />
              </div>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontWeight: 700, fontSize: "0.88rem", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{u.name || "—"}</div>
                <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{u.email}</div>
              </div>
              <span className={`badge ${u.role === "ADMIN" ? "badge-purple" : "badge-blue"}`} style={{ fontSize: 10, width: "fit-content" }}>{u.role}</span>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                {depts.length === 0 ? (
                  <span style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>—</span>
                ) : depts.map((d) => (
                  <span key={d.id} style={{ fontSize: "0.65rem", fontWeight: 700, padding: "2px 8px", borderRadius: 999, background: d.color + "18", color: d.color }}>{d.label}</span>
                ))}
              </div>
              <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: "0.75rem", color: u.isActive ? "#059669" : "#b91c1c", fontWeight: 700 }}>
                {u.isActive ? <><CheckCircle2 size={12} /> Active</> : <><XCircle size={12} /> Inactive</>}
              </span>
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                  <Chip label={u.invitedAt ? `Enrolled ${new Date(u.invitedAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}` : "Not enrolled"} color={u.invitedAt ? "#4318ff" : "#94a3b8"} />
                  <Chip label={approved ? "Approved" : "Pending reset"} color={approved ? "#10b981" : "#f59e0b"} />
                  <Chip label={hasLoggedIn ? "Logged in" : "Never logged in"} color={hasLoggedIn ? "#10b981" : "#ef4444"} />
                </div>
                {hasLoggedIn && (
                  <div style={{ fontSize: "0.65rem", color: "var(--text-muted)" }}>
                    {p.label} · last seen {timeAgo(new Date(u.lastSeenAt as string))}
                  </div>
                )}
              </div>
              <button
                onClick={() => setEditing(u)}
                style={{
                  display: "inline-flex", alignItems: "center", gap: 4,
                  padding: "6px 10px", borderRadius: 8,
                  border: "1px solid var(--border-color)", background: "white",
                  fontSize: "0.72rem", fontWeight: 700, color: "var(--text-secondary)", cursor: "pointer",
                }}
              >
                <Pencil size={11} /> Edit
              </button>
            </div>
          );
        })}
      </div>

      {editing && <EditUserModal user={editing} onClose={() => setEditing(null)} />}
    </>
  );
}

function Chip({ label, color }: { label: string; color: string }) {
  return (
    <span style={{ fontSize: "0.62rem", fontWeight: 700, padding: "2px 8px", borderRadius: 999, background: color + "18", color, whiteSpace: "nowrap" }}>
      {label}
    </span>
  );
}

function timeAgo(d: Date) {
  const ms = Date.now() - d.getTime();
  const m = Math.floor(ms / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}
