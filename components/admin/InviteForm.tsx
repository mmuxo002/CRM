"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Copy, Send } from "lucide-react";

const DEPT_OPTIONS = [
  { id: "development", label: "Development", color: "#4318ff" },
  { id: "crm", label: "CRM", color: "#7c3aed" },
  { id: "sales", label: "Sales", color: "#f59e0b" },
  { id: "marketing", label: "Marketing", color: "#ec4899" },
];

const ROLE_OPTIONS = ["USER", "APPS_DEV", "CRM_DEV", "SALES", "ADMIN"];

export function InviteForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [title, setTitle] = useState("");
  const [role, setRole] = useState("USER");
  const [allDepts, setAllDepts] = useState(false);
  const [depts, setDepts] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ email: string; tempPassword: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  function toggleDept(id: string) {
    const next = new Set(depts);
    if (next.has(id)) next.delete(id); else next.add(id);
    setDepts(next);
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setResult(null);
    const chosen = allDepts ? ["all"] : [...depts];
    if (chosen.length === 0) { setError("Pick at least one department (or All)."); return; }
    setLoading(true);
    const res = await fetch("/api/admin/invite", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, title, role, departments: chosen }),
    });
    setLoading(false);
    const j = await res.json().catch(() => ({}));
    if (!res.ok) { setError(j.error || "Failed to invite"); return; }
    setResult({ email: j.user.email, tempPassword: j.tempPassword });
    setName(""); setEmail(""); setTitle(""); setRole("USER"); setDepts(new Set()); setAllDepts(false);
    router.refresh();
  }

  return (
    <div className="card">
      <h2 style={{ fontSize: "1rem", fontWeight: 800, marginBottom: "0.75rem", display: "flex", alignItems: "center", gap: 6 }}><Send size={16} color="#4318ff" /> Invite a team member</h2>

      <form onSubmit={onSubmit} style={{ display: "grid", gap: "0.75rem" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
          <Labeled label="Full name">
            <input required value={name} onChange={(e) => setName(e.target.value)} style={inputStyle} placeholder="Jane Doe" />
          </Labeled>
          <Labeled label="Email">
            <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} style={inputStyle} placeholder="jane@innovat3.com" />
          </Labeled>
          <Labeled label="Title (optional)">
            <input value={title} onChange={(e) => setTitle(e.target.value)} style={inputStyle} placeholder="Senior Engineer" />
          </Labeled>
          <Labeled label="Role">
            <select value={role} onChange={(e) => setRole(e.target.value)} style={inputStyle}>
              {ROLE_OPTIONS.map((r) => <option key={r} value={r}>{r}</option>)}
            </select>
          </Labeled>
        </div>

        <div>
          <div style={{ fontSize: "0.8rem", fontWeight: 700, marginBottom: 6 }}>Department access</div>
          <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: "0.85rem", fontWeight: 600, marginBottom: 8 }}>
            <input type="checkbox" checked={allDepts} onChange={(e) => setAllDepts(e.target.checked)} />
            All departments
          </label>
          <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
            {DEPT_OPTIONS.map((d) => {
              const active = allDepts || depts.has(d.id);
              return (
                <button
                  type="button"
                  key={d.id}
                  onClick={() => !allDepts && toggleDept(d.id)}
                  disabled={allDepts}
                  style={{
                    padding: "0.45rem 0.85rem",
                    borderRadius: 999,
                    border: `1.5px solid ${active ? d.color : "var(--border-color)"}`,
                    background: active ? d.color + "18" : "white",
                    color: active ? d.color : "var(--text-secondary)",
                    fontWeight: 700, fontSize: "0.8rem", cursor: allDepts ? "not-allowed" : "pointer", opacity: allDepts ? 0.55 : 1,
                  }}
                >
                  {active && <Check size={12} style={{ display: "inline", marginRight: 4 }} />}
                  {d.label}
                </button>
              );
            })}
          </div>
        </div>

        {error && <div style={{ background: "#fee2e2", color: "#b91c1c", fontSize: "0.8rem", padding: "0.6rem 0.85rem", borderRadius: 8, fontWeight: 600 }}>{error}</div>}

        {result && (
          <div style={{ background: "#ecfdf5", border: "1px solid #a7f3d0", padding: "0.9rem 1rem", borderRadius: 10 }}>
            <div style={{ fontSize: "0.85rem", fontWeight: 800, color: "#065f46" }}>Invitation created for {result.email}</div>
            <div style={{ fontSize: "0.78rem", color: "#065f46", marginTop: 4, marginBottom: 8 }}>Share this temporary password. They'll be forced to reset it on first sign-in.</div>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <code style={{ background: "white", padding: "0.4rem 0.7rem", borderRadius: 6, fontSize: "0.9rem", fontWeight: 700, letterSpacing: "0.02em", border: "1px solid #a7f3d0" }}>{result.tempPassword}</code>
              <button type="button" onClick={() => { navigator.clipboard.writeText(result.tempPassword); setCopied(true); setTimeout(() => setCopied(false), 1500); }} className="btn btn-ghost" style={{ padding: "0.35rem 0.6rem", fontSize: "0.75rem" }}>
                {copied ? <><Check size={12} /> Copied</> : <><Copy size={12} /> Copy</>}
              </button>
            </div>
          </div>
        )}

        <div style={{ display: "flex", justifyContent: "flex-end" }}>
          <button type="submit" disabled={loading} className="btn btn-primary" style={{ opacity: loading ? 0.6 : 1 }}>
            {loading ? "Sending…" : "Send invite"}
          </button>
        </div>
      </form>
    </div>
  );
}

const inputStyle: React.CSSProperties = { padding: "0.6rem 0.8rem", borderRadius: 8, border: "1px solid var(--border-color)", fontSize: "0.88rem", outline: "none", width: "100%" };

function Labeled({ label, children }: { label: string; children: React.ReactNode }) {
  return <label style={{ display: "flex", flexDirection: "column", gap: 4, fontSize: "0.75rem", fontWeight: 700 }}>{label}{children}</label>;
}
