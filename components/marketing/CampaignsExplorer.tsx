"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { LayoutGrid, List as ListIcon, Search, X, Megaphone, Users, TrendingUp } from "lucide-react";
import { CAMPAIGN_SERVICES, CAMPAIGN_NICHES } from "@/lib/campaign-taxonomy";

export type CampaignRow = {
  id: string;
  name: string;
  entityName: string | null;
  description: string | null;
  coverColor: string;
  service: string | null;
  niche: string | null;
  status: string;
  leads: number;
  prospects: number;
  clients: number;
  total: number;
  tagCount: number;
  linkCount: number;
  fileCount: number;
  tags: { id: string; label: string; color: string; count: number }[];
};

export function CampaignsExplorer({ campaigns }: { campaigns: CampaignRow[] }) {
  const [view, setView] = useState<"grid" | "list">("grid");
  const [query, setQuery] = useState("");
  const [service, setService] = useState<string | null>(null);
  const [niche, setNiche] = useState<string | null>(null);

  const services = useMemo(() => {
    const fromData = new Set(campaigns.map((c) => c.service).filter(Boolean) as string[]);
    return Array.from(new Set<string>([...CAMPAIGN_SERVICES, ...fromData]));
  }, [campaigns]);
  const niches = useMemo(() => {
    const fromData = new Set(campaigns.map((c) => c.niche).filter(Boolean) as string[]);
    return Array.from(new Set<string>([...CAMPAIGN_NICHES, ...fromData]));
  }, [campaigns]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return campaigns.filter((c) => {
      if (service && c.service !== service) return false;
      if (niche && c.niche !== niche) return false;
      if (q) {
        const hay = `${c.name} ${c.entityName ?? ""} ${c.description ?? ""}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [campaigns, query, service, niche]);

  const totals = filtered.reduce((acc, c) => ({ leads: acc.leads + c.leads, prospects: acc.prospects + c.prospects, clients: acc.clients + c.clients, total: acc.total + c.total }), { leads: 0, prospects: 0, clients: 0, total: 0 });
  const activeFilters = !!service || !!niche || !!query;

  return (
    <div>
      {/* Summary */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "1rem", marginBottom: "1.25rem" }}>
        <SummaryCard label={activeFilters ? "Matching" : "Total Campaigns"} value={filtered.length} icon={<Megaphone size={18} />} color="#ec4899" />
        <SummaryCard label="Leads" value={totals.leads} icon={<Users size={18} />} color="#94a3b8" />
        <SummaryCard label="Prospects" value={totals.prospects} icon={<Users size={18} />} color="#f59e0b" />
        <SummaryCard label="Clients (Converted)" value={totals.clients} icon={<TrendingUp size={18} />} color="#10b981" />
      </div>

      {/* Filter bar */}
      <div
        className="card"
        style={{
          padding: "0.6rem 0.85rem",
          marginBottom: "1rem",
          display: "flex",
          flexDirection: "row",
          alignItems: "center",
          gap: "0.6rem",
          flexWrap: "wrap",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            width: 260,
            padding: "0.4rem 0.7rem",
            border: "1px solid var(--border-color)",
            borderRadius: 10,
            background: "var(--bg-base)",
          }}
        >
          <Search size={14} color="#94a3b8" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search campaigns…"
            style={{ flex: 1, border: "none", outline: "none", background: "transparent", fontSize: "0.82rem", minWidth: 0 }}
          />
        </div>

        <div style={{ width: 1, height: 24, background: "var(--border-color)" }} />

        <FilterPills
          label="Service"
          value={service}
          options={services}
          onChange={setService}
          color="#7c3aed"
        />
        <FilterPills
          label="Niche"
          value={niche}
          options={niches}
          onChange={setNiche}
          color="#ec4899"
        />

        {activeFilters && (
          <button
            onClick={() => { setQuery(""); setService(null); setNiche(null); }}
            className="btn btn-ghost"
            style={{ padding: "0.35rem 0.7rem", fontSize: "0.75rem" }}
          >
            <X size={12} /> Clear
          </button>
        )}

        <div
          style={{
            marginLeft: "auto",
            display: "flex",
            border: "1px solid var(--border-color)",
            borderRadius: 10,
            overflow: "hidden",
            background: "var(--bg-base)",
          }}
        >
          <button onClick={() => setView("grid")} style={viewBtn(view === "grid")}>
            <LayoutGrid size={14} /> Cards
          </button>
          <button onClick={() => setView("list")} style={viewBtn(view === "list")}>
            <ListIcon size={14} /> List
          </button>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="card" style={{ textAlign: "center", padding: "2.5rem" }}>
          <div style={{ fontSize: "1rem", fontWeight: 700, marginBottom: 4 }}>No campaigns match.</div>
          <div style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>Clear filters or create a new campaign.</div>
        </div>
      ) : view === "grid" ? (
        <GridView campaigns={filtered} />
      ) : (
        <ListView campaigns={filtered} />
      )}
    </div>
  );
}

/* ---------------- Filter pill group ---------------- */

function FilterPills({ label, value, options, onChange, color }: { label: string; value: string | null; options: string[]; onChange: (v: string | null) => void; color: string }) {
  const [open, setOpen] = useState(false);
  if (options.length === 0) return null;
  return (
    <div style={{ position: "relative" }}>
      <button onClick={() => setOpen(!open)} style={{
        padding: "0.35rem 0.7rem", fontSize: "0.78rem", fontWeight: 700,
        borderRadius: 999, border: `1.5px solid ${value ? color : "var(--border-color)"}`,
        background: value ? color + "18" : "white", color: value ? color : "var(--text-secondary)",
        cursor: "pointer", display: "flex", alignItems: "center", gap: 4,
      }}>
        {label}{value ? `: ${value}` : ""} ▾
      </button>
      {open && (
        <>
          <div onClick={() => setOpen(false)} style={{ position: "fixed", inset: 0, zIndex: 20 }} />
          <div style={{ position: "absolute", top: "calc(100% + 4px)", left: 0, background: "white", border: "1px solid var(--border-color)", borderRadius: 10, boxShadow: "0 8px 24px rgba(15, 23, 42, 0.12)", zIndex: 21, minWidth: 180, padding: 4 }}>
            <div onClick={() => { onChange(null); setOpen(false); }} style={optionStyle(value === null)}>All {label.toLowerCase()}s</div>
            {options.map((o) => (
              <div key={o} onClick={() => { onChange(o); setOpen(false); }} style={optionStyle(value === o)}>{o}</div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

const optionStyle = (active: boolean): React.CSSProperties => ({
  padding: "0.45rem 0.65rem", fontSize: "0.82rem", borderRadius: 6, cursor: "pointer",
  background: active ? "var(--bg-base)" : "transparent", fontWeight: active ? 700 : 500,
});

const viewBtn = (active: boolean): React.CSSProperties => ({
  padding: "0.4rem 0.75rem", fontSize: "0.8rem", fontWeight: 700, border: "none",
  background: active ? "var(--bg-base)" : "white", color: active ? "var(--accent-primary)" : "var(--text-secondary)",
  cursor: "pointer", display: "flex", alignItems: "center", gap: 4,
});

/* ---------------- Views ---------------- */

function GridView({ campaigns }: { campaigns: CampaignRow[] }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))", gap: "1rem" }}>
      {campaigns.map((c) => (
        <Link key={c.id} href={`/marketing/campaigns/${c.id}`} className="card" style={{ textDecoration: "none", padding: 0, overflow: "hidden" }}>
          <div style={{ height: 72, background: `linear-gradient(135deg, ${c.coverColor}, ${c.coverColor}aa)`, display: "flex", alignItems: "center", padding: "0 1rem", color: "white" }}>
            <div style={{ fontWeight: 800, fontSize: "1rem", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{c.name}</div>
          </div>
          <div style={{ padding: "1rem" }}>
            <div style={{ fontSize: "0.78rem", color: "var(--text-secondary)", marginBottom: "0.5rem", display: "flex", gap: 6, flexWrap: "wrap" }}>
              <span style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: 180 }}>{c.entityName || "—"}</span>
              {c.service && <Chip label={c.service} color="#7c3aed" />}
              {c.niche && <Chip label={c.niche} color="#ec4899" />}
            </div>
            {c.description && <div style={{ fontSize: "0.8rem", color: "var(--text-primary)", lineHeight: 1.45, marginBottom: "0.75rem", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{c.description}</div>}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "0.5rem", marginBottom: "0.75rem" }}>
              <Mini label="Leads" value={c.leads} color="#94a3b8" />
              <Mini label="Prospects" value={c.prospects} color="#f59e0b" />
              <Mini label="Clients" value={c.clients} color="#10b981" />
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.7rem", color: "var(--text-muted)", fontWeight: 600 }}>
              <span>{c.linkCount} links · {c.fileCount} files</span>
              <span>Open →</span>
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}

function ListView({ campaigns }: { campaigns: CampaignRow[] }) {
  return (
    <div className="card" style={{ padding: "0.5rem" }}>
      <div style={{ display: "grid", gridTemplateColumns: "44px 1.4fr 1fr 1fr 90px 90px 90px 70px", gap: "0.75rem", padding: "0.5rem 0.75rem", fontSize: "0.7rem", textTransform: "uppercase", color: "var(--text-secondary)", fontWeight: 700, letterSpacing: "0.05em", borderBottom: "1px solid var(--border-color)" }}>
        <span />
        <span>Name</span>
        <span>Service</span>
        <span>Niche</span>
        <span style={{ textAlign: "right" }}>Leads</span>
        <span style={{ textAlign: "right" }}>Prospects</span>
        <span style={{ textAlign: "right" }}>Clients</span>
        <span style={{ textAlign: "right" }}>Conv</span>
      </div>
      {campaigns.map((c) => {
        const conv = c.total ? Math.round((c.clients / c.total) * 100) : 0;
        return (
          <Link key={c.id} href={`/marketing/campaigns/${c.id}`} style={{ display: "grid", gridTemplateColumns: "44px 1.4fr 1fr 1fr 90px 90px 90px 70px", gap: "0.75rem", padding: "0.75rem", alignItems: "center", borderBottom: "1px solid var(--border-color)", textDecoration: "none", color: "inherit" }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: c.coverColor, color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: "0.8rem" }}>{c.name.slice(0, 2).toUpperCase()}</div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontWeight: 700, fontSize: "0.88rem", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{c.name}</div>
              <div style={{ fontSize: "0.7rem", color: "var(--text-muted)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{c.entityName || "—"}</div>
            </div>
            <span>{c.service ? <Chip label={c.service} color="#7c3aed" /> : <span style={{ color: "var(--text-muted)", fontSize: "0.78rem" }}>—</span>}</span>
            <span>{c.niche ? <Chip label={c.niche} color="#ec4899" /> : <span style={{ color: "var(--text-muted)", fontSize: "0.78rem" }}>—</span>}</span>
            <span style={{ textAlign: "right", fontWeight: 700, color: "#94a3b8" }}>{c.leads}</span>
            <span style={{ textAlign: "right", fontWeight: 700, color: "#f59e0b" }}>{c.prospects}</span>
            <span style={{ textAlign: "right", fontWeight: 700, color: "#10b981" }}>{c.clients}</span>
            <span style={{ textAlign: "right", fontWeight: 800, color: c.coverColor }}>{conv}%</span>
          </Link>
        );
      })}
    </div>
  );
}

/* ---------------- Bits ---------------- */

function Chip({ label, color }: { label: string; color: string }) {
  return (
    <span style={{ fontSize: "0.65rem", fontWeight: 700, padding: "2px 8px", borderRadius: 999, background: color + "18", color, whiteSpace: "nowrap" }}>{label}</span>
  );
}

function Mini({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div style={{ background: "var(--bg-base)", borderRadius: 8, padding: "0.45rem 0.5rem", textAlign: "center" }}>
      <div style={{ fontSize: "0.6rem", color: "var(--text-muted)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}>{label}</div>
      <div style={{ fontSize: "1.05rem", fontWeight: 800, color }}>{value}</div>
    </div>
  );
}

function SummaryCard({ label, value, icon, color }: { label: string; value: number; icon: React.ReactNode; color: string }) {
  return (
    <div className="card">
      <div className="row-between" style={{ marginBottom: "0.6rem" }}>
        <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}>{label}</div>
        <div style={{ color, display: "flex", alignItems: "center", justifyContent: "center", width: 32, height: 32, borderRadius: 8, background: color + "18" }}>{icon}</div>
      </div>
      <div style={{ fontSize: "1.75rem", fontWeight: 900 }}>{value}</div>
    </div>
  );
}
