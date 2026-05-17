"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, X } from "lucide-react";
import { CAMPAIGN_SERVICES, CAMPAIGN_NICHES } from "@/lib/campaign-taxonomy";

const COLOR_CHOICES = ["#ec4899", "#4318ff", "#7c3aed", "#06b6d4", "#10b981", "#f59e0b", "#ef4444", "#3b82f6"];

export function NewCampaignButton() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [entityName, setEntityName] = useState("");
  const [description, setDescription] = useState("");
  const [funnelUrl, setFunnelUrl] = useState("");
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [service, setService] = useState("");
  const [niche, setNiche] = useState("");
  const [coverColor, setCoverColor] = useState(COLOR_CHOICES[0]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const res = await fetch("/api/campaigns", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, entityName, description, funnelUrl, websiteUrl, service, niche, coverColor }),
    });
    setLoading(false);
    const j = await res.json().catch(() => ({}));
    if (!res.ok) { setError(j.error || "Failed to create campaign"); return; }
    setOpen(false);
    setName(""); setEntityName(""); setDescription(""); setFunnelUrl(""); setWebsiteUrl(""); setService(""); setNiche("");
    router.push(`/marketing/campaigns/${j.campaign.id}`);
    router.refresh();
  }

  return (
    <>
      <button onClick={() => setOpen(true)} className="btn btn-primary" style={{ background: "linear-gradient(135deg, #ec4899, #7c3aed)", borderColor: "transparent" }}>
        <Plus size={14} /> New Campaign
      </button>

      {open && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(15, 23, 42, 0.55)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50, padding: "1rem" }} onClick={() => setOpen(false)}>
          <div onClick={(e) => e.stopPropagation()} style={{ background: "white", borderRadius: 16, padding: "1.75rem", width: "100%", maxWidth: 520, boxShadow: "0 20px 60px rgba(0,0,0,0.25)" }}>
            <div className="row-between" style={{ marginBottom: "1rem" }}>
              <h2 style={{ fontSize: "1.15rem", fontWeight: 800 }}>New Campaign</h2>
              <button onClick={() => setOpen(false)} className="btn btn-ghost" style={{ padding: "0.3rem 0.5rem" }}><X size={14} /></button>
            </div>
            <form onSubmit={onSubmit} style={{ display: "grid", gap: "0.75rem" }}>
              <Labeled label="Campaign name *"><input required value={name} onChange={(e) => setName(e.target.value)} style={inputStyle} placeholder="Santa Monica Honda" /></Labeled>
              <Labeled label="Entity / client name"><input value={entityName} onChange={(e) => setEntityName(e.target.value)} style={inputStyle} placeholder="Honda of Santa Monica" /></Labeled>
              <Labeled label="Description"><textarea value={description} onChange={(e) => setDescription(e.target.value)} style={{ ...inputStyle, minHeight: 70, resize: "vertical" }} placeholder="Monthly trade-in + financing offer funnel…" /></Labeled>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem" }}>
                <Labeled label="Funnel URL"><input value={funnelUrl} onChange={(e) => setFunnelUrl(e.target.value)} style={inputStyle} placeholder="https://funnel.example.com" /></Labeled>
                <Labeled label="Website URL"><input value={websiteUrl} onChange={(e) => setWebsiteUrl(e.target.value)} style={inputStyle} placeholder="https://client.example.com" /></Labeled>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem" }}>
                <Labeled label="Service">
                  <select value={service} onChange={(e) => setService(e.target.value)} style={inputStyle}>
                    <option value="">Select service…</option>
                    {CAMPAIGN_SERVICES.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </Labeled>
                <Labeled label="Niche">
                  <select value={niche} onChange={(e) => setNiche(e.target.value)} style={inputStyle}>
                    <option value="">Select niche…</option>
                    {CAMPAIGN_NICHES.map((n) => <option key={n} value={n}>{n}</option>)}
                  </select>
                </Labeled>
              </div>
              <div>
                <div style={{ fontSize: "0.75rem", fontWeight: 700, marginBottom: 6 }}>Cover color</div>
                <div style={{ display: "flex", gap: 6 }}>
                  {COLOR_CHOICES.map((c) => (
                    <button type="button" key={c} onClick={() => setCoverColor(c)} style={{ width: 26, height: 26, borderRadius: 8, background: c, border: coverColor === c ? "3px solid #0f172a" : "2px solid transparent", cursor: "pointer" }} />
                  ))}
                </div>
              </div>
              {error && <div style={{ background: "#fee2e2", color: "#b91c1c", fontSize: "0.8rem", padding: "0.6rem 0.85rem", borderRadius: 8, fontWeight: 600 }}>{error}</div>}
              <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 4 }}>
                <button type="button" onClick={() => setOpen(false)} className="btn btn-ghost">Cancel</button>
                <button type="submit" disabled={loading} className="btn btn-primary" style={{ opacity: loading ? 0.6 : 1 }}>{loading ? "Creating…" : "Create campaign"}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

const inputStyle: React.CSSProperties = { padding: "0.55rem 0.75rem", borderRadius: 8, border: "1px solid var(--border-color)", fontSize: "0.88rem", outline: "none", width: "100%" };

function Labeled({ label, children }: { label: string; children: React.ReactNode }) {
  return <label style={{ display: "flex", flexDirection: "column", gap: 4, fontSize: "0.75rem", fontWeight: 700 }}>{label}{children}</label>;
}
