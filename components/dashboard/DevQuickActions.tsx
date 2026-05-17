"use client";

import { useState, useEffect } from "react";
import { Plus, ListChecks, Calendar, PhoneCall, X, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { PRDDrafterModal } from "./PRDDrafterModal";
import { ScheduleMeetingModal } from "./ScheduleMeetingModal";

type TeamMember = { id: string; name: string | null; email: string | null };
type ProjectOption = { id: string; name: string; companyName: string | null };

type Action =
  | { kind: "new-project"; label: string; color: string; icon: any }
  | { kind: "new-task"; label: string; color: string; icon: any }
  | { kind: "schedule-standup"; label: string; color: string; icon: any }
  | { kind: "schedule-internal"; label: string; color: string; icon: any };

export function DevQuickActions({ team, members, primary }: { team: "APPS" | "CRM"; members: TeamMember[]; primary: string }) {
  const [prdOpen, setPrdOpen] = useState(false);
  const [taskOpen, setTaskOpen] = useState(false);
  const [meeting, setMeeting] = useState<null | "standup" | "internal">(null);

  const actions: Action[] = [
    { kind: "new-project", label: "New Project", color: primary, icon: Plus },
    { kind: "new-task", label: "User Story", color: "#06b6d4", icon: ListChecks },
    { kind: "schedule-standup", label: "Schedule Stand-up", color: "#f59e0b", icon: Calendar },
    { kind: "schedule-internal", label: "Schedule Internal Call", color: "#7c3aed", icon: PhoneCall },
  ];

  function handle(a: Action) {
    if (a.kind === "new-project") setPrdOpen(true);
    else if (a.kind === "new-task") setTaskOpen(true);
    else if (a.kind === "schedule-standup") setMeeting("standup");
    else if (a.kind === "schedule-internal") setMeeting("internal");
  }

  return (
    <>
      <div className="quick-action-row" style={{ gridTemplateColumns: `repeat(${actions.length}, 1fr)` }}>
        {actions.map((a) => (
          <div
            key={a.kind}
            onClick={() => handle(a)}
            className="quick-action-card"
          >
            <div className="qa-icon" style={{ background: a.color, color: "white", width: 36, height: 36, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center" }}><a.icon size={18} /></div>
            <div>
              <div style={{ fontWeight: 700, fontSize: "0.875rem" }}>{a.label}</div>
              <div style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>Quick action</div>
            </div>
          </div>
        ))}
      </div>

      <PRDDrafterModal open={prdOpen} onClose={() => setPrdOpen(false)} team={team} managers={members} />
      <ScheduleMeetingModal
        open={meeting !== null}
        onClose={() => setMeeting(null)}
        team={team}
        kind={meeting === "standup" ? "CLIENT_STANDUP" : "INTERNAL_CALL"}
        attendees={members}
      />
      {taskOpen && <NewTaskModal team={team} members={members} onClose={() => setTaskOpen(false)} />}
    </>
  );
}

function NewTaskModal({ team, members, onClose }: { team: "APPS" | "CRM"; members: TeamMember[]; onClose: () => void }) {
  const router = useRouter();
  const [projects, setProjects] = useState<ProjectOption[]>([]);
  const [projectId, setProjectId] = useState("");
  const [title, setTitle] = useState("");
  const [assignedTo, setAssignedTo] = useState("");
  const [priority, setPriority] = useState("MEDIUM");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/meetings/projects?team=${team}`)
      .then((r) => r.json())
      .then((d) => Array.isArray(d) && setProjects(d))
      .catch(() => {});
  }, [team]);

  const save = async () => {
    setError(null);
    if (!projectId) { setError("Select a project."); return; }
    if (!title.trim()) { setError("Title is required."); return; }
    setSaving(true);
    try {
      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId,
          title: title.trim(),
          description: description.trim() || undefined,
          assignedTo: assignedTo || undefined,
          priority,
          dueDate: dueDate || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create task");
      onClose();
      router.refresh();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  const inputStyle: React.CSSProperties = { width: "100%", padding: "0.55rem 0.75rem", border: "1px solid var(--border-color)", borderRadius: 8, fontSize: "0.88rem", background: "white" };

  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,0.55)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", padding: "1.5rem" }}>
      <div onClick={(e) => e.stopPropagation()} style={{ background: "white", borderRadius: 16, width: "min(480px, 100%)", maxHeight: "92vh", display: "flex", flexDirection: "column", boxShadow: "0 30px 60px rgba(0,0,0,0.3)" }}>
        <div style={{ padding: "1rem 1.25rem", borderBottom: "1px solid var(--border-color)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: "#06b6d4", color: "white", display: "flex", alignItems: "center", justifyContent: "center" }}><ListChecks size={18} /></div>
            <div>
              <div style={{ fontWeight: 800, fontSize: "0.95rem" }}>User Story</div>
              <div style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>Create a user story on any {team === "CRM" ? "CRM" : "Development"} project</div>
            </div>
          </div>
          <button onClick={onClose} style={{ background: "transparent", border: "none", cursor: "pointer", color: "var(--text-muted)" }}><X size={18} /></button>
        </div>

        <div style={{ padding: "1rem 1.25rem", overflowY: "auto", display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          <div>
            <label style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--text-secondary)", marginBottom: 5, display: "block" }}>Project *</label>
            <select value={projectId} onChange={(e) => setProjectId(e.target.value)} style={inputStyle}>
              <option value="">— Select a project —</option>
              {projects.map((p) => <option key={p.id} value={p.id}>{p.companyName ? `${p.companyName} · ${p.name}` : p.name}</option>)}
            </select>
          </div>

          <div>
            <label style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--text-secondary)", marginBottom: 5, display: "block" }}>Title *</label>
            <input value={title} onChange={(e) => setTitle(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") save(); }} placeholder="What needs to be done?" style={inputStyle} autoFocus />
          </div>

          <div>
            <label style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--text-secondary)", marginBottom: 5, display: "block" }}>Description</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} placeholder="Add details, context, or acceptance criteria…" style={{ ...inputStyle, fontFamily: "inherit", resize: "vertical" }} />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
            <div>
              <label style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--text-secondary)", marginBottom: 5, display: "block" }}>Assignee</label>
              <select value={assignedTo} onChange={(e) => setAssignedTo(e.target.value)} style={inputStyle}>
                <option value="">Unassigned</option>
                {members.map((m) => <option key={m.id} value={m.id}>{m.name || m.email}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--text-secondary)", marginBottom: 5, display: "block" }}>Priority</label>
              <select value={priority} onChange={(e) => setPriority(e.target.value)} style={inputStyle}>
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
              </select>
            </div>
          </div>

          <div>
            <label style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--text-secondary)", marginBottom: 5, display: "block" }}>Due date</label>
            <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} style={inputStyle} />
          </div>

          {error && <div style={{ color: "#ef4444", fontSize: "0.85rem" }}>{error}</div>}
        </div>

        <div style={{ padding: "1rem 1.25rem", borderTop: "1px solid var(--border-color)", display: "flex", justifyContent: "flex-end", gap: 8 }}>
          <button onClick={onClose} disabled={saving} className="btn btn-ghost">Cancel</button>
          <button onClick={save} disabled={saving || !projectId || !title.trim()} className="btn btn-primary" style={{ background: "#06b6d4", borderColor: "transparent" }}>
            {saving ? <><Loader2 size={14} className="spin" /> Creating…</> : "Create Task"}
          </button>
        </div>
      </div>
    </div>
  );
}
