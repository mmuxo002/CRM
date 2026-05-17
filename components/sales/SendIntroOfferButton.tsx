"use client";

// 24h cold-lead intro offer modal.
// Two-pane layout: editable compose form (left) + live HTML email preview (right).
// Agent edits the recipient first name, display name, subject, and body.
// Body default is auto-built from persona pain points + recommended services.
// Backend uses the same renderer for preview AND send, so what the agent
// sees is byte-identical to what the prospect gets in their inbox.

import { useEffect, useRef, useState } from "react";
import {
  Mail, Loader2, Check, AlertCircle, ExternalLink, Copy, X, Eye, Send, RotateCcw, Sparkles,
} from "lucide-react";

type Defaults = {
  recipientFirstName: string;
  businessNameDisplay: string;
  subject: string;
  body: string;
};
type LeadInfo = {
  hasPersona: boolean;
  painPointCount: number;
  recommendedServiceCount: number;
  hasDecisionMakerName: boolean;
  aiUsed: boolean;
};
type Preview = { subject: string; html: string; text: string; expiresAt: string };
type SendResult = {
  ok: true; offerId: string; token: string; expiresAt: string; offerUrl: string;
};

const DEBOUNCE_MS = 400;

export function SendIntroOfferButton({
  leadId,
  leadName,
  leadEmail,
}: { leadId: string; leadName: string; leadEmail: string | null }) {
  const [open, setOpen] = useState(false);

  // Form state
  const [to, setTo] = useState(leadEmail ?? "");
  const [recipientFirstName, setRecipientFirstName] = useState("");
  const [businessNameDisplay, setBusinessNameDisplay] = useState("");
  const [subject, setSubject] = useState("");
  const [bodyText, setBodyText] = useState("");
  const [defaults, setDefaults] = useState<Defaults | null>(null);
  const [leadInfo, setLeadInfo] = useState<LeadInfo | null>(null);

  // Preview state
  const [preview, setPreview] = useState<Preview | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState<string | null>(null);
  // True when the current preview call is running the AI generator (initial
  // open or regenerate). Drives a richer loading message than plain previews.
  const [aiRunning, setAiRunning] = useState(false);

  // Send state
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const [result, setResult] = useState<SendResult | null>(null);
  const [copied, setCopied] = useState(false);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // First open: fetch defaults + initial preview (this calls the AI).
  useEffect(() => {
    if (!open) return;
    if (defaults) return;
    void fetchPreview({}, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // Debounced preview refresh as agent types any of the editable fields.
  // This call passes overrides, so the server skips the AI and just re-renders.
  useEffect(() => {
    if (!open || !defaults) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      void fetchPreview(
        {
          subjectOverride: subject,
          bodyOverride: bodyText,
          recipientFirstNameOverride: recipientFirstName,
          businessNameDisplayOverride: businessNameDisplay,
        },
        false,
      );
    }, DEBOUNCE_MS);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subject, bodyText, recipientFirstName, businessNameDisplay]);

  type Overrides = {
    subjectOverride?: string;
    bodyOverride?: string;
    recipientFirstNameOverride?: string;
    businessNameDisplayOverride?: string;
    regenerate?: boolean;
  };

  async function fetchPreview(
    overrides: Overrides,
    /** When true, populates form state with the returned defaults
     * (initial load OR explicit regenerate). */
    overwriteFormFromDefaults: boolean,
  ) {
    setPreviewLoading(true);
    setPreviewError(null);
    // If this call will run the AI, flip the richer loading flag so the UI
    // can show "Writing personalized copy..." instead of generic spinner text.
    const willRunAI =
      overrides.regenerate === true ||
      (overrides.subjectOverride === undefined &&
        overrides.bodyOverride === undefined &&
        overrides.recipientFirstNameOverride === undefined &&
        overrides.businessNameDisplayOverride === undefined);
    if (willRunAI) setAiRunning(true);
    try {
      const res = await fetch(`/api/leads/${leadId}/intro-offer/preview`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(overrides),
      });
      const json = await res.json();
      if (!res.ok) {
        setPreviewError(json.error || `Preview failed (HTTP ${res.status})`);
        return;
      }
      setPreview(json.preview);
      if (overwriteFormFromDefaults) {
        setDefaults(json.defaults);
        setLeadInfo(json.leadInfo);
        setRecipientFirstName(json.defaults.recipientFirstName);
        setBusinessNameDisplay(json.defaults.businessNameDisplay);
        setSubject(json.defaults.subject);
        setBodyText(json.defaults.body);
      }
    } catch (e) {
      setPreviewError(e instanceof Error ? e.message : "Network error");
    } finally {
      setPreviewLoading(false);
      setAiRunning(false);
    }
  }

  // Re-roll the AI generator. Replaces the current subject + body with a
  // fresh AI version. Costs ~$0.003 per click.
  async function regenerate() {
    await fetchPreview({ regenerate: true }, true);
  }

  function reset() {
    setTo(leadEmail ?? "");
    setRecipientFirstName("");
    setBusinessNameDisplay("");
    setSubject("");
    setBodyText("");
    setDefaults(null);
    setLeadInfo(null);
    setPreview(null);
    setPreviewError(null);
    setSending(false);
    setSendError(null);
    setResult(null);
    setCopied(false);
  }

  async function send() {
    setSending(true);
    setSendError(null);
    try {
      const res = await fetch(`/api/leads/${leadId}/intro-offer/send`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to,
          subjectOverride: subject || null,
          bodyOverride: bodyText || null,
          recipientFirstNameOverride: recipientFirstName || null,
          businessNameDisplayOverride: businessNameDisplay || null,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        setSendError(json.error || `Send failed (HTTP ${res.status})`);
      } else {
        setResult(json as SendResult);
      }
    } catch (e) {
      setSendError(e instanceof Error ? e.message : "Network error");
    } finally {
      setSending(false);
    }
  }

  function copyLink() {
    if (!result?.offerUrl) return;
    navigator.clipboard.writeText(result.offerUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  function resetField(field: "subject" | "body" | "firstName" | "businessName") {
    if (!defaults) return;
    if (field === "subject") setSubject(defaults.subject);
    if (field === "body") setBodyText(defaults.body);
    if (field === "firstName") setRecipientFirstName(defaults.recipientFirstName);
    if (field === "businessName") setBusinessNameDisplay(defaults.businessNameDisplay);
  }

  const isEdited = (field: "subject" | "body" | "firstName" | "businessName"): boolean => {
    if (!defaults) return false;
    if (field === "subject") return subject !== defaults.subject;
    if (field === "body") return bodyText !== defaults.body;
    if (field === "firstName") return recipientFirstName !== defaults.recipientFirstName;
    if (field === "businessName") return businessNameDisplay !== defaults.businessNameDisplay;
    return false;
  };

  return (
    <>
      <button
        type="button"
        onClick={() => { reset(); setOpen(true); }}
        style={{
          display: "inline-flex", alignItems: "center", gap: 6,
          padding: "0.5rem 0.85rem", borderRadius: 10,
          border: "1px solid #cbd5e1", background: "white",
          color: "#334155", fontSize: "0.78rem", fontWeight: 700, cursor: "pointer",
        }}
        title="Preview, edit, and send a 24-hour 25% off intro offer with your scheduling link"
      >
        <Mail size={13} />
        Send Intro Offer
      </button>

      {open && (
        <div
          role="dialog"
          aria-modal="true"
          onClick={(e) => { if (e.target === e.currentTarget) setOpen(false); }}
          style={{
            position: "fixed", inset: 0, zIndex: 1000,
            background: "rgba(15,23,42,0.6)", backdropFilter: "blur(4px)",
            display: "flex", alignItems: "center", justifyContent: "center", padding: "1.25rem",
          }}
        >
          <div style={{
            background: "white", borderRadius: 16, width: "100%", maxWidth: 1120,
            maxHeight: "94vh", display: "flex", flexDirection: "column", overflow: "hidden",
            boxShadow: "0 30px 80px rgba(0,0,0,0.3)",
          }}>
            {/* Header */}
            <div style={{ padding: "1rem 1.25rem", borderBottom: "1px solid #f1f5f9", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
                <div style={{ width: 32, height: 32, borderRadius: 9, background: "linear-gradient(135deg, #ea580c, #db2777)", color: "white", display: "grid", placeItems: "center" }}>
                  <Mail size={15} />
                </div>
                <div>
                  <div style={{ fontWeight: 800, fontSize: "0.95rem" }}>24h Intro Offer</div>
                  <div style={{ fontSize: "0.72rem", color: "#64748b" }}>Preview and edit before sending. For {leadName}.</div>
                </div>
              </div>
              <button onClick={() => setOpen(false)} aria-label="Close" style={{ ...iconBtn, padding: 8 }}>
                <X size={16} />
              </button>
            </div>

            {/* Body */}
            <div style={{ display: "grid", gridTemplateColumns: result ? "1fr" : "minmax(360px, 420px) 1fr", flex: 1, overflow: "hidden" }}>

              {result ? (
                /* SENT view */
                <div style={{ padding: "2rem 1.25rem", display: "flex", flexDirection: "column", gap: 14, alignItems: "center", textAlign: "center", maxWidth: 560, margin: "0 auto" }}>
                  <div style={{ width: 56, height: 56, borderRadius: 999, background: "#f0fdf4", border: "2px solid #22c55e", display: "grid", placeItems: "center", color: "#16a34a" }}>
                    <Check size={26} />
                  </div>
                  <div style={{ fontSize: 18, fontWeight: 800 }}>Offer sent</div>
                  <div style={{ fontSize: 13, color: "#64748b", lineHeight: 1.55 }}>
                    Expires {new Date(result.expiresAt).toLocaleString()}.<br />
                    They&apos;ll see a live countdown when they click through.
                  </div>
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "center", marginTop: 6 }}>
                    <a href={result.offerUrl} target="_blank" rel="noopener noreferrer" style={iconBtn}>
                      <ExternalLink size={13} /> Preview offer page
                    </a>
                    <button onClick={copyLink} style={iconBtn}>
                      {copied ? <><Check size={13} /> Copied</> : <><Copy size={13} /> Copy link</>}
                    </button>
                  </div>
                  <button onClick={() => setOpen(false)} style={{ ...iconBtn, marginTop: 8 }}>Done</button>
                </div>
              ) : (
                <>
                  {/* COMPOSE pane */}
                  <div style={{ borderRight: "1px solid #f1f5f9", padding: "1.1rem 1.25rem", overflow: "auto", display: "flex", flexDirection: "column", gap: 12 }}>

                    {/* Persona warning if thin data */}
                    {leadInfo && leadInfo.painPointCount === 0 && (
                      <div style={{ background: "#fffbeb", border: "1px solid #fde68a", borderRadius: 8, padding: "8px 12px", color: "#92400e", fontSize: 12, lineHeight: 1.5, display: "flex", alignItems: "flex-start", gap: 6 }}>
                        <AlertCircle size={13} style={{ marginTop: 2, flexShrink: 0 }} />
                        <div>
                          No persona research on this lead yet. The body falls back to a generic pitch. Run the research phase on this contact for a sharper email.
                        </div>
                      </div>
                    )}

                    {leadInfo && leadInfo.aiUsed && (
                      <div style={{ background: "#fff7ed", border: "1px solid #fed7aa", borderRadius: 8, padding: "8px 12px", color: "#9a3412", fontSize: 12, lineHeight: 1.5, display: "flex", alignItems: "flex-start", gap: 6 }}>
                        <Sparkles size={13} style={{ marginTop: 2, flexShrink: 0 }} />
                        <div>
                          Subject and body were AI-personalized using this lead&apos;s research notes (no service names, no AI-tells). Edit anything you want, or hit <strong>Regenerate</strong> for a different version.
                        </div>
                      </div>
                    )}

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                      <div>
                        <LabelRow>
                          <Label>First name</Label>
                          {isEdited("firstName") && <button style={miniResetBtn} onClick={() => resetField("firstName")}><RotateCcw size={10} /></button>}
                        </LabelRow>
                        <input
                          type="text"
                          value={recipientFirstName}
                          onChange={(e) => setRecipientFirstName(e.target.value)}
                          placeholder="(leave blank for 'Hey there')"
                          style={inputStyle}
                        />
                      </div>
                      <div>
                        <LabelRow>
                          <Label>Business name</Label>
                          {isEdited("businessName") && <button style={miniResetBtn} onClick={() => resetField("businessName")}><RotateCcw size={10} /></button>}
                        </LabelRow>
                        <input
                          type="text"
                          value={businessNameDisplay}
                          onChange={(e) => setBusinessNameDisplay(e.target.value)}
                          placeholder="Displayed in the email"
                          style={inputStyle}
                        />
                      </div>
                    </div>

                    <div>
                      <Label>Recipient email</Label>
                      <input
                        type="email"
                        value={to}
                        onChange={(e) => setTo(e.target.value)}
                        placeholder="prospect@example.com"
                        style={inputStyle}
                      />
                    </div>

                    <div>
                      <LabelRow>
                        <Label>Subject</Label>
                        {isEdited("subject") && <button style={miniResetBtn} onClick={() => resetField("subject")}><RotateCcw size={10} /></button>}
                      </LabelRow>
                      <input
                        type="text"
                        value={subject}
                        onChange={(e) => setSubject(e.target.value)}
                        style={inputStyle}
                      />
                    </div>

                    <div style={{ display: "flex", flexDirection: "column", flex: 1, minHeight: 260 }}>
                      <LabelRow>
                        <Label>Body</Label>
                        {isEdited("body") && <button style={miniResetBtn} onClick={() => resetField("body")}><RotateCcw size={10} /> reset</button>}
                      </LabelRow>
                      <textarea
                        value={bodyText}
                        onChange={(e) => setBodyText(e.target.value)}
                        style={{ ...inputStyle, resize: "vertical", fontFamily: "inherit", lineHeight: 1.55, flex: 1, minHeight: 220 }}
                      />
                      <div style={hintStyle}>
                        Blank lines separate paragraphs. Lines starting with <code style={kbdStyle}>-&nbsp;</code> or <code style={kbdStyle}>•&nbsp;</code> become bullets.
                        Header, deadline, CTA, and signature stay locked for brand consistency.
                      </div>
                    </div>

                    {sendError && (
                      <div style={errBox}>
                        <AlertCircle size={14} /> {sendError}
                      </div>
                    )}

                    <button
                      onClick={send}
                      disabled={sending || !to}
                      style={{
                        display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 6,
                        padding: "12px 20px", borderRadius: 10, border: "none",
                        background: sending || !to ? "#cbd5e1" : "linear-gradient(135deg, #ea580c, #db2777)",
                        color: "white", fontSize: 14, fontWeight: 800,
                        cursor: sending || !to ? "not-allowed" : "pointer",
                        marginTop: 4,
                      }}
                    >
                      {sending
                        ? <><Loader2 size={14} style={{ animation: "spin 0.9s linear infinite" }} /> Sending...</>
                        : <><Send size={14} /> Send to {to || "..."}</>}
                    </button>
                  </div>

                  {/* PREVIEW pane */}
                  <div style={{ background: "#f1f5f9", display: "flex", flexDirection: "column", overflow: "hidden" }}>
                    <div style={{ padding: "10px 16px", borderBottom: "1px solid #e2e8f0", display: "flex", alignItems: "center", gap: 8, fontSize: 11, fontWeight: 800, color: "#475569", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                      <Eye size={12} />
                      <span>Live preview</span>
                      {previewLoading && !aiRunning && (
                        <Loader2 size={12} style={{ animation: "spin 0.9s linear infinite", color: "#94a3b8", marginLeft: 4 }} />
                      )}
                      <button
                        onClick={regenerate}
                        disabled={aiRunning || !defaults}
                        title="Re-roll the AI-generated subject and body. Replaces your current edits."
                        style={{
                          marginLeft: "auto",
                          display: "inline-flex", alignItems: "center", gap: 4,
                          padding: "4px 9px", borderRadius: 6,
                          border: "1px solid #fed7aa", background: "white",
                          fontSize: 10, fontWeight: 800, color: "#c2410c",
                          textTransform: "uppercase", letterSpacing: "0.06em",
                          cursor: aiRunning || !defaults ? "not-allowed" : "pointer",
                          opacity: aiRunning || !defaults ? 0.5 : 1,
                        }}
                      >
                        {aiRunning ? <Loader2 size={10} style={{ animation: "spin 0.9s linear infinite" }} /> : <Sparkles size={10} />}
                        Regenerate
                      </button>
                    </div>

                    {preview && (
                      <div style={{ padding: "8px 16px", background: "#fff", borderBottom: "1px solid #e2e8f0", fontSize: 12, color: "#475569", display: "flex", alignItems: "center", gap: 6 }}>
                        <span style={{ color: "#94a3b8", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", fontSize: 10 }}>Subject</span>
                        <span style={{ color: "#0f172a", fontWeight: 700, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{preview.subject}</span>
                      </div>
                    )}

                    <div style={{ flex: 1, overflow: "auto", padding: 16 }}>
                      {previewError ? (
                        <div style={errBox}>
                          <AlertCircle size={14} /> {previewError}
                        </div>
                      ) : preview ? (
                        <iframe
                          srcDoc={preview.html}
                          title="Email preview"
                          sandbox=""
                          style={{
                            width: "100%",
                            minHeight: 640,
                            background: "white",
                            border: "1px solid #e2e8f0",
                            borderRadius: 8,
                            boxShadow: "0 4px 16px -8px rgba(15,23,42,0.2)",
                          }}
                        />
                      ) : aiRunning ? (
                        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", gap: 12, color: "#475569", textAlign: "center", padding: 24 }}>
                          <div style={{ display: "inline-flex", alignItems: "center", gap: 8, color: "#ea580c" }}>
                            <Sparkles size={18} />
                            <Loader2 size={16} style={{ animation: "spin 0.9s linear infinite" }} />
                          </div>
                          <div style={{ fontSize: 14, fontWeight: 700, color: "#0f172a" }}>Writing personalized copy...</div>
                          <div style={{ fontSize: 12, color: "#64748b", maxWidth: 320, lineHeight: 1.5 }}>
                            Pulling pain points and research from this lead, drafting a subject and body that reads like a real human wrote it. Usually 5 to 10 seconds.
                          </div>
                        </div>
                      ) : (
                        <div style={{ display: "grid", placeItems: "center", height: "100%", color: "#94a3b8", fontSize: 13 }}>
                          Loading preview...
                        </div>
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      <style jsx global>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ fontSize: 10, fontWeight: 800, color: "#475569", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 4 }}>
      {children}
    </div>
  );
}

function LabelRow({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
      {children}
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  padding: "9px 11px", borderRadius: 7, border: "1px solid #cbd5e1",
  fontSize: 13, color: "#0f172a", outline: "none",
  fontWeight: 500, width: "100%", boxSizing: "border-box",
};

const iconBtn: React.CSSProperties = {
  display: "inline-flex", alignItems: "center", gap: 6,
  padding: "8px 12px", borderRadius: 8,
  border: "1px solid #e2e8f0", background: "white",
  fontSize: "0.78rem", fontWeight: 700, color: "#475569",
  cursor: "pointer", textDecoration: "none",
};

const miniResetBtn: React.CSSProperties = {
  display: "inline-flex", alignItems: "center", gap: 3,
  padding: "1px 6px", borderRadius: 4, border: "none", background: "transparent",
  fontSize: 10, fontWeight: 700, color: "#7c3aed", cursor: "pointer",
};

const hintStyle: React.CSSProperties = {
  marginTop: 6, fontSize: 11, color: "#94a3b8", lineHeight: 1.5,
};

const kbdStyle: React.CSSProperties = {
  background: "#f1f5f9", padding: "1px 4px", borderRadius: 3, fontSize: 10,
  fontFamily: "ui-monospace, monospace", color: "#475569",
};

const errBox: React.CSSProperties = {
  background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 8,
  padding: "8px 12px", color: "#991b1b", fontSize: 13,
  display: "flex", alignItems: "center", gap: 6,
};
