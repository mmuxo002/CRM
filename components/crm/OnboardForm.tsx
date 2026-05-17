"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { SERVICE_TYPES } from "@/lib/crm";
import { UserPlus, Sparkles } from "lucide-react";

export function OnboardForm() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [f, setF] = useState({
    companyName: "",
    contactName: "",
    companyEmail: "",
    companyPhone: "",
    companyWebsite: "",
    projectName: "",
    serviceType: "",
    description: "",
    dueDate: "",
    mrr: "",
    priority: "MEDIUM",
  });

  const update = (k: string, v: string) => setF((p) => ({ ...p, [k]: v }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!f.companyName || !f.contactName || !f.companyEmail || !f.companyPhone || !f.serviceType) {
      setError("Business name, contact name, email, phone, and service are all required.");
      return;
    }
    if (!f.projectName) update("projectName", `${f.companyName} · ${SERVICE_TYPES.find((s) => s.id === f.serviceType)?.label || "Engagement"}`);
    setSubmitting(true);
    const res = await fetch("/api/crm/projects", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(f) });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Failed");
      setSubmitting(false);
      return;
    }
    router.push(`/dev/crm/projects/${data.id}`);
  };

  const autofillProjectName = () => {
    if (f.companyName && f.serviceType && !f.projectName) {
      const svc = SERVICE_TYPES.find((s) => s.id === f.serviceType)?.label || "Engagement";
      update("projectName", `${f.companyName} · ${svc}`);
    }
  };

  return (
    <form onSubmit={submit} style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.25rem" }}>
      <div className="card" style={{ gridColumn: "span 2" }}>
        <h3 style={{ fontSize: "0.9rem", fontWeight: 800, marginBottom: "0.75rem", color: "#7c3aed" }}>1 · Client</h3>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
          <Field label="Business name *"><input value={f.companyName} onChange={(e) => update("companyName", e.target.value)} onBlur={autofillProjectName} className="input" placeholder="Acme Inc." /></Field>
          <Field label="Contact name *"><input value={f.contactName} onChange={(e) => update("contactName", e.target.value)} className="input" placeholder="Jane Doe" /></Field>
          <Field label="Email *"><input value={f.companyEmail} onChange={(e) => update("companyEmail", e.target.value)} className="input" placeholder="jane@acme.com" /></Field>
          <Field label="Phone number *"><input value={f.companyPhone} onChange={(e) => update("companyPhone", e.target.value)} className="input" placeholder="+1 …" /></Field>
          <Field label="Website" full><input value={f.companyWebsite} onChange={(e) => update("companyWebsite", e.target.value)} className="input" placeholder="acme.com" /></Field>
        </div>
      </div>

      <div className="card" style={{ gridColumn: "span 2" }}>
        <h3 style={{ fontSize: "0.9rem", fontWeight: 800, marginBottom: "0.75rem", color: "#7c3aed" }}>2 · Service</h3>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "0.6rem" }}>
          {SERVICE_TYPES.map((s) => (
            <button type="button" key={s.id} onClick={() => { update("serviceType", s.id); setTimeout(autofillProjectName, 0); }}
              style={{ padding: "0.75rem 0.9rem", border: `2px solid ${f.serviceType === s.id ? s.color : "var(--border-color)"}`, background: f.serviceType === s.id ? s.color + "14" : "var(--bg-surface)", borderRadius: 12, cursor: "pointer", textAlign: "left", display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ width: 10, height: 10, borderRadius: 999, background: s.color, flexShrink: 0 }} />
              <span style={{ fontWeight: 700, fontSize: "0.85rem" }}>{s.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="card" style={{ gridColumn: "span 2" }}>
        <h3 style={{ fontSize: "0.9rem", fontWeight: 800, marginBottom: "0.75rem", color: "#7c3aed" }}>3 · Engagement details</h3>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
          <Field label="Project name *"><input value={f.projectName} onChange={(e) => update("projectName", e.target.value)} className="input" placeholder="Acme · GHL Automation Buildout" /></Field>
          <Field label="Priority">
            <select value={f.priority} onChange={(e) => update("priority", e.target.value)} className="input">
              <option value="LOW">Low</option><option value="MEDIUM">Medium</option><option value="HIGH">High</option>
            </select>
          </Field>
          <Field label="Target go-live"><input type="date" value={f.dueDate} onChange={(e) => update("dueDate", e.target.value)} className="input" /></Field>
          <Field label="Monthly recurring ($)"><input type="number" value={f.mrr} onChange={(e) => update("mrr", e.target.value)} className="input" placeholder="0" /></Field>
          <Field label="Scope summary" full>
            <textarea value={f.description} onChange={(e) => update("description", e.target.value)} rows={3} className="input" placeholder="What's in scope? What does success look like?" />
          </Field>
        </div>
      </div>

      {error && <div className="card" style={{ gridColumn: "span 2", background: "#fee2e2", color: "#b91c1c", fontSize: "0.85rem", fontWeight: 600 }}>{error}</div>}

      <div style={{ gridColumn: "span 2", display: "flex", justifyContent: "flex-end", gap: "0.5rem" }}>
        <button type="button" onClick={() => history.back()} className="btn btn-ghost">Cancel</button>
        <button type="submit" disabled={submitting} className="btn btn-primary" style={{ background: "linear-gradient(135deg, #7c3aed, #ec4899)", borderColor: "transparent", padding: "0.65rem 1.25rem" }}>
          {submitting ? <><Sparkles size={14} /> Creating…</> : <><UserPlus size={14} /> Onboard & Open Project</>}
        </button>
      </div>

      <style>{`.input { padding: 0.55rem 0.75rem; border: 1px solid var(--border-color); border-radius: 10px; font-size: 0.85rem; background: var(--bg-surface); font-family: inherit; width: 100%; outline: none; color: var(--text-primary); } .input:focus { border-color: #7c3aed; }`}</style>
    </form>
  );
}

function Field({ label, children, full }: { label: string; children: React.ReactNode; full?: boolean }) {
  return (
    <label style={{ display: "flex", flexDirection: "column", gap: 4, gridColumn: full ? "span 2" : undefined }}>
      <span style={{ fontSize: "0.7rem", fontWeight: 700, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.04em" }}>{label}</span>
      {children}
    </label>
  );
}
