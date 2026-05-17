"use client";

import { useState } from "react";
import {
  Zap, TrendingUp, Copy, Check, MessageCircle, ChevronDown, ChevronUp,
  Tag, Target, Users,
} from "lucide-react";

export interface PainPoint {
  category: string;
  title: string;
  observation: string;
  industryContext?: string;
  evidence?: string;
  talkingPoint: string;
  severity?: "critical" | "high" | "medium";
}

export interface Opportunity {
  title: string;
  solution: string;
  linkedPainCategory?: string;
  serviceId?: string | null;
  estimatedImpact?: string;
  talkingPoint: string;
}

interface Props {
  painPoints: any[] | null; // PainPoint[] or string[] (legacy)
  opportunities: any[] | null; // Opportunity[] or string[] (legacy)
}

const SEVERITY_COLORS: Record<string, { bg: string; fg: string; border: string; label: string }> = {
  critical: { bg: "#fef2f2", fg: "#dc2626", border: "#fca5a5", label: "CRITICAL" },
  high:     { bg: "#fff7ed", fg: "#ea580c", border: "#fdba74", label: "HIGH" },
  medium:   { bg: "#fffbeb", fg: "#d97706", border: "#fcd34d", label: "MEDIUM" },
};

export function PainPointsAndOpportunities({ painPoints, opportunities }: Props) {
  const normalizedPain = normalizePainPoints(painPoints);
  const normalizedOpp = normalizeOpportunities(opportunities);

  const hasAny = normalizedPain.length > 0 || normalizedOpp.length > 0;
  if (!hasAny) return null;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {normalizedPain.length > 0 && (
        <PainPointsList pain={normalizedPain} opportunities={normalizedOpp} />
      )}
      {normalizedOpp.length > 0 && (
        <OpportunitiesList opportunities={normalizedOpp} />
      )}
    </div>
  );
}

function PainPointsList({ pain, opportunities }: { pain: PainPoint[]; opportunities: Opportunity[] }) {
  const [expanded, setExpanded] = useState<number | null>(0);
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);

  const copy = (text: string, idx: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIdx(idx);
    setTimeout(() => setCopiedIdx(null), 1500);
  };

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
        <Zap size={14} style={{ color: "#dc2626" }} />
        <span style={{ fontSize: "0.75rem", fontWeight: 800, color: "#dc2626", textTransform: "uppercase", letterSpacing: "0.05em" }}>
          Pain Points
        </span>
        <span style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>
          ({pain.length})
        </span>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {pain.map((p, i) => {
          const sev = SEVERITY_COLORS[p.severity || "high"];
          const isOpen = expanded === i;
          const matchedOpp = opportunities.find((o) => o.linkedPainCategory?.toLowerCase() === p.category.toLowerCase());

          return (
            <div key={i} style={{
              borderRadius: 10, overflow: "hidden",
              border: `1px solid ${sev.border}`,
              background: "#fff",
            }}>
              <div
                onClick={() => setExpanded(isOpen ? null : i)}
                style={{
                  display: "flex", alignItems: "flex-start", gap: 10,
                  padding: "0.65rem 0.85rem",
                  background: isOpen ? sev.bg : "transparent",
                  cursor: "pointer",
                }}
              >
                <span style={{
                  padding: "2px 6px", borderRadius: 4,
                  fontSize: "0.55rem", fontWeight: 800,
                  background: `${sev.fg}14`, color: sev.fg,
                  letterSpacing: "0.04em",
                  marginTop: 2, flexShrink: 0,
                }}>
                  {sev.label}
                </span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                    <span style={{ fontSize: "0.83rem", fontWeight: 700, color: "var(--text-primary)" }}>
                      {p.title}
                    </span>
                    <span style={{
                      padding: "1px 6px", borderRadius: 4,
                      fontSize: "0.58rem", fontWeight: 700,
                      background: "#f1f5f9", color: "#475569",
                      textTransform: "uppercase", letterSpacing: "0.04em",
                    }}>
                      {p.category}
                    </span>
                  </div>
                  <div style={{
                    fontSize: "0.76rem", color: "var(--text-secondary)",
                    marginTop: 3, lineHeight: 1.45,
                    overflow: "hidden", textOverflow: "ellipsis",
                    whiteSpace: isOpen ? "normal" : "nowrap",
                  }}>
                    {p.observation}
                  </div>
                </div>
                {isOpen
                  ? <ChevronUp size={13} style={{ color: "var(--text-muted)", flexShrink: 0, marginTop: 3 }} />
                  : <ChevronDown size={13} style={{ color: "var(--text-muted)", flexShrink: 0, marginTop: 3 }} />}
              </div>

              {isOpen && (
                <div style={{
                  padding: "0.75rem 0.85rem", borderTop: `1px solid ${sev.border}`,
                  background: "#fafafa",
                  display: "flex", flexDirection: "column", gap: 10,
                }}>
                  {p.industryContext && (
                    <InfoRow
                      icon={<Users size={11} />}
                      label="What the industry is saying"
                      text={p.industryContext}
                      color="#6366f1"
                    />
                  )}
                  {p.evidence && (
                    <InfoRow
                      icon={<Target size={11} />}
                      label="What we saw here"
                      text={p.evidence}
                      color="#0ea5e9"
                    />
                  )}
                  <TalkingPoint
                    text={p.talkingPoint}
                    color={sev.fg}
                    copied={copiedIdx === i}
                    onCopy={() => copy(p.talkingPoint, i)}
                  />
                  {matchedOpp && (
                    <div style={{
                      padding: "0.55rem 0.75rem", borderRadius: 8,
                      background: "#ecfdf5", border: "1px solid #a7f3d0",
                    }}>
                      <div style={{
                        display: "flex", alignItems: "center", gap: 5,
                        fontSize: "0.6rem", fontWeight: 800, color: "#059669",
                        textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 3,
                      }}>
                        <TrendingUp size={10} /> How we fix this
                      </div>
                      <div style={{ fontSize: "0.8rem", color: "var(--text-primary)", fontWeight: 600 }}>
                        {matchedOpp.title}
                      </div>
                      <div style={{ fontSize: "0.74rem", color: "var(--text-secondary)", marginTop: 2, lineHeight: 1.45 }}>
                        {matchedOpp.solution}
                      </div>
                      {matchedOpp.estimatedImpact && (
                        <div style={{ fontSize: "0.72rem", color: "#059669", fontWeight: 600, marginTop: 4 }}>
                          → {matchedOpp.estimatedImpact}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function OpportunitiesList({ opportunities }: { opportunities: Opportunity[] }) {
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);
  const [expanded, setExpanded] = useState<number | null>(null);

  const copy = (text: string, idx: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIdx(idx);
    setTimeout(() => setCopiedIdx(null), 1500);
  };

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
        <TrendingUp size={14} style={{ color: "#059669" }} />
        <span style={{ fontSize: "0.75rem", fontWeight: 800, color: "#059669", textTransform: "uppercase", letterSpacing: "0.05em" }}>
          Opportunities
        </span>
        <span style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>
          ({opportunities.length})
        </span>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {opportunities.map((o, i) => {
          const isOpen = expanded === i;
          return (
            <div key={i} style={{
              borderRadius: 10, overflow: "hidden",
              border: "1px solid #a7f3d0",
              background: "#fff",
            }}>
              <div
                onClick={() => setExpanded(isOpen ? null : i)}
                style={{
                  display: "flex", alignItems: "flex-start", gap: 10,
                  padding: "0.65rem 0.85rem",
                  background: isOpen ? "#ecfdf5" : "transparent",
                  cursor: "pointer",
                }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                    <span style={{ fontSize: "0.83rem", fontWeight: 700, color: "var(--text-primary)" }}>
                      {o.title}
                    </span>
                    {o.serviceId && (
                      <span style={{
                        display: "inline-flex", alignItems: "center", gap: 3,
                        padding: "1px 6px", borderRadius: 4,
                        fontSize: "0.58rem", fontWeight: 700,
                        background: "#eff6ff", color: "#1d4ed8",
                        textTransform: "uppercase", letterSpacing: "0.04em",
                      }}>
                        <Tag size={8} /> {o.serviceId}
                      </span>
                    )}
                  </div>
                  <div style={{
                    fontSize: "0.76rem", color: "var(--text-secondary)",
                    marginTop: 3, lineHeight: 1.45,
                    overflow: "hidden", textOverflow: "ellipsis",
                    whiteSpace: isOpen ? "normal" : "nowrap",
                  }}>
                    {o.solution}
                  </div>
                </div>
                {isOpen
                  ? <ChevronUp size={13} style={{ color: "var(--text-muted)", flexShrink: 0, marginTop: 3 }} />
                  : <ChevronDown size={13} style={{ color: "var(--text-muted)", flexShrink: 0, marginTop: 3 }} />}
              </div>

              {isOpen && (
                <div style={{
                  padding: "0.75rem 0.85rem", borderTop: "1px solid #a7f3d0",
                  background: "#fafafa",
                  display: "flex", flexDirection: "column", gap: 10,
                }}>
                  {o.estimatedImpact && (
                    <InfoRow
                      icon={<TrendingUp size={11} />}
                      label="Estimated impact"
                      text={o.estimatedImpact}
                      color="#059669"
                    />
                  )}
                  <TalkingPoint
                    text={o.talkingPoint}
                    color="#059669"
                    copied={copiedIdx === i}
                    onCopy={() => copy(o.talkingPoint, i)}
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

function InfoRow({ icon, label, text, color }: { icon: React.ReactNode; label: string; text: string; color: string }) {
  return (
    <div>
      <div style={{
        display: "flex", alignItems: "center", gap: 4,
        fontSize: "0.6rem", fontWeight: 800, color,
        textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 3,
      }}>
        {icon} {label}
      </div>
      <div style={{ fontSize: "0.78rem", color: "var(--text-secondary)", lineHeight: 1.5 }}>
        {text}
      </div>
    </div>
  );
}

function TalkingPoint({ text, color, copied, onCopy }: {
  text: string; color: string; copied: boolean; onCopy: () => void;
}) {
  return (
    <div style={{
      padding: "0.6rem 0.75rem", borderRadius: 8,
      background: "#fff", border: `1.5px solid ${color}40`,
      position: "relative",
    }}>
      <div style={{
        display: "flex", alignItems: "center", gap: 5,
        fontSize: "0.6rem", fontWeight: 800, color,
        textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 4,
      }}>
        <MessageCircle size={10} /> Use This on the Call
      </div>
      <div style={{
        fontSize: "0.82rem", color: "var(--text-primary)",
        lineHeight: 1.55, fontStyle: "italic",
      }}>
        &ldquo;{text}&rdquo;
      </div>
      <button
        onClick={(e) => { e.stopPropagation(); onCopy(); }}
        style={{
          position: "absolute", top: 6, right: 6,
          background: "none", border: "none", cursor: "pointer",
          display: "flex", alignItems: "center", gap: 3,
          fontSize: "0.65rem", color: copied ? "#10b981" : "var(--text-muted)",
          fontWeight: 600,
        }}
      >
        {copied ? <><Check size={10} /> Copied</> : <><Copy size={10} /> Copy</>}
      </button>
    </div>
  );
}

function normalizePainPoints(raw: any[] | null): PainPoint[] {
  if (!raw) return [];
  return raw.map((item) => {
    if (typeof item === "string") {
      return {
        category: "General",
        title: item,
        observation: item,
        talkingPoint: `I noticed something that jumped out: ${item.toLowerCase()} — is that on your radar?`,
        severity: "high" as const,
      };
    }
    return {
      category: item.category || "General",
      title: item.title || item.observation || "Pain point",
      observation: item.observation || item.title || "",
      industryContext: item.industryContext,
      evidence: item.evidence,
      talkingPoint: item.talkingPoint || `I noticed ${item.title?.toLowerCase() || "something"} — is that an issue for you?`,
      severity: item.severity || "high",
    };
  });
}

function normalizeOpportunities(raw: any[] | null): Opportunity[] {
  if (!raw) return [];
  return raw.map((item) => {
    if (typeof item === "string") {
      return {
        title: item,
        solution: item,
        talkingPoint: `One thing we could do is ${item.toLowerCase()} — would that move the needle for you?`,
      };
    }
    return {
      title: item.title || item.solution || "Opportunity",
      solution: item.solution || item.title || "",
      linkedPainCategory: item.linkedPainCategory,
      serviceId: item.serviceId,
      estimatedImpact: item.estimatedImpact,
      talkingPoint: item.talkingPoint || `We could help by ${(item.solution || item.title || "").toLowerCase()} — would that be worth 15 minutes?`,
    };
  });
}
