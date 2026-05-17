"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Brain, Loader2, Target, FileText, Send, ChevronDown, ChevronUp,
  Shield, DollarSign, TrendingUp, MessageSquare, Headphones, Save,
  Copy, Check, ExternalLink,
} from "lucide-react";
import { DigitalPresenceBreakdown } from "@/components/sales/DigitalPresenceBreakdown";
import { PainPointsAndOpportunities } from "@/components/sales/PainPointsAndOpportunities";

interface LeadIntelligencePanelProps {
  lead: any;
}

type Section = "research" | "qualification" | "brief" | "outreach" | "coaching";

export function LeadIntelligencePanel({ lead }: LeadIntelligencePanelProps) {
  const router = useRouter();
  const [openSections, setOpenSections] = useState<Set<Section>>(
    new Set(["research", "qualification", "brief"])
  );
  const [loadingAction, setLoadingAction] = useState<string | null>(null);
  const [coaching, setCoaching] = useState<any>(null);
  const [callNotes, setCallNotes] = useState(lead.preCallBrief?.callNotes || "");
  const [callOutcome, setCallOutcome] = useState(lead.preCallBrief?.callOutcome || "");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const projectId = lead.salesProjectId;

  const toggleSection = (s: Section) => {
    setOpenSections((prev) => {
      const next = new Set(prev);
      next.has(s) ? next.delete(s) : next.add(s);
      return next;
    });
  };

  const persona = lead.persona;
  const painPoints = safeJson(persona?.painPoints, []);
  const opportunities = safeJson(persona?.opportunities, []);
  const competitors = safeJson(persona?.competitors, []);
  const challenges = safeJson(persona?.challenges, []);
  const toolsUsed = safeJson(persona?.toolsUsed, []);
  const services = safeJson(lead.recommendedServices, []);
  const brief = lead.preCallBrief;
  const outreaches = lead.outreaches || [];

  const refresh = () => router.refresh();

  // --- Actions ---
  const runResearch = async () => {
    if (!projectId) return;
    setLoadingAction("research");
    try {
      await fetch(`/api/sales-projects/${projectId}/research`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ leadId: lead.id }),
      });
      refresh();
    } catch {} finally { setLoadingAction(null); }
  };

  const generateBrief = async () => {
    if (!projectId) return;
    setLoadingAction("brief");
    try {
      await fetch(`/api/sales-projects/${projectId}/brief/${lead.id}`, { method: "POST" });
      refresh();
    } catch {} finally { setLoadingAction(null); }
  };

  const generateOutreach = async () => {
    if (!projectId) return;
    setLoadingAction("outreach");
    try {
      await fetch(`/api/sales-projects/${projectId}/outreach`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ leadId: lead.id }),
      });
      refresh();
    } catch {} finally { setLoadingAction(null); }
  };

  const loadCoaching = async () => {
    if (!projectId) return;
    setLoadingAction("coaching");
    try {
      const res = await fetch(`/api/sales-projects/${projectId}/coach/${lead.id}`, { method: "POST" });
      const data = await res.json();
      setCoaching(data);
      setCallNotes(data.callNotes || "");
      setCallOutcome(data.callOutcome || "");
    } catch {} finally { setLoadingAction(null); }
  };

  const saveNotes = async () => {
    if (!projectId) return;
    setLoadingAction("saving");
    try {
      await fetch(`/api/sales-projects/${projectId}/coach/${lead.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ callNotes, callOutcome }),
      });
      refresh();
    } catch {} finally { setLoadingAction(null); }
  };

  const copyText = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const hasNoProject = !projectId;

  return (
    <div>
      {/* === RESEARCH SECTION === */}
      <SectionCard
        title="Research & Persona"
        icon={<Brain size={15} />}
        color="#8b5cf6"
        open={openSections.has("research")}
        onToggle={() => toggleSection("research")}
        badge={persona ? "Complete" : undefined}
        badgeColor={persona ? "#10b981" : undefined}
      >
        {!persona ? (
          <div style={{ textAlign: "center", padding: "1.5rem 1rem" }}>
            <Brain size={28} style={{ color: "#8b5cf620", marginBottom: 8 }} />
            <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginBottom: 12 }}>
              AI-powered business analysis — pain points, opportunities, decision maker profile, and digital presence assessment.
            </p>
            {hasNoProject ? (
              <p style={{ fontSize: "0.78rem", color: "#f59e0b", fontWeight: 600 }}>
                This lead is not linked to a sales project. Research is available from the pipeline board.
              </p>
            ) : (
              <button className="btn btn-primary" onClick={runResearch} disabled={loadingAction === "research"} style={{ fontSize: "0.85rem" }}>
                {loadingAction === "research" ? <><Loader2 size={14} className="spin" /> Researching...</> : <><Brain size={14} /> Run Research</>}
              </button>
            )}
          </div>
        ) : (
          <div>
            {/* Business Summary */}
            {persona.businessSummary && (
              <p style={{ fontSize: "0.88rem", color: "var(--text-secondary)", lineHeight: 1.65, marginBottom: 16 }}>
                {persona.businessSummary}
              </p>
            )}

            {/* Decision Maker Card */}
            {persona.decisionMakerTitle && (
              <div style={{
                marginBottom: 16, padding: "0.75rem 1rem", borderRadius: 10,
                background: "linear-gradient(135deg, #f5f3ff, #ede9fe)",
                border: "1px solid #ddd6fe",
              }}>
                <div style={{ fontSize: "0.7rem", fontWeight: 800, color: "#7c3aed", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 4 }}>
                  Decision Maker
                </div>
                <div style={{ fontWeight: 700, fontSize: "0.95rem", color: "var(--text-primary)" }}>
                  {persona.decisionMakerName || persona.decisionMakerTitle}
                </div>
                {persona.decisionMakerName && persona.decisionMakerTitle && (
                  <div style={{ fontSize: "0.82rem", color: "var(--text-secondary)", marginTop: 2 }}>
                    {persona.decisionMakerTitle}
                  </div>
                )}
                {persona.decisionMakerStyle && (
                  <span style={{
                    display: "inline-block", marginTop: 6,
                    padding: "2px 8px", borderRadius: 5, fontSize: "0.72rem",
                    fontWeight: 600, background: "#7c3aed18", color: "#7c3aed",
                  }}>
                    {persona.decisionMakerStyle}
                  </span>
                )}
              </div>
            )}

            {/* Digital Presence — per-channel breakdown with talking points */}
            {persona.digitalPresence && (() => {
              const dp = parseDigitalPresence(persona.digitalPresence);
              return (
                <div style={{ marginBottom: 16 }}>
                  <div style={{ fontWeight: 800, color: "#0284c7", fontSize: "0.72rem", textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 8, display: "flex", alignItems: "center", gap: 5 }}>
                    Digital Presence Assessment
                  </div>
                  <DigitalPresenceBreakdown channels={dp.channels} legacy={dp.legacy} />
                </div>
              );
            })()}

            {/* Pain Points & Opportunities — structured + talking points */}
            {(painPoints.length > 0 || opportunities.length > 0) && (
              <div style={{ marginBottom: 16 }}>
                <PainPointsAndOpportunities
                  painPoints={painPoints}
                  opportunities={opportunities}
                />
              </div>
            )}

            {/* Additional intel row */}
            {(competitors.length > 0 || challenges.length > 0 || toolsUsed.length > 0) && (
              <div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginBottom: 16 }}>
                {competitors.length > 0 && (
                  <IntelChips label="Competitors" items={competitors} color="#6366f1" />
                )}
                {challenges.length > 0 && (
                  <IntelChips label="Industry Challenges" items={challenges} color="#f59e0b" />
                )}
                {toolsUsed.length > 0 && (
                  <IntelChips label="Tools Used" items={toolsUsed} color="#06b6d4" />
                )}
              </div>
            )}

            {!hasNoProject && (
              <button onClick={runResearch} disabled={loadingAction === "research"} className="btn btn-ghost" style={{ fontSize: "0.8rem", marginTop: 4 }}>
                {loadingAction === "research" ? <Loader2 size={12} className="spin" /> : <Brain size={12} />} Re-run Research
              </button>
            )}
          </div>
        )}
      </SectionCard>

      {/* === QUALIFICATION SECTION === */}
      <SectionCard
        title="Qualification"
        icon={<Target size={15} />}
        color="#ec4899"
        open={openSections.has("qualification")}
        onToggle={() => toggleSection("qualification")}
        badge={lead.qualified ? "Qualified" : lead.qualificationScore > 0 ? "Reviewed" : undefined}
        badgeColor={lead.qualified ? "#10b981" : "#f59e0b"}
      >
        {lead.qualificationScore === 0 ? (
          <div style={{ textAlign: "center", padding: "1.25rem 1rem" }}>
            <Target size={28} style={{ color: "#ec489920", marginBottom: 8 }} />
            <p style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>
              Qualification runs automatically after research is complete.
            </p>
          </div>
        ) : (
          <div>
            {/* Score + Status Row */}
            <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 16 }}>
              <div style={{
                width: 64, height: 64, borderRadius: 16,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontWeight: 800, fontSize: "1.5rem",
                background: lead.qualificationScore >= 70 ? "#10b98118" : lead.qualificationScore >= 40 ? "#f59e0b18" : "#94a3b818",
                color: lead.qualificationScore >= 70 ? "#10b981" : lead.qualificationScore >= 40 ? "#f59e0b" : "#94a3b8",
              }}>
                {lead.qualificationScore}
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: "1rem", color: "var(--text-primary)" }}>
                  {lead.qualified ? "Qualified Lead" : "Not Yet Qualified"}
                </div>
                {lead.qualificationReason && (
                  <div style={{ fontSize: "0.82rem", color: "var(--text-muted)", marginTop: 3, lineHeight: 1.5 }}>
                    {lead.qualificationReason}
                  </div>
                )}
              </div>
            </div>

            {/* Recommended Services */}
            {services.length > 0 && (
              <div>
                <div style={{ fontWeight: 800, fontSize: "0.72rem", color: "var(--text-primary)", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.04em" }}>
                  Recommended Services
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {services.map((s: any, i: number) => {
                    const name = typeof s === "string" ? s : s.name;
                    const tier = typeof s === "string" ? "secondary" : s.tier;
                    const reason = typeof s === "string" ? "" : s.reason;
                    const tierColor = tier === "primary" ? "#ef4444" : tier === "secondary" ? "#f59e0b" : "#94a3b8";
                    return (
                      <div key={i} style={{
                        display: "flex", alignItems: "flex-start", gap: 10,
                        padding: "0.6rem 0.75rem", borderRadius: 8, background: "#f8fafc",
                        border: "1px solid var(--border-color)",
                      }}>
                        <span style={{
                          padding: "2px 7px", borderRadius: 5, fontSize: "0.65rem", fontWeight: 700,
                          color: tierColor, background: `${tierColor}14`, flexShrink: 0, marginTop: 2,
                        }}>
                          {tier === "primary" ? "CRITICAL" : tier === "secondary" ? "HIGH" : "OPTIONAL"}
                        </span>
                        <div>
                          <div style={{ fontWeight: 600, color: "var(--text-primary)", fontSize: "0.85rem" }}>{name}</div>
                          {reason && <div style={{ fontSize: "0.78rem", color: "var(--text-muted)", marginTop: 2 }}>{reason}</div>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </SectionCard>

      {/* === PRE-CALL BRIEF === */}
      <SectionCard
        title="Pre-Call Brief"
        icon={<FileText size={15} />}
        color="#3b82f6"
        open={openSections.has("brief")}
        onToggle={() => toggleSection("brief")}
        badge={brief?.headline ? "Ready" : undefined}
        badgeColor="#3b82f6"
      >
        {!brief?.headline ? (
          <div style={{ textAlign: "center", padding: "1.25rem 1rem" }}>
            <FileText size={28} style={{ color: "#3b82f620", marginBottom: 8 }} />
            <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginBottom: 12 }}>
              Generate a pre-call brief with talking points, opening lines, and qualification questions.
            </p>
            {hasNoProject ? (
              <p style={{ fontSize: "0.78rem", color: "#f59e0b", fontWeight: 600 }}>
                Available from the pipeline board.
              </p>
            ) : (
              <button className="btn btn-primary" onClick={generateBrief} disabled={loadingAction === "brief"} style={{ fontSize: "0.85rem" }}>
                {loadingAction === "brief" ? <><Loader2 size={14} className="spin" /> Generating...</> : <><FileText size={14} /> Generate Brief</>}
              </button>
            )}
          </div>
        ) : (
          <div>
            <div style={{
              fontWeight: 700, fontSize: "1rem", color: "var(--accent-primary)",
              marginBottom: 16, lineHeight: 1.4,
            }}>
              {brief.headline}
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <BriefList title="Talking Points" data={brief.talkingPoints} color="#3b82f6" />
              <BriefList title="Opening Lines" data={brief.openingLines} color="#10b981" />
              <BriefList title="Qualification Questions" data={brief.qualificationQuestions} color="#f59e0b" />
              {brief.recommendedServices && (
                <BriefList title="Recommended Services" data={brief.recommendedServices} color="#8b5cf6" />
              )}
            </div>
          </div>
        )}
      </SectionCard>

      {/* === OUTREACH MESSAGES === */}
      <SectionCard
        title="Outreach Messages"
        icon={<Send size={15} />}
        color="#a855f7"
        open={openSections.has("outreach")}
        onToggle={() => toggleSection("outreach")}
        badge={outreaches.length > 0 ? `${outreaches.length} messages` : undefined}
      >
        {outreaches.length === 0 ? (
          <div style={{ textAlign: "center", padding: "1.25rem 1rem" }}>
            <Send size={28} style={{ color: "#a855f720", marginBottom: 8 }} />
            <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginBottom: 12 }}>
              Generate personalized outreach messages for each social platform.
            </p>
            {hasNoProject ? (
              <p style={{ fontSize: "0.78rem", color: "#f59e0b", fontWeight: 600 }}>
                Available from the pipeline board.
              </p>
            ) : (
              <button className="btn btn-primary" onClick={generateOutreach} disabled={loadingAction === "outreach" || !lead.qualified} style={{ fontSize: "0.85rem" }}>
                {loadingAction === "outreach" ? <><Loader2 size={14} className="spin" /> Generating...</> : <><Send size={14} /> Generate Messages</>}
              </button>
            )}
            {!lead.qualified && !hasNoProject && (
              <p style={{ fontSize: "0.78rem", color: "var(--text-muted)", marginTop: 8 }}>Lead must be qualified first.</p>
            )}
          </div>
        ) : (
          <div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {outreaches.map((msg: any) => (
                <OutreachCard key={msg.id} msg={msg} onCopy={copyText} copiedId={copiedId} />
              ))}
            </div>
            {!hasNoProject && (
              <div style={{ marginTop: 12, textAlign: "center" }}>
                <button className="btn btn-ghost" onClick={generateOutreach} disabled={loadingAction === "outreach"} style={{ fontSize: "0.8rem" }}>
                  {loadingAction === "outreach" ? <Loader2 size={12} className="spin" /> : <Send size={12} />} Regenerate Messages
                </button>
              </div>
            )}
          </div>
        )}
      </SectionCard>

      {/* === COACHING & CALL NOTES === */}
      <SectionCard
        title="Coaching & Call Notes"
        icon={<Headphones size={15} />}
        color="#f59e0b"
        open={openSections.has("coaching")}
        onToggle={() => toggleSection("coaching")}
        badge={brief?.callOutcome || callOutcome ? (brief?.callOutcome || callOutcome) : undefined}
        badgeColor={
          (brief?.callOutcome || callOutcome) === "OUTREACHED" ? "#10b981"
          : (brief?.callOutcome || callOutcome) === "SCHEDULED" ? "#8b5cf6"
          : (brief?.callOutcome || callOutcome) === "NOT_INTERESTED" ? "#ef4444"
          : "#94a3b8"
        }
      >
        {!coaching && !brief ? (
          <div style={{ textAlign: "center", padding: "1.25rem 1rem" }}>
            <Headphones size={28} style={{ color: "#f59e0b20", marginBottom: 8 }} />
            <p style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>
              Generate a Pre-Call Brief first to unlock sales coaching — call scripts, objection handlers, pricing guidance, and ROI projections.
            </p>
          </div>
        ) : !coaching ? (
          <div style={{ textAlign: "center", padding: "1.25rem 1rem" }}>
            {hasNoProject ? (
              <p style={{ fontSize: "0.78rem", color: "#f59e0b", fontWeight: 600 }}>
                Available from the pipeline board.
              </p>
            ) : (
              <button className="btn btn-primary" onClick={loadCoaching} disabled={loadingAction === "coaching"} style={{ fontSize: "0.85rem" }}>
                {loadingAction === "coaching" ? <><Loader2 size={14} className="spin" /> Loading...</> : <><Headphones size={14} /> Load Coaching</>}
              </button>
            )}
          </div>
        ) : (
          <div>
            <CoachingTabs coaching={coaching} />

            {/* Call Outcome */}
            <div style={{ marginTop: 16 }}>
              <div style={{ fontWeight: 700, fontSize: "0.82rem", color: "var(--text-primary)", marginBottom: 8 }}>Call Outcome</div>
              <div style={{ display: "flex", gap: 6 }}>
                {[
                  { v: "OUTREACHED", l: "Outreached", c: "#10b981" },
                  { v: "SCHEDULED", l: "Scheduled Appt", c: "#8b5cf6" },
                  { v: "NOT_INTERESTED", l: "Not Interested", c: "#ef4444" },
                  { v: "CALLBACK", l: "Callback", c: "#f59e0b" },
                ].map((o) => (
                  <button key={o.v} onClick={() => setCallOutcome(o.v)} style={{
                    padding: "0.4rem 0.75rem", borderRadius: 8, fontSize: "0.78rem", fontWeight: 600, cursor: "pointer",
                    border: callOutcome === o.v ? `2px solid ${o.c}` : "1.5px solid var(--border-color)",
                    background: callOutcome === o.v ? `${o.c}12` : "var(--bg-surface)",
                    color: callOutcome === o.v ? o.c : "var(--text-secondary)",
                  }}>{o.l}</button>
                ))}
              </div>
            </div>

            {/* Call Notes */}
            <div style={{ marginTop: 12 }}>
              <div style={{ fontWeight: 700, fontSize: "0.82rem", color: "var(--text-primary)", marginBottom: 8 }}>Call Notes</div>
              <textarea
                value={callNotes}
                onChange={(e) => setCallNotes(e.target.value)}
                placeholder="Enter notes from your call..."
                style={{
                  width: "100%", minHeight: 100, padding: "0.65rem",
                  borderRadius: 10, border: "1.5px solid var(--border-color)",
                  fontSize: "0.85rem", fontFamily: "inherit", resize: "vertical",
                  color: "var(--text-primary)",
                }}
              />
            </div>

            <div style={{ marginTop: 10, display: "flex", justifyContent: "flex-end" }}>
              <button className="btn btn-primary" onClick={saveNotes} disabled={loadingAction === "saving"} style={{ fontSize: "0.85rem" }}>
                {loadingAction === "saving" ? <Loader2 size={13} className="spin" /> : <Save size={13} />} Save Notes
              </button>
            </div>
          </div>
        )}
      </SectionCard>

      <style>{`
        .spin { animation: intel-spin 1s linear infinite; }
        @keyframes intel-spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}

// --- Subcomponents ---

function SectionCard({ title, icon, color, open, onToggle, badge, badgeColor, children }: {
  title: string; icon: React.ReactNode; color: string; open: boolean;
  onToggle: () => void; badge?: string; badgeColor?: string; children: React.ReactNode;
}) {
  return (
    <div className="card" style={{ marginBottom: "1rem", padding: 0, overflow: "hidden" }}>
      <div
        onClick={onToggle}
        style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "0.85rem 1.15rem", cursor: "pointer",
          background: open ? `${color}06` : "#fafafa",
          borderBottom: open ? "1px solid var(--border-color)" : "none",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ color, display: "flex" }}>{icon}</span>
          <span style={{ fontWeight: 700, fontSize: "0.88rem", color: "var(--text-primary)" }}>{title}</span>
          {badge && (
            <span style={{
              padding: "2px 8px", borderRadius: 5, fontSize: "0.68rem", fontWeight: 700,
              background: `${badgeColor || color}14`, color: badgeColor || color,
            }}>{badge}</span>
          )}
        </div>
        {open
          ? <ChevronUp size={15} style={{ color: "var(--text-muted)" }} />
          : <ChevronDown size={15} style={{ color: "var(--text-muted)" }} />
        }
      </div>
      {open && <div style={{ padding: "1rem 1.15rem" }}>{children}</div>}
    </div>
  );
}

function IntelChips({ label, items, color }: { label: string; items: string[]; color: string }) {
  return (
    <div>
      <div style={{ fontWeight: 800, fontSize: "0.68rem", color, textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 6 }}>
        {label}
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
        {items.map((item: string, i: number) => (
          <span key={i} style={{
            padding: "3px 8px", borderRadius: 6, fontSize: "0.75rem",
            background: `${color}10`, color, fontWeight: 500,
            border: `1px solid ${color}30`,
          }}>
            {item}
          </span>
        ))}
      </div>
    </div>
  );
}

function BriefList({ title, data, color }: { title: string; data: string | null; color: string }) {
  const items = safeJson(data, null);
  if (!items || items.length === 0) return null;
  return (
    <div style={{ padding: "0.65rem", borderRadius: 10, background: `${color}08`, border: `1px solid ${color}20` }}>
      <div style={{ fontWeight: 800, fontSize: "0.7rem", color, marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.04em" }}>
        {title}
      </div>
      <ul style={{ margin: 0, paddingLeft: 16, color: "var(--text-secondary)", fontSize: "0.82rem", lineHeight: 1.7 }}>
        {items.map((item: string, i: number) => <li key={i}>{item}</li>)}
      </ul>
    </div>
  );
}

function OutreachCard({ msg, onCopy, copiedId }: { msg: any; onCopy: (text: string, id: string) => void; copiedId: string | null }) {
  const platformColors: Record<string, string> = {
    INSTAGRAM: "#E4405F",
    LINKEDIN: "#0077B5",
    FACEBOOK: "#1877F2",
    TWITTER: "#000000",
    EMAIL: "#6366f1",
    SMS: "#10b981",
  };
  const color = platformColors[msg.platform] || "#94a3b8";
  const isCopied = copiedId === msg.id;

  return (
    <div style={{
      borderRadius: 10, border: "1px solid var(--border-color)",
      overflow: "hidden",
    }}>
      {/* Platform header */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "0.5rem 0.85rem", background: `${color}08`,
        borderBottom: "1px solid var(--border-color)",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{
            padding: "2px 7px", borderRadius: 5, fontSize: "0.65rem",
            fontWeight: 700, background: `${color}18`, color,
          }}>
            {msg.platform}
          </span>
          <span style={{ fontSize: "0.72rem", color: "var(--text-muted)", fontWeight: 500 }}>
            {msg.type === "FOLLOW_UP" ? "Follow-up" : "Introduction"}
          </span>
          {msg.status !== "DRAFT" && (
            <span style={{
              padding: "1px 6px", borderRadius: 4, fontSize: "0.6rem", fontWeight: 700,
              background: msg.status === "SENT" ? "#3b82f618" : "#10b98118",
              color: msg.status === "SENT" ? "#3b82f6" : "#10b981",
            }}>
              {msg.status}
            </span>
          )}
        </div>
        <button
          onClick={() => onCopy(msg.body, msg.id)}
          style={{
            display: "flex", alignItems: "center", gap: 4,
            background: "none", border: "none", cursor: "pointer",
            fontSize: "0.72rem", color: isCopied ? "#10b981" : "var(--text-muted)",
            fontWeight: 600,
          }}
        >
          {isCopied ? <><Check size={11} /> Copied</> : <><Copy size={11} /> Copy</>}
        </button>
      </div>
      {/* Subject (email) */}
      {msg.subject && (
        <div style={{ padding: "0.4rem 0.85rem", fontSize: "0.82rem", fontWeight: 600, color: "var(--text-primary)", borderBottom: "1px solid var(--border-color)", background: "#fafafa" }}>
          {msg.subject}
        </div>
      )}
      {/* Body */}
      <div style={{
        padding: "0.75rem 0.85rem", fontSize: "0.85rem",
        lineHeight: 1.65, color: "var(--text-secondary)",
        whiteSpace: "pre-wrap", maxHeight: 180, overflowY: "auto",
      }}>
        {msg.body}
      </div>
    </div>
  );
}

function CoachingTabs({ coaching }: { coaching: any }) {
  const [tab, setTab] = useState("script");
  const tabs = [
    { id: "script", label: "Call Script", icon: MessageSquare },
    { id: "objections", label: "Objections", icon: Shield },
    { id: "pricing", label: "Pricing", icon: DollarSign },
    { id: "roi", label: "ROI", icon: TrendingUp },
  ];

  return (
    <div>
      <div style={{ display: "flex", gap: 4, marginBottom: 10 }}>
        {tabs.map((t) => {
          const Icon = t.icon;
          return (
            <button key={t.id} onClick={() => setTab(t.id)} style={{
              display: "flex", alignItems: "center", gap: 4,
              padding: "0.4rem 0.65rem", borderRadius: 8,
              fontSize: "0.78rem", fontWeight: 600, cursor: "pointer",
              border: tab === t.id ? "1.5px solid var(--accent-primary)" : "1px solid var(--border-color)",
              background: tab === t.id ? "var(--accent-primary)08" : "transparent",
              color: tab === t.id ? "var(--accent-primary)" : "var(--text-muted)",
            }}><Icon size={13} /> {t.label}</button>
          );
        })}
      </div>
      <div style={{
        padding: "0.75rem", borderRadius: 10, background: "#f8fafc",
        fontSize: "0.85rem", lineHeight: 1.65, color: "var(--text-secondary)",
        whiteSpace: "pre-wrap", maxHeight: 280, overflowY: "auto",
        border: "1px solid var(--border-color)",
      }}>
        {tab === "script" && (coaching.callScript || "Generate coaching to see the call script.")}
        {tab === "objections" && (coaching.objectionHandlers || "—")}
        {tab === "pricing" && (coaching.pricingGuidance || "—")}
        {tab === "roi" && (coaching.roiProjections || "—")}
      </div>
    </div>
  );
}

function parseDigitalPresence(raw: string | null): { channels: any[] | null; legacy: any } {
  if (!raw) return { channels: null, legacy: null };
  try {
    const obj = typeof raw === "string" ? JSON.parse(raw) : raw;
    // New structured format: { channels: [...], hasWebsite, ... }
    if (obj && Array.isArray(obj.channels) && obj.channels.length > 0) {
      return { channels: obj.channels, legacy: obj };
    }
    // Legacy flat format
    return { channels: null, legacy: obj };
  } catch {
    return { channels: null, legacy: null };
  }
}

function safeJson(str: any, fallback: any) {
  if (!str) return fallback;
  if (typeof str !== "string") return str;
  try { return JSON.parse(str); } catch { return fallback; }
}
