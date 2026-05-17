"use client";

import { useState, useTransition, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { CRM_STAGES } from "@/lib/crm";
import { CheckCircle2, Circle, Plus, Send, Trash2 } from "lucide-react";

type Task = { id: string; title: string; status: string; dueDate: string | null; assignee: { id: string; name: string | null; image: string | null } | null };
type Note = { id: string; body: string; createdAt: string; author: { id: string; name: string | null; image: string | null } };

export function StageSelector({ projectId, initial }: { projectId: string; initial: string }) {
  const [stage, setStage] = useState(initial);
  const [pending, start] = useTransition();
  const router = useRouter();

  const change = async (next: string) => {
    if (next === stage) return;
    setStage(next);
    await fetch("/api/crm/projects/move", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: projectId, toColumn: next }) });
    start(() => router.refresh());
  };

  return (
    <div className="flex-gap" style={{ gap: 6, flexWrap: "wrap" }}>
      {CRM_STAGES.map((s) => (
        <button
          key={s.id}
          onClick={() => change(s.id)}
          disabled={pending}
          className="btn"
          style={{ padding: "0.35rem 0.75rem", fontSize: "0.75rem", background: stage === s.id ? s.color : "transparent", color: stage === s.id ? "white" : "var(--text-secondary)", border: `1px solid ${stage === s.id ? s.color : "var(--border-color)"}`, fontWeight: 700 }}
        >
          {s.short}
        </button>
      ))}
    </div>
  );
}

export function TaskList({ projectId, initial }: { projectId: string; initial: Task[] }) {
  const [tasks, setTasks] = useState(initial);
  const [title, setTitle] = useState("");
  const [adding, setAdding] = useState(false);
  const router = useRouter();

  const add = async () => {
    if (!title.trim()) return;
    setAdding(true);
    const res = await fetch("/api/crm/tasks", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ projectId, title: title.trim() }) });
    const data = await res.json();
    if (res.ok) {
      setTasks((prev) => [...prev, { id: data.id, title: title.trim(), status: "BACKLOG", dueDate: null, assignee: null }]);
      setTitle("");
      router.refresh();
    }
    setAdding(false);
  };

  const toggle = async (id: string, status: string) => {
    const next = status === "DONE" ? "IN_PROGRESS" : "DONE";
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, status: next } : t)));
    await fetch("/api/crm/tasks", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, status: next }) });
    router.refresh();
  };

  const done = tasks.filter((t) => t.status === "DONE").length;

  return (
    <div>
      <div className="row-between" style={{ marginBottom: "0.75rem" }}>
        <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", fontWeight: 700 }}>{done} of {tasks.length} complete</div>
        <div className="progress-bar-bg" style={{ width: 120 }}><div className="progress-bar-fill" style={{ width: `${tasks.length ? (done / tasks.length) * 100 : 0}%`, background: "#7c3aed" }} /></div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {tasks.map((t) => (
          <div key={t.id} style={{ display: "flex", alignItems: "center", gap: "0.6rem", padding: "0.55rem 0.75rem", background: t.status === "DONE" ? "#f0fdf4" : "var(--bg-base)", borderRadius: 10, border: "1px solid " + (t.status === "DONE" ? "#bbf7d0" : "var(--border-color)") }}>
            <button onClick={() => toggle(t.id, t.status)} style={{ background: "transparent", border: "none", cursor: "pointer", color: t.status === "DONE" ? "#10b981" : "var(--text-muted)", display: "flex", alignItems: "center" }}>
              {t.status === "DONE" ? <CheckCircle2 size={18} /> : <Circle size={18} />}
            </button>
            <span style={{ flex: 1, fontSize: "0.875rem", textDecoration: t.status === "DONE" ? "line-through" : "none", color: t.status === "DONE" ? "var(--text-muted)" : "var(--text-primary)" }}>{t.title}</span>
            {t.dueDate && <span style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>{new Date(t.dueDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span>}
            {t.assignee?.image && <img src={t.assignee.image} alt="" style={{ width: 20, height: 20, borderRadius: "50%" }} />}
          </div>
        ))}
      </div>
      <div style={{ display: "flex", gap: 6, marginTop: "0.75rem" }}>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") add(); }}
          placeholder="Add a task (enter to save)"
          style={{ flex: 1, padding: "0.55rem 0.75rem", border: "1px solid var(--border-color)", borderRadius: 10, fontSize: "0.85rem", outline: "none" }}
        />
        <button onClick={add} disabled={adding || !title.trim()} className="btn btn-primary" style={{ background: "#7c3aed", borderColor: "#7c3aed" }}><Plus size={14} /></button>
      </div>
    </div>
  );
}

export function NoteList({ projectId, initial }: { projectId: string; initial: Note[] }) {
  const [notes, setNotes] = useState(initial);
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  const scrollToBottom = () => {
    if (listRef.current) listRef.current.scrollTop = listRef.current.scrollHeight;
  };

  useEffect(() => { scrollToBottom(); }, [notes.length]);

  const submit = async () => {
    if (!body.trim()) return;
    setSending(true);
    const res = await fetch("/api/crm/notes", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ projectId, body: body.trim() }) });
    const data = await res.json();
    if (res.ok && data.comment) {
      setNotes((prev) => [...prev, {
        id: data.comment.id,
        body: data.comment.body,
        createdAt: data.comment.createdAt,
        author: data.comment.author,
      }]);
      setBody("");
      router.refresh();
    }
    setSending(false);
  };

  const COLORS = ["#7c3aed", "#4318ff", "#ec4899", "#f59e0b", "#10b981", "#ef4444"];

  return (
    <div>
      <div style={{ fontSize: "0.7rem", textTransform: "uppercase", color: "var(--text-muted)", fontWeight: 700, marginBottom: 8 }}>
        Comments {notes.length > 0 && <span style={{ color: "var(--text-secondary)", fontWeight: 800 }}>({notes.length})</span>}
      </div>

      <div ref={listRef} style={{ display: "flex", flexDirection: "column", gap: 0, maxHeight: 360, overflowY: "auto", marginBottom: 10, border: notes.length ? "1px solid var(--border-color)" : "none", borderRadius: 10, padding: notes.length ? "0.5rem" : 0 }}>
        {notes.length === 0 && <div style={{ color: "var(--text-muted)", fontSize: "0.82rem", textAlign: "center", padding: "1.5rem" }}>No comments yet. Start the conversation below.</div>}
        {notes.map((n, i) => {
          const initials = (n.author.name || "?").split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();
          const bg = COLORS[n.author.id.charCodeAt(0) % COLORS.length];
          return (
            <div key={n.id} style={{ padding: "0.6rem 0.65rem", borderBottom: i < notes.length - 1 ? "1px solid var(--border-color)" : "none" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                {n.author.image
                  ? <img src={n.author.image} alt="" style={{ width: 26, height: 26, borderRadius: "50%" }} />
                  : <div style={{ width: 26, height: 26, borderRadius: "50%", background: bg, color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.6rem", fontWeight: 800 }}>{initials}</div>}
                <span style={{ fontWeight: 700, fontSize: "0.8rem" }}>{n.author.name || "Unknown"}</span>
                <span style={{ fontSize: "0.65rem", color: "var(--text-muted)", marginLeft: "auto" }}>{timeAgo(n.createdAt)}</span>
              </div>
              <div style={{ fontSize: "0.85rem", whiteSpace: "pre-wrap", lineHeight: 1.5, paddingLeft: 34, color: "var(--text-primary)" }}>{n.body}</div>
            </div>
          );
        })}
      </div>

      <div style={{ display: "flex", gap: 8, alignItems: "flex-end" }}>
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) { e.preventDefault(); submit(); } }}
          placeholder="Write a comment… (⌘ Enter to submit)"
          rows={2}
          style={{ flex: 1, padding: "0.55rem 0.75rem", border: "1px solid var(--border-color)", borderRadius: 10, fontSize: "0.85rem", fontFamily: "inherit", resize: "vertical", outline: "none" }}
        />
        <button onClick={submit} disabled={sending || !body.trim()} className="btn btn-primary" style={{ background: "#7c3aed", borderColor: "#7c3aed", height: 40 }}><Send size={14} /></button>
      </div>
    </div>
  );
}

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
