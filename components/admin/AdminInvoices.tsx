"use client";

import { useState, useEffect, useRef } from "react";
import { Plus, X, Check, Trash2, DollarSign, Clock, CheckCircle2, AlertCircle, Send } from "lucide-react";

type Invoice = {
  id: string;
  number: string;
  description: string | null;
  amount: number;
  status: string;
  dueDate: string;
  paidAt: string | null;
  project: { id: string; name: string } | null;
  company: { id: string; name: string } | null;
};

const STATUS_META: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  DRAFT:   { label: "Draft",   color: "#94a3b8", icon: <Clock size={12} /> },
  SENT:    { label: "Sent",    color: "#3b82f6", icon: <Send size={12} /> },
  PAID:    { label: "Paid",    color: "#10b981", icon: <CheckCircle2 size={12} /> },
  OVERDUE: { label: "Overdue", color: "#ef4444", icon: <AlertCircle size={12} /> },
  VOID:    { label: "Void",    color: "#64748b", icon: <X size={12} /> },
};

export function AdminInvoicesSection() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState({ description: "", amount: "", dueDate: "", status: "DRAFT" });

  useEffect(() => {
    fetch("/api/invoices").then((r) => r.json()).then((d) => { setInvoices(d.invoices || []); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

  const paidThisMonth = invoices
    .filter((inv) => inv.status === "PAID" && inv.paidAt && new Date(inv.paidAt) >= monthStart && new Date(inv.paidAt) <= monthEnd)
    .reduce((s, inv) => s + inv.amount, 0);

  const upcoming = invoices
    .filter((inv) => inv.status !== "PAID" && inv.status !== "VOID")
    .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());

  const create = async () => {
    if (!draft.amount || !draft.dueDate) return;
    const res = await fetch("/api/invoices", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...draft, amount: Number(draft.amount) }),
    });
    const data = await res.json();
    if (data.invoice) setInvoices((prev) => [...prev, data.invoice]);
    setDraft({ description: "", amount: "", dueDate: "", status: "DRAFT" });
    setAdding(false);
  };

  const updateStatus = async (id: string, status: string) => {
    setInvoices((prev) => prev.map((inv) => inv.id === id ? { ...inv, status, paidAt: status === "PAID" ? new Date().toISOString() : inv.paidAt } : inv));
    await fetch(`/api/invoices/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status }) });
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this invoice?")) return;
    setInvoices((prev) => prev.filter((inv) => inv.id !== id));
    await fetch(`/api/invoices/${id}`, { method: "DELETE" });
  };

  return (
    <div>
      {/* Rolling counter */}
      <div style={{ display: "flex", gap: "1rem", marginBottom: "1rem" }}>
        <div style={{ flex: 1, padding: "1rem", background: "linear-gradient(135deg, #10b981, #059669)", borderRadius: 12, color: "white" }}>
          <div style={{ fontSize: "0.68rem", fontWeight: 700, textTransform: "uppercase", opacity: 0.85, marginBottom: 4 }}>Paid This Month</div>
          <RollingCounter value={paidThisMonth} />
          <div style={{ fontSize: "0.65rem", opacity: 0.75, marginTop: 2 }}>{now.toLocaleString("en-US", { month: "long", year: "numeric" })}</div>
        </div>
        <div style={{ flex: 1, padding: "1rem", background: "linear-gradient(135deg, #f59e0b, #d97706)", borderRadius: 12, color: "white" }}>
          <div style={{ fontSize: "0.68rem", fontWeight: 700, textTransform: "uppercase", opacity: 0.85, marginBottom: 4 }}>Upcoming Due</div>
          <div style={{ fontSize: "1.75rem", fontWeight: 900 }}>${upcoming.reduce((s, i) => s + i.amount, 0).toLocaleString()}</div>
          <div style={{ fontSize: "0.65rem", opacity: 0.75, marginTop: 2 }}>{upcoming.length} invoice{upcoming.length === 1 ? "" : "s"} pending</div>
        </div>
      </div>

      {/* Upcoming invoices */}
      <div className="row-between" style={{ marginBottom: "0.5rem" }}>
        <h3 style={{ fontSize: "0.85rem", fontWeight: 800 }}>Upcoming Invoices</h3>
        <button onClick={() => setAdding(true)} className="btn btn-ghost" style={{ fontSize: "0.72rem" }}><Plus size={12} /> New Invoice</button>
      </div>

      {adding && (
        <div style={{ padding: "0.75rem", background: "var(--bg-base)", borderRadius: 10, marginBottom: "0.75rem", border: "1px solid var(--border-color)" }}>
          <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr", gap: 6, marginBottom: 6 }}>
            <input value={draft.description} onChange={(e) => setDraft({ ...draft, description: e.target.value })} placeholder="Description" style={{ padding: "6px 8px", border: "1px solid var(--border-color)", borderRadius: 6, fontSize: "0.8rem" }} />
            <input type="number" value={draft.amount} onChange={(e) => setDraft({ ...draft, amount: e.target.value })} placeholder="Amount $" style={{ padding: "6px 8px", border: "1px solid var(--border-color)", borderRadius: 6, fontSize: "0.8rem" }} />
            <input type="date" value={draft.dueDate} onChange={(e) => setDraft({ ...draft, dueDate: e.target.value })} style={{ padding: "6px 8px", border: "1px solid var(--border-color)", borderRadius: 6, fontSize: "0.8rem" }} />
          </div>
          <div style={{ display: "flex", gap: 6 }}>
            <button onClick={create} disabled={!draft.amount || !draft.dueDate} className="btn btn-primary" style={{ fontSize: "0.75rem" }}>Create</button>
            <button onClick={() => setAdding(false)} className="btn btn-ghost" style={{ fontSize: "0.75rem" }}>Cancel</button>
          </div>
        </div>
      )}

      {loading && <div style={{ color: "var(--text-muted)", fontSize: "0.85rem", padding: "1rem" }}>Loading…</div>}

      <div style={{ maxHeight: 400, overflowY: "auto" }}>
        {!loading && upcoming.length === 0 && <div style={{ color: "var(--text-muted)", fontSize: "0.85rem", padding: "0.75rem 0" }}>No upcoming invoices.</div>}
        {upcoming.map((inv) => {
          const meta = STATUS_META[inv.status] || STATUS_META.DRAFT;
          const daysTo = Math.ceil((new Date(inv.dueDate).getTime() - Date.now()) / 86400000);
          const overdue = daysTo < 0 && inv.status !== "PAID";
          return (
            <div key={inv.id} style={{ display: "flex", alignItems: "center", gap: "0.6rem", padding: "0.55rem 0", borderBottom: "1px solid var(--border-color)" }}>
              <div style={{ width: 32, height: 32, borderRadius: 8, background: (overdue ? "#ef4444" : meta.color) + "18", color: overdue ? "#ef4444" : meta.color, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <DollarSign size={14} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 700, fontSize: "0.82rem", display: "flex", alignItems: "center", gap: 6 }}>
                  <span>{inv.number}</span>
                  <span style={{ fontSize: "0.68rem", fontWeight: 600, color: meta.color, background: meta.color + "18", padding: "1px 6px", borderRadius: 4, display: "inline-flex", alignItems: "center", gap: 3 }}>{meta.icon} {meta.label}</span>
                </div>
                <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {inv.description || "—"}
                  {inv.company && ` · ${inv.company.name}`}
                  {inv.project && ` · ${inv.project.name}`}
                </div>
              </div>
              <div style={{ textAlign: "right", flexShrink: 0 }}>
                <div style={{ fontWeight: 800, fontSize: "0.88rem" }}>${inv.amount.toLocaleString()}</div>
                <div style={{ fontSize: "0.65rem", color: overdue ? "#ef4444" : "var(--text-muted)", fontWeight: overdue ? 700 : 400 }}>
                  {overdue ? `${-daysTo}d overdue` : daysTo === 0 ? "Due today" : `${daysTo}d`}
                </div>
              </div>
              <div style={{ display: "flex", gap: 2, flexShrink: 0 }}>
                {inv.status !== "PAID" && (
                  <button onClick={() => updateStatus(inv.id, "PAID")} title="Mark paid" className="btn btn-ghost" style={{ padding: "4px 6px", color: "#10b981" }}><CheckCircle2 size={12} /></button>
                )}
                {inv.status === "DRAFT" && (
                  <button onClick={() => updateStatus(inv.id, "SENT")} title="Mark sent" className="btn btn-ghost" style={{ padding: "4px 6px", color: "#3b82f6" }}><Send size={12} /></button>
                )}
                <button onClick={() => remove(inv.id)} className="btn btn-ghost" style={{ padding: "4px 6px", color: "#ef4444" }}><Trash2 size={12} /></button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Paid this month list */}
      {invoices.filter((i) => i.status === "PAID" && i.paidAt && new Date(i.paidAt) >= monthStart).length > 0 && (
        <div style={{ marginTop: "1rem" }}>
          <h4 style={{ fontSize: "0.72rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", marginBottom: "0.4rem" }}>Paid This Month</h4>
          {invoices.filter((i) => i.status === "PAID" && i.paidAt && new Date(i.paidAt) >= monthStart).map((inv) => (
            <div key={inv.id} style={{ display: "flex", alignItems: "center", gap: "0.5rem", padding: "0.35rem 0", fontSize: "0.78rem", opacity: 0.7 }}>
              <CheckCircle2 size={12} style={{ color: "#10b981" }} />
              <span style={{ fontWeight: 600 }}>{inv.number}</span>
              <span style={{ color: "var(--text-muted)", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{inv.description || inv.company?.name || "—"}</span>
              <span style={{ fontWeight: 700, color: "#10b981" }}>${inv.amount.toLocaleString()}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function RollingCounter({ value }: { value: number }) {
  const [display, setDisplay] = useState(0);
  const ref = useRef<number>(0);

  useEffect(() => {
    const start = ref.current;
    const diff = value - start;
    if (diff === 0) return;
    const duration = 1200;
    const startTime = performance.now();
    const tick = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = start + diff * eased;
      setDisplay(current);
      if (progress < 1) requestAnimationFrame(tick);
      else ref.current = value;
    };
    requestAnimationFrame(tick);
  }, [value]);

  return <div style={{ fontSize: "1.75rem", fontWeight: 900 }}>${Math.round(display).toLocaleString()}</div>;
}
