"use client";

import { signOut, useSession } from "next-auth/react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Play, Coffee, Square, RefreshCw, CheckCircle2, FileText } from "lucide-react";

const HEARTBEAT_MS = 30_000;
const ACTIVITY_WINDOW_MS = 60_000;
const ACTIVITY_EVENTS: (keyof WindowEventMap)[] = ["mousemove", "mousedown", "keydown", "scroll", "touchstart"];

export type TrackerPhase = "NONE" | "WORKING" | "ON_BREAK" | "INACTIVE_BREAK" | "ENDED";

export type TrackerInterval = {
  id: string;
  kind: "WORK" | "BREAK";
  source: "SYSTEM" | "USER" | "BACKFILL";
  startedAt: string;
  endedAt: string | null;
  note: string | null;
};

export type TrackerPayload = {
  session: {
    id: string;
    userId: string;
    dateCST: string;
    startedAt: string;
    endedAt: string | null;
    endReason: string | null;
    status: "ACTIVE" | "ON_BREAK" | "ENDED";
    lastActivityAt: string;
    breakCount: number;
    intervals: TrackerInterval[];
  };
  totals: { workMs: number; breakMs: number; breakCount: number };
  openInterval: TrackerInterval | null;
};

export function fmtHMS(ms: number) {
  const s = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
}

export function phaseColor(phase: TrackerPhase): string {
  if (phase === "WORKING") return "#10b981"; // green
  if (phase === "ON_BREAK") return "#f59e0b"; // yellow/amber
  if (phase === "INACTIVE_BREAK") return "#3b82f6"; // blue
  return "#94a3b8"; // gray — NONE or ENDED
}

export function phaseLabel(phase: TrackerPhase): string {
  switch (phase) {
    case "WORKING": return "You're clocked in";
    case "ON_BREAK": return "On break";
    case "INACTIVE_BREAK": return "Clock back in";
    case "ENDED": return "Day complete";
    default: return "Not clocked in";
  }
}

export function useTimeTracker() {
  const { data: authSession, status: authStatus } = useSession();
  const role = (authSession?.user as { role?: string } | undefined)?.role;
  const enabled = role === "SALES" && authStatus === "authenticated";

  const [state, setState] = useState<TrackerPayload | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSummary, setShowSummary] = useState<TrackerPayload | null>(null);
  const [nowTick, setNowTick] = useState(Date.now());
  const lastActivityRef = useRef(Date.now());

  useEffect(() => {
    if (!enabled) return;
    const onActivity = () => { lastActivityRef.current = Date.now(); };
    const onVisibility = () => { if (!document.hidden) lastActivityRef.current = Date.now(); };
    ACTIVITY_EVENTS.forEach((e) => window.addEventListener(e, onActivity, { passive: true }));
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      ACTIVITY_EVENTS.forEach((e) => window.removeEventListener(e, onActivity));
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [enabled]);

  useEffect(() => {
    if (!enabled) return;
    const t = setInterval(() => setNowTick(Date.now()), 1000);
    return () => clearInterval(t);
  }, [enabled]);

  const loadMe = useCallback(async () => {
    try {
      const res = await fetch("/api/sales/time/me", { cache: "no-store" });
      if (!res.ok) return;
      const data = await res.json();
      setState(data.state ?? null);
    } catch {}
  }, []);

  const startDay = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/sales/time/start", { method: "POST" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data?.error || `Start failed (${res.status})`);
        return;
      }
      setState(data.state);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Network error starting day");
    } finally { setLoading(false); }
  }, []);

  const sendHeartbeat = useCallback(async () => {
    if (document.hidden) return;
    if (Date.now() - lastActivityRef.current > ACTIVITY_WINDOW_MS) return;
    try {
      const res = await fetch("/api/sales/time/heartbeat", { method: "POST" });
      if (!res.ok) return;
      const data = await res.json();
      if (data.signOut) {
        await signOut({ callbackUrl: "/login" });
        return;
      }
      if (data.needsStart) {
        setState(null);
        return;
      }
      if (data.state) setState(data.state);
    } catch {}
  }, []);

  useEffect(() => {
    if (!enabled) return;
    loadMe();
    const t = setInterval(sendHeartbeat, HEARTBEAT_MS);
    return () => clearInterval(t);
  }, [enabled, loadMe, sendHeartbeat]);

  const onBreakClick = useCallback(async (action: "start" | "end") => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/sales/time/break", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data?.error || `Break ${action} failed (${res.status})`);
        return;
      }
      setState(data.state);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Network error on break");
    } finally { setLoading(false); }
  }, []);

  const onEndSession = useCallback(async () => {
    if (!confirm("End your work session for the day? You will not be able to start another session until tomorrow.")) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/sales/time/end", { method: "POST" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data?.error || `End failed (${res.status})`);
        return;
      }
      setState(data.state);
      setShowSummary(data.state);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Network error ending session");
    } finally { setLoading(false); }
  }, []);

  const liveDisplay = useMemo(() => {
    if (!state) return { workMs: 0, breakMs: 0 };
    const base = state.totals;
    const open = state.openInterval;
    if (!open || state.session.status === "ENDED") {
      return { workMs: base.workMs, breakMs: base.breakMs };
    }
    const liveMs = Math.max(0, nowTick - new Date(open.startedAt).getTime());
    return {
      workMs: open.kind === "WORK" ? base.workMs + liveMs : base.workMs,
      breakMs: open.kind === "BREAK" ? base.breakMs + liveMs : base.breakMs,
    };
  }, [state, nowTick]);

  const phase: TrackerPhase = useMemo(() => {
    if (!state) return "NONE";
    if (state.session.status === "ENDED") return "ENDED";
    if (state.session.status === "ON_BREAK") {
      return state.openInterval?.source === "SYSTEM" ? "INACTIVE_BREAK" : "ON_BREAK";
    }
    return "WORKING";
  }, [state]);

  return {
    enabled,
    state,
    phase,
    liveDisplay,
    loading,
    error,
    showSummary,
    setShowSummary,
    startDay,
    onBreakClick,
    onEndSession,
  };
}

export function TimeTrackerPanel({
  state,
  phase,
  liveDisplay,
  loading,
  error,
  onStart,
  onBreak,
  onEnd,
  onViewSummary,
}: {
  state: TrackerPayload | null;
  phase: TrackerPhase;
  liveDisplay: { workMs: number; breakMs: number };
  loading: boolean;
  error: string | null;
  onStart: () => void;
  onBreak: (action: "start" | "end") => void;
  onEnd: () => void;
  onViewSummary?: () => void;
}) {
  const hasSession = state !== null;
  const ended = phase === "ENDED";
  const onBreakState = phase === "ON_BREAK" || phase === "INACTIVE_BREAK";
  const color = phaseColor(phase);

  return (
    <div style={styles.panel}>
      <div style={styles.panelHeader}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ ...styles.dot, background: color }} />
          <div style={styles.title}>{phaseLabel(phase)}</div>
        </div>
        <div style={styles.dateLabel}>{state?.session.dateCST ?? ""}</div>
      </div>

      {error && (
        <div style={styles.errorBanner}>{error}</div>
      )}

      {!hasSession && (
        <button type="button" style={styles.primaryBtn} disabled={loading} onClick={onStart}>
          <Play size={14} /> {loading ? "Starting…" : "Start My Day"}
        </button>
      )}

      {hasSession && (
        <>
          <div style={styles.timeGrid}>
            <div style={styles.timeCell}>
              <div style={styles.timeLabel}>Worked</div>
              <div style={{ ...styles.timeValue, color: onBreakState || ended ? "var(--text-secondary)" : "#10b981" }}>
                {fmtHMS(liveDisplay.workMs)}
              </div>
            </div>
            <div style={styles.timeCell}>
              <div style={styles.timeLabel}>Break</div>
              <div style={{ ...styles.timeValue, color: onBreakState ? color : "var(--text-secondary)" }}>
                {fmtHMS(liveDisplay.breakMs)}
              </div>
            </div>
            <div style={styles.timeCell}>
              <div style={styles.timeLabel}>Breaks</div>
              <div style={styles.timeValue}>{state.totals.breakCount}</div>
            </div>
          </div>

          {!ended && (
            <div style={styles.buttonRow}>
              {onBreakState ? (
                <button type="button" style={styles.primaryBtn} disabled={loading} onClick={() => onBreak("end")}>
                  <RefreshCw size={14} /> Back from Break
                </button>
              ) : (
                <button type="button" style={styles.secondaryBtn} disabled={loading} onClick={() => onBreak("start")}>
                  <Coffee size={14} /> Going on Break
                </button>
              )}
              <button type="button" style={styles.dangerBtn} disabled={loading} onClick={onEnd}>
                <Square size={14} /> End Session
              </button>
            </div>
          )}

          {ended && (
            <button type="button" style={styles.summaryBtn} onClick={onViewSummary} disabled={!onViewSummary}>
              <FileText size={14} /> View Session Summary
            </button>
          )}
        </>
      )}
    </div>
  );
}

export function SessionSummaryModal({ payload, onClose }: { payload: TrackerPayload; onClose: () => void }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
    const onEsc = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onEsc);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onEsc);
      document.body.style.overflow = prev;
    };
  }, [onClose]);

  if (!mounted) return null;

  const breaks = payload.session.intervals.filter((i) => i.kind === "BREAK");
  const endedAtLabel = payload.session.endedAt
    ? new Date(payload.session.endedAt).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })
    : null;
  const dayLabel = new Date(payload.session.dateCST + "T12:00:00").toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" });

  const node = (
    <div style={styles.overlay} role="dialog" aria-modal="true" onClick={onClose}>
      <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div style={styles.modalHeader}>
          <div style={styles.successBadge}><CheckCircle2 size={18} /></div>
          <div style={{ fontSize: 11, color: "var(--text-secondary)", fontWeight: 800, letterSpacing: "0.1em", textTransform: "uppercase", marginTop: 4 }}>Session Complete</div>
          <div style={{ fontSize: 22, fontWeight: 900, marginTop: 6 }}>{dayLabel}</div>
          {endedAtLabel && (
            <div style={{ fontSize: 13, color: "var(--text-secondary)", marginTop: 4 }}>Ended at {endedAtLabel}</div>
          )}
        </div>

        <div style={styles.summaryGrid}>
          <Stat label="Hours Worked" value={fmtHMS(payload.totals.workMs)} accent="#10b981" />
          <Stat label="Break Time" value={fmtHMS(payload.totals.breakMs)} accent="#f59e0b" />
          <Stat label="Breaks Taken" value={String(payload.totals.breakCount)} />
        </div>

        {breaks.length > 0 && (
          <div style={{ marginTop: "1.25rem" }}>
            <div style={{ fontSize: 11, fontWeight: 800, color: "var(--text-secondary)", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.08em" }}>Breaks</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {breaks.map((b) => {
                const start = new Date(b.startedAt);
                const end = b.endedAt ? new Date(b.endedAt) : null;
                const dur = end ? end.getTime() - start.getTime() : 0;
                return (
                  <div key={b.id} style={styles.breakRow}>
                    <span style={styles.breakSource}>{b.source === "SYSTEM" ? "Auto (inactive)" : b.source === "BACKFILL" ? "Added later" : "Manual"}</span>
                    <span>{start.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })} — {end ? end.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }) : "…"}</span>
                    <span style={{ fontWeight: 800, marginLeft: "auto" }}>{fmtHMS(dur)}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <button type="button" style={styles.doneBtn} onClick={onClose} autoFocus>Done</button>
      </div>
    </div>
  );

  return createPortal(node, document.body);
}

function Stat({ label, value, accent }: { label: string; value: string; accent?: string }) {
  return (
    <div style={styles.summaryCell}>
      <div style={styles.timeLabel}>{label}</div>
      <div style={{ ...styles.summaryValue, color: accent ?? "var(--text-primary)" }}>{value}</div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  panel: { padding: "0.9rem 1rem", fontSize: 13, borderBottom: "1px solid var(--border-color)" },
  panelHeader: { display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 },
  title: { fontWeight: 800, fontSize: 13 },
  dot: { width: 10, height: 10, borderRadius: "50%" },
  dateLabel: { fontSize: 11, color: "var(--text-secondary)", fontWeight: 700 },
  timeGrid: { display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 10 },
  timeCell: { background: "var(--bg-base)", padding: "0.5rem 0.6rem", borderRadius: 8 },
  timeLabel: { fontSize: 10, color: "var(--text-secondary)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" },
  timeValue: { fontSize: 14, fontWeight: 800, fontVariantNumeric: "tabular-nums", marginTop: 2 },
  buttonRow: { display: "flex", gap: 6 },
  primaryBtn: { flex: 1, display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 6, padding: "0.55rem 0.75rem", borderRadius: 8, background: "var(--accent-primary, #4318ff)", color: "white", border: "none", fontSize: 12, fontWeight: 700, cursor: "pointer" },
  secondaryBtn: { flex: 1, display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 6, padding: "0.55rem 0.75rem", borderRadius: 8, background: "var(--bg-base)", color: "var(--text-primary)", border: "1px solid var(--border-color)", fontSize: 12, fontWeight: 700, cursor: "pointer" },
  dangerBtn: { display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 6, padding: "0.55rem 0.75rem", borderRadius: 8, background: "#ef4444", color: "white", border: "none", fontSize: 12, fontWeight: 700, cursor: "pointer" },
  summaryBtn: { width: "100%", display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 6, padding: "0.6rem 0.75rem", borderRadius: 8, background: "var(--bg-base)", color: "var(--text-primary)", border: "1px solid var(--border-color)", fontSize: 12, fontWeight: 700, cursor: "pointer" },
  errorBanner: { fontSize: 11, fontWeight: 700, color: "#991b1b", background: "#fef2f2", border: "1px solid #fecaca", padding: "0.4rem 0.6rem", borderRadius: 6, marginBottom: 8 },
  overlay: { position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(15,23,42,0.55)", backdropFilter: "blur(2px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999, padding: "1rem" },
  modal: { background: "var(--bg-surface, white)", borderRadius: 16, padding: "1.75rem 1.75rem 1.5rem", width: "min(460px, 100%)", maxHeight: "90vh", overflow: "auto", boxShadow: "0 40px 80px -20px rgba(0,0,0,0.45)", textAlign: "center" as const },
  modalHeader: { display: "flex", flexDirection: "column" as const, alignItems: "center", marginBottom: "1.25rem" },
  successBadge: { width: 48, height: 48, borderRadius: "50%", background: "#d1fae5", color: "#059669", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 6 },
  summaryGrid: { display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, textAlign: "left" as const },
  summaryCell: { background: "var(--bg-base)", padding: "0.8rem", borderRadius: 10 },
  summaryValue: { fontSize: 22, fontWeight: 900, fontVariantNumeric: "tabular-nums", marginTop: 4 },
  breakRow: { display: "flex", alignItems: "center", gap: 10, padding: "0.55rem 0.75rem", background: "var(--bg-base)", borderRadius: 8, fontSize: 12, textAlign: "left" as const },
  breakSource: { fontSize: 10, fontWeight: 700, color: "var(--text-secondary)", background: "var(--bg-surface, white)", padding: "0.15rem 0.4rem", borderRadius: 4, minWidth: 100, textTransform: "uppercase", letterSpacing: "0.04em" },
  doneBtn: { marginTop: "1.5rem", width: "100%", padding: "0.8rem 1rem", borderRadius: 10, background: "var(--accent-primary, #4318ff)", color: "white", border: "none", fontSize: 14, fontWeight: 800, cursor: "pointer", boxShadow: "0 10px 25px -10px rgba(67,24,255,0.55)" },
};
