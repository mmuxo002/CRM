"use client";

import { useState } from "react";
import { Sparkles, Loader2, Copy, Check, X, FileText, Globe, Printer, AlertCircle } from "lucide-react";
import type { ProposalJSON } from "@/lib/sales/proposal-schema";

type ProposalResponse = {
  ok: true;
  meta: { generatedAt: string; generatedBy: { id: string; name: string | null; email: string | null }; leadId: string; version: string };
  proposal: ProposalJSON;
};

type Tab = "summary" | "json" | "website";

export function GenerateProposalButton({ leadId, leadName }: { leadId: string; leadName: string }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<ProposalResponse | null>(null);
  const [tab, setTab] = useState<Tab>("summary");
  const [copied, setCopied] = useState<"json" | "website" | null>(null);

  async function generate() {
    setLoading(true);
    setError(null);
    setData(null);
    setTab("summary");
    try {
      const res = await fetch(`/api/leads/${leadId}/proposal`, { method: "POST" });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error || `Request failed with status ${res.status}`);
      } else {
        setData(json as ProposalResponse);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Network error");
    } finally {
      setLoading(false);
    }
  }

  function open_() {
    setOpen(true);
    if (!data && !loading) generate();
  }

  function copyToClipboard(text: string, which: "json" | "website") {
    navigator.clipboard.writeText(text);
    setCopied(which);
    setTimeout(() => setCopied(null), 1500);
  }

  function printPDF() {
    window.print();
  }

  return (
    <>
      <button
        type="button"
        onClick={open_}
        style={{
          display: "inline-flex", alignItems: "center", gap: 6,
          padding: "0.5rem 0.85rem", borderRadius: 10,
          border: "none",
          background: "linear-gradient(135deg, #4318ff, #7c3aed)",
          color: "white", fontSize: "0.78rem", fontWeight: 700, cursor: "pointer",
          boxShadow: "0 6px 18px -8px rgba(67,24,255,0.55)",
        }}
      >
        <Sparkles size={13} />
        Generate Proposal
      </button>

      {open && (
        <div
          role="dialog"
          aria-modal="true"
          onClick={(e) => { if (e.target === e.currentTarget) setOpen(false); }}
          style={{
            position: "fixed", inset: 0, zIndex: 1000,
            background: "rgba(15,23,42,0.55)", backdropFilter: "blur(4px)",
            display: "flex", alignItems: "center", justifyContent: "center", padding: "2rem",
          }}
        >
          <div
            className="proposal-modal"
            style={{
              background: "white", borderRadius: 16, width: "100%", maxWidth: 920,
              maxHeight: "90vh", display: "flex", flexDirection: "column", overflow: "hidden",
              boxShadow: "0 30px 80px rgba(0,0,0,0.3)",
            }}
          >
            <div style={{ padding: "1rem 1.25rem", borderBottom: "1px solid #f1f5f9", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
                <div style={{ width: 34, height: 34, borderRadius: 9, background: "linear-gradient(135deg, #4318ff, #7c3aed)", color: "white", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Sparkles size={16} />
                </div>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontWeight: 800, fontSize: "0.95rem", color: "#0f172a" }}>Client Proposal</div>
                  <div style={{ fontSize: "0.72rem", color: "#64748b", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>For {leadName}</div>
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                {data && (
                  <button onClick={printPDF} title="Print or save as PDF" style={iconBtn}>
                    <Printer size={14} /> Print / PDF
                  </button>
                )}
                <button onClick={() => setOpen(false)} aria-label="Close" style={{ ...iconBtn, padding: 8 }}>
                  <X size={16} />
                </button>
              </div>
            </div>

            {data && (
              <div style={{ padding: "0 1.25rem", borderBottom: "1px solid #f1f5f9", display: "flex", gap: 4 }}>
                <TabBtn active={tab === "summary"} onClick={() => setTab("summary")} icon={<FileText size={13} />} label="Summary" />
                <TabBtn active={tab === "json"} onClick={() => setTab("json")} icon={<Sparkles size={13} />} label="JSON" />
                {data.proposal.websiteBuilderPrompt && (
                  <TabBtn active={tab === "website"} onClick={() => setTab("website")} icon={<Globe size={13} />} label="Website Prompt" highlight />
                )}
              </div>
            )}

            <div style={{ overflow: "auto", padding: "1.25rem", flex: 1 }}>
              {loading && (
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "3rem 1rem", color: "#64748b", gap: 12 }}>
                  <Loader2 size={32} style={{ animation: "spin 0.9s linear infinite", color: "#4318ff" }} />
                  <div style={{ fontWeight: 700, color: "#0f172a" }}>Generating proposal…</div>
                  <div style={{ fontSize: "0.8rem", textAlign: "center", maxWidth: 360 }}>
                    Claude is reviewing this contact's intel, pain points, and digital footprint to craft a tailored proposal. This usually takes 20–60 seconds.
                  </div>
                </div>
              )}

              {error && !loading && (
                <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 10, padding: "1rem 1.25rem", color: "#991b1b" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, fontWeight: 700, marginBottom: 6 }}>
                    <AlertCircle size={16} /> Couldn't generate proposal
                  </div>
                  <div style={{ fontSize: "0.85rem", lineHeight: 1.5 }}>{error}</div>
                  <button onClick={generate} style={{ ...iconBtn, marginTop: 10 }}>Try again</button>
                </div>
              )}

              {data && tab === "summary" && <SummaryView proposal={data.proposal} meta={data.meta} />}

              {data && tab === "json" && (
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                    <div style={{ fontSize: "0.72rem", color: "#64748b", fontWeight: 600 }}>Copy this JSON into your CRM, proposal tool, or send to a client.</div>
                    <button onClick={() => copyToClipboard(JSON.stringify(data.proposal, null, 2), "json")} style={iconBtn}>
                      {copied === "json" ? <><Check size={13} /> Copied</> : <><Copy size={13} /> Copy JSON</>}
                    </button>
                  </div>
                  <pre style={preStyle}>{JSON.stringify(data.proposal, null, 2)}</pre>
                </div>
              )}

              {data && tab === "website" && data.proposal.websiteBuilderPrompt && (
                <div>
                  <div style={{ background: "#f5f3ff", border: "1px solid #ddd6fe", borderRadius: 10, padding: "0.8rem 1rem", marginBottom: 12, fontSize: "0.82rem", color: "#5b21b6", lineHeight: 1.5 }}>
                    <strong>Paste this into v0.dev, Lovable, Bolt, or Claude Artifacts</strong> to generate a landing-page rendering for this client. The prompt is tuned to their business, niche, and pain points.
                  </div>
                  <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 8 }}>
                    <button onClick={() => copyToClipboard(data.proposal.websiteBuilderPrompt!, "website")} style={iconBtn}>
                      {copied === "website" ? <><Check size={13} /> Copied</> : <><Copy size={13} /> Copy prompt</>}
                    </button>
                  </div>
                  <pre style={preStyle}>{data.proposal.websiteBuilderPrompt}</pre>
                </div>
              )}
            </div>

            {data && (
              <div style={{ padding: "0.7rem 1.25rem", borderTop: "1px solid #f1f5f9", fontSize: "0.7rem", color: "#94a3b8", display: "flex", justifyContent: "space-between" }}>
                <span>Generated {new Date(data.meta.generatedAt).toLocaleString()}</span>
                <span>by {data.meta.generatedBy.name || data.meta.generatedBy.email || "—"}</span>
              </div>
            )}
          </div>
        </div>
      )}

      <style jsx global>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @media print {
          body * { visibility: hidden !important; }
          .proposal-modal, .proposal-modal * { visibility: visible !important; }
          .proposal-modal {
            position: fixed !important;
            inset: 0 !important;
            max-width: 100% !important;
            max-height: none !important;
            box-shadow: none !important;
            border-radius: 0 !important;
          }
        }
      `}</style>
    </>
  );
}

function TabBtn({ active, onClick, icon, label, highlight }: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string; highlight?: boolean }) {
  return (
    <button
      onClick={onClick}
      style={{
        display: "inline-flex", alignItems: "center", gap: 6,
        padding: "0.65rem 0.85rem", border: "none", background: "transparent", cursor: "pointer",
        fontSize: "0.78rem", fontWeight: 700,
        color: active ? "#4318ff" : highlight ? "#7c3aed" : "#64748b",
        borderBottom: `2px solid ${active ? "#4318ff" : "transparent"}`,
        marginBottom: -1,
      }}
    >
      {icon} {label}
    </button>
  );
}

function SummaryView({ proposal, meta }: { proposal: ProposalJSON; meta: ProposalResponse["meta"] }) {
  const p = proposal;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem", color: "#0f172a" }}>
      <Section title="Pitch Headline">
        <div style={{ fontSize: "1.15rem", fontWeight: 800, lineHeight: 1.3 }}>{p.pitch.headline}</div>
      </Section>

      <Section title="Client">
        <Grid>
          <KV k="Business" v={p.client.businessName} />
          <KV k="Industry" v={p.client.industry} />
          <KV k="Location" v={p.client.location} />
          <KV k="Website" v={p.client.website || "— (no website)"} />
          <KV k="Primary contact" v={`${p.client.primaryContact.name}${p.client.primaryContact.title ? ` (${p.client.primaryContact.title})` : ""}`} />
          <KV k="Decision maker" v={p.client.decisionMaker.name ? `${p.client.decisionMaker.name}${p.client.decisionMaker.title ? ` — ${p.client.decisionMaker.title}` : ""}` : "—"} />
        </Grid>
      </Section>

      <Section title="Situation">
        <div style={{ fontSize: "0.9rem", lineHeight: 1.6 }}>{p.situation.summary}</div>
        {p.situation.painPoints.length > 0 && (
          <div style={{ marginTop: 12 }}>
            <Subhead>Pain points</Subhead>
            <Bullets items={p.situation.painPoints} color="#dc2626" />
          </div>
        )}
        {p.situation.opportunities.length > 0 && (
          <div style={{ marginTop: 12 }}>
            <Subhead>Opportunities</Subhead>
            <Bullets items={p.situation.opportunities} color="#059669" />
          </div>
        )}
        {p.situation.digitalPresenceGaps.length > 0 && (
          <div style={{ marginTop: 12 }}>
            <Subhead>Digital presence gaps</Subhead>
            <Bullets items={p.situation.digitalPresenceGaps} color="#f59e0b" />
          </div>
        )}
      </Section>

      <Section title="Recommended Services">
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {p.recommendedServices.map((s, i) => (
            <div key={i} style={{ border: "1px solid #e2e8f0", borderRadius: 10, padding: "0.75rem 0.9rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, marginBottom: 4 }}>
                <div style={{ fontWeight: 700, fontSize: "0.9rem" }}>{s.name}</div>
                <span style={{
                  fontSize: "0.65rem", fontWeight: 800, padding: "2px 8px", borderRadius: 999,
                  background: s.tier === "primary" ? "#fee2e2" : s.tier === "secondary" ? "#fef3c7" : "#f1f5f9",
                  color: s.tier === "primary" ? "#991b1b" : s.tier === "secondary" ? "#92400e" : "#64748b",
                  textTransform: "uppercase", letterSpacing: "0.04em",
                }}>{s.tier.replace("_", " ")}</span>
              </div>
              <div style={{ fontSize: "0.78rem", color: "#475569", marginBottom: 4 }}>{s.price}</div>
              <div style={{ fontSize: "0.82rem", color: "#334155", lineHeight: 1.5 }}>{s.rationale}</div>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Recommended Bundle">
        <div style={{
          background: "linear-gradient(135deg, #f5f3ff, #ede9fe)",
          border: "1.5px solid #c4b5fd", borderRadius: 12, padding: "1rem 1.1rem",
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, marginBottom: 8 }}>
            <div>
              <div style={{ fontSize: "0.65rem", textTransform: "uppercase", color: "#7c3aed", fontWeight: 800, letterSpacing: "0.06em" }}>{p.recommendedBundle.id}</div>
              <div style={{ fontSize: "1.15rem", fontWeight: 800, color: "#0f172a" }}>{p.recommendedBundle.name}</div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: "1.3rem", fontWeight: 800, color: "#4318ff" }}>${p.recommendedBundle.setupPriceUSD.toLocaleString()}</div>
              {p.recommendedBundle.monthlyPriceUSD > 0 && (
                <div style={{ fontSize: "0.78rem", color: "#7c3aed", fontWeight: 700 }}>+ ${p.recommendedBundle.monthlyPriceUSD}/mo</div>
              )}
            </div>
          </div>
          <div style={{ fontSize: "0.85rem", color: "#334155", lineHeight: 1.5 }}>{p.recommendedBundle.rationale}</div>
        </div>
      </Section>

      <Section title="Value Pillars">
        <Bullets items={p.pitch.valuePillars} color="#4318ff" />
      </Section>

      <Section title="ROI Projection">
        <div style={{ fontSize: "0.9rem", lineHeight: 1.6, background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 10, padding: "0.8rem 1rem", color: "#166534" }}>
          {p.pitch.roiProjection}
        </div>
      </Section>

      <Section title="Next Steps">
        <ol style={{ paddingLeft: "1.2rem", margin: 0, display: "flex", flexDirection: "column", gap: 4 }}>
          {p.pitch.nextSteps.map((step, i) => (
            <li key={i} style={{ fontSize: "0.88rem", lineHeight: 1.55, color: "#334155" }}>{step}</li>
          ))}
        </ol>
      </Section>

      {p.websiteBuilderPrompt && (
        <Section title="Website Builder Prompt">
          <div style={{ fontSize: "0.82rem", color: "#7c3aed", fontWeight: 600, marginBottom: 6 }}>
            <Globe size={13} style={{ display: "inline", marginRight: 4, verticalAlign: "middle" }} />
            A full website-design prompt is included — switch to the "Website Prompt" tab above to copy it.
          </div>
        </Section>
      )}
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <div style={{ fontSize: "0.7rem", fontWeight: 800, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 8 }}>{title}</div>
      {children}
    </div>
  );
}

function Subhead({ children }: { children: React.ReactNode }) {
  return <div style={{ fontSize: "0.72rem", fontWeight: 700, color: "#475569", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.05em" }}>{children}</div>;
}

function Bullets({ items, color }: { items: string[]; color: string }) {
  return (
    <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: 5 }}>
      {items.map((item, i) => (
        <li key={i} style={{ display: "flex", gap: 8, fontSize: "0.86rem", lineHeight: 1.5, color: "#334155" }}>
          <span style={{ width: 5, height: 5, borderRadius: "50%", background: color, marginTop: 8, flexShrink: 0 }} />
          {item}
        </li>
      ))}
    </ul>
  );
}

function Grid({ children }: { children: React.ReactNode }) {
  return <div style={{ display: "grid", gridTemplateColumns: "auto 1fr", rowGap: "0.4rem", columnGap: "1rem", fontSize: "0.85rem" }}>{children}</div>;
}

function KV({ k, v }: { k: string; v: string }) {
  return (
    <>
      <span style={{ color: "#94a3b8", fontWeight: 600 }}>{k}</span>
      <span style={{ color: "#0f172a" }}>{v}</span>
    </>
  );
}

const iconBtn: React.CSSProperties = {
  display: "inline-flex", alignItems: "center", gap: 6,
  padding: "6px 10px", borderRadius: 8,
  border: "1px solid #e2e8f0", background: "white",
  fontSize: "0.75rem", fontWeight: 700, color: "#475569", cursor: "pointer",
};

const preStyle: React.CSSProperties = {
  background: "#0f172a", color: "#e2e8f0",
  padding: "1rem 1.1rem", borderRadius: 10,
  fontSize: "0.78rem", lineHeight: 1.55, fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
  whiteSpace: "pre-wrap", wordBreak: "break-word", margin: 0,
  maxHeight: "55vh", overflow: "auto",
};
