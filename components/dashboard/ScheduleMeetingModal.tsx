"use client";

import { useEffect, useState } from "react";
import { X, Calendar, Loader2, Briefcase, UserCircle2 } from "lucide-react";
import { useRouter } from "next/navigation";

type Attendee = { id: string; name: string | null; email: string | null };
type ProjectOption = { id: string; name: string; companyName: string | null };
type ProjectDetail = {
  id: string;
  name: string;
  companyName: string | null;
  client: { id: string; name: string; email: string | null; phone: string | null } | null;
  owner: { id: string; name: string | null; email: string | null; image: string | null } | null;
  tasks: { id: string; title: string; status: string; priority: string; dueDate: string | null }[];
};

export function ScheduleMeetingModal({
  open,
  onClose,
  team,
  kind,
  attendees,
}: {
  open: boolean;
  onClose: () => void;
  team: "APPS" | "CRM";
  kind: "CLIENT_STANDUP" | "INTERNAL_CALL";
  attendees: Attendee[];
}) {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [when, setWhen] = useState(() => {
    const d = new Date(Date.now() + 60 * 60 * 1000);
    d.setMinutes(0, 0, 0);
    return d.toISOString().slice(0, 16);
  });
  const [duration, setDuration] = useState(30);
  const [selected, setSelected] = useState<string[]>([]);
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [projects, setProjects] = useState<ProjectOption[]>([]);
  const [projectId, setProjectId] = useState<string>("");
  const [detail, setDetail] = useState<ProjectDetail | null>(null);
  const [selectedTasks, setSelectedTasks] = useState<string[]>([]);
  const [loadingDetail, setLoadingDetail] = useState(false);

  useEffect(() => {
    if (!open) return;
    setProjects([]); setProjectId(""); setDetail(null); setSelectedTasks([]);
    fetch(`/api/meetings/projects?team=${team}`)
      .then((r) => r.json())
      .then((d) => Array.isArray(d) && setProjects(d))
      .catch(() => {});
  }, [open, team]);

  useEffect(() => {
    if (!projectId) { setDetail(null); setSelectedTasks([]); return; }
    setLoadingDetail(true);
    fetch(`/api/meetings/projects?team=${team}&id=${projectId}`)
      .then((r) => r.json())
      .then((d: ProjectDetail) => { setDetail(d); setSelectedTasks([]); })
      .catch(() => {})
      .finally(() => setLoadingDetail(false));
  }, [projectId, team]);

  if (!open) return null;

  const isClientStandup = kind === "CLIENT_STANDUP";
  const defaultTitle = isClientStandup ? "Client stand-up" : "Internal dev sync";
  const accent = isClientStandup ? "#f59e0b" : "#7c3aed";

  async function save() {
    setError(null);
    if (!projectId) { setError("Select a project first."); return; }
    setLoading(true);
    try {
      const res = await fetch("/api/meetings/schedule", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title || defaultTitle,
          startIso: new Date(when).toISOString(),
          durationMinutes: duration,
          attendeeIds: selected,
          notes,
          teamId: team,
          kind,
          projectId,
          taskIds: selectedTasks,
          includeClient: isClientStandup,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to schedule meeting");
      onClose();
      router.refresh();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,0.55)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", padding: "1.5rem" }} onClick={() => !loading && onClose()}>
      <div onClick={(e) => e.stopPropagation()} style={{ background: "white", borderRadius: 16, width: "min(680px, 100%)", maxHeight: "92vh", display: "flex", flexDirection: "column", boxShadow: "0 30px 60px rgba(0,0,0,0.3)" }}>
        <div style={{ padding: "1.25rem 1.5rem", borderBottom: "1px solid var(--border-color)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: accent, color: "white", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Calendar size={18} />
            </div>
            <div>
              <div style={{ fontWeight: 800, fontSize: "1rem" }}>{isClientStandup ? "Schedule Client Stand-up" : "Schedule Internal Call"}</div>
              <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                {isClientStandup ? "Tied to a project · client contact included" : "Internal developers only · no client contact"}
              </div>
            </div>
          </div>
          <button onClick={onClose} disabled={loading} style={{ background: "transparent", border: "none", cursor: "pointer", color: "var(--text-muted)" }}><X size={20} /></button>
        </div>

        <div style={{ padding: "1.25rem 1.5rem", overflowY: "auto", flex: 1, display: "flex", flexDirection: "column", gap: "1rem" }}>
          <div>
            <label style={{ fontSize: "0.8rem", fontWeight: 700, color: "var(--text-secondary)", marginBottom: 6, display: "flex", alignItems: "center", gap: 6 }}>
              <Briefcase size={13} /> Project *
            </label>
            <select value={projectId} onChange={(e) => setProjectId(e.target.value)} style={{ width: "100%", padding: "0.65rem 0.8rem", border: "1px solid var(--border-color)", borderRadius: 8, fontSize: "0.9rem", background: "white" }}>
              <option value="">— Select a project —</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>{p.companyName ? `${p.companyName} · ${p.name}` : p.name}</option>
              ))}
            </select>
          </div>

          {loadingDetail && <div style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>Loading project…</div>}

          {detail && (
            <>
              {isClientStandup ? (
                <div style={{ padding: "0.75rem 0.9rem", background: "#fffbeb", border: "1px solid #fde68a", borderRadius: 10, display: "flex", alignItems: "center", gap: 10 }}>
                  <UserCircle2 size={22} color="#b45309" />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: "0.7rem", fontWeight: 700, color: "#b45309", textTransform: "uppercase", letterSpacing: "0.04em" }}>Client (pre-populated)</div>
                    {detail.client ? (
                      <div style={{ fontSize: "0.85rem", fontWeight: 700 }}>
                        {detail.client.name} <span style={{ color: "var(--text-muted)", fontWeight: 500 }}>· {detail.client.email || detail.client.phone || "no contact info"}</span>
                      </div>
                    ) : (
                      <div style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>No primary contact on file for {detail.companyName || detail.name}.</div>
                    )}
                  </div>
                </div>
              ) : (
                <div style={{ padding: "0.6rem 0.9rem", background: "#f5f3ff", border: "1px solid #ddd6fe", borderRadius: 10, fontSize: "0.8rem", color: "#5b21b6", fontWeight: 600 }}>
                  Internal call for <strong>{detail.companyName || detail.name}</strong> — client contact is not invited.
                </div>
              )}

              <div>
                <label style={{ fontSize: "0.8rem", fontWeight: 700, color: "var(--text-secondary)", marginBottom: 6, display: "block" }}>
                  Tasks to discuss ({selectedTasks.length} selected)
                </label>
                <div style={{ display: "flex", flexDirection: "column", gap: 4, maxHeight: 180, overflowY: "auto", border: "1px solid var(--border-color)", borderRadius: 8, padding: "0.5rem" }}>
                  {detail.tasks.length === 0 && <div style={{ color: "var(--text-muted)", fontSize: "0.8rem", padding: "0.5rem" }}>No open tasks on this project.</div>}
                  {detail.tasks.map((t) => (
                    <label key={t.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "0.35rem 0.5rem", borderRadius: 6, cursor: "pointer", fontSize: "0.85rem" }}>
                      <input
                        type="checkbox"
                        checked={selectedTasks.includes(t.id)}
                        onChange={(e) => setSelectedTasks(e.target.checked ? [...selectedTasks, t.id] : selectedTasks.filter((id) => id !== t.id))}
                      />
                      <span style={{ fontWeight: 600, flex: 1 }}>{t.title}</span>
                      <span style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>{t.status.replace("_", " ")}</span>
                    </label>
                  ))}
                </div>
              </div>
            </>
          )}

          <div>
            <label style={{ fontSize: "0.8rem", fontWeight: 700, color: "var(--text-secondary)", marginBottom: 6, display: "block" }}>Title</label>
            <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder={defaultTitle} style={{ width: "100%", padding: "0.65rem 0.8rem", border: "1px solid var(--border-color)", borderRadius: 8, fontSize: "0.9rem" }} />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 140px", gap: "0.75rem" }}>
            <div>
              <label style={{ fontSize: "0.8rem", fontWeight: 700, color: "var(--text-secondary)", marginBottom: 6, display: "block" }}>When</label>
              <input type="datetime-local" value={when} onChange={(e) => setWhen(e.target.value)} style={{ width: "100%", padding: "0.65rem 0.8rem", border: "1px solid var(--border-color)", borderRadius: 8, fontSize: "0.9rem" }} />
            </div>
            <div>
              <label style={{ fontSize: "0.8rem", fontWeight: 700, color: "var(--text-secondary)", marginBottom: 6, display: "block" }}>Duration (min)</label>
              <input type="number" value={duration} min={15} step={15} onChange={(e) => setDuration(parseInt(e.target.value) || 30)} style={{ width: "100%", padding: "0.65rem 0.8rem", border: "1px solid var(--border-color)", borderRadius: 8, fontSize: "0.9rem" }} />
            </div>
          </div>
          <div>
            <label style={{ fontSize: "0.8rem", fontWeight: 700, color: "var(--text-secondary)", marginBottom: 6, display: "block" }}>
              {isClientStandup ? "Internal developers" : "Developers"}
            </label>
            <div style={{ display: "flex", flexDirection: "column", gap: 4, maxHeight: 160, overflowY: "auto", border: "1px solid var(--border-color)", borderRadius: 8, padding: "0.5rem" }}>
              {attendees.length === 0 && <div style={{ color: "var(--text-muted)", fontSize: "0.8rem", padding: "0.5rem" }}>No team members yet.</div>}
              {attendees.map((a) => (
                <label key={a.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "0.35rem 0.5rem", borderRadius: 6, cursor: "pointer", fontSize: "0.85rem" }}>
                  <input
                    type="checkbox"
                    checked={selected.includes(a.id)}
                    onChange={(e) => setSelected(e.target.checked ? [...selected, a.id] : selected.filter((id) => id !== a.id))}
                  />
                  <span style={{ fontWeight: 600 }}>{a.name || a.email}</span>
                  {a.email && <span style={{ color: "var(--text-muted)", fontSize: "0.75rem" }}>· {a.email}</span>}
                </label>
              ))}
            </div>
          </div>
          <div>
            <label style={{ fontSize: "0.8rem", fontWeight: 700, color: "var(--text-secondary)", marginBottom: 6, display: "block" }}>Agenda / notes</label>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} placeholder="Anything beyond the tasks you've selected?" style={{ width: "100%", padding: "0.75rem 0.9rem", border: "1px solid var(--border-color)", borderRadius: 8, fontSize: "0.85rem", fontFamily: "inherit", resize: "vertical" }} />
          </div>
          {error && <div style={{ color: "#ef4444", fontSize: "0.85rem" }}>{error}</div>}
        </div>

        <div style={{ padding: "1rem 1.5rem", borderTop: "1px solid var(--border-color)", display: "flex", justifyContent: "flex-end", gap: "0.5rem" }}>
          <button onClick={onClose} disabled={loading} className="btn btn-ghost">Cancel</button>
          <button onClick={save} disabled={loading || !projectId} className="btn btn-primary" style={{ background: accent, borderColor: "transparent" }}>
            {loading ? <><Loader2 size={14} className="spin" /> Scheduling…</> : "Schedule"}
          </button>
        </div>
      </div>
    </div>
  );
}
