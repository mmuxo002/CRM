"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Settings, Percent, DollarSign, History, Save, Loader2,
  Check, AlertCircle, Clock,
} from "lucide-react";

type RateRow = {
  id: string;
  rate: number;
  basis: string;
  note: string | null;
  effectiveFrom: string;
  effectiveTo: string | null;
  updatedBy: { name: string | null; email: string | null } | null;
};

type PricingRow = {
  id: string | null;
  serviceType: string;
  label: string;
  onboardingFee: number;
  monthlyFee: number;
  cost: number;
  effectiveFrom: string | null;
  updatedBy: { name: string | null; email: string | null } | null;
};

type Payload = {
  activeRate: RateRow | null;
  rateHistory: RateRow[];
  pricingRows: PricingRow[];
  serviceTypes: string[];
};

export function CommissionConfigEditor({ initial }: { initial: Payload }) {
  const router = useRouter();
  const [activeRate, setActiveRate] = useState<RateRow | null>(initial.activeRate);
  const [rateHistory, setRateHistory] = useState<RateRow[]>(initial.rateHistory);
  const [pricingRows, setPricingRows] = useState<PricingRow[]>(initial.pricingRows);
  const [toast, setToast] = useState<{ kind: "ok" | "err"; text: string } | null>(null);

  const flash = (kind: "ok" | "err", text: string) => {
    setToast({ kind, text });
    setTimeout(() => setToast(null), 3000);
  };

  const refresh = () => router.refresh();

  return (
    <div className="animate-slide-up">
      <div className="row-between" style={{ marginBottom: "1.25rem" }}>
        <div>
          <h1 className="page-title" style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <Settings size={22} color="#4318ff" />
            Commission Configuration
          </h1>
          <p className="page-subtitle">
            Manage the sales commission rate and per-service pricing. Changes are versioned — new rates and prices apply to commissions earned going forward and do not retroactively affect already-booked amounts.
          </p>
        </div>
      </div>

      {toast && (
        <div style={{
          padding: "0.65rem 0.9rem", borderRadius: 10, marginBottom: "1rem",
          background: toast.kind === "ok" ? "#ecfdf5" : "#fef2f2",
          border: toast.kind === "ok" ? "1px solid #a7f3d0" : "1px solid #fecaca",
          color: toast.kind === "ok" ? "#065f46" : "#991b1b",
          fontSize: "0.85rem", fontWeight: 600,
          display: "flex", alignItems: "center", gap: 8,
        }}>
          {toast.kind === "ok" ? <Check size={14} /> : <AlertCircle size={14} />}
          {toast.text}
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr)", gap: "1.25rem" }}>
        <CommissionRateCard
          activeRate={activeRate}
          rateHistory={rateHistory}
          onSaved={(rate) => {
            setActiveRate(rate);
            setRateHistory((prev) => [rate, ...prev].slice(0, 10));
            flash("ok", `Commission rate set to ${(rate.rate * 100).toFixed(2)}%.`);
            refresh();
          }}
          onError={(msg) => flash("err", msg)}
        />

        <ServicePricingCard
          rows={pricingRows}
          onRowSaved={(row) => {
            setPricingRows((prev) => prev.map((r) => r.serviceType === row.serviceType ? { ...row, id: row.id } : r));
            flash("ok", `Saved pricing for ${row.label}.`);
            refresh();
          }}
          onError={(msg) => flash("err", msg)}
        />
      </div>
    </div>
  );
}

// ── Commission Rate ──────────────────────────────────────────────────────────

function CommissionRateCard({
  activeRate, rateHistory, onSaved, onError,
}: {
  activeRate: RateRow | null;
  rateHistory: RateRow[];
  onSaved: (rate: RateRow) => void;
  onError: (msg: string) => void;
}) {
  const [ratePct, setRatePct] = useState<string>(activeRate ? (activeRate.rate * 100).toFixed(2) : "20");
  const [note, setNote] = useState<string>("");
  const [basis, setBasis] = useState<string>(activeRate?.basis || "ONBOARDING");
  const [saving, setSaving] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  const save = async () => {
    const pct = parseFloat(ratePct);
    if (!Number.isFinite(pct) || pct < 0 || pct > 100) {
      onError("Rate must be a number between 0 and 100.");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/admin/commission-rate", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rate: pct / 100, note: note.trim() || undefined, basis }),
      });
      const data = await res.json();
      if (!res.ok) {
        onError(data?.error || "Failed to save rate.");
        return;
      }
      onSaved(data.rate);
      setNote("");
    } catch (e) {
      onError(e instanceof Error ? e.message : "Network error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="card">
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
        <Percent size={16} style={{ color: "#4318ff" }} />
        <h2 style={{ fontSize: "1rem", fontWeight: 800, margin: 0 }}>Commission Rate</h2>
      </div>

      <p style={{ fontSize: "0.82rem", color: "var(--text-secondary)", marginBottom: 14, lineHeight: 1.55 }}>
        The percentage of onboarding revenue paid to the closing sales rep. Changes create a new versioned rate — commissions already recorded keep their snapshotted rate.
      </p>

      <div style={{
        display: "grid", gridTemplateColumns: "1.2fr 1fr 1.5fr auto", gap: 12,
        alignItems: "end", marginBottom: 12,
      }}>
        <Field label="New rate (%)">
          <div style={{ position: "relative" }}>
            <input
              type="number"
              step="0.01"
              min="0"
              max="100"
              value={ratePct}
              onChange={(e) => setRatePct(e.target.value)}
              style={{ ...inputStyle, paddingRight: 28 }}
            />
            <span style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)", fontWeight: 700, fontSize: "0.85rem" }}>%</span>
          </div>
        </Field>

        <Field label="Basis">
          <select value={basis} onChange={(e) => setBasis(e.target.value)} style={inputStyle}>
            <option value="ONBOARDING">Onboarding fee</option>
            <option value="ONBOARDING_PLUS_MRR_1">Onboarding + 1st month</option>
          </select>
        </Field>

        <Field label="Change note (optional)">
          <input
            type="text"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="e.g. Q2 2026 compensation plan"
            style={inputStyle}
          />
        </Field>

        <button className="btn btn-primary" onClick={save} disabled={saving} style={{ fontSize: "0.85rem", height: 38 }}>
          {saving ? <><Loader2 size={14} className="spin" /> Saving…</> : <><Save size={14} /> Save Rate</>}
        </button>
      </div>

      {activeRate && (
        <div style={{
          padding: "0.65rem 0.9rem", borderRadius: 10,
          background: "linear-gradient(135deg, #eff6ff, #dbeafe)",
          border: "1px solid #bfdbfe",
          display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, flexWrap: "wrap",
        }}>
          <div>
            <div style={{ fontSize: "0.62rem", fontWeight: 800, color: "#1d4ed8", textTransform: "uppercase", letterSpacing: "0.05em" }}>
              Current Rate
            </div>
            <div style={{ fontSize: "1.35rem", fontWeight: 900, color: "#1e3a8a", fontVariantNumeric: "tabular-nums" }}>
              {(activeRate.rate * 100).toFixed(2)}%
              <span style={{ fontSize: "0.75rem", color: "#3b82f6", fontWeight: 600, marginLeft: 8 }}>
                of {activeRate.basis.replace(/_/g, " ").toLowerCase()}
              </span>
            </div>
          </div>
          <div style={{ fontSize: "0.72rem", color: "#3b82f6" }}>
            <Clock size={11} style={{ verticalAlign: "middle", marginRight: 3 }} />
            Effective {new Date(activeRate.effectiveFrom).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}
            {activeRate.updatedBy?.name && <> · by {activeRate.updatedBy.name}</>}
            {activeRate.note && <> · "{activeRate.note}"</>}
          </div>
        </div>
      )}

      {rateHistory.length > 1 && (
        <div style={{ marginTop: 12 }}>
          <button
            onClick={() => setShowHistory((s) => !s)}
            style={{
              background: "none", border: "none", cursor: "pointer",
              fontSize: "0.78rem", fontWeight: 700, color: "var(--text-secondary)",
              display: "flex", alignItems: "center", gap: 4, padding: 0,
            }}
          >
            <History size={13} />
            {showHistory ? "Hide" : "Show"} history ({rateHistory.length})
          </button>

          {showHistory && (
            <div style={{ marginTop: 10, display: "flex", flexDirection: "column", gap: 4 }}>
              {rateHistory.map((r) => (
                <div key={r.id} style={{
                  display: "grid", gridTemplateColumns: "80px 1.2fr 1.5fr 1fr",
                  gap: 10, padding: "0.45rem 0.7rem",
                  background: r.effectiveTo === null ? "#eff6ff" : "var(--bg-base)",
                  borderRadius: 8, fontSize: "0.78rem", alignItems: "center",
                }}>
                  <span style={{ fontWeight: 800, fontVariantNumeric: "tabular-nums" }}>{(r.rate * 100).toFixed(2)}%</span>
                  <span style={{ color: "var(--text-secondary)" }}>
                    {new Date(r.effectiveFrom).toLocaleDateString()}
                    {r.effectiveTo && ` → ${new Date(r.effectiveTo).toLocaleDateString()}`}
                    {r.effectiveTo === null && (
                      <span style={{ marginLeft: 6, padding: "1px 6px", borderRadius: 4, background: "#3b82f614", color: "#1d4ed8", fontSize: "0.62rem", fontWeight: 800 }}>ACTIVE</span>
                    )}
                  </span>
                  <span style={{ color: "var(--text-muted)", fontStyle: r.note ? "normal" : "italic" }}>
                    {r.note || "—"}
                  </span>
                  <span style={{ color: "var(--text-muted)", fontSize: "0.72rem", textAlign: "right" }}>
                    {r.updatedBy?.name || r.updatedBy?.email || "—"}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Service Pricing ──────────────────────────────────────────────────────────

function ServicePricingCard({
  rows, onRowSaved, onError,
}: {
  rows: PricingRow[];
  onRowSaved: (row: PricingRow) => void;
  onError: (msg: string) => void;
}) {
  return (
    <div className="card">
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
        <DollarSign size={16} style={{ color: "#f59e0b" }} />
        <h2 style={{ fontSize: "1rem", fontWeight: 800, margin: 0 }}>Service Pricing</h2>
      </div>

      <p style={{ fontSize: "0.82rem", color: "var(--text-secondary)", marginBottom: 14, lineHeight: 1.55 }}>
        Onboarding fee, monthly fee, and internal cost per service type. The commission rate above is applied to the onboarding fee when a deal closes. Cost is admin-only and used for margin tracking.
      </p>

      <div style={{
        display: "grid",
        gridTemplateColumns: "1.4fr 1fr 1fr 1fr auto",
        gap: 10, padding: "0.5rem 0.7rem", fontSize: "0.68rem",
        textTransform: "uppercase", color: "var(--text-secondary)",
        fontWeight: 700, letterSpacing: "0.05em",
        borderBottom: "1px solid var(--border-color)",
      }}>
        <span>Service</span>
        <span style={{ textAlign: "right" }}>Onboarding</span>
        <span style={{ textAlign: "right" }}>Monthly</span>
        <span style={{ textAlign: "right" }}>Cost</span>
        <span />
      </div>

      <div style={{ display: "flex", flexDirection: "column" }}>
        {rows.map((row) => (
          <PricingRowEditor
            key={row.serviceType}
            row={row}
            onSaved={onRowSaved}
            onError={onError}
          />
        ))}
      </div>

      <style>{`
        .spin { animation: cc-spin 1s linear infinite; }
        @keyframes cc-spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}

function PricingRowEditor({
  row, onSaved, onError,
}: {
  row: PricingRow;
  onSaved: (row: PricingRow) => void;
  onError: (msg: string) => void;
}) {
  const [label, setLabel] = useState(row.label);
  const [onboarding, setOnboarding] = useState(String(row.onboardingFee));
  const [monthly, setMonthly] = useState(String(row.monthlyFee));
  const [cost, setCost] = useState(String(row.cost));
  const [saving, setSaving] = useState(false);

  const dirty = label !== row.label
    || onboarding !== String(row.onboardingFee)
    || monthly !== String(row.monthlyFee)
    || cost !== String(row.cost);

  const save = async () => {
    const numOnb = parseFloat(onboarding);
    const numMo = parseFloat(monthly);
    const numCost = parseFloat(cost);
    if (![numOnb, numMo, numCost].every((n) => Number.isFinite(n) && n >= 0)) {
      onError("All fees and cost must be non-negative numbers.");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/admin/service-pricing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          serviceType: row.serviceType,
          label: label.trim() || row.serviceType,
          onboardingFee: numOnb,
          monthlyFee: numMo,
          cost: numCost,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        onError(data?.error || "Failed to save pricing.");
        return;
      }
      onSaved({
        ...row,
        id: data.pricing.id,
        label: data.pricing.label,
        onboardingFee: data.pricing.onboardingFee,
        monthlyFee: data.pricing.monthlyFee,
        cost: data.pricing.cost,
        effectiveFrom: data.pricing.effectiveFrom,
      });
    } catch (e) {
      onError(e instanceof Error ? e.message : "Network error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{
      display: "grid", gridTemplateColumns: "1.4fr 1fr 1fr 1fr auto",
      gap: 10, padding: "0.55rem 0.7rem", alignItems: "center",
      borderBottom: "1px solid var(--border-color)",
    }}>
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: "0.62rem", fontWeight: 700, color: "var(--text-muted)", letterSpacing: "0.04em" }}>
          {row.serviceType}
        </div>
        <input
          type="text"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          style={{ ...inputStyle, fontWeight: 600, padding: "0.35rem 0.5rem", marginTop: 2 }}
        />
      </div>
      <MoneyInput value={onboarding} onChange={setOnboarding} />
      <MoneyInput value={monthly} onChange={setMonthly} suffix="/mo" />
      <MoneyInput value={cost} onChange={setCost} />
      <button
        className="btn btn-primary"
        onClick={save}
        disabled={saving || !dirty}
        style={{
          fontSize: "0.75rem", padding: "0.4rem 0.8rem",
          opacity: dirty || saving ? 1 : 0.4,
        }}
      >
        {saving ? <Loader2 size={12} className="spin" /> : <Save size={12} />}
      </button>
    </div>
  );
}

function MoneyInput({ value, onChange, suffix }: { value: string; onChange: (v: string) => void; suffix?: string }) {
  return (
    <div style={{ position: "relative" }}>
      <span style={{ position: "absolute", left: 8, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)", fontSize: "0.78rem", fontWeight: 700 }}>$</span>
      <input
        type="number"
        step="0.01"
        min="0"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{ ...inputStyle, paddingLeft: 18, paddingRight: suffix ? 32 : 8, textAlign: "right", fontVariantNumeric: "tabular-nums" }}
      />
      {suffix && (
        <span style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)", fontSize: "0.68rem", fontWeight: 600 }}>
          {suffix}
        </span>
      )}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label style={{ display: "flex", flexDirection: "column", gap: 5 }}>
      <span style={{ fontSize: "0.68rem", fontWeight: 700, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
        {label}
      </span>
      {children}
    </label>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "0.55rem 0.65rem",
  borderRadius: 8,
  border: "1.5px solid var(--border-color)",
  fontSize: "0.85rem",
  fontFamily: "inherit",
  background: "var(--bg-surface)",
  color: "var(--text-primary)",
  boxSizing: "border-box",
};
