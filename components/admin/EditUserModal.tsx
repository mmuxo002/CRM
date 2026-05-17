"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { X, Loader2, Check, Copy, KeyRound, Save, UserX, UserCheck, AlertCircle } from "lucide-react";

export type AdminUser = {
  id: string;
  name: string | null;
  email: string | null;
  image: string | null;
  title: string | null;
  role: string;
  accessDepartments: string;
  isActive: boolean;
  mustResetPassword: boolean;
  invitedAt: string | null;
  lastSeenAt: string | null;
};

const DEPT_OPTIONS = [
  { id: "development", label: "Development", color: "#4318ff" },
  { id: "crm", label: "CRM", color: "#7c3aed" },
  { id: "sales", label: "Sales", color: "#f59e0b" },
  { id: "marketing", label: "Marketing", color: "#ec4899" },
];

const ROLE_OPTIONS = ["USER", "APPS_DEV", "CRM_DEV", "SALES", "ADMIN"];

function splitName(full: string | null): { first: string; last: string } {
  const t = (full || "").trim();
  if (!t) return { first: "", last: "" };
  const parts = t.split(/\s+/);
  return { first: parts[0], last: parts.slice(1).join(" ") };
}

function parseAccessClient(s: string): { all: boolean; set: Set<string> } {
  const t = (s || "").trim();
  if (!t) return { all: false, set: new Set() };
  if (t === "all") return { all: true, set: new Set() };
  return { all: false, set: new Set(t.split(",").map((x) => x.trim()).filter(Boolean)) };
}

export function EditUserModal({ user, onClose }: { user: AdminUser; onClose: () => void }) {
  const router = useRouter();
  const initialName = splitName(user.name);
  const initialAccess = parseAccessClient(user.accessDepartments);

  const [firstName, setFirstName] = useState(initialName.first);
  const [lastName, setLastName] = useState(initialName.last);
  const [email, setEmail] = useState(user.email ?? "");
  const [image, setImage] = useState(user.image ?? "");
  const [title, setTitle] = useState(user.title ?? "");
  const [role, setRole] = useState(user.role);
  const [allDepts, setAllDepts] = useState(initialAccess.all);
  const [depts, setDepts] = useState<Set<string>>(initialAccess.set);
  const [isActive, setIsActive] = useState(user.isActive);

  const [saving, setSaving] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tempPassword, setTempPassword] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === "Escape") onClose(); }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  function toggleDept(id: string) {
    const next = new Set(depts);
    if (next.has(id)) next.delete(id); else next.add(id);
    setDepts(next);
  }

  async function save() {
    setError(null);
    const nameCombined = [firstName.trim(), lastName.trim()].filter(Boolean).join(" ");
    if (!nameCombined) { setError("First name is required."); return; }
    if (!email.trim()) { setError("Email is required."); return; }

    const accessDepartments = allDepts ? "all" : [...depts].join(",");

    setSaving(true);
    const res = await fetch(`/api/admin/users/${user.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: nameCombined,
        email: email.trim(),
        image: image.trim() || null,
        title: title.trim(),
        role,
        accessDepartments,
        isActive,
      }),
    });
    setSaving(false);
    const j = await res.json().catch(() => ({}));
    if (!res.ok) { setError(j.error || "Save failed"); return; }
    router.refresh();
    onClose();
  }

  async function resetPassword() {
    setError(null);
    setTempPassword(null);
    if (!confirm(`Issue a new temporary password for ${user.name || user.email}? They'll be forced to change it on their next sign-in.`)) return;
    setResetting(true);
    const res = await fetch(`/api/admin/users/${user.id}/reset-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
    setResetting(false);
    const j = await res.json().catch(() => ({}));
    if (!res.ok) { setError(j.error || "Reset failed"); return; }
    setTempPassword(j.tempPassword as string);
    router.refresh();
  }

  const preview = image.trim();
  const avatarFallback = (firstName || email || "?").slice(0, 1).toUpperCase();

  return (
    <div
      role="dialog"
      aria-modal="true"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      style={{
        position: "fixed", inset: 0, zIndex: 1000,
        background: "rgba(15,23,42,0.55)", backdropFilter: "blur(4px)",
        display: "flex", alignItems: "center", justifyContent: "center", padding: "2rem",
      }}
    >
      <div style={{
        background: "white", borderRadius: 16, width: "100%", maxWidth: 620,
        maxHeight: "92vh", display: "flex", flexDirection: "column", overflow: "hidden",
        boxShadow: "0 30px 80px rgba(0,0,0,0.3)",
      }}>
        {/* Header */}
        <div style={{ padding: "1rem 1.25rem", borderBottom: "1px solid #f1f5f9", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            {preview ? (
              <img src={preview} alt="" style={{ width: 38, height: 38, borderRadius: "50%", objectFit: "cover" }} onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
            ) : (
              <div style={{ width: 38, height: 38, borderRadius: "50%", background: "linear-gradient(135deg, #4318ff, #7c3aed)", color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 14 }}>
                {avatarFallback}
              </div>
            )}
            <div>
              <div style={{ fontWeight: 800, fontSize: "0.95rem", color: "#0f172a" }}>Edit user</div>
              <div style={{ fontSize: "0.72rem", color: "#64748b" }}>{user.email}</div>
            </div>
          </div>
          <button onClick={onClose} aria-label="Close" style={{ ...iconBtn, padding: 8 }}>
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div style={{ overflow: "auto", padding: "1.25rem", flex: 1, display: "flex", flexDirection: "column", gap: "1rem" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
            <Labeled label="First name">
              <input value={firstName} onChange={(e) => setFirstName(e.target.value)} style={inputStyle} placeholder="Jane" />
            </Labeled>
            <Labeled label="Last name">
              <input value={lastName} onChange={(e) => setLastName(e.target.value)} style={inputStyle} placeholder="Doe" />
            </Labeled>
          </div>

          <Labeled label="Email">
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} style={inputStyle} placeholder="jane@innovat3.com" />
          </Labeled>

          <Labeled label="Profile picture URL">
            <input value={image} onChange={(e) => setImage(e.target.value)} style={inputStyle} placeholder="https://… (leave blank for gradient initial)" />
            <div style={{ fontSize: "0.7rem", color: "#94a3b8", marginTop: 4 }}>
              Paste any public image URL. Leave blank to show a gradient initial.
            </div>
          </Labeled>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
            <Labeled label="Title">
              <input value={title} onChange={(e) => setTitle(e.target.value)} style={inputStyle} placeholder="Senior Engineer" />
            </Labeled>
            <Labeled label="Role">
              <select value={role} onChange={(e) => setRole(e.target.value)} style={inputStyle}>
                {ROLE_OPTIONS.map((r) => <option key={r} value={r}>{r}</option>)}
              </select>
            </Labeled>
          </div>

          <div>
            <div style={{ fontSize: "0.78rem", fontWeight: 700, marginBottom: 6, color: "#0f172a" }}>Department access</div>
            <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: "0.85rem", fontWeight: 600, marginBottom: 8 }}>
              <input type="checkbox" checked={allDepts} onChange={(e) => setAllDepts(e.target.checked)} />
              All departments
            </label>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {DEPT_OPTIONS.map((d) => {
                const active = allDepts || depts.has(d.id);
                return (
                  <button
                    type="button"
                    key={d.id}
                    onClick={() => !allDepts && toggleDept(d.id)}
                    disabled={allDepts}
                    style={{
                      padding: "0.4rem 0.8rem", borderRadius: 999,
                      border: `1.5px solid ${active ? d.color : "#e2e8f0"}`,
                      background: active ? d.color + "18" : "white",
                      color: active ? d.color : "#64748b",
                      fontWeight: 700, fontSize: "0.78rem",
                      cursor: allDepts ? "not-allowed" : "pointer", opacity: allDepts ? 0.55 : 1,
                    }}
                  >
                    {active && <Check size={11} style={{ display: "inline", marginRight: 4, verticalAlign: "middle" }} />}
                    {d.label}
                  </button>
                );
              })}
            </div>
          </div>

          <label style={{
            display: "flex", alignItems: "center", gap: 10, padding: "0.7rem 0.9rem",
            background: isActive ? "#f0fdf4" : "#fef2f2",
            border: `1px solid ${isActive ? "#bbf7d0" : "#fecaca"}`,
            borderRadius: 10, cursor: "pointer",
          }}>
            <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} />
            {isActive ? <UserCheck size={15} color="#059669" /> : <UserX size={15} color="#b91c1c" />}
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: "0.82rem", fontWeight: 700, color: isActive ? "#065f46" : "#991b1b" }}>
                {isActive ? "Active — can sign in" : "Deactivated — sign-in blocked"}
              </div>
              <div style={{ fontSize: "0.7rem", color: isActive ? "#065f46" : "#991b1b", opacity: 0.85 }}>
                Uncheck to block this user from signing in without deleting their data.
              </div>
            </div>
          </label>

          {/* Password reset block */}
          <div style={{ marginTop: 4, padding: "0.9rem 1rem", border: "1px dashed #c4b5fd", borderRadius: 10, background: "#f5f3ff" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, marginBottom: tempPassword ? 10 : 0 }}>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: "0.82rem", fontWeight: 800, color: "#5b21b6" }}>
                  <KeyRound size={13} /> Password
                </div>
                <div style={{ fontSize: "0.72rem", color: "#6d28d9", marginTop: 2 }}>
                  {user.mustResetPassword
                    ? "This user still has their original temporary password pending."
                    : "Issue a new temporary password — the user will be forced to change it on next sign-in."}
                </div>
              </div>
              <button onClick={resetPassword} disabled={resetting} style={{ ...iconBtn, background: "white", borderColor: "#c4b5fd", color: "#5b21b6", opacity: resetting ? 0.7 : 1 }}>
                {resetting ? <><Loader2 size={13} style={{ animation: "spin 0.9s linear infinite" }} /> Resetting…</> : <><KeyRound size={13} /> Reset password</>}
              </button>
            </div>
            {tempPassword && (
              <div style={{ background: "white", border: "1px solid #c4b5fd", borderRadius: 8, padding: "0.6rem 0.8rem", display: "flex", alignItems: "center", gap: 8 }}>
                <code style={{ flex: 1, fontSize: "0.9rem", fontWeight: 700, letterSpacing: "0.02em", color: "#0f172a" }}>{tempPassword}</code>
                <button
                  onClick={() => { navigator.clipboard.writeText(tempPassword); setCopied(true); setTimeout(() => setCopied(false), 1500); }}
                  style={iconBtn}
                >
                  {copied ? <><Check size={12} /> Copied</> : <><Copy size={12} /> Copy</>}
                </button>
              </div>
            )}
          </div>

          {error && (
            <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 10, padding: "0.7rem 0.9rem", color: "#991b1b", fontSize: "0.82rem", display: "flex", gap: 8, alignItems: "flex-start" }}>
              <AlertCircle size={14} style={{ marginTop: 2, flexShrink: 0 }} /> {error}
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ padding: "0.85rem 1.25rem", borderTop: "1px solid #f1f5f9", display: "flex", justifyContent: "flex-end", gap: 8 }}>
          <button onClick={onClose} style={iconBtn}>Cancel</button>
          <button
            onClick={save}
            disabled={saving}
            style={{
              display: "inline-flex", alignItems: "center", gap: 6,
              padding: "8px 14px", borderRadius: 8, border: "none",
              background: "#4318ff", color: "white", fontWeight: 700, fontSize: "0.82rem", cursor: "pointer",
              opacity: saving ? 0.7 : 1,
            }}
          >
            {saving ? <Loader2 size={13} style={{ animation: "spin 0.9s linear infinite" }} /> : <Save size={13} />}
            {saving ? "Saving…" : "Save changes"}
          </button>
        </div>
      </div>

      <style jsx global>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

function Labeled({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label style={{ display: "flex", flexDirection: "column", gap: 4, fontSize: "0.75rem", fontWeight: 700, color: "#0f172a" }}>
      {label}
      {children}
    </label>
  );
}

const inputStyle: React.CSSProperties = {
  padding: "0.6rem 0.8rem", borderRadius: 8,
  border: "1px solid #e2e8f0", fontSize: "0.88rem", outline: "none",
  width: "100%", fontFamily: "var(--font-sans)", color: "#0f172a", background: "white",
};

const iconBtn: React.CSSProperties = {
  display: "inline-flex", alignItems: "center", gap: 6,
  padding: "7px 12px", borderRadius: 8,
  border: "1px solid #e2e8f0", background: "white",
  fontSize: "0.78rem", fontWeight: 700, color: "#475569", cursor: "pointer",
};
