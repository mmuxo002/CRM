"use client";

import { useState } from "react";
import { Users, TrendingUp, Phone, CalendarCheck, Target, Megaphone, ChevronDown, ChevronUp, BarChart3 } from "lucide-react";

type CampaignStat = {
  id: string;
  name: string;
  color: string;
  service: string | null;
  niche: string | null;
  leads: number;
  prospects: number;
  clients: number;
  total: number;
  conversion: number;
};

type FunnelData = {
  totalLeads: number;
  newLeads: number;
  contactedLeads: number;
  meetingLeads: number;
  proposalLeads: number;
  readyToCallLeads: number;
  closedWonDeals: number;
  closedWonValue: number;
  totalDeals: number;
};

export function AdminMarketingSales({ campaigns, funnel }: { campaigns: CampaignStat[]; funnel: FunnelData }) {
  const [expanded, setExpanded] = useState(false);
  const visibleCampaigns = expanded ? campaigns : campaigns.slice(0, 4);

  return (
    <div>
      <h2 style={{ fontSize: "1rem", fontWeight: 800, marginBottom: "1rem", display: "flex", alignItems: "center", gap: 8 }}>
        <BarChart3 size={16} style={{ color: "#ec4899" }} /> Marketing & Sales Performance
      </h2>

      {/* Lead funnel */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: "0.5rem", marginBottom: "1.25rem" }}>
        <FunnelTile label="Total Leads" value={funnel.totalLeads} color="#94a3b8" icon={<Users size={14} />} />
        <FunnelTile label="Appointments Set" value={funnel.meetingLeads} color="#3b82f6" icon={<CalendarCheck size={14} />} sub={funnel.totalLeads > 0 ? `${Math.round((funnel.meetingLeads / funnel.totalLeads) * 100)}% of leads` : undefined} />
        <FunnelTile label="Proposals Sent" value={funnel.proposalLeads} color="#a855f7" icon={<Target size={14} />} />
        <FunnelTile label="Ready to Call" value={funnel.readyToCallLeads} color="#f59e0b" icon={<Phone size={14} />} />
        <FunnelTile label="Deals Closed" value={funnel.closedWonDeals} color="#10b981" icon={<TrendingUp size={14} />} sub={funnel.closedWonValue > 0 ? `$${funnel.closedWonValue.toLocaleString()}` : undefined} />
      </div>

      {/* Funnel bar */}
      <div style={{ display: "flex", height: 8, borderRadius: 999, overflow: "hidden", marginBottom: "1.5rem", background: "var(--bg-base)" }}>
        {[
          { value: funnel.newLeads + funnel.contactedLeads, color: "#94a3b8" },
          { value: funnel.meetingLeads, color: "#3b82f6" },
          { value: funnel.proposalLeads, color: "#a855f7" },
          { value: funnel.readyToCallLeads, color: "#f59e0b" },
          { value: funnel.closedWonDeals, color: "#10b981" },
        ].map((seg, i) => {
          const total = funnel.totalLeads + funnel.closedWonDeals;
          const pct = total > 0 ? (seg.value / total) * 100 : 0;
          return pct > 0 ? <div key={i} style={{ width: `${pct}%`, background: seg.color, minWidth: pct > 0 ? 3 : 0 }} /> : null;
        })}
      </div>

      {/* Campaign breakdown */}
      <div className="row-between" style={{ marginBottom: "0.6rem" }}>
        <h3 style={{ fontSize: "0.85rem", fontWeight: 800, display: "flex", alignItems: "center", gap: 6 }}>
          <Megaphone size={14} style={{ color: "#ec4899" }} /> Campaigns
          <span style={{ fontSize: "0.72rem", color: "var(--text-muted)", fontWeight: 500 }}>{campaigns.length} total</span>
        </h3>
      </div>

      {campaigns.length === 0 && <div style={{ color: "var(--text-muted)", fontSize: "0.85rem", padding: "0.5rem 0" }}>No campaigns yet.</div>}

      <div style={{ border: "1px solid var(--border-color)", borderRadius: 10, overflow: "hidden" }}>
        <div style={{ display: "grid", gridTemplateColumns: "2.5fr 0.8fr 0.8fr 0.8fr 0.8fr 0.8fr", padding: "0.5rem 0.75rem", background: "var(--bg-base)", fontSize: "0.62rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", borderBottom: "1px solid var(--border-color)" }}>
          <span>Campaign</span>
          <span style={{ textAlign: "center" }}>Total</span>
          <span style={{ textAlign: "center" }}>Leads</span>
          <span style={{ textAlign: "center" }}>Prospects</span>
          <span style={{ textAlign: "center" }}>Clients</span>
          <span style={{ textAlign: "center" }}>Conv.</span>
        </div>
        {visibleCampaigns.map((c) => (
          <div key={c.id} style={{ display: "grid", gridTemplateColumns: "2.5fr 0.8fr 0.8fr 0.8fr 0.8fr 0.8fr", padding: "0.6rem 0.75rem", borderBottom: "1px solid var(--border-color)", alignItems: "center", fontSize: "0.82rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
              <div style={{ width: 8, height: 8, borderRadius: 999, background: c.color, flexShrink: 0 }} />
              <div style={{ minWidth: 0 }}>
                <div style={{ fontWeight: 700, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.name}</div>
                {(c.service || c.niche) && <div style={{ fontSize: "0.65rem", color: "var(--text-muted)" }}>{[c.service, c.niche].filter(Boolean).join(" · ")}</div>}
              </div>
            </div>
            <div style={{ textAlign: "center", fontWeight: 700 }}>{c.total}</div>
            <div style={{ textAlign: "center", color: "#94a3b8" }}>{c.leads}</div>
            <div style={{ textAlign: "center", color: "#f59e0b" }}>{c.prospects}</div>
            <div style={{ textAlign: "center", color: "#10b981", fontWeight: 700 }}>{c.clients}</div>
            <div style={{ textAlign: "center" }}>
              <span style={{ fontWeight: 800, fontSize: "0.8rem", color: c.conversion >= 20 ? "#10b981" : c.conversion >= 10 ? "#f59e0b" : "var(--text-muted)" }}>
                {c.conversion}%
              </span>
            </div>
          </div>
        ))}
      </div>

      {campaigns.length > 4 && (
        <button onClick={() => setExpanded((e) => !e)} className="btn btn-ghost" style={{ marginTop: "0.5rem", fontSize: "0.75rem", width: "100%" }}>
          {expanded ? <><ChevronUp size={12} /> Show less</> : <><ChevronDown size={12} /> Show all {campaigns.length} campaigns</>}
        </button>
      )}
    </div>
  );
}

function FunnelTile({ label, value, color, icon, sub }: { label: string; value: number; color: string; icon: React.ReactNode; sub?: string }) {
  return (
    <div style={{ padding: "0.65rem 0.75rem", background: "var(--bg-base)", borderRadius: 10, borderLeft: `3px solid ${color}` }}>
      <div style={{ display: "flex", alignItems: "center", gap: 4, marginBottom: 2 }}>
        <span style={{ color }}>{icon}</span>
        <span style={{ fontSize: "0.62rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase" }}>{label}</span>
      </div>
      <div style={{ fontSize: "1.3rem", fontWeight: 900, color }}>{value}</div>
      {sub && <div style={{ fontSize: "0.62rem", color: "var(--text-muted)", marginTop: 1 }}>{sub}</div>}
    </div>
  );
}
