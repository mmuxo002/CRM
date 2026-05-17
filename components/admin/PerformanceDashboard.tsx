"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  BarChart3, Clock, DollarSign, Users, ChevronLeft, ChevronRight,
  ChevronDown, ChevronUp, Loader2, Check, ExternalLink, Package, Tag,
} from "lucide-react";

type Totals = { workMs: number; breakMs: number; sessionCount: number; commissionTotal: number; paidTotal: number; pendingTotal: number; onboardingTotal: number; commissionCount: number };

type Row = {
  id: string;
  name: string | null;
  email: string | null;
  image: string | null;
  role: string;
  lastSeenAt: string | null;
  hours: { workMs: number; breakMs: number; breakCount: number; sessionCount: number; daysWorked: number };
  commissions: { commissionTotal: number; onboardingTotal: number; paidTotal: number; pendingTotal: number; count: number };
};

type Payload = {
  ok: true;
  period: { kind: "week"; weekOf: string } | { kind: "month"; monthOf: string };
  thisWeek: string;
  thisMonth: string;
  rows: Row[];
  totals: Totals;
};

function fmtH(ms: number) {
  const totalMin = Math.round(ms / 60000);
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  return `${h}h ${String(m).padStart(2, "0")}m`;
}

function fmtUSD(n: number) {
  if (n >= 1000) return `$${(n / 1000).toFixed(1)}k`;
  return `$${n.toFixed(0)}`;
}

function shiftWeek(weekOf: string, delta: number): string {
  const [yy, ww] = weekOf.split("-W").map(Number);
  // Start from Jan 4 of that year (always in W01 per ISO)
  const jan4 = new Date(Date.UTC(yy, 0, 4));
  const jan4Day = jan4.getUTCDay() || 7;
  const mondayOfW01 = new Date(jan4);
  mondayOfW01.setUTCDate(jan4.getUTCDate() - (jan4Day - 1));
  const target = new Date(mondayOfW01);
  target.setUTCDate(mondayOfW01.getUTCDate() + (ww - 1 + delta) * 7);
  // Compute ISO week of target
  const t = new Date(Date.UTC(target.getUTCFullYear(), target.getUTCMonth(), target.getUTCDate()));
  const d = t.getUTCDay() || 7;
  t.setUTCDate(t.getUTCDate() + 4 - d);
  const yearStart = new Date(Date.UTC(t.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil(((t.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return `${t.getUTCFullYear()}-W${String(weekNo).padStart(2, "0")}`;
}

function shiftMonth(monthOf: string, delta: number): string {
  const [yy, mm] = monthOf.split("-").map(Number);
  const d = new Date(Date.UTC(yy, mm - 1 + delta, 1));
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
}

type CommissionRow = {
  id: string;
  status: "PENDING" | "PAID" | "VOID";
  serviceType: string | null;
  source: string | null;
  onboardingAmount: number;
  rate: number;
  commissionAmount: number;
  earnedAt: string;
  paidAt: string | null;
  notes: string | null;
  lead: { id: string; name: string; source: string | null } | null;
  contact: { id: string; name: string; email: string | null } | null;
  project: { id: string; name: string; serviceType: string | null; company: { name: string } | null } | null;
};

export function PerformanceDashboard({ initial }: { initial: Payload }) {
  const [kind, setKind] = useState<"week" | "month">(initial.period.kind);
  const [weekOf, setWeekOf] = useState<string>(initial.period.kind === "week" ? initial.period.weekOf : initial.thisWeek);
  const [monthOf, setMonthOf] = useState<string>(initial.period.kind === "month" ? initial.period.monthOf : initial.thisMonth);
  const [data, setData] = useState<Payload>(initial);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [dealsByUser, setDealsByUser] = useState<Record<string, CommissionRow[]>>({});
  const [dealsLoading, setDealsLoading] = useState<Set<string>>(new Set());

  const load = useCallback(async () => {
    const qs = kind === "week" ? `weekOf=${weekOf}` : `monthOf=${monthOf}`;
    setLoading(true);
    try {
      const r = await fetch(`/api/admin/performance?${qs}`, { cache: "no-store" });
      if (r.ok) setData(await r.json());
    } finally { setLoading(false); }
  }, [kind, weekOf, monthOf]);

  useEffect(() => { load(); }, [load]);

  // Reset any per-rep expansion when the period changes — drilled-down data
  // would be stale for the new period.
  useEffect(() => {
    setExpanded(new Set());
    setDealsByUser({});
  }, [kind, weekOf, monthOf]);

  const loadDealsFor = useCallback(async (userId: string) => {
    const qs = kind === "week" ? `weekOf=${weekOf}` : `monthOf=${monthOf}`;
    setDealsLoading((prev) => new Set(prev).add(userId));
    try {
      const r = await fetch(`/api/admin/commissions?userId=${userId}&${qs}`, { cache: "no-store" });
      if (r.ok) {
        const body = await r.json();
        setDealsByUser((prev) => ({ ...prev, [userId]: body.commissions }));
      }
    } finally {
      setDealsLoading((prev) => {
        const next = new Set(prev); next.delete(userId); return next;
      });
    }
  }, [kind, weekOf, monthOf]);

  const toggleRep = useCallback((userId: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(userId)) {
        next.delete(userId);
      } else {
        next.add(userId);
        if (!dealsByUser[userId]) void loadDealsFor(userId);
      }
      return next;
    });
  }, [dealsByUser, loadDealsFor]);

  const markPaid = useCallback(async (userId: string, commissionId: string) => {
    const res = await fetch(`/api/admin/commissions/${commissionId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "PAID" }),
    });
    if (!res.ok) return;
    // Update in place and refresh the rep row totals
    setDealsByUser((prev) => ({
      ...prev,
      [userId]: (prev[userId] || []).map((c) =>
        c.id === commissionId ? { ...c, status: "PAID", paidAt: new Date().toISOString() } : c,
      ),
    }));
    void load();
  }, [load]);

  const periodLabel = useMemo(() => kind === "week" ? weekOf : monthOf, [kind, weekOf, monthOf]);

  const sorted = useMemo(() => {
    return [...data.rows].sort((a, b) => b.hours.workMs - a.hours.workMs);
  }, [data.rows]);

  function step(delta: number) {
    if (kind === "week") setWeekOf((w) => shiftWeek(w, delta));
    else setMonthOf((m) => shiftMonth(m, delta));
  }

  return (
    <div className="animate-slide-up">
      <div className="row-between" style={{ marginBottom: "1.25rem" }}>
        <div>
          <h1 className="page-title" style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <BarChart3 size={22} color="#4318ff" />
            Team Performance
          </h1>
          <p className="page-subtitle">Hours worked and commissions earned by each sales rep.</p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ display: "flex", background: "var(--bg-surface)", border: "1px solid var(--border-color)", borderRadius: 10, padding: 3 }}>
            <button type="button" onClick={() => setKind("week")} style={pillStyle(kind === "week")}>Week</button>
            <button type="button" onClick={() => setKind("month")} style={pillStyle(kind === "month")}>Month</button>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 4, background: "var(--bg-surface)", border: "1px solid var(--border-color)", borderRadius: 10, padding: 3 }}>
            <button type="button" onClick={() => step(-1)} style={arrowBtn}><ChevronLeft size={14} /></button>
            <div style={{ fontSize: "0.8rem", fontWeight: 700, padding: "0 10px", minWidth: 90, textAlign: "center" }}>{periodLabel}</div>
            <button type="button" onClick={() => step(1)} style={arrowBtn}><ChevronRight size={14} /></button>
          </div>
        </div>
      </div>

      <div className="dashboard-grid" style={{ gridTemplateColumns: "repeat(5, 1fr)", marginBottom: "1.25rem" }}>
        <SummaryCard label="Sales Reps" value={String(data.rows.length)} sub="Active" icon={<Users size={14} />} color="#4318ff" />
        <SummaryCard label="Hours Worked" value={fmtH(data.totals.workMs)} sub={`${data.totals.sessionCount} sessions`} icon={<Clock size={14} />} color="#10b981" />
        <SummaryCard label="Commissions" value={fmtUSD(data.totals.commissionTotal)} sub={`${data.totals.commissionCount} entries`} icon={<DollarSign size={14} />} color="#f59e0b" />
        <SummaryCard label="Paid" value={fmtUSD(data.totals.paidTotal)} sub="This period" icon={<DollarSign size={14} />} color="#059669" />
        <SummaryCard label="Pending" value={fmtUSD(data.totals.pendingTotal)} sub="Awaiting payout" icon={<DollarSign size={14} />} color="#ef4444" />
      </div>

      <div className="card">
        <div className="row-between" style={{ marginBottom: "0.75rem" }}>
          <h2 style={{ fontSize: "1rem", fontWeight: 800 }}>Reps</h2>
          <span style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>{loading ? "Loading…" : `${kind === "week" ? "Week" : "Month"} ${periodLabel}`}</span>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "24px 40px 1.5fr 90px 90px 90px 90px 100px 100px 100px", gap: "0.75rem", padding: "0.5rem 0.75rem", fontSize: "0.7rem", textTransform: "uppercase", color: "var(--text-secondary)", fontWeight: 700, letterSpacing: "0.05em", borderBottom: "1px solid var(--border-color)" }}>
          <span />
          <span />
          <span>Rep</span>
          <span>Hours</span>
          <span>Break</span>
          <span>Deals</span>
          <span>Sold</span>
          <span>Commission</span>
          <span>Paid</span>
          <span>Pending</span>
        </div>

        {sorted.length === 0 && (
          <div style={{ padding: "1.5rem", textAlign: "center", color: "var(--text-muted)", fontSize: "0.85rem" }}>
            No sales reps found. Enroll users with sales access to see them here.
          </div>
        )}

        {sorted.map((r) => {
          const isOpen = expanded.has(r.id);
          const deals = dealsByUser[r.id] || [];
          const isDealsLoading = dealsLoading.has(r.id);

          return (
            <div key={r.id} style={{ borderBottom: "1px solid var(--border-color)" }}>
              <div
                onClick={() => toggleRep(r.id)}
                style={{
                  display: "grid", gridTemplateColumns: "24px 40px 1.5fr 90px 90px 90px 90px 100px 100px 100px",
                  gap: "0.75rem", padding: "0.75rem", alignItems: "center",
                  cursor: "pointer",
                  background: isOpen ? "var(--bg-base)" : "transparent",
                }}
              >
                <span style={{ color: "var(--text-muted)", display: "flex" }}>
                  {isOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                </span>
                {r.image ? (
                  <img src={r.image} alt="" style={{ width: 32, height: 32, borderRadius: "50%", objectFit: "cover" }} />
                ) : (
                  <div style={{ width: 32, height: 32, borderRadius: "50%", background: "linear-gradient(135deg, #4318ff, #7c3aed)", color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: "0.7rem" }}>
                    {(r.name || r.email || "?").slice(0, 1).toUpperCase()}
                  </div>
                )}
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: "0.88rem", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{r.name || "—"}</div>
                  <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{r.email}</div>
                </div>
                <span style={{ fontWeight: 800, fontVariantNumeric: "tabular-nums", color: r.hours.workMs > 0 ? "#10b981" : "var(--text-muted)" }}>{fmtH(r.hours.workMs)}</span>
                <span style={{ fontVariantNumeric: "tabular-nums", color: "var(--text-secondary)" }}>{fmtH(r.hours.breakMs)}</span>
                <span style={{ fontVariantNumeric: "tabular-nums", color: r.commissions.count > 0 ? "var(--text-primary)" : "var(--text-muted)", fontWeight: 700 }}>{r.commissions.count}</span>
                <span style={{ fontVariantNumeric: "tabular-nums", color: r.commissions.onboardingTotal > 0 ? "#4318ff" : "var(--text-muted)", fontWeight: 700 }}>{fmtUSD(r.commissions.onboardingTotal)}</span>
                <span style={{ fontWeight: 800, fontVariantNumeric: "tabular-nums", color: r.commissions.commissionTotal > 0 ? "#f59e0b" : "var(--text-muted)" }}>{fmtUSD(r.commissions.commissionTotal)}</span>
                <span style={{ fontVariantNumeric: "tabular-nums", color: "#059669", fontWeight: 700 }}>{fmtUSD(r.commissions.paidTotal)}</span>
                <span style={{ fontVariantNumeric: "tabular-nums", color: "#ef4444", fontWeight: 700 }}>{fmtUSD(r.commissions.pendingTotal)}</span>
              </div>

              {isOpen && (
                <div style={{ padding: "0.5rem 1rem 1rem", background: "var(--bg-base)" }}>
                  <DealsTable
                    deals={deals}
                    loading={isDealsLoading}
                    onMarkPaid={(commissionId) => markPaid(r.id, commissionId)}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function SummaryCard({ label, value, sub, icon, color }: { label: string; value: string; sub: string; icon: React.ReactNode; color: string }) {
  return (
    <div className="card" style={{ padding: "0.75rem 1rem" }}>
      <div className="row-between" style={{ marginBottom: "0.35rem" }}>
        <span style={{ fontSize: "0.66rem", fontWeight: 700, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.04em" }}>{label}</span>
        <div style={{ color, display: "flex", alignItems: "center", justifyContent: "center", width: 24, height: 24, borderRadius: 7, background: color + "15" }}>{icon}</div>
      </div>
      <div style={{ fontSize: "1.4rem", fontWeight: 900, fontVariantNumeric: "tabular-nums" }}>{value}</div>
      <div style={{ fontSize: "0.65rem", color: "var(--text-muted)", fontWeight: 600 }}>{sub}</div>
    </div>
  );
}

function pillStyle(active: boolean): React.CSSProperties {
  return {
    padding: "0.4rem 0.85rem",
    borderRadius: 8,
    border: "none",
    background: active ? "var(--accent-primary)" : "transparent",
    color: active ? "white" : "var(--text-secondary)",
    fontSize: "0.78rem",
    fontWeight: 700,
    cursor: "pointer",
  };
}

const arrowBtn: React.CSSProperties = {
  display: "inline-flex", alignItems: "center", justifyContent: "center",
  width: 26, height: 26, borderRadius: 6, background: "transparent",
  border: "none", color: "var(--text-secondary)", cursor: "pointer",
};

function DealsTable({ deals, loading, onMarkPaid }: {
  deals: CommissionRow[];
  loading: boolean;
  onMarkPaid: (commissionId: string) => void;
}) {
  if (loading) {
    return (
      <div style={{ padding: "1rem", display: "flex", alignItems: "center", gap: 8, color: "var(--text-muted)", fontSize: "0.85rem" }}>
        <Loader2 size={14} className="spin" /> Loading deals…
      </div>
    );
  }

  if (deals.length === 0) {
    return (
      <div style={{ padding: "1rem", textAlign: "center", color: "var(--text-muted)", fontSize: "0.82rem" }}>
        No deals closed in this period.
      </div>
    );
  }

  const pendingTotal = deals.filter((d) => d.status === "PENDING").reduce((a, d) => a + d.commissionAmount, 0);
  const paidTotal = deals.filter((d) => d.status === "PAID").reduce((a, d) => a + d.commissionAmount, 0);
  const soldTotal = deals.reduce((a, d) => a + d.onboardingAmount, 0);

  return (
    <div>
      {/* Per-rep sub-summary */}
      <div style={{
        display: "flex", gap: 12, marginBottom: 10, fontSize: "0.78rem",
        padding: "0.6rem 0.8rem", borderRadius: 10,
        background: "var(--bg-surface)", border: "1px solid var(--border-color)",
      }}>
        <DealMini icon={<Package size={12} />} label="Deals" value={String(deals.length)} />
        <DealMini icon={<DollarSign size={12} />} label="Sold" value={fmtUSD(soldTotal)} color="#4318ff" />
        <DealMini icon={<DollarSign size={12} />} label="Commission Owed" value={fmtUSD(pendingTotal)} color="#ef4444" />
        <DealMini icon={<Check size={12} />} label="Already Paid" value={fmtUSD(paidTotal)} color="#059669" />
      </div>

      <div style={{
        display: "grid",
        gridTemplateColumns: "80px 1.5fr 1fr 90px 60px 100px 100px 110px",
        gap: 10, padding: "0.4rem 0.8rem", fontSize: "0.65rem",
        textTransform: "uppercase", color: "var(--text-secondary)",
        fontWeight: 700, letterSpacing: "0.04em",
        borderBottom: "1px solid var(--border-color)",
      }}>
        <span>Date</span>
        <span>What Was Sold</span>
        <span>Service</span>
        <span style={{ textAlign: "right" }}>Sold $</span>
        <span style={{ textAlign: "right" }}>Rate</span>
        <span style={{ textAlign: "right" }}>Commission</span>
        <span>Status</span>
        <span />
      </div>

      {deals.map((d) => {
        const soldName = d.project?.name || d.lead?.name || d.contact?.name || "—";
        const companyName = d.project?.company?.name;
        const service = d.project?.serviceType || d.serviceType || "—";
        const statusColor = d.status === "PAID" ? "#059669" : d.status === "VOID" ? "#64748b" : "#ef4444";
        const statusBg = d.status === "PAID" ? "#ecfdf5" : d.status === "VOID" ? "#f1f5f9" : "#fef2f2";

        return (
          <div key={d.id} style={{
            display: "grid",
            gridTemplateColumns: "80px 1.5fr 1fr 90px 60px 100px 100px 110px",
            gap: 10, padding: "0.55rem 0.8rem",
            fontSize: "0.8rem", alignItems: "center",
            borderBottom: "1px solid var(--border-color)",
          }}>
            <span style={{ color: "var(--text-muted)", fontSize: "0.75rem" }}>
              {new Date(d.earnedAt).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
            </span>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontWeight: 700, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                {soldName}
              </div>
              {companyName && companyName !== soldName && (
                <div style={{ fontSize: "0.7rem", color: "var(--text-muted)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {companyName}
                </div>
              )}
              {d.lead?.source && (
                <div style={{ fontSize: "0.65rem", color: "var(--text-muted)" }}>
                  via {d.lead.source}
                </div>
              )}
            </div>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: "0.72rem", color: "var(--text-secondary)" }}>
              <Tag size={10} /> {service.replace(/_/g, " ")}
            </span>
            <span style={{ textAlign: "right", fontVariantNumeric: "tabular-nums", fontWeight: 700, color: "#4318ff" }}>
              {fmtUSD(d.onboardingAmount)}
            </span>
            <span style={{ textAlign: "right", fontVariantNumeric: "tabular-nums", color: "var(--text-muted)", fontSize: "0.72rem" }}>
              {(d.rate * 100).toFixed(1)}%
            </span>
            <span style={{ textAlign: "right", fontVariantNumeric: "tabular-nums", fontWeight: 800, color: "#f59e0b" }}>
              {fmtUSD(d.commissionAmount)}
            </span>
            <span>
              <span style={{
                padding: "2px 7px", borderRadius: 5,
                fontSize: "0.62rem", fontWeight: 800,
                background: statusBg, color: statusColor,
                letterSpacing: "0.04em",
              }}>
                {d.status}
              </span>
              {d.paidAt && (
                <div style={{ fontSize: "0.62rem", color: "var(--text-muted)", marginTop: 2 }}>
                  {new Date(d.paidAt).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                </div>
              )}
            </span>
            <span>
              {d.status === "PENDING" && (
                <button
                  onClick={(e) => { e.stopPropagation(); onMarkPaid(d.id); }}
                  className="btn btn-primary"
                  style={{ fontSize: "0.7rem", padding: "0.3rem 0.6rem" }}
                >
                  <Check size={11} /> Mark Paid
                </button>
              )}
              {d.lead && (
                <a
                  href={`/prospecting/contacts/${d.lead.id}`}
                  onClick={(e) => e.stopPropagation()}
                  style={{
                    display: "inline-flex", alignItems: "center", gap: 3,
                    fontSize: "0.65rem", color: "var(--text-muted)",
                    textDecoration: "none", marginLeft: 6,
                  }}
                >
                  <ExternalLink size={9} /> Lead
                </a>
              )}
            </span>
          </div>
        );
      })}

      <style>{`
        .spin { animation: perf-spin 1s linear infinite; }
        @keyframes perf-spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}

function DealMini({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: string; color?: string }) {
  return (
    <div style={{ flex: 1, minWidth: 0 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: "0.6rem", fontWeight: 700, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 2 }}>
        {icon} {label}
      </div>
      <div style={{ fontSize: "0.95rem", fontWeight: 800, fontVariantNumeric: "tabular-nums", color: color ?? "var(--text-primary)" }}>
        {value}
      </div>
    </div>
  );
}
