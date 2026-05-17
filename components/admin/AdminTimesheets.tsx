"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Clock, ChevronLeft, ChevronRight, ChevronDown, ChevronUp,
  CheckCircle2, Users, Search, X,
} from "lucide-react";

type Interval = {
  id: string;
  kind: "WORK" | "BREAK";
  source: "SYSTEM" | "USER" | "BACKFILL";
  startedAt: string;
  endedAt: string | null;
  note: string | null;
};

type SessionState = {
  session: {
    id: string;
    dateCST: string;
    startedAt: string;
    endedAt: string | null;
    endReason: string | null;
    status: "ACTIVE" | "ON_BREAK" | "ENDED";
    lastActivityAt: string;
    intervals: Interval[];
  };
  totals: { workMs: number; breakMs: number; breakCount: number };
  openInterval: Interval | null;
};

type Rep = {
  id: string;
  name: string | null;
  email: string | null;
  image: string | null;
  role: string;
  lastSeenAt: string | null;
  totals: { workMs: number; breakMs: number; breakCount: number };
  states: SessionState[];
};

type Payload = {
  ok: true;
  weekOf: string;
  todayCST: string;
  reps: Rep[];
};

function fmtHMS(ms: number) {
  const s = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  return `${h}h ${String(m).padStart(2, "0")}m`;
}

function currentWeekKey() {
  const d = new Date();
  const c = new Date(d.getTime() - 6 * 3600 * 1000);
  const t = new Date(Date.UTC(c.getUTCFullYear(), c.getUTCMonth(), c.getUTCDate()));
  const dayNum = t.getUTCDay() || 7;
  t.setUTCDate(t.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(t.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil(((t.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return `${t.getUTCFullYear()}-W${String(weekNo).padStart(2, "0")}`;
}

function shiftWeek(weekKey: string, delta: number): string {
  const [y, w] = weekKey.split("-W").map((n) => parseInt(n, 10));
  const jan4 = new Date(Date.UTC(y, 0, 4));
  const dayOfWeek = jan4.getUTCDay() || 7;
  const mondayWeek1 = new Date(jan4);
  mondayWeek1.setUTCDate(jan4.getUTCDate() - (dayOfWeek - 1));
  const target = new Date(mondayWeek1);
  target.setUTCDate(mondayWeek1.getUTCDate() + (w - 1 + delta) * 7);
  const yearStart = new Date(Date.UTC(target.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil(((target.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return `${target.getUTCFullYear()}-W${String(weekNo).padStart(2, "0")}`;
}

export function AdminTimesheets({ initial }: { initial: Payload }) {
  const [weekOf, setWeekOf] = useState<string>(initial.weekOf);
  const [data, setData] = useState<Payload>(initial);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [filter, setFilter] = useState("");

  const load = useCallback(async (week: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/timesheets?weekOf=${week}`, { cache: "no-store" });
      if (res.ok) setData(await res.json());
    } finally { setLoading(false); }
  }, []);

  // Skip the initial refetch since we SSR'd the first week already.
  useEffect(() => {
    if (weekOf === initial.weekOf) return;
    load(weekOf);
  }, [weekOf, load, initial.weekOf]);

  const thisWeekKey = useMemo(() => currentWeekKey(), []);
  const isCurrentWeek = weekOf === thisWeekKey;

  const filteredReps = useMemo(() => {
    if (!filter.trim()) return data.reps;
    const q = filter.toLowerCase();
    return data.reps.filter(
      (r) => (r.name || "").toLowerCase().includes(q) || (r.email || "").toLowerCase().includes(q),
    );
  }, [data.reps, filter]);

  const weekTotals = useMemo(() => {
    return data.reps.reduce(
      (acc, r) => {
        acc.workMs += r.totals.workMs;
        acc.breakMs += r.totals.breakMs;
        acc.sessions += r.states.length;
        acc.activeReps += r.totals.workMs > 0 ? 1 : 0;
        return acc;
      },
      { workMs: 0, breakMs: 0, sessions: 0, activeReps: 0 },
    );
  }, [data.reps]);

  const toggle = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const expandAll = () => setExpanded(new Set(filteredReps.map((r) => r.id)));
  const collapseAll = () => setExpanded(new Set());

  return (
    <div className="animate-slide-up">
      <div className="row-between" style={{ marginBottom: "1.25rem" }}>
        <div>
          <h1 className="page-title" style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <Clock size={22} color="#f59e0b" /> Team Timesheets
          </h1>
          <p className="page-subtitle">
            Week-by-week hours for every sales rep. Split by person — click any name to expand day-by-day details. Times in CST.
          </p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <button className="btn btn-secondary" onClick={() => setWeekOf(shiftWeek(weekOf, -1))} disabled={loading}>
            <ChevronLeft size={14} />
          </button>
          <div style={{ fontWeight: 700, fontSize: 14, minWidth: 120, textAlign: "center" }}>
            {isCurrentWeek ? "This Week" : weekOf.replace("-W", " · Week ")}
          </div>
          <button className="btn btn-secondary" onClick={() => setWeekOf(shiftWeek(weekOf, 1))} disabled={loading || isCurrentWeek}>
            <ChevronRight size={14} />
          </button>
        </div>
      </div>

      {/* Week totals */}
      <div className="card" style={{ marginBottom: "1.25rem" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16 }}>
          <Stat label="Reps" value={String(data.reps.length)} sub={`${weekTotals.activeReps} active`} accent="#4318ff" icon={<Users size={14} />} />
          <Stat label="Hours This Week" value={fmtHMS(weekTotals.workMs)} sub={`${weekTotals.sessions} sessions`} accent="#10b981" />
          <Stat label="Break Time" value={fmtHMS(weekTotals.breakMs)} accent="#f59e0b" />
          <Stat label="Avg Per Rep" value={data.reps.length > 0 ? fmtHMS(weekTotals.workMs / data.reps.length) : "—"} />
        </div>
      </div>

      {/* Filter + expand controls — toolbar, not a card */}
      <div style={{
        display: "flex", alignItems: "center", gap: 10,
        marginBottom: "1rem",
      }}>
        <div style={{
          position: "relative", flex: 1, minWidth: 0,
          display: "flex", alignItems: "center",
          height: 38, borderRadius: 10,
          background: "var(--bg-surface)",
          border: "1px solid var(--border-color)",
          transition: "border-color 120ms, box-shadow 120ms",
        }}
          onFocus={(e) => { e.currentTarget.style.borderColor = "var(--accent-primary)"; e.currentTarget.style.boxShadow = "0 0 0 3px rgba(67,24,255,0.08)"; }}
          onBlur={(e) => { e.currentTarget.style.borderColor = "var(--border-color)"; e.currentTarget.style.boxShadow = "none"; }}
        >
          <Search size={14} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)", pointerEvents: "none" }} />
          <input
            type="text"
            placeholder="Search a rep by name or email"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            style={{
              flex: 1,
              padding: "0 2.25rem",
              height: "100%",
              borderRadius: 10,
              border: "none",
              outline: "none",
              fontSize: "0.85rem",
              fontFamily: "inherit",
              background: "transparent",
              color: "var(--text-primary)",
            }}
          />
          {filter && (
            <button
              type="button"
              onClick={() => setFilter("")}
              aria-label="Clear filter"
              style={{
                position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)",
                display: "inline-flex", alignItems: "center", justifyContent: "center",
                width: 22, height: 22, borderRadius: 999,
                background: "var(--bg-base)", border: "none",
                color: "var(--text-muted)", cursor: "pointer",
              }}
            >
              <X size={12} />
            </button>
          )}
        </div>

        {filter && (
          <span style={{
            fontSize: "0.72rem", fontWeight: 700, color: "var(--text-muted)",
            whiteSpace: "nowrap",
          }}>
            {filteredReps.length} of {data.reps.length}
          </span>
        )}

        <div style={{
          display: "inline-flex", height: 38, borderRadius: 10,
          background: "var(--bg-surface)", border: "1px solid var(--border-color)",
          overflow: "hidden",
        }}>
          <button
            onClick={expandAll}
            style={toolbarBtn}
            title="Expand every rep"
          >
            Expand all
          </button>
          <div style={{ width: 1, background: "var(--border-color)" }} />
          <button
            onClick={collapseAll}
            style={toolbarBtn}
            title="Collapse every rep"
          >
            Collapse all
          </button>
        </div>
      </div>

      {/* Per-rep sections */}
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {loading && data.reps.length === 0 && (
          <div className="card"><span style={{ color: "var(--text-secondary)" }}>Loading…</span></div>
        )}
        {!loading && filteredReps.length === 0 && (
          <div className="card" style={{ textAlign: "center", padding: "2rem" }}>
            <div style={{ color: "var(--text-secondary)" }}>
              {data.reps.length === 0
                ? "No sales-access users found."
                : "No matches for that filter."}
            </div>
          </div>
        )}
        {filteredReps.map((rep) => (
          <RepCard
            key={rep.id}
            rep={rep}
            expanded={expanded.has(rep.id)}
            onToggle={() => toggle(rep.id)}
            todayCST={data.todayCST}
          />
        ))}
      </div>
    </div>
  );
}

function RepCard({ rep, expanded, onToggle, todayCST }: {
  rep: Rep; expanded: boolean; onToggle: () => void; todayCST: string;
}) {
  const hasHours = rep.totals.workMs > 0;
  const avatar = rep.image
    ? <img src={rep.image} alt="" style={{ width: 44, height: 44, borderRadius: "50%", objectFit: "cover" }} />
    : (
      <div style={{
        width: 44, height: 44, borderRadius: "50%",
        background: "linear-gradient(135deg, #4318ff, #7c3aed)",
        color: "white", display: "flex", alignItems: "center", justifyContent: "center",
        fontWeight: 800, fontSize: "1rem",
      }}>
        {(rep.name || rep.email || "?").slice(0, 1).toUpperCase()}
      </div>
    );

  return (
    <div className="card" style={{ padding: 0, overflow: "hidden" }}>
      <div
        onClick={onToggle}
        style={{
          display: "flex", alignItems: "center", gap: 14,
          padding: "0.85rem 1.1rem",
          cursor: "pointer",
          background: expanded ? "var(--bg-base)" : "transparent",
          borderBottom: expanded ? "1px solid var(--border-color)" : "none",
        }}
      >
        {avatar}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 800, fontSize: "0.95rem", color: "var(--text-primary)", display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            {rep.name || rep.email || "Unnamed"}
            <span style={{
              padding: "1px 7px", borderRadius: 4,
              fontSize: "0.6rem", fontWeight: 800,
              background: rep.role === "ADMIN" ? "#fef3c7" : "#ede9fe",
              color: rep.role === "ADMIN" ? "#92400e" : "#6d28d9",
              letterSpacing: "0.04em", textTransform: "uppercase",
            }}>
              {rep.role}
            </span>
          </div>
          <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", marginTop: 2 }}>
            {rep.email}
            {rep.lastSeenAt && (
              <span> · Last active {new Date(rep.lastSeenAt).toLocaleString(undefined, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}</span>
            )}
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
          <RepMini label="Worked" value={fmtHMS(rep.totals.workMs)} accent={hasHours ? "#10b981" : undefined} />
          <RepMini label="Break" value={fmtHMS(rep.totals.breakMs)} accent={rep.totals.breakMs > 0 ? "#f59e0b" : undefined} />
          <RepMini label="Days" value={String(rep.states.length)} />
          <RepMini label="Breaks" value={String(rep.totals.breakCount)} />
        </div>

        <div style={{ color: "var(--text-muted)", flexShrink: 0 }}>
          {expanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </div>
      </div>

      {expanded && (
        <div style={{ padding: "1rem 1.1rem" }}>
          {rep.states.length === 0 ? (
            <div style={{ textAlign: "center", padding: "1.5rem", color: "var(--text-muted)", fontSize: "0.85rem" }}>
              No sessions logged this week.
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {rep.states.map((st) => (
                <DayCard key={st.session.id} state={st} isToday={st.session.dateCST === todayCST} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function DayCard({ state, isToday }: { state: SessionState; isToday: boolean }) {
  const { session, totals } = state;
  const status = session.status;
  const dayLabel = new Date(session.dateCST + "T12:00:00").toLocaleDateString(undefined, { weekday: "long", month: "short", day: "numeric" });

  return (
    <div style={{
      padding: "0.85rem 1rem", borderRadius: 10,
      border: "1px solid var(--border-color)",
      background: "var(--bg-surface)",
    }}>
      <div className="row-between" style={{ marginBottom: 10 }}>
        <div>
          <div style={{ fontWeight: 800, fontSize: "0.9rem" }}>
            {dayLabel}
            {isToday && <span style={{ marginLeft: 8, fontSize: 10, padding: "2px 6px", background: "#f59e0b", color: "white", borderRadius: 4, verticalAlign: "middle", fontWeight: 800, letterSpacing: "0.05em" }}>TODAY</span>}
          </div>
          <div style={{ fontSize: "0.72rem", color: "var(--text-secondary)", marginTop: 2 }}>
            Started {new Date(session.startedAt).toLocaleTimeString()}
            {session.endedAt && ` · Ended ${new Date(session.endedAt).toLocaleTimeString()}`}
            {session.endReason && ` · ${endReasonLabel(session.endReason)}`}
          </div>
        </div>
        <StatusPill status={status} />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 10 }}>
        <Mini label="Worked" value={fmtHMS(totals.workMs)} accent="#10b981" />
        <Mini label="Break" value={fmtHMS(totals.breakMs)} accent="#f59e0b" />
        <Mini label="Breaks" value={String(totals.breakCount)} />
      </div>

      {session.intervals.length > 0 && (
        <details>
          <summary style={{ fontSize: "0.7rem", fontWeight: 700, color: "var(--text-secondary)", cursor: "pointer", letterSpacing: "0.04em" }}>
            INTERVALS ({session.intervals.length})
          </summary>
          <div style={{ display: "flex", flexDirection: "column", gap: 4, marginTop: 8 }}>
            {session.intervals.map((iv) => {
              const start = new Date(iv.startedAt);
              const end = iv.endedAt ? new Date(iv.endedAt) : null;
              const dur = end ? end.getTime() - start.getTime() : 0;
              return (
                <div key={iv.id} style={{
                  display: "grid", gridTemplateColumns: "70px 70px 1fr 1fr 70px",
                  gap: 8, padding: "0.35rem 0.55rem",
                  background: "var(--bg-base)", borderRadius: 6,
                  fontSize: "0.72rem", alignItems: "center",
                }}>
                  <span style={{ fontWeight: 800, color: iv.kind === "WORK" ? "#10b981" : "#f59e0b" }}>{iv.kind}</span>
                  <span style={{ fontSize: "0.62rem", fontWeight: 700, color: "var(--text-secondary)" }}>{iv.source}</span>
                  <span>{start.toLocaleTimeString()}</span>
                  <span>{end ? end.toLocaleTimeString() : "…"}</span>
                  <span style={{ textAlign: "right", fontVariantNumeric: "tabular-nums", fontWeight: 700 }}>{end ? fmtHMS(dur) : "open"}</span>
                </div>
              );
            })}
          </div>
        </details>
      )}
    </div>
  );
}

function Stat({ label, value, sub, accent, icon }: { label: string; value: string; sub?: string; accent?: string; icon?: React.ReactNode }) {
  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11, color: "var(--text-secondary)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}>
        {icon} {label}
      </div>
      <div style={{ fontSize: 24, fontWeight: 900, fontVariantNumeric: "tabular-nums", marginTop: 4, color: accent ?? "var(--text-primary)" }}>{value}</div>
      {sub && <div style={{ fontSize: "0.68rem", color: "var(--text-muted)", fontWeight: 600, marginTop: 2 }}>{sub}</div>}
    </div>
  );
}

function RepMini({ label, value, accent }: { label: string; value: string; accent?: string }) {
  return (
    <div style={{ textAlign: "right", minWidth: 58 }}>
      <div style={{ fontSize: 9, color: "var(--text-secondary)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}>{label}</div>
      <div style={{ fontSize: "0.95rem", fontWeight: 800, fontVariantNumeric: "tabular-nums", color: accent ?? "var(--text-muted)" }}>{value}</div>
    </div>
  );
}

function Mini({ label, value, accent }: { label: string; value: string; accent?: string }) {
  return (
    <div style={{ background: "var(--bg-base)", padding: "0.45rem 0.6rem", borderRadius: 8 }}>
      <div style={{ fontSize: 10, color: "var(--text-secondary)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}>{label}</div>
      <div style={{ fontSize: 15, fontWeight: 800, fontVariantNumeric: "tabular-nums", marginTop: 1, color: accent ?? "var(--text-primary)" }}>{value}</div>
    </div>
  );
}

function StatusPill({ status }: { status: "ACTIVE" | "ON_BREAK" | "ENDED" }) {
  const meta = status === "ACTIVE"
    ? { label: "Working", color: "#10b981", bg: "#d1fae5" }
    : status === "ON_BREAK"
    ? { label: "On Break", color: "#f59e0b", bg: "#fef3c7" }
    : { label: "Ended", color: "#64748b", bg: "#f1f5f9" };
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "3px 9px", borderRadius: 999, fontSize: 10, fontWeight: 800, color: meta.color, background: meta.bg }}>
      {status === "ENDED" ? <CheckCircle2 size={11} /> : <span style={{ width: 5, height: 5, borderRadius: "50%", background: meta.color }} />}
      {meta.label}
    </span>
  );
}

function endReasonLabel(r: string): string {
  switch (r) {
    case "MANUAL_END": return "Ended by rep";
    case "AUTO_MIDNIGHT": return "Rolled past midnight";
    case "AUTO_INACTIVE_EOD": return "Ended by system (inactive)";
    default: return r;
  }
}

const toolbarBtn: React.CSSProperties = {
  padding: "0 0.85rem",
  background: "transparent",
  border: "none",
  fontSize: "0.78rem",
  fontWeight: 600,
  color: "var(--text-secondary)",
  cursor: "pointer",
  whiteSpace: "nowrap",
  fontFamily: "inherit",
};
