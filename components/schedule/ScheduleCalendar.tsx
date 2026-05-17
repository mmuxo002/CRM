"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight, Plus, Calendar as CalIcon, Repeat, Trash2, X, Loader2, Briefcase } from "lucide-react";
import { MEETING_KIND_META, RECURRENCE_OPTIONS, type MeetingKind, type RecurrenceKind } from "@/lib/meetings";

type Attendee = { id: string; name: string | null; email: string | null; image: string | null };

type MeetingOccurrence = {
  id: string;
  occurrenceId: string;
  title: string;
  kind: MeetingKind;
  teamId: string;
  durationMinutes: number;
  notes: string | null;
  startAt: string;
  isRecurring: boolean;
  recurrence: RecurrenceKind;
  recurrenceUntil: string | null;
  includeClient: boolean;
  owner: { id: string; name: string | null; email: string | null; image: string | null } | null;
  attendees: Attendee[];
  project: { id: string; name: string; companyName: string | null } | null;
};

type ProjectOption = { id: string; name: string; companyName: string | null };

const TEAMS: { id: "APPS" | "CRM" | "SALES" | "ALL"; label: string }[] = [
  { id: "ALL", label: "All teams" },
  { id: "APPS", label: "Development" },
  { id: "CRM", label: "CRM" },
  { id: "SALES", label: "Sales" },
];

function startOfMonth(d: Date) { const x = new Date(d); x.setDate(1); x.setHours(0, 0, 0, 0); return x; }
function startOfGrid(d: Date) { const s = startOfMonth(d); s.setDate(s.getDate() - s.getDay()); return s; }
function addDays(d: Date, n: number) { const x = new Date(d); x.setDate(x.getDate() + n); return x; }
function isSameDay(a: Date, b: Date) { return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate(); }
function fmtMonth(d: Date) { return d.toLocaleString("en-US", { month: "long", year: "numeric" }); }
function fmtTime(d: Date) { return d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" }); }

export function ScheduleCalendar({ defaultTeam, lockedTeam, attendees }: { defaultTeam: "APPS" | "CRM" | "SALES" | "ALL"; lockedTeam?: "APPS" | "CRM" | "SALES" | null; attendees: Attendee[] }) {
  const [cursor, setCursor] = useState(() => startOfMonth(new Date()));
  const [team, setTeam] = useState<"APPS" | "CRM" | "SALES" | "ALL">(defaultTeam);
  const [meetings, setMeetings] = useState<MeetingOccurrence[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalDate, setModalDate] = useState<Date | null>(null);
  const [detail, setDetail] = useState<MeetingOccurrence | null>(null);

  const gridStart = useMemo(() => startOfGrid(cursor), [cursor]);
  const gridDays = useMemo(() => Array.from({ length: 42 }, (_, i) => addDays(gridStart, i)), [gridStart]);
  const monthEnd = useMemo(() => { const e = new Date(cursor); e.setMonth(e.getMonth() + 1); e.setDate(0); e.setHours(23, 59, 59, 999); return e; }, [cursor]);

  const fetchMeetings = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ from: gridStart.toISOString(), to: addDays(gridStart, 42).toISOString() });
      if (team !== "ALL") params.set("team", team);
      const res = await fetch(`/api/meetings?${params}`);
      const data = await res.json();
      setMeetings(Array.isArray(data) ? data : []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchMeetings(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [gridStart.getTime(), team]);

  const meetingsByDay = useMemo(() => {
    const map = new Map<string, MeetingOccurrence[]>();
    for (const m of meetings) {
      const key = m.startAt.slice(0, 10);
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(m);
    }
    return map;
  }, [meetings]);

  const upcoming = useMemo(() => {
    const now = Date.now();
    return meetings.filter((m) => new Date(m.startAt).getTime() >= now).slice(0, 8);
  }, [meetings]);

  const openNewMeeting = (date?: Date) => {
    setModalDate(date ?? null);
    setModalOpen(true);
  };

  const today = new Date();

  return (
    <div>
      <div className="row-between" style={{ marginBottom: "1.25rem" }}>
        <div>
          <h1 className="page-title" style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <CalIcon size={22} /> Schedule
          </h1>
          <p className="page-subtitle">
            {lockedTeam
              ? `${lockedTeam === "APPS" ? "Development" : lockedTeam === "CRM" ? "CRM" : "Sales"} team schedule — calls, stand-ups, and recurring sessions.`
              : "All departments — internal calls, client stand-ups, and recurring sessions."}
          </p>
        </div>
        <div className="flex-gap">
          {!lockedTeam && (
            <select value={team} onChange={(e) => setTeam(e.target.value as any)} style={{ padding: "0.5rem 0.75rem", border: "1px solid var(--border-color)", borderRadius: 8, fontSize: "0.85rem", background: "white" }}>
              {TEAMS.map((t) => <option key={t.id} value={t.id}>{t.label}</option>)}
            </select>
          )}
          <button className="btn btn-primary" onClick={() => openNewMeeting()}><Plus size={14} /> New Meeting</button>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: "1.25rem" }}>
        <div className="card" style={{ padding: "1rem" }}>
          <div className="row-between" style={{ marginBottom: "0.75rem" }}>
            <div className="flex-gap">
              <button className="btn btn-ghost" onClick={() => setCursor(startOfMonth(new Date()))}>Today</button>
              <button className="btn btn-ghost" onClick={() => setCursor(addDays(startOfMonth(cursor), -1))} aria-label="Prev"><ChevronLeft size={16} /></button>
              <button className="btn btn-ghost" onClick={() => { const n = new Date(cursor); n.setMonth(n.getMonth() + 1); setCursor(startOfMonth(n)); }} aria-label="Next"><ChevronRight size={16} /></button>
              <div style={{ fontWeight: 800, fontSize: "1rem", marginLeft: 8 }}>{fmtMonth(cursor)}</div>
            </div>
            {loading && <Loader2 size={14} className="spin" />}
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 4, fontSize: "0.7rem", color: "var(--text-muted)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.04em", padding: "0 4px 6px" }}>
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => <div key={d} style={{ textAlign: "center" }}>{d}</div>)}
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 4 }}>
            {gridDays.map((day) => {
              const inMonth = day.getMonth() === cursor.getMonth();
              const key = day.toISOString().slice(0, 10);
              const dayMeetings = (meetingsByDay.get(key) || []).slice(0, 4);
              const isToday = isSameDay(day, today);
              return (
                <button
                  key={key}
                  onClick={() => openNewMeeting(day)}
                  style={{
                    minHeight: 96,
                    padding: 6,
                    border: `1px solid ${isToday ? "#7c3aed" : "var(--border-color)"}`,
                    borderRadius: 8,
                    background: inMonth ? "white" : "var(--bg-base, #f8fafc)",
                    opacity: inMonth ? 1 : 0.55,
                    textAlign: "left",
                    cursor: "pointer",
                    display: "flex",
                    flexDirection: "column",
                    gap: 3,
                  }}
                >
                  <div style={{ fontSize: "0.72rem", fontWeight: isToday ? 900 : 700, color: isToday ? "#7c3aed" : "var(--text-secondary)" }}>{day.getDate()}</div>
                  {dayMeetings.map((m) => {
                    const meta = MEETING_KIND_META[m.kind];
                    return (
                      <div
                        key={m.occurrenceId}
                        onClick={(e) => { e.stopPropagation(); setDetail(m); }}
                        style={{ background: meta.color + "1f", color: meta.color, padding: "2px 5px", borderRadius: 4, fontSize: "0.65rem", fontWeight: 700, display: "flex", alignItems: "center", gap: 3, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
                        title={m.title}
                      >
                        {m.isRecurring && <Repeat size={9} />}
                        <span>{fmtTime(new Date(m.startAt))}</span>
                        <span style={{ overflow: "hidden", textOverflow: "ellipsis" }}>{m.title}</span>
                      </div>
                    );
                  })}
                  {(meetingsByDay.get(key)?.length || 0) > 4 && (
                    <div style={{ fontSize: "0.65rem", color: "var(--text-muted)" }}>+{(meetingsByDay.get(key)?.length || 0) - 4} more</div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        <div className="card" style={{ padding: "1rem" }}>
          <h3 style={{ fontSize: "0.85rem", fontWeight: 800, marginBottom: "0.75rem" }}>Upcoming</h3>
          {upcoming.length === 0 && <div style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>Nothing scheduled.</div>}
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {upcoming.map((m) => {
              const meta = MEETING_KIND_META[m.kind];
              return (
                <button key={m.occurrenceId} onClick={() => setDetail(m)} style={{ textAlign: "left", padding: "0.6rem 0.7rem", border: "1px solid var(--border-color)", borderRadius: 8, background: "white", cursor: "pointer" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: "0.7rem", color: meta.color, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.04em" }}>
                    <span style={{ width: 8, height: 8, borderRadius: 999, background: meta.color }} />
                    {meta.label}
                    {m.isRecurring && <Repeat size={11} />}
                  </div>
                  <div style={{ fontSize: "0.85rem", fontWeight: 700, marginTop: 2 }}>{m.title}</div>
                  <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", marginTop: 2 }}>
                    {new Date(m.startAt).toLocaleString("en-US", { weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })} · {m.durationMinutes}m
                  </div>
                  {m.project && <div style={{ fontSize: "0.7rem", color: "var(--text-muted)", marginTop: 2 }}>{m.project.companyName || m.project.name}</div>}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {modalOpen && (
        <NewMeetingModal
          defaultTeam={lockedTeam || (team !== "ALL" ? team : defaultTeam !== "ALL" ? defaultTeam : "APPS")}
          lockedTeam={lockedTeam || null}
          defaultDate={modalDate}
          attendees={attendees}
          onClose={() => setModalOpen(false)}
          onSaved={() => { setModalOpen(false); fetchMeetings(); }}
        />
      )}

      {detail && (
        <MeetingDetailModal
          meeting={detail}
          onClose={() => setDetail(null)}
          onDeleted={() => { setDetail(null); fetchMeetings(); }}
        />
      )}
    </div>
  );
}

function NewMeetingModal({
  defaultTeam,
  lockedTeam,
  defaultDate,
  attendees,
  onClose,
  onSaved,
}: {
  defaultTeam: "APPS" | "CRM" | "SALES";
  lockedTeam: "APPS" | "CRM" | "SALES" | null;
  defaultDate: Date | null;
  attendees: Attendee[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const [team, setTeam] = useState<"APPS" | "CRM" | "SALES">(defaultTeam);
  const [kind, setKind] = useState<MeetingKind>("INTERNAL_CALL");
  const [title, setTitle] = useState("");
  const [when, setWhen] = useState(() => {
    const d = defaultDate ? new Date(defaultDate) : new Date(Date.now() + 60 * 60 * 1000);
    if (defaultDate) d.setHours(10, 0, 0, 0);
    else d.setMinutes(0, 0, 0);
    return toLocalInput(d);
  });
  const [duration, setDuration] = useState(30);
  const [recurrence, setRecurrence] = useState<RecurrenceKind>("NONE");
  const [recurrenceUntil, setRecurrenceUntil] = useState<string>("");
  const [selected, setSelected] = useState<string[]>([]);
  const [notes, setNotes] = useState("");
  const [projects, setProjects] = useState<ProjectOption[]>([]);
  const [projectId, setProjectId] = useState<string>("");
  const [includeClient, setIncludeClient] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/meetings/projects?team=${team}`).then((r) => r.json()).then((d) => Array.isArray(d) && setProjects(d)).catch(() => {});
    setProjectId("");
  }, [team]);

  const isStandup = kind === "CLIENT_STANDUP";
  const accent = MEETING_KIND_META[kind].color;

  async function save() {
    setError(null);
    if (isStandup && !projectId) { setError("Client stand-ups need a project."); return; }
    setSaving(true);
    try {
      const res = await fetch("/api/meetings/schedule", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title || (isStandup ? "Client stand-up" : "Internal call"),
          startIso: new Date(when).toISOString(),
          durationMinutes: duration,
          attendeeIds: selected,
          notes,
          teamId: team,
          kind,
          projectId: projectId || undefined,
          includeClient: isStandup && includeClient,
          recurrence,
          recurrenceUntilIso: recurrence !== "NONE" && recurrenceUntil ? new Date(recurrenceUntil).toISOString() : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to schedule meeting");
      onSaved();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <ModalShell onClose={onClose} title={isStandup ? "Schedule Client Stand-up" : "Schedule Internal Call"} subtitle={isStandup ? "Tied to a project · client invited" : "Internal team only"} accent={accent}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
        <Field label="Type">
          <div className="chip-toggle" style={{ display: "flex", gap: 4 }}>
            {(["INTERNAL_CALL", "CLIENT_STANDUP"] as MeetingKind[]).map((k) => (
              <button key={k} type="button" onClick={() => setKind(k)} style={{ flex: 1, padding: "0.5rem", borderRadius: 6, border: "1px solid var(--border-color)", background: kind === k ? MEETING_KIND_META[k].color + "22" : "white", color: kind === k ? MEETING_KIND_META[k].color : "var(--text-secondary)", fontWeight: 700, fontSize: "0.78rem", cursor: "pointer" }}>{MEETING_KIND_META[k].label}</button>
            ))}
          </div>
        </Field>
        <Field label="Team">
          <select value={team} onChange={(e) => !lockedTeam && setTeam(e.target.value as any)} disabled={!!lockedTeam} style={{ ...inputStyle, opacity: lockedTeam ? 0.7 : 1 }}>
            <option value="APPS">Development</option>
            <option value="CRM">CRM</option>
            <option value="SALES">Sales</option>
          </select>
        </Field>
      </div>

      <Field label="Title">
        <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder={isStandup ? "Client stand-up" : "Internal sync"} style={inputStyle} />
      </Field>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 130px", gap: "0.75rem" }}>
        <Field label="When">
          <input type="datetime-local" value={when} onChange={(e) => setWhen(e.target.value)} style={inputStyle} />
        </Field>
        <Field label="Duration (min)">
          <input type="number" value={duration} min={15} step={15} onChange={(e) => setDuration(parseInt(e.target.value) || 30)} style={inputStyle} />
        </Field>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
        <Field label={<><Repeat size={12} style={{ marginRight: 4, display: "inline" }} /> Repeats</>}>
          <select value={recurrence} onChange={(e) => setRecurrence(e.target.value as RecurrenceKind)} style={inputStyle}>
            {RECURRENCE_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </Field>
        {recurrence !== "NONE" && (
          <Field label="Repeat until (optional)">
            <input type="date" value={recurrenceUntil} onChange={(e) => setRecurrenceUntil(e.target.value)} style={inputStyle} />
          </Field>
        )}
      </div>

      <Field label={<><Briefcase size={12} style={{ marginRight: 4, display: "inline" }} /> Project {isStandup && "*"}</>}>
        <select value={projectId} onChange={(e) => setProjectId(e.target.value)} style={inputStyle}>
          <option value="">{isStandup ? "— Select a project —" : "— None (general meeting) —"}</option>
          {projects.map((p) => <option key={p.id} value={p.id}>{p.companyName ? `${p.companyName} · ${p.name}` : p.name}</option>)}
        </select>
      </Field>

      {isStandup && projectId && (
        <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: "0.82rem" }}>
          <input type="checkbox" checked={includeClient} onChange={(e) => setIncludeClient(e.target.checked)} />
          Invite the client's primary contact
        </label>
      )}

      <Field label={`Attendees (${selected.length} selected)`}>
        <div style={{ display: "flex", flexDirection: "column", gap: 2, maxHeight: 140, overflowY: "auto", border: "1px solid var(--border-color)", borderRadius: 8, padding: "0.4rem" }}>
          {attendees.length === 0 && <div style={{ color: "var(--text-muted)", fontSize: "0.8rem", padding: "0.4rem" }}>No team members.</div>}
          {attendees.map((a) => (
            <label key={a.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "0.3rem 0.4rem", borderRadius: 6, fontSize: "0.82rem", cursor: "pointer" }}>
              <input type="checkbox" checked={selected.includes(a.id)} onChange={(e) => setSelected(e.target.checked ? [...selected, a.id] : selected.filter((id) => id !== a.id))} />
              <span style={{ fontWeight: 600 }}>{a.name || a.email}</span>
              {a.email && <span style={{ color: "var(--text-muted)", fontSize: "0.72rem" }}>· {a.email}</span>}
            </label>
          ))}
        </div>
      </Field>

      <Field label="Notes / agenda">
        <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} style={{ ...inputStyle, fontFamily: "inherit", resize: "vertical" }} />
      </Field>

      {error && <div style={{ color: "#ef4444", fontSize: "0.85rem" }}>{error}</div>}

      <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 8 }}>
        <button onClick={onClose} disabled={saving} className="btn btn-ghost">Cancel</button>
        <button onClick={save} disabled={saving} className="btn btn-primary" style={{ background: accent, borderColor: "transparent" }}>
          {saving ? <><Loader2 size={14} className="spin" /> Saving…</> : "Schedule"}
        </button>
      </div>
    </ModalShell>
  );
}

function MeetingDetailModal({ meeting, onClose, onDeleted }: { meeting: MeetingOccurrence; onClose: () => void; onDeleted: () => void }) {
  const [deleting, setDeleting] = useState(false);
  const meta = MEETING_KIND_META[meeting.kind];

  async function remove() {
    if (!confirm(meeting.isRecurring ? "Cancel the entire recurring series?" : "Cancel this meeting?")) return;
    setDeleting(true);
    try {
      await fetch(`/api/meetings/${meeting.id}`, { method: "DELETE" });
      onDeleted();
    } finally {
      setDeleting(false);
    }
  }

  return (
    <ModalShell onClose={onClose} title={meeting.title} subtitle={meta.label} accent={meta.color}>
      <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", fontSize: "0.85rem" }}>
        <div><strong>When:</strong> {new Date(meeting.startAt).toLocaleString()} ({meeting.durationMinutes} min)</div>
        {meeting.isRecurring && (
          <div style={{ display: "flex", alignItems: "center", gap: 6, color: meta.color }}>
            <Repeat size={14} /> Repeats {meeting.recurrence.toLowerCase()}
            {meeting.recurrenceUntil && ` until ${new Date(meeting.recurrenceUntil).toLocaleDateString()}`}
          </div>
        )}
        {meeting.project && <div><strong>Project:</strong> {meeting.project.companyName ? `${meeting.project.companyName} · ` : ""}{meeting.project.name}</div>}
        {meeting.owner && <div><strong>Owner:</strong> {meeting.owner.name || meeting.owner.email}</div>}
        {meeting.attendees.length > 0 && (
          <div><strong>Attendees:</strong> {meeting.attendees.map((a) => a.name || a.email).join(", ")}</div>
        )}
        {meeting.notes && <div style={{ padding: "0.6rem 0.75rem", background: "var(--bg-base, #f8fafc)", borderRadius: 8, whiteSpace: "pre-wrap" }}>{meeting.notes}</div>}
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: "1rem" }}>
        <button onClick={remove} disabled={deleting} className="btn btn-ghost" style={{ color: "#ef4444" }}>
          {deleting ? <Loader2 size={14} className="spin" /> : <><Trash2 size={14} /> Cancel meeting</>}
        </button>
        <button onClick={onClose} className="btn btn-ghost">Close</button>
      </div>
    </ModalShell>
  );
}

function ModalShell({ onClose, title, subtitle, accent, children }: { onClose: () => void; title: string; subtitle: string; accent: string; children: React.ReactNode }) {
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,0.55)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", padding: "1.5rem" }} onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} style={{ background: "white", borderRadius: 16, width: "min(640px, 100%)", maxHeight: "92vh", display: "flex", flexDirection: "column", boxShadow: "0 30px 60px rgba(0,0,0,0.3)" }}>
        <div style={{ padding: "1rem 1.25rem", borderBottom: "1px solid var(--border-color)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: accent, color: "white", display: "flex", alignItems: "center", justifyContent: "center" }}><CalIcon size={18} /></div>
            <div>
              <div style={{ fontWeight: 800, fontSize: "0.95rem" }}>{title}</div>
              <div style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>{subtitle}</div>
            </div>
          </div>
          <button onClick={onClose} style={{ background: "transparent", border: "none", cursor: "pointer", color: "var(--text-muted)" }}><X size={18} /></button>
        </div>
        <div style={{ padding: "1rem 1.25rem", overflowY: "auto", display: "flex", flexDirection: "column", gap: "0.7rem" }}>
          {children}
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: React.ReactNode; children: React.ReactNode }) {
  return (
    <div>
      <label style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--text-secondary)", marginBottom: 5, display: "block" }}>{label}</label>
      {children}
    </div>
  );
}

const inputStyle: React.CSSProperties = { width: "100%", padding: "0.55rem 0.75rem", border: "1px solid var(--border-color)", borderRadius: 8, fontSize: "0.88rem", background: "white" };

function toLocalInput(d: Date) {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
