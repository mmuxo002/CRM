"use client";

import { useState, useEffect, useRef } from "react";
import { Send, MessageSquare, ListChecks } from "lucide-react";

type Note = {
  id: string;
  body: string;
  createdAt: string;
  author: { id: string; name: string | null; image: string | null };
  kind: "project" | "task";
  task: { id: string; title: string } | null;
};

export function ProjectNotesChat({ projectId }: { projectId: string }) {
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch(`/api/projects/${projectId}/notes`)
      .then((r) => r.json())
      .then((d) => { setNotes(d.notes || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, [projectId]);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [notes]);

  const send = async () => {
    if (!body.trim() || sending) return;
    setSending(true);
    try {
      const res = await fetch(`/api/projects/${projectId}/notes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body: body.trim() }),
      });
      const data = await res.json();
      if (data.note) setNotes((prev) => [...prev, data.note]);
      setBody("");
    } finally {
      setSending(false);
    }
  };

  const grouped = groupByDate(notes);

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "min(600px, 70vh)" }}>
      <div ref={scrollRef} style={{ flex: 1, overflowY: "auto", padding: "0.75rem 0" }}>
        {loading && <div style={{ textAlign: "center", color: "var(--text-muted)", fontSize: "0.85rem", padding: "2rem" }}>Loading notes…</div>}
        {!loading && notes.length === 0 && <div style={{ textAlign: "center", color: "var(--text-muted)", fontSize: "0.85rem", padding: "2rem" }}>No notes yet. Start the conversation below.</div>}
        {grouped.map(({ date, items }) => (
          <div key={date}>
            <div style={{ textAlign: "center", margin: "1rem 0 0.75rem" }}>
              <span style={{ fontSize: "0.65rem", fontWeight: 700, color: "var(--text-muted)", background: "var(--bg-base)", padding: "4px 12px", borderRadius: 999, textTransform: "uppercase", letterSpacing: "0.05em" }}>{date}</span>
            </div>
            {items.map((n) => (
              <NoteMessage key={n.id} note={n} />
            ))}
          </div>
        ))}
      </div>

      <div style={{ borderTop: "1px solid var(--border-color)", padding: "0.75rem 0 0", display: "flex", gap: 8, alignItems: "flex-end" }}>
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
          placeholder="Write a project note… (Enter to send, Shift+Enter for new line)"
          rows={2}
          style={{ flex: 1, padding: "0.6rem 0.75rem", border: "1px solid var(--border-color)", borderRadius: 12, fontSize: "0.85rem", fontFamily: "inherit", resize: "none", outline: "none" }}
        />
        <button onClick={send} disabled={sending || !body.trim()} className="btn btn-primary" style={{ padding: "0.6rem 1rem", borderRadius: 12 }}>
          <Send size={14} />
        </button>
      </div>
    </div>
  );
}

function NoteMessage({ note }: { note: Note }) {
  const isTask = note.kind === "task" && note.task;
  return (
    <div style={{ display: "flex", gap: "0.6rem", padding: "0.5rem 0.75rem", marginBottom: 4 }}>
      {note.author.image ? (
        <img src={note.author.image} alt="" style={{ width: 32, height: 32, borderRadius: "50%", flexShrink: 0, marginTop: 2 }} />
      ) : (
        <div style={{ width: 32, height: 32, borderRadius: "50%", background: "#e2e8f0", flexShrink: 0, marginTop: 2 }} />
      )}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 2 }}>
          <span style={{ fontWeight: 700, fontSize: "0.82rem" }}>{note.author.name || "Unknown"}</span>
          <span style={{ fontSize: "0.65rem", color: "var(--text-muted)" }}>
            {new Date(note.createdAt).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}
          </span>
        </div>

        {isTask && (
          <div style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 4,
            padding: "2px 8px",
            marginBottom: 4,
            borderRadius: 6,
            background: "#7c3aed14",
            border: "1px solid #7c3aed30",
            fontSize: "0.68rem",
            fontWeight: 700,
            color: "#7c3aed",
          }}>
            <ListChecks size={10} />
            {note.task!.title}
          </div>
        )}

        <div style={{
          padding: "0.5rem 0.75rem",
          borderRadius: isTask ? "4px 12px 12px 12px" : "4px 12px 12px 12px",
          background: isTask ? "#f5f3ff" : "var(--bg-base)",
          border: isTask ? "1px solid #ede9fe" : "1px solid var(--border-color)",
          fontSize: "0.85rem",
          lineHeight: 1.5,
          whiteSpace: "pre-wrap",
        }}>
          {note.body}
        </div>
      </div>
    </div>
  );
}

function groupByDate(notes: Note[]) {
  const groups: { date: string; items: Note[] }[] = [];
  for (const n of notes) {
    const d = new Date(n.createdAt).toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric", year: "numeric" });
    const last = groups[groups.length - 1];
    if (last && last.date === d) {
      last.items.push(n);
    } else {
      groups.push({ date: d, items: [n] });
    }
  }
  return groups;
}
