"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  UserSearch, Loader2, ExternalLink, Mail, Link2,
  Building2, Check, AlertTriangle, ChevronDown, ChevronUp, MapPin,
} from "lucide-react";

interface Candidate {
  name: string;
  title: string;
  source: "sunbiz" | "apollo" | "persona";
  address?: string;
  email?: string;
  linkedinUrl?: string;
  filingDate?: string;
  entityStatus?: string;
  detailUrl?: string;
}

interface LookupResponse {
  ok: boolean;
  primary: Candidate | null;
  candidates: Candidate[];
  sources: {
    sunbiz: null | {
      entityName: string;
      documentNumber: string;
      status?: string;
      entityType?: string;
      filingDate?: string;
      principalAddress?: string;
      detailUrl: string;
      officerCount: number;
    };
    apollo: { enabled: boolean; resultCount: number };
  };
}

interface Props {
  leadId: string;
  currentName: string | null;
  currentTitle: string | null;
}

const SOURCE_COLORS: Record<string, { bg: string; fg: string; label: string }> = {
  sunbiz: { bg: "#eef2ff", fg: "#4338ca", label: "FL Sunbiz" },
  apollo: { bg: "#fdf2f8", fg: "#be185d", label: "Apollo" },
  persona: { bg: "#f1f5f9", fg: "#475569", label: "AI Inferred" },
};

export function DecisionMakerPanel({ leadId, currentName, currentTitle }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<LookupResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);

  const runLookup = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/leads/${leadId}/decision-maker`, { method: "POST" });
      if (!res.ok) throw new Error(`Lookup failed (${res.status})`);
      const data: LookupResponse = await res.json();
      setResult(data);
      router.refresh();
    } catch (e: any) {
      setError(e?.message || "Lookup failed");
    } finally {
      setLoading(false);
    }
  };

  const primary = result?.primary;
  const others = (result?.candidates || []).filter((c) => c !== primary).slice(0, 6);

  return (
    <div className="card" style={{
      marginBottom: "1rem", padding: 0, overflow: "hidden",
      border: "1.5px solid #ddd6fe",
    }}>
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "0.85rem 1.15rem",
        background: "linear-gradient(135deg, #f5f3ff, #ede9fe)",
        borderBottom: "1px solid #ddd6fe",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <UserSearch size={15} style={{ color: "#7c3aed" }} />
          <span style={{ fontWeight: 700, fontSize: "0.88rem", color: "var(--text-primary)" }}>
            Decision Maker
          </span>
          {currentName && (
            <span style={{
              padding: "2px 8px", borderRadius: 5, fontSize: "0.68rem", fontWeight: 700,
              background: "#10b98114", color: "#10b981",
            }}>
              On File
            </span>
          )}
        </div>
        <button
          onClick={runLookup}
          disabled={loading}
          className="btn btn-primary"
          style={{ fontSize: "0.75rem", padding: "0.35rem 0.7rem" }}
        >
          {loading ? (
            <><Loader2 size={12} className="spin" /> Searching…</>
          ) : (
            <><UserSearch size={12} /> {currentName ? "Refresh" : "Find Decision Maker"}</>
          )}
        </button>
      </div>

      <div style={{ padding: "1rem 1.15rem" }}>
        {/* Current on-file value */}
        {currentName && !result && (
          <div style={{
            padding: "0.75rem 1rem", borderRadius: 10,
            background: "#fafafa", border: "1px solid var(--border-color)",
          }}>
            <div style={{ fontSize: "0.65rem", fontWeight: 800, color: "#7c3aed", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 4 }}>
              Ask For
            </div>
            <div style={{ fontWeight: 700, fontSize: "1.1rem", color: "var(--text-primary)" }}>
              {currentName}
            </div>
            {currentTitle && (
              <div style={{ fontSize: "0.82rem", color: "var(--text-secondary)", marginTop: 2 }}>
                {currentTitle}
              </div>
            )}
            <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", marginTop: 8 }}>
              Run the lookup above to verify against Sunbiz & Apollo records.
            </div>
          </div>
        )}

        {!currentName && !result && !loading && (
          <div style={{ textAlign: "center", padding: "0.75rem 0.5rem" }}>
            <Building2 size={24} style={{ color: "#7c3aed40", marginBottom: 6 }} />
            <p style={{ fontSize: "0.82rem", color: "var(--text-muted)", margin: 0, lineHeight: 1.5 }}>
              Pull the actual owner/officer name from Florida Sunbiz corporate filings
              {" "}and Apollo's people database so the rep has a real human to ask for.
            </p>
          </div>
        )}

        {error && (
          <div style={{
            padding: "0.6rem 0.85rem", borderRadius: 8,
            background: "#fef2f2", border: "1px solid #fecaca",
            fontSize: "0.8rem", color: "#b91c1c",
            display: "flex", alignItems: "center", gap: 8,
          }}>
            <AlertTriangle size={14} /> {error}
          </div>
        )}

        {/* Primary result */}
        {primary && (
          <div style={{
            padding: "0.85rem 1rem", borderRadius: 10,
            background: "linear-gradient(135deg, #f5f3ff, #ede9fe)",
            border: "1.5px solid #c4b5fd",
            marginBottom: others.length > 0 ? 10 : 0,
          }}>
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 10 }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: "0.62rem", fontWeight: 800, color: "#7c3aed", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 4 }}>
                  Ask For
                </div>
                <div style={{ fontWeight: 800, fontSize: "1.2rem", color: "var(--text-primary)", lineHeight: 1.2 }}>
                  {primary.name}
                </div>
                <div style={{ fontSize: "0.82rem", color: "#6d28d9", fontWeight: 600, marginTop: 3 }}>
                  {primary.title}
                </div>
              </div>
              <SourceBadge source={primary.source} />
            </div>

            <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 10, fontSize: "0.72rem" }}>
              {primary.email && (
                <a href={`mailto:${primary.email}`} style={metaChip("#10b981")}>
                  <Mail size={10} /> {primary.email}
                </a>
              )}
              {primary.linkedinUrl && (
                <a href={primary.linkedinUrl} target="_blank" rel="noopener noreferrer" style={metaChip("#0077b5")}>
                  <Link2 size={10} /> LinkedIn
                </a>
              )}
              {primary.entityStatus && (
                <span style={metaChip(primary.entityStatus === "ACTIVE" ? "#10b981" : "#f59e0b")}>
                  <Check size={10} /> {primary.entityStatus}
                </span>
              )}
              {primary.filingDate && (
                <span style={metaChip("#64748b")}>
                  Filed {primary.filingDate}
                </span>
              )}
              {primary.detailUrl && (
                <a href={primary.detailUrl} target="_blank" rel="noopener noreferrer" style={metaChip("#4338ca")}>
                  <ExternalLink size={10} /> Sunbiz Record
                </a>
              )}
            </div>

            {primary.address && (
              <div style={{ marginTop: 8, fontSize: "0.73rem", color: "var(--text-muted)", display: "flex", alignItems: "center", gap: 4 }}>
                <MapPin size={11} /> {primary.address}
              </div>
            )}
          </div>
        )}

        {/* Other candidates */}
        {others.length > 0 && (
          <div style={{ marginTop: 10 }}>
            <button
              onClick={() => setExpanded(!expanded)}
              style={{
                display: "flex", alignItems: "center", gap: 4,
                background: "none", border: "none", cursor: "pointer",
                fontSize: "0.72rem", fontWeight: 600, color: "var(--text-muted)",
                padding: 0,
              }}
            >
              {expanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
              {others.length} other {others.length === 1 ? "candidate" : "candidates"} found
            </button>
            {expanded && (
              <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 8 }}>
                {others.map((c, i) => (
                  <div key={`${c.name}-${i}`} style={{
                    padding: "0.5rem 0.75rem", borderRadius: 8,
                    background: "#f8fafc", border: "1px solid var(--border-color)",
                    display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8,
                  }}>
                    <div>
                      <div style={{ fontSize: "0.82rem", fontWeight: 600, color: "var(--text-primary)" }}>{c.name}</div>
                      <div style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>{c.title}</div>
                    </div>
                    <SourceBadge source={c.source} compact />
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Source footer */}
        {result && (
          <div style={{
            marginTop: 10, fontSize: "0.68rem", color: "var(--text-muted)",
            display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap",
          }}>
            <span>
              Sunbiz: {result.sources.sunbiz ? `${result.sources.sunbiz.officerCount} officers` : "no record"}
            </span>
            <span>•</span>
            <span>
              Apollo: {result.sources.apollo.enabled
                ? `${result.sources.apollo.resultCount} matches`
                : "not configured"}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

function SourceBadge({ source, compact }: { source: "sunbiz" | "apollo" | "persona"; compact?: boolean }) {
  const cfg = SOURCE_COLORS[source];
  return (
    <span style={{
      padding: compact ? "1px 6px" : "3px 8px",
      borderRadius: 5,
      fontSize: compact ? "0.58rem" : "0.64rem",
      fontWeight: 800,
      letterSpacing: "0.04em",
      background: cfg.bg,
      color: cfg.fg,
      textTransform: "uppercase",
      whiteSpace: "nowrap",
      flexShrink: 0,
    }}>
      {cfg.label}
    </span>
  );
}

function metaChip(color: string): React.CSSProperties {
  return {
    display: "inline-flex", alignItems: "center", gap: 3,
    padding: "2px 7px", borderRadius: 5,
    background: `${color}14`, color,
    fontWeight: 600, textDecoration: "none",
    border: `1px solid ${color}30`,
  };
}
