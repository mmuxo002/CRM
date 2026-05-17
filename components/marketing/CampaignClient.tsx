"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Link2, FileText, Tag as TagIcon, UserPlus, ExternalLink, X } from "lucide-react";

type Tag = { id: string; label: string; color: string; leads: number; prospects: number; clients: number; contacts: { id: string; name: string; email: string | null; status: string }[] };
type Link = { id: string; label: string; url: string; kind: string };
type File = { id: string; name: string; format: string; url: string; createdAt: string; uploader: { name: string | null; image: string | null } | null };

export function CampaignClient({ campaignId, coverColor, tags, links, files }: { campaignId: string; coverColor: string; tags: Tag[]; links: Link[]; files: File[] }) {
  const router = useRouter();
  const [tab, setTab] = useState<"tags" | "links" | "files">("tags");

  return (
    <div>
      <div className="record-tabs" style={{ marginBottom: "1rem" }}>
        <div className={`record-tab ${tab === "tags" ? "active" : ""}`} onClick={() => setTab("tags")} style={{ cursor: "pointer" }}><TagIcon size={12} style={{ display: "inline", marginRight: 4 }} /> Tags & Contacts ({tags.length})</div>
        <div className={`record-tab ${tab === "links" ? "active" : ""}`} onClick={() => setTab("links")} style={{ cursor: "pointer" }}><Link2 size={12} style={{ display: "inline", marginRight: 4 }} /> Links ({links.length})</div>
        <div className={`record-tab ${tab === "files" ? "active" : ""}`} onClick={() => setTab("files")} style={{ cursor: "pointer" }}><FileText size={12} style={{ display: "inline", marginRight: 4 }} /> Assets ({files.length})</div>
      </div>

      {tab === "tags" && <TagsPanel campaignId={campaignId} coverColor={coverColor} tags={tags} onChange={() => router.refresh()} />}
      {tab === "links" && <LinksPanel campaignId={campaignId} coverColor={coverColor} links={links} onChange={() => router.refresh()} />}
      {tab === "files" && <FilesPanel files={files} />}
    </div>
  );
}

/* ---------------- Tags ---------------- */

function TagsPanel({ campaignId, coverColor, tags, onChange }: { campaignId: string; coverColor: string; tags: Tag[]; onChange: () => void }) {
  const [newTag, setNewTag] = useState("");
  const [newColor, setNewColor] = useState(coverColor);
  const [addingTo, setAddingTo] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function createTag() {
    if (!newTag.trim()) return;
    setBusy(true);
    await fetch(`/api/campaigns/${campaignId}/tags`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ label: newTag.trim(), color: newColor }) });
    setBusy(false);
    setNewTag("");
    onChange();
  }

  return (
    <div style={{ display: "grid", gap: "1rem" }}>
      <div className="card" style={{ padding: "1rem", display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
        <input value={newTag} onChange={(e) => setNewTag(e.target.value)} placeholder="New tag label…" style={inputStyle} />
        <input type="color" value={newColor} onChange={(e) => setNewColor(e.target.value)} style={{ width: 36, height: 36, border: "1px solid var(--border-color)", borderRadius: 8, cursor: "pointer", padding: 0 }} />
        <button onClick={createTag} disabled={busy || !newTag.trim()} className="btn btn-primary" style={{ background: coverColor, borderColor: coverColor, opacity: busy ? 0.6 : 1 }}>
          <Plus size={14} /> Add Tag
        </button>
      </div>

      {tags.length === 0 && <div className="card" style={{ textAlign: "center", padding: "2rem", color: "var(--text-muted)" }}>No tags yet. Create one to start attributing contacts.</div>}

      {tags.map((t) => (
        <div key={t.id} className="card">
          <div className="row-between" style={{ marginBottom: "0.75rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ width: 14, height: 14, borderRadius: 4, background: t.color }} />
              <h3 style={{ fontSize: "1rem", fontWeight: 800 }}>{t.label}</h3>
              <span style={{ fontSize: "0.72rem", color: "var(--text-muted)", fontWeight: 700 }}>{t.contacts.length} contacts</span>
            </div>
            <div style={{ display: "flex", gap: 6 }}>
              <MiniStat label="L" value={t.leads} color="#94a3b8" />
              <MiniStat label="P" value={t.prospects} color="#f59e0b" />
              <MiniStat label="C" value={t.clients} color="#10b981" />
              <button onClick={() => setAddingTo(addingTo === t.id ? null : t.id)} className="btn btn-ghost" style={{ padding: "0.3rem 0.6rem", fontSize: "0.75rem" }}>
                <UserPlus size={12} /> Add Contact
              </button>
            </div>
          </div>

          {addingTo === t.id && <ContactForm campaignId={campaignId} tagId={t.id} color={coverColor} onDone={() => { setAddingTo(null); onChange(); }} />}

          {t.contacts.length === 0 ? (
            <div style={{ fontSize: "0.82rem", color: "var(--text-muted)", padding: "0.5rem 0" }}>No contacts tagged yet.</div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 6 }}>
              {t.contacts.map((c) => {
                const statusColor = c.status === "CLIENT" ? "#10b981" : c.status === "PROSPECT" ? "#f59e0b" : "#94a3b8";
                return (
                  <div key={c.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "0.5rem 0.75rem", border: "1px solid var(--border-color)", borderRadius: 10 }}>
                    <span style={{ width: 8, height: 8, borderRadius: "50%", background: statusColor, flexShrink: 0 }} />
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div style={{ fontWeight: 700, fontSize: "0.82rem", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{c.name}</div>
                      <div style={{ fontSize: "0.68rem", color: "var(--text-muted)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{c.email || "—"}</div>
                    </div>
                    <span className={`badge ${c.status === "CLIENT" ? "badge-green" : c.status === "PROSPECT" ? "badge-orange" : "badge-gray"}`} style={{ fontSize: 9 }}>{c.status}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function ContactForm({ campaignId, tagId, color, onDone }: { campaignId: string; tagId: string; color: string; onDone: () => void }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState("LEAD");
  const [busy, setBusy] = useState(false);

  async function submit() {
    if (!name.trim()) return;
    setBusy(true);
    await fetch(`/api/campaigns/${campaignId}/contacts`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name, email, status, tagId }) });
    setBusy(false);
    onDone();
  }

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr auto auto", gap: 8, marginBottom: "0.75rem", padding: "0.75rem", background: "var(--bg-base)", borderRadius: 10 }}>
      <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Name" style={inputStyle} />
      <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="email@example.com" style={inputStyle} />
      <select value={status} onChange={(e) => setStatus(e.target.value)} style={inputStyle}>
        <option value="LEAD">Lead</option>
        <option value="PROSPECT">Prospect</option>
        <option value="CLIENT">Client</option>
      </select>
      <button onClick={submit} disabled={busy || !name.trim()} className="btn btn-primary" style={{ background: color, borderColor: color, opacity: busy ? 0.6 : 1 }}>Add</button>
    </div>
  );
}

function MiniStat({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div style={{ minWidth: 42, background: color + "18", padding: "0.3rem 0.5rem", borderRadius: 6, textAlign: "center" }}>
      <div style={{ fontSize: "0.6rem", color, fontWeight: 800 }}>{label}</div>
      <div style={{ fontSize: "0.85rem", fontWeight: 800, color }}>{value}</div>
    </div>
  );
}

/* ---------------- Links ---------------- */

function LinksPanel({ campaignId, coverColor, links, onChange }: { campaignId: string; coverColor: string; links: Link[]; onChange: () => void }) {
  const [label, setLabel] = useState("");
  const [url, setUrl] = useState("");
  const [kind, setKind] = useState("FUNNEL");
  const [busy, setBusy] = useState(false);

  async function add() {
    if (!label.trim() || !url.trim()) return;
    setBusy(true);
    await fetch(`/api/campaigns/${campaignId}/links`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ label: label.trim(), url: url.trim(), kind }) });
    setBusy(false);
    setLabel(""); setUrl("");
    onChange();
  }

  return (
    <div style={{ display: "grid", gap: "1rem" }}>
      <div className="card" style={{ padding: "1rem", display: "grid", gridTemplateColumns: "1fr 1.5fr auto auto", gap: 8 }}>
        <input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Label (e.g. Primary Funnel)" style={inputStyle} />
        <input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://…" style={inputStyle} />
        <select value={kind} onChange={(e) => setKind(e.target.value)} style={inputStyle}>
          <option value="FUNNEL">Funnel</option>
          <option value="LANDING">Landing</option>
          <option value="AD">Ad Account</option>
          <option value="OTHER">Other</option>
        </select>
        <button onClick={add} disabled={busy} className="btn btn-primary" style={{ background: coverColor, borderColor: coverColor, opacity: busy ? 0.6 : 1 }}><Plus size={14} /> Add Link</button>
      </div>

      <div className="card">
        {links.length === 0 && <div style={{ textAlign: "center", padding: "1.5rem", color: "var(--text-muted)" }}>No links yet. Add your funnel, landing page, or ad account URLs.</div>}
        {links.map((l) => (
          <div key={l.id} style={{ display: "flex", alignItems: "center", gap: "0.75rem", padding: "0.75rem 0", borderBottom: "1px solid var(--border-color)" }}>
            <div style={{ width: 36, height: 36, borderRadius: 8, background: coverColor + "18", color: coverColor, display: "flex", alignItems: "center", justifyContent: "center" }}><Link2 size={16} /></div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 700, fontSize: "0.88rem" }}>{l.label}</div>
              <a href={l.url} target="_blank" rel="noreferrer" style={{ fontSize: "0.75rem", color: "var(--accent-primary)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", display: "block", maxWidth: 560 }}>{l.url}</a>
            </div>
            <span className="badge badge-gray" style={{ fontSize: 10 }}>{l.kind}</span>
            <a href={l.url} target="_blank" rel="noreferrer" className="btn btn-ghost" style={{ padding: "0.3rem 0.5rem" }}><ExternalLink size={14} /></a>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ---------------- Files ---------------- */

function FilesPanel({ files }: { files: File[] }) {
  return (
    <div className="card">
      {files.length === 0 && <div style={{ textAlign: "center", padding: "2rem", color: "var(--text-muted)" }}>No assets uploaded yet. Attach campaign creative, PDFs, or scripts here.</div>}
      {files.length > 0 && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: "0.75rem" }}>
          {files.map((f) => (
            <div key={f.id} className="folder-card" style={{ padding: "1rem", border: "1px solid var(--border-color)", borderRadius: 12 }}>
              <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", fontWeight: 700 }}>{f.format}</div>
              <div className="name" style={{ marginTop: 4, fontWeight: 700, fontSize: "0.88rem", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{f.name}</div>
              <div style={{ fontSize: "0.7rem", color: "var(--text-muted)", marginTop: 4 }}>{new Date(f.createdAt).toLocaleDateString()}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const inputStyle: React.CSSProperties = { padding: "0.55rem 0.75rem", borderRadius: 8, border: "1px solid var(--border-color)", fontSize: "0.85rem", outline: "none", width: "100%" };
