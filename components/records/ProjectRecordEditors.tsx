"use client";

import { useState, useTransition, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Wrench, CheckCircle2, DollarSign, FileText, Pencil, Check, X, Plus, Trash2, Star, Building2, Folder, UploadCloud, FolderPlus, Send } from "lucide-react";
import { SERVICE_TYPES } from "@/lib/crm";

/* ---------- shared ---------- */

type Assignee = { id: string; name: string | null; image: string | null } | null;
type UserOption = { id: string; name: string | null; image: string | null };

const STATUS_META: Record<string, { label: string; color: string }> = {
  BACKLOG:     { label: "In Queue",    color: "#94a3b8" },
  RESEARCH:    { label: "In Queue",    color: "#94a3b8" },
  IN_PROGRESS: { label: "In Progress", color: "#4318ff" },
  REVIEW:      { label: "In Progress", color: "#4318ff" },
  DONE:        { label: "Completed",   color: "#10b981" },
  BLOCKED:     { label: "Blocked",     color: "#ef4444" },
};

function toBucket(status: string): "IN_QUEUE" | "IN_PROGRESS" | "COMPLETED" | "BLOCKED" {
  if (status === "DONE") return "COMPLETED";
  if (status === "BLOCKED") return "BLOCKED";
  if (status === "IN_PROGRESS" || status === "REVIEW") return "IN_PROGRESS";
  return "IN_QUEUE";
}

function bucketToStatus(b: string): string {
  if (b === "COMPLETED") return "DONE";
  if (b === "IN_PROGRESS") return "IN_PROGRESS";
  if (b === "BLOCKED") return "BLOCKED";
  return "BACKLOG";
}

async function api(url: string, method: string, body?: unknown) {
  const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: body ? JSON.stringify(body) : undefined });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

/* ---------- Editable summary tile ---------- */

export function EditableSummaryTile({
  label, icon, color, children,
}: { label: string; icon: React.ReactNode; color: string; children: React.ReactNode }) {
  return (
    <div className="card" style={{ padding: "1rem" }}>
      <div className="row-between" style={{ marginBottom: "0.4rem" }}>
        <div style={{ fontSize: "0.7rem", textTransform: "uppercase", color: "var(--text-secondary)", letterSpacing: "0.05em", fontWeight: 700 }}>{label}</div>
        <div style={{ color, display: "flex", alignItems: "center", justifyContent: "center", width: 28, height: 28, borderRadius: 8, background: color + "18" }}>{icon}</div>
      </div>
      <div style={{ fontSize: "1.1rem", fontWeight: 800 }}>{children}</div>
    </div>
  );
}

/* ---------- Service selector ---------- */

export function ServiceEditor({ projectId, initial }: { projectId: string; initial: string | null }) {
  const [value, setValue] = useState(initial || "");
  const [open, setOpen] = useState(false);
  const [pending, start] = useTransition();
  const router = useRouter();

  const save = (next: string) => {
    setValue(next);
    setOpen(false);
    start(async () => {
      await api(`/api/projects/${projectId}`, "PATCH", { serviceType: next || null });
      router.refresh();
    });
  };

  const meta = SERVICE_TYPES.find((s) => s.id === value);
  return (
    <div style={{ position: "relative" }}>
      <button onClick={() => setOpen((o) => !o)} disabled={pending} style={{ background: "transparent", border: "none", padding: 0, fontWeight: 800, fontSize: "1.1rem", cursor: "pointer", color: "var(--text-primary)", display: "flex", alignItems: "center", gap: 6 }}>
        {meta?.label || value || "—"} <Pencil size={12} style={{ color: "var(--text-muted)" }} />
      </button>
      {open && (
        <div style={{ position: "absolute", top: "100%", left: 0, zIndex: 20, marginTop: 4, background: "var(--bg-surface)", border: "1px solid var(--border-color)", borderRadius: 10, padding: 6, minWidth: 200, boxShadow: "0 8px 24px rgba(0,0,0,0.12)" }}>
          {SERVICE_TYPES.map((s) => (
            <button key={s.id} onClick={() => save(s.id)} style={{ display: "block", width: "100%", textAlign: "left", padding: "6px 10px", background: s.id === value ? s.color + "18" : "transparent", color: s.color, border: "none", borderRadius: 6, cursor: "pointer", fontSize: "0.85rem", fontWeight: 700 }}>
              {s.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* ---------- Onboarded date ---------- */

export function OnboardedEditor({ projectId, initial }: { projectId: string; initial: string | null }) {
  const [value, setValue] = useState(initial ? initial.slice(0, 10) : "");
  const [editing, setEditing] = useState(false);
  const [pending, start] = useTransition();
  const router = useRouter();

  const save = (v: string) => {
    setValue(v);
    start(async () => {
      await api(`/api/projects/${projectId}`, "PATCH", { onboardedAt: v || null });
      router.refresh();
    });
    setEditing(false);
  };

  if (editing) {
    return (
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        <input type="date" defaultValue={value} onBlur={(e) => save(e.target.value)} autoFocus style={{ padding: "4px 6px", border: "1px solid var(--border-color)", borderRadius: 6, fontSize: "0.85rem" }} />
        <button onClick={() => setEditing(false)} style={{ background: "transparent", border: "none", cursor: "pointer" }}><X size={14} /></button>
      </div>
    );
  }
  return (
    <button onClick={() => setEditing(true)} disabled={pending} style={{ background: "transparent", border: "none", padding: 0, fontWeight: 800, fontSize: "1.1rem", cursor: "pointer", color: "var(--text-primary)", display: "flex", alignItems: "center", gap: 6 }}>
      {value ? new Date(value).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "Pending"} <Pencil size={12} style={{ color: "var(--text-muted)" }} />
    </button>
  );
}

/* ---------- MRR ---------- */

export function MrrEditor({ projectId, initial }: { projectId: string; initial: number }) {
  const [value, setValue] = useState(initial);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(String(initial));
  const [pending, start] = useTransition();
  const router = useRouter();

  const save = () => {
    const n = Number(draft);
    if (Number.isNaN(n)) return setEditing(false);
    setValue(n);
    setEditing(false);
    start(async () => {
      await api(`/api/projects/${projectId}`, "PATCH", { mrr: n });
      router.refresh();
    });
  };

  if (editing) {
    return (
      <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
        <span>$</span>
        <input type="number" value={draft} onChange={(e) => setDraft(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") save(); if (e.key === "Escape") setEditing(false); }} autoFocus style={{ width: 100, padding: "4px 6px", border: "1px solid var(--border-color)", borderRadius: 6, fontSize: "0.95rem", fontWeight: 800 }} />
        <button onClick={save} style={{ background: "transparent", border: "none", cursor: "pointer", color: "#10b981" }}><Check size={14} /></button>
      </div>
    );
  }
  return (
    <button onClick={() => { setDraft(String(value)); setEditing(true); }} disabled={pending} style={{ background: "transparent", border: "none", padding: 0, fontWeight: 800, fontSize: "1.1rem", cursor: "pointer", color: "var(--text-primary)", display: "flex", alignItems: "center", gap: 6 }}>
      {value > 0 ? `$${value.toLocaleString()}` : "—"} <Pencil size={12} style={{ color: "var(--text-muted)" }} />
    </button>
  );
}

/* ---------- Tags ---------- */

type Tag = { id: string; label: string; color: string };
const TAG_COLORS = ["#4318ff", "#7c3aed", "#ec4899", "#f59e0b", "#10b981", "#06b6d4", "#ef4444", "#6366f1"];

export function TagsEditor({ projectId, initial }: { projectId: string; initial: Tag[] }) {
  const [tags, setTags] = useState(initial);
  const [adding, setAdding] = useState(false);
  const [label, setLabel] = useState("");
  const [color, setColor] = useState(TAG_COLORS[0]);
  const router = useRouter();

  const add = async () => {
    if (!label.trim()) return;
    const { tag } = await api("/api/tags", "POST", { projectId, label: label.trim(), color });
    setTags((t) => [...t, tag]);
    setLabel("");
    setAdding(false);
    router.refresh();
  };
  const remove = async (id: string) => {
    setTags((t) => t.filter((x) => x.id !== id));
    await api("/api/tags", "DELETE", { id });
    router.refresh();
  };

  return (
    <div className="flex-gap" style={{ flexWrap: "wrap", gap: 6 }}>
      {tags.length === 0 && !adding && <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>No tags yet.</span>}
      {tags.map((t) => (
        <span key={t.id} style={{ background: t.color + "22", color: t.color, padding: "3px 8px", borderRadius: 6, fontSize: "0.72rem", fontWeight: 700, display: "inline-flex", alignItems: "center", gap: 4 }}>
          {t.label}
          <button onClick={() => remove(t.id)} style={{ background: "transparent", border: "none", cursor: "pointer", color: t.color, padding: 0, display: "flex" }}><X size={10} /></button>
        </span>
      ))}
      {adding ? (
        <div style={{ display: "flex", alignItems: "center", gap: 4, flexBasis: "100%" }}>
          <input value={label} onChange={(e) => setLabel(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") add(); if (e.key === "Escape") setAdding(false); }} placeholder="Tag" autoFocus style={{ padding: "4px 8px", border: "1px solid var(--border-color)", borderRadius: 6, fontSize: "0.75rem", width: 100 }} />
          <div style={{ display: "flex", gap: 2 }}>
            {TAG_COLORS.map((c) => (
              <button key={c} onClick={() => setColor(c)} style={{ width: 14, height: 14, borderRadius: "50%", background: c, border: color === c ? "2px solid var(--text-primary)" : "1px solid var(--border-color)", cursor: "pointer" }} />
            ))}
          </div>
          <button onClick={add} className="btn btn-ghost" style={{ padding: "2px 8px", fontSize: "0.72rem" }}>Add</button>
          <button onClick={() => setAdding(false)} style={{ background: "transparent", border: "none", cursor: "pointer" }}><X size={12} /></button>
        </div>
      ) : (
        <button onClick={() => setAdding(true)} className="btn btn-ghost" style={{ padding: "2px 8px", fontSize: "0.72rem" }}><Plus size={10} /> Tag</button>
      )}
    </div>
  );
}

/* ---------- Client (company) editor ---------- */

type Company = { id: string; name: string; industry: string | null; website: string | null; phone: string | null; headquarters: string | null };

export function ClientEditor({ company }: { company: Company }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(company);
  const router = useRouter();

  const save = async () => {
    await api(`/api/companies/${company.id}`, "PATCH", draft);
    setEditing(false);
    router.refresh();
  };

  if (!editing) {
    return (
      <>
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.75rem" }}>
          <div style={{ width: 40, height: 40, borderRadius: 10, background: "#f1f5f9", display: "flex", alignItems: "center", justifyContent: "center" }}><Building2 size={20} /></div>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 700, fontSize: "0.88rem" }}>{company.name}</div>
            <div style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>{company.industry || "—"}</div>
          </div>
          <button onClick={() => setEditing(true)} className="btn btn-ghost" style={{ padding: "4px 8px" }}><Pencil size={12} /></button>
        </div>
        <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)", display: "grid", gap: 4 }}>
          {company.website && <div>🌐 {company.website}</div>}
          {company.headquarters && <div>📍 {company.headquarters}</div>}
          {company.phone && <div>📞 {company.phone}</div>}
        </div>
      </>
    );
  }

  return (
    <div style={{ display: "grid", gap: 6 }}>
      {(["name", "industry", "website", "phone", "headquarters"] as const).map((k) => (
        <input key={k} value={draft[k] || ""} onChange={(e) => setDraft({ ...draft, [k]: e.target.value })} placeholder={k} style={{ padding: "6px 8px", border: "1px solid var(--border-color)", borderRadius: 6, fontSize: "0.8rem" }} />
      ))}
      <div style={{ display: "flex", gap: 6 }}>
        <button onClick={save} className="btn btn-primary" style={{ padding: "4px 10px", fontSize: "0.75rem" }}>Save</button>
        <button onClick={() => { setDraft(company); setEditing(false); }} className="btn btn-ghost" style={{ padding: "4px 10px", fontSize: "0.75rem" }}>Cancel</button>
      </div>
    </div>
  );
}

/* ---------- Primary contact ---------- */

type Contact = { id: string; name: string; email: string | null; title: string | null; phone: string | null; avatarUrl: string | null; isPrimary: boolean };

export function PrimaryContactEditor({ companyId, contacts: initial }: { companyId: string | null; contacts: Contact[] }) {
  const [contacts, setContacts] = useState(initial);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState<Partial<Contact>>({});
  const router = useRouter();

  const primary = contacts.find((c) => c.isPrimary) || contacts[0];

  const makePrimary = async (id: string) => {
    setContacts((cs) => cs.map((c) => ({ ...c, isPrimary: c.id === id })));
    await api(`/api/contacts/${id}`, "PATCH", { isPrimary: true });
    router.refresh();
  };
  const saveEdit = async (id: string) => {
    await api(`/api/contacts/${id}`, "PATCH", draft);
    setContacts((cs) => cs.map((c) => (c.id === id ? { ...c, ...draft } as Contact : c)));
    setEditingId(null);
    setDraft({});
    router.refresh();
  };
  const remove = async (id: string) => {
    setContacts((cs) => cs.filter((c) => c.id !== id));
    await api(`/api/contacts/${id}`, "DELETE");
    router.refresh();
  };
  const add = async () => {
    if (!draft.name) return;
    const res = await api("/api/contacts", "POST", { ...draft, companyId, isPrimary: contacts.length === 0 });
    setContacts((cs) => [...cs, res.contact]);
    setDraft({});
    setAdding(false);
    router.refresh();
  };

  return (
    <div>
      {contacts.length === 0 && !adding && <div style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginBottom: 8 }}>No contacts yet.</div>}
      {contacts.map((c) => {
        const isEditing = editingId === c.id;
        return (
          <div key={c.id} style={{ padding: "0.4rem 0", borderBottom: "1px solid var(--border-color)" }}>
            {isEditing ? (
              <div style={{ display: "grid", gap: 4 }}>
                {(["name", "email", "title", "phone"] as const).map((k) => (
                  <input key={k} defaultValue={c[k] || ""} onChange={(e) => setDraft((d) => ({ ...d, [k]: e.target.value }))} placeholder={k} style={{ padding: "4px 6px", border: "1px solid var(--border-color)", borderRadius: 6, fontSize: "0.75rem" }} />
                ))}
                <div style={{ display: "flex", gap: 4 }}>
                  <button onClick={() => saveEdit(c.id)} className="btn btn-primary" style={{ padding: "2px 8px", fontSize: "0.7rem" }}>Save</button>
                  <button onClick={() => { setEditingId(null); setDraft({}); }} className="btn btn-ghost" style={{ padding: "2px 8px", fontSize: "0.7rem" }}>Cancel</button>
                </div>
              </div>
            ) : (
              <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
                {c.avatarUrl ? <img src={c.avatarUrl} style={{ width: 32, height: 32, borderRadius: "50%" }} alt="" /> : <div style={{ width: 32, height: 32, borderRadius: "50%", background: "#e2e8f0" }} />}
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: "0.82rem", display: "flex", alignItems: "center", gap: 4 }}>
                    {c.name}
                    {c.isPrimary && <Star size={10} style={{ color: "#f59e0b", fill: "#f59e0b" }} />}
                  </div>
                  <div style={{ fontSize: "0.7rem", color: "var(--accent-primary)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{c.email}</div>
                  {c.title && <div style={{ fontSize: "0.65rem", color: "var(--text-muted)" }}>{c.title}</div>}
                </div>
                <div style={{ display: "flex", gap: 2 }}>
                  {!c.isPrimary && <button onClick={() => makePrimary(c.id)} title="Make primary" className="btn btn-ghost" style={{ padding: "2px 6px" }}><Star size={10} /></button>}
                  <button onClick={() => { setEditingId(c.id); setDraft({}); }} className="btn btn-ghost" style={{ padding: "2px 6px" }}><Pencil size={10} /></button>
                  <button onClick={() => remove(c.id)} className="btn btn-ghost" style={{ padding: "2px 6px", color: "#ef4444" }}><Trash2 size={10} /></button>
                </div>
              </div>
            )}
          </div>
        );
      })}
      {adding ? (
        <div style={{ display: "grid", gap: 4, marginTop: 8 }}>
          {(["name", "email", "title", "phone"] as const).map((k) => (
            <input key={k} onChange={(e) => setDraft((d) => ({ ...d, [k]: e.target.value }))} placeholder={k} style={{ padding: "4px 6px", border: "1px solid var(--border-color)", borderRadius: 6, fontSize: "0.75rem" }} />
          ))}
          <div style={{ display: "flex", gap: 4 }}>
            <button onClick={add} className="btn btn-primary" style={{ padding: "2px 8px", fontSize: "0.7rem" }}>Add</button>
            <button onClick={() => { setAdding(false); setDraft({}); }} className="btn btn-ghost" style={{ padding: "2px 8px", fontSize: "0.7rem" }}>Cancel</button>
          </div>
        </div>
      ) : (
        <button onClick={() => setAdding(true)} className="btn btn-ghost" style={{ marginTop: 8, fontSize: "0.7rem", padding: "4px 8px" }}><Plus size={10} /> Contact</button>
      )}
    </div>
  );
}

/* ---------- Task detail modal ---------- */

type TaskFull = {
  id: string;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  dueDate: string | null;
  assignee: Assignee;
  platformTag: string | null;
};

type TaskComment = { id: string; body: string; createdAt: string; author: { id: string; name: string | null; image: string | null } };

export function TaskDetailModal({
  task, users, onClose, onSaved, onDeleted,
}: {
  task: TaskFull;
  users: UserOption[];
  onClose: () => void;
  onSaved: (t: TaskFull) => void;
  onDeleted: (id: string) => void;
}) {
  const [draft, setDraft] = useState<TaskFull>(task);
  const [comments, setComments] = useState<TaskComment[]>([]);
  const [noteBody, setNoteBody] = useState("");
  const [loadingComments, setLoadingComments] = useState(true);
  const router = useRouter();

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/tasks/${task.id}/comments`).then((r) => r.json()).then((d) => {
      if (!cancelled) { setComments(d.comments || []); setLoadingComments(false); }
    }).catch(() => setLoadingComments(false));
    return () => { cancelled = true; };
  }, [task.id]);

  const addNote = async () => {
    if (!noteBody.trim()) return;
    const res = await api(`/api/tasks/${task.id}/comments`, "POST", { body: noteBody });
    setComments((c) => [...c, res.comment]);
    setNoteBody("");
  };

  const patch = async (patch: Partial<TaskFull> & { assignedTo?: string | null }) => {
    const next = { ...draft, ...patch };
    setDraft(next);
    await api(`/api/tasks/${task.id}`, "PATCH", patch);
    onSaved(next);
    router.refresh();
  };

  const del = async () => {
    if (!confirm("Delete this task?")) return;
    await api(`/api/tasks/${task.id}`, "DELETE");
    onDeleted(task.id);
    router.refresh();
    onClose();
  };

  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(15, 23, 42, 0.4)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", padding: "2rem" }}>
      <div onClick={(e) => e.stopPropagation()} className="card" style={{ width: "100%", maxWidth: 560, padding: "1.5rem", background: "var(--bg-surface)" }}>
        <div className="row-between" style={{ marginBottom: "1rem" }}>
          <input value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} onBlur={() => patch({ title: draft.title })} style={{ fontSize: "1.15rem", fontWeight: 800, border: "none", background: "transparent", outline: "none", flex: 1 }} />
          <button onClick={onClose} className="btn btn-ghost"><X size={14} /></button>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "0.75rem", marginBottom: "1rem" }}>
          <Field label="Status">
            <select value={draft.status} onChange={(e) => patch({ status: e.target.value })} style={selectStyle}>
              <option value="BACKLOG">In Queue</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="REVIEW">In Review</option>
              <option value="DONE">Completed</option>
              <option value="BLOCKED">Blocked</option>
            </select>
          </Field>
          <Field label="Priority">
            <select value={draft.priority} onChange={(e) => patch({ priority: e.target.value })} style={selectStyle}>
              <option value="LOW">Low</option>
              <option value="MEDIUM">Medium</option>
              <option value="HIGH">High</option>
            </select>
          </Field>
          <Field label="Assignee">
            <select value={draft.assignee?.id || ""} onChange={(e) => {
              const u = users.find((x) => x.id === e.target.value) || null;
              patch({ assignedTo: e.target.value || null, assignee: u });
            }} style={selectStyle}>
              <option value="">Unassigned</option>
              {users.map((u) => <option key={u.id} value={u.id}>{u.name || u.id}</option>)}
            </select>
          </Field>
          <Field label="Due date">
            <input type="date" value={draft.dueDate ? draft.dueDate.slice(0, 10) : ""} onChange={(e) => patch({ dueDate: e.target.value || null })} style={selectStyle} />
          </Field>
        </div>

        <Field label="Description">
          <textarea value={draft.description || ""} onChange={(e) => setDraft({ ...draft, description: e.target.value })} onBlur={() => patch({ description: draft.description })} rows={4} placeholder="What's being done…" style={{ ...selectStyle, fontFamily: "inherit", resize: "vertical" }} />
        </Field>

        <div style={{ marginTop: "1rem" }}>
          <div className="row-between" style={{ marginBottom: 6 }}>
            <div style={{ fontSize: "0.7rem", textTransform: "uppercase", color: "var(--text-muted)", fontWeight: 700 }}>Comments {comments.length > 0 && <span style={{ color: "var(--text-secondary)", fontWeight: 800 }}>({comments.length})</span>}</div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 0, maxHeight: 260, overflowY: "auto", marginBottom: 10, border: comments.length ? "1px solid var(--border-color)" : "none", borderRadius: 10, padding: comments.length ? "0.5rem" : 0 }}>
            {loadingComments && <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", padding: "0.5rem" }}>Loading…</div>}
            {!loadingComments && comments.length === 0 && <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>No comments yet. Start the conversation below.</div>}
            {comments.map((c, i) => {
              const initials = (c.author.name || "?").split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();
              const colors = ["#7c3aed", "#4318ff", "#ec4899", "#f59e0b", "#10b981", "#ef4444"];
              const bg = colors[c.author.id.charCodeAt(0) % colors.length];
              return (
                <div key={c.id} style={{ padding: "0.55rem 0.6rem", borderBottom: i < comments.length - 1 ? "1px solid var(--border-color)" : "none" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                    {c.author.image
                      ? <img src={c.author.image} alt="" style={{ width: 24, height: 24, borderRadius: "50%" }} />
                      : <div style={{ width: 24, height: 24, borderRadius: "50%", background: bg, color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.6rem", fontWeight: 800 }}>{initials}</div>}
                    <span style={{ fontWeight: 700, fontSize: "0.78rem" }}>{c.author.name || "Unknown"}</span>
                    <span style={{ fontSize: "0.65rem", color: "var(--text-muted)", marginLeft: "auto" }}>{timeAgo(c.createdAt)}</span>
                  </div>
                  <div style={{ fontSize: "0.82rem", whiteSpace: "pre-wrap", lineHeight: 1.5, paddingLeft: 32, color: "var(--text-primary)" }}>{c.body}</div>
                </div>
              );
            })}
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "flex-end" }}>
            <textarea
              value={noteBody}
              onChange={(e) => setNoteBody(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) { e.preventDefault(); addNote(); } }}
              rows={2}
              placeholder="Write a comment… (⌘ Enter to submit)"
              style={{ ...selectStyle, fontFamily: "inherit", resize: "vertical", flex: 1 }}
            />
            <button onClick={addNote} disabled={!noteBody.trim()} className="btn btn-primary" style={{ height: 40 }}><Send size={13} /></button>
          </div>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", marginTop: "1rem" }}>
          <button onClick={del} className="btn btn-ghost" style={{ color: "#ef4444" }}><Trash2 size={12} /> Delete</button>
          <button onClick={onClose} className="btn btn-primary">Done</button>
        </div>
      </div>
    </div>
  );
}

const selectStyle: React.CSSProperties = { width: "100%", padding: "6px 8px", border: "1px solid var(--border-color)", borderRadius: 8, fontSize: "0.85rem", background: "var(--bg-base)" };

function timeAgo(iso: string) {
  const ms = Date.now() - new Date(iso).getTime();
  const m = Math.floor(ms / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 30) return `${d}d ago`;
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div style={{ fontSize: "0.7rem", textTransform: "uppercase", color: "var(--text-muted)", fontWeight: 700, marginBottom: 4 }}>{label}</div>
      {children}
    </div>
  );
}

/* ---------- Task list with click-to-open modal ---------- */

export function TasksWithModal({ projectId, initial, users, autoOpenId }: { projectId: string; initial: TaskFull[]; users: UserOption[]; autoOpenId?: string | null }) {
  const [tasks, setTasks] = useState(initial);
  const [openId, setOpenId] = useState<string | null>(autoOpenId ?? null);
  useEffect(() => { if (autoOpenId) setOpenId(autoOpenId); }, [autoOpenId]);
  const [adding, setAdding] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const router = useRouter();

  const open = tasks.find((t) => t.id === openId);

  const create = async () => {
    if (!newTitle.trim()) return;
    const res = await api("/api/tasks", "POST", { projectId, title: newTitle.trim() });
    setTasks((ts) => [...ts, { id: res.id, title: newTitle.trim(), description: null, status: "BACKLOG", priority: "MEDIUM", dueDate: null, assignee: null, platformTag: null }]);
    setNewTitle("");
    setAdding(false);
    router.refresh();
  };

  return (
    <>
      <div style={{ display: "flex", flexDirection: "column" }}>
        {tasks.length === 0 && <div style={{ color: "var(--text-muted)", fontSize: "0.85rem", padding: "0.75rem 0" }}>No tasks yet.</div>}
        {tasks.map((t) => {
          const daysTo = t.dueDate ? Math.ceil((new Date(t.dueDate).getTime() - Date.now()) / 86400000) : null;
          const meta = STATUS_META[t.status] || STATUS_META.BACKLOG;
          return (
            <button key={t.id} onClick={() => setOpenId(t.id)} className="task-row" style={{ background: "transparent", border: "none", borderBottom: "1px solid var(--border-color)", padding: "0.6rem 0", width: "100%", textAlign: "left", cursor: "pointer", display: "flex", alignItems: "center", gap: "0.75rem" }}>
              <span style={{ width: 8, height: 8, borderRadius: 2, background: meta.color, flexShrink: 0 }} />
              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: "0.88rem", textDecoration: t.status === "DONE" ? "line-through" : "none", opacity: t.status === "DONE" ? 0.6 : 1 }}>{t.title}</div>
                <div style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>{meta.label}{t.assignee?.name ? ` · ${t.assignee.name}` : ""}</div>
              </div>
              <span className={`priority-${t.priority.toLowerCase()}`} style={{ fontSize: 10 }}>{t.priority}</span>
              {daysTo !== null && <span className={`badge ${daysTo < 0 ? "badge-red" : daysTo <= 3 ? "badge-orange" : "badge-gray"}`} style={{ fontSize: 10 }}>{daysTo < 0 ? `${-daysTo}d over` : daysTo === 0 ? "Today" : `${daysTo}d`}</span>}
              {t.assignee?.image ? <img src={t.assignee.image} alt="" style={{ width: 24, height: 24, borderRadius: "50%" }} /> : <div style={{ width: 24, height: 24, borderRadius: "50%", background: "#e2e8f0" }} />}
            </button>
          );
        })}
      </div>

      <div style={{ marginTop: "0.75rem" }}>
        {adding ? (
          <div style={{ display: "flex", gap: 6 }}>
            <input value={newTitle} onChange={(e) => setNewTitle(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") create(); if (e.key === "Escape") setAdding(false); }} placeholder="Task title" autoFocus style={{ flex: 1, padding: "6px 10px", border: "1px solid var(--border-color)", borderRadius: 8, fontSize: "0.85rem" }} />
            <button onClick={create} className="btn btn-primary" style={{ fontSize: "0.8rem" }}>Add</button>
            <button onClick={() => { setAdding(false); setNewTitle(""); }} className="btn btn-ghost" style={{ fontSize: "0.8rem" }}>Cancel</button>
          </div>
        ) : (
          <button onClick={() => setAdding(true)} className="btn btn-ghost" style={{ fontSize: "0.8rem" }}><Plus size={12} /> New Task</button>
        )}
      </div>

      {open && (
        <TaskDetailModal
          task={open}
          users={users}
          onClose={() => setOpenId(null)}
          onSaved={(t) => setTasks((prev) => prev.map((x) => (x.id === t.id ? t : x)))}
          onDeleted={(id) => setTasks((prev) => prev.filter((x) => x.id !== id))}
        />
      )}
    </>
  );
}

/* ---------- Internal kanban ---------- */

const KANBAN_COLS: { id: "IN_QUEUE" | "IN_PROGRESS" | "COMPLETED" | "BLOCKED"; title: string; color: string }[] = [
  { id: "IN_QUEUE",    title: "In Queue",    color: "#94a3b8" },
  { id: "IN_PROGRESS", title: "In Progress", color: "#4318ff" },
  { id: "COMPLETED",   title: "Completed",   color: "#10b981" },
  { id: "BLOCKED",     title: "Blocked",     color: "#ef4444" },
];

export function InternalKanban({ projectId, initial, users, autoOpenId }: { projectId: string; initial: TaskFull[]; users: UserOption[]; autoOpenId?: string | null }) {
  const [tasks, setTasks] = useState(initial);
  const [dragId, setDragId] = useState<string | null>(null);
  const [openId, setOpenId] = useState<string | null>(autoOpenId ?? null);
  useEffect(() => { if (autoOpenId) setOpenId(autoOpenId); }, [autoOpenId]);
  const router = useRouter();
  const open = tasks.find((t) => t.id === openId);

  // keep in sync when parent refreshes
  useEffect(() => { setTasks(initial); }, [initial]);

  const move = async (id: string, bucket: string) => {
    const t = tasks.find((x) => x.id === id);
    if (!t) return;
    const nextStatus = bucketToStatus(bucket);
    if (toBucket(t.status) === bucket) return;
    setTasks((prev) => prev.map((x) => (x.id === id ? { ...x, status: nextStatus } : x)));
    await api(`/api/tasks/${id}`, "PATCH", { status: nextStatus });
    router.refresh();
  };

  return (
    <>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0,1fr))", gap: "0.65rem" }}>
        {KANBAN_COLS.map((c) => {
          const items = tasks.filter((t) => toBucket(t.status) === c.id);
          return (
            <div
              key={c.id}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => { if (dragId) { move(dragId, c.id); setDragId(null); } }}
              style={{ background: "var(--bg-base)", borderRadius: 12, padding: "0.6rem", border: "1px solid var(--border-color)", minHeight: 160 }}
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
                    onClick={() => setOpenId(t.id)}
                    style={{ padding: "0.55rem 0.65rem", background: "var(--bg-surface)", border: "1px solid var(--border-color)", borderRadius: 10, cursor: "grab", fontSize: "0.8rem" }}
                  >
                    <div style={{ fontWeight: 700, lineHeight: 1.25 }}>{t.title}</div>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 4, fontSize: "0.7rem", color: "var(--text-muted)" }}>
                      <span className={`priority-${t.priority.toLowerCase()}`} style={{ fontSize: 10 }}>{t.priority}</span>
                      {t.assignee?.image ? <img src={t.assignee.image} alt="" style={{ width: 18, height: 18, borderRadius: "50%" }} /> : null}
                    </div>
                  </div>
                ))}
                {items.length === 0 && <div style={{ fontSize: "0.7rem", color: "var(--text-muted)", padding: "0.5rem 0.25rem" }}>Drop tasks here</div>}
              </div>
            </div>
          );
        })}
      </div>

      {open && (
        <TaskDetailModal
          task={open}
          users={users}
          onClose={() => setOpenId(null)}
          onSaved={(t) => setTasks((prev) => prev.map((x) => (x.id === t.id ? t : x)))}
          onDeleted={(id) => setTasks((prev) => prev.filter((x) => x.id !== id))}
        />
      )}
    </>
  );
}

/* ---------- Files & Folders inline editor ---------- */

type FileItem = { id: string; name: string; format: string; url: string; isLink: boolean; folderId: string | null };
type FolderItem = { id: string; name: string; color: string };

export function FilesFoldersEditor({
  projectId, initialFolders, initialFiles,
}: {
  projectId: string;
  initialFolders: FolderItem[];
  initialFiles: FileItem[];
}) {
  const [folders, setFolders] = useState(initialFolders);
  const [files, setFiles] = useState(initialFiles);
  const [addingFolder, setAddingFolder] = useState(false);
  const [folderName, setFolderName] = useState("");
  const [addingLinkForFolder, setAddingLinkForFolder] = useState<string | "ROOT" | null>(null);
  const [linkDraft, setLinkDraft] = useState({ name: "", url: "" });
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadTargetFolder, setUploadTargetFolder] = useState<string | null>(null);
  const router = useRouter();

  const createFolder = async () => {
    if (!folderName.trim()) return;
    const folder = await api("/api/folders", "POST", { projectId, name: folderName.trim() });
    setFolders((f) => [...f, folder]);
    setFolderName("");
    setAddingFolder(false);
    router.refresh();
  };
  const deleteFolder = async (id: string) => {
    if (!confirm("Delete folder? Files inside will move to root.")) return;
    setFolders((f) => f.filter((x) => x.id !== id));
    setFiles((fs) => fs.map((f) => (f.folderId === id ? { ...f, folderId: null } : f)));
    await api(`/api/folders/${id}`, "DELETE");
    router.refresh();
  };
  const addLink = async (folderId: string | null) => {
    if (!linkDraft.name.trim() || !linkDraft.url.trim()) return;
    const file = await api("/api/files", "POST", { projectId, folderId, name: linkDraft.name.trim(), url: linkDraft.url.trim(), isLink: true, format: "LINK" });
    setFiles((fs) => [...fs, file]);
    setLinkDraft({ name: "", url: "" });
    setAddingLinkForFolder(null);
    router.refresh();
  };
  const deleteFile = async (id: string) => {
    setFiles((fs) => fs.filter((x) => x.id !== id));
    await api("/api/files", "DELETE", { id });
    router.refresh();
  };
  const triggerUpload = (folderId: string | null) => {
    setUploadTargetFolder(folderId);
    fileInputRef.current?.click();
  };
  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const list = e.target.files;
    if (!list) return;
    for (const f of Array.from(list)) {
      const fmt = f.name.split(".").pop()?.toUpperCase() || "FILE";
      const file = await api("/api/files", "POST", {
        projectId,
        folderId: uploadTargetFolder,
        name: f.name,
        url: `#/${f.name}`,
        format: fmt,
        isLink: false,
      });
      setFiles((fs) => [...fs, file]);
    }
    e.target.value = "";
    router.refresh();
  };

  const rootFiles = files.filter((f) => !f.folderId);

  return (
    <div>
      <input ref={fileInputRef} type="file" multiple onChange={handleUpload} style={{ display: "none" }} />

      <div className="row-between" style={{ marginBottom: "0.75rem" }}>
        <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", fontWeight: 700 }}>{files.length} file{files.length === 1 ? "" : "s"} · {folders.length} folder{folders.length === 1 ? "" : "s"}</div>
        <div className="flex-gap">
          <button onClick={() => triggerUpload(null)} className="btn btn-ghost" style={{ fontSize: "0.75rem" }}><UploadCloud size={12} /> Upload</button>
          <button onClick={() => setAddingFolder(true)} className="btn btn-ghost" style={{ fontSize: "0.75rem" }}><FolderPlus size={12} /> Folder</button>
        </div>
      </div>

      {addingFolder && (
        <div style={{ display: "flex", gap: 6, marginBottom: 8 }}>
          <input value={folderName} onChange={(e) => setFolderName(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") createFolder(); if (e.key === "Escape") setAddingFolder(false); }} placeholder="Folder name" autoFocus style={{ flex: 1, padding: "4px 8px", border: "1px solid var(--border-color)", borderRadius: 6, fontSize: "0.8rem" }} />
          <button onClick={createFolder} className="btn btn-primary" style={{ fontSize: "0.75rem" }}>Add</button>
          <button onClick={() => setAddingFolder(false)} className="btn btn-ghost" style={{ fontSize: "0.75rem" }}>Cancel</button>
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {folders.map((f) => {
          const items = files.filter((x) => x.folderId === f.id);
          return (
            <div key={f.id} style={{ border: "1px solid var(--border-color)", borderRadius: 10, padding: "0.5rem 0.7rem", background: "var(--bg-base)" }}>
              <div className="row-between">
                <div className="flex-gap" style={{ gap: 6 }}><Folder size={14} style={{ color: f.color }} /><span style={{ fontWeight: 700, fontSize: "0.85rem" }}>{f.name}</span><span style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>{items.length}</span></div>
                <div className="flex-gap" style={{ gap: 4 }}>
                  <button onClick={() => triggerUpload(f.id)} className="btn btn-ghost" style={{ fontSize: "0.7rem", padding: "2px 6px" }}><UploadCloud size={10} /></button>
                  <button onClick={() => setAddingLinkForFolder(f.id)} className="btn btn-ghost" style={{ fontSize: "0.7rem", padding: "2px 6px" }}><Plus size={10} /> Link</button>
                  <button onClick={() => deleteFolder(f.id)} className="btn btn-ghost" style={{ fontSize: "0.7rem", padding: "2px 6px", color: "#ef4444" }}><Trash2 size={10} /></button>
                </div>
              </div>
              {addingLinkForFolder === f.id && <LinkForm draft={linkDraft} setDraft={setLinkDraft} onAdd={() => addLink(f.id)} onCancel={() => setAddingLinkForFolder(null)} />}
              {items.map((file) => <FileRow key={file.id} file={file} onDelete={() => deleteFile(file.id)} />)}
            </div>
          );
        })}

        {rootFiles.length > 0 && (
          <div style={{ paddingTop: 4 }}>
            <div style={{ fontSize: "0.7rem", color: "var(--text-muted)", fontWeight: 700, marginBottom: 4 }}>Root</div>
            {rootFiles.map((file) => <FileRow key={file.id} file={file} onDelete={() => deleteFile(file.id)} />)}
          </div>
        )}
        {addingLinkForFolder === "ROOT" && <LinkForm draft={linkDraft} setDraft={setLinkDraft} onAdd={() => addLink(null)} onCancel={() => setAddingLinkForFolder(null)} />}

        <button onClick={() => setAddingLinkForFolder("ROOT")} className="btn btn-ghost" style={{ fontSize: "0.72rem", alignSelf: "flex-start", marginTop: 4 }}><Plus size={10} /> Add link</button>
      </div>
    </div>
  );
}

function LinkForm({ draft, setDraft, onAdd, onCancel }: { draft: { name: string; url: string }; setDraft: (v: { name: string; url: string }) => void; onAdd: () => void; onCancel: () => void }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1.5fr auto auto", gap: 4, marginTop: 6 }}>
      <input value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} placeholder="Label" style={{ padding: "4px 6px", border: "1px solid var(--border-color)", borderRadius: 6, fontSize: "0.75rem" }} />
      <input value={draft.url} onChange={(e) => setDraft({ ...draft, url: e.target.value })} placeholder="https://…" style={{ padding: "4px 6px", border: "1px solid var(--border-color)", borderRadius: 6, fontSize: "0.75rem" }} />
      <button onClick={onAdd} className="btn btn-primary" style={{ fontSize: "0.7rem" }}>Add</button>
      <button onClick={onCancel} className="btn btn-ghost" style={{ fontSize: "0.7rem" }}><X size={10} /></button>
    </div>
  );
}

function FileRow({ file, onDelete }: { file: FileItem; onDelete: () => void }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "4px 0", borderTop: "1px solid var(--border-color)" }}>
      <FileText size={12} style={{ color: "var(--text-muted)" }} />
      {file.isLink ? (
        <a href={file.url} target="_blank" rel="noreferrer" style={{ flex: 1, fontSize: "0.78rem", color: "var(--accent-primary)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{file.name}</a>
      ) : (
        <span style={{ flex: 1, fontSize: "0.78rem" }}>{file.name}</span>
      )}
      <span style={{ fontSize: "0.65rem", color: "var(--text-muted)" }}>{file.format}</span>
      <button onClick={onDelete} className="btn btn-ghost" style={{ padding: "2px 4px", color: "#ef4444" }}><Trash2 size={10} /></button>
    </div>
  );
}
