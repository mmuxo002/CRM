"use client";

// Kicks off the full Rend3r pipeline (research → copy → mockup image → polish)
// and shows live progress, then lets the rep send the proposal via Resend.

import { useEffect, useRef, useState } from "react";
import {
  Wand2, Loader2, X, Send, ExternalLink, AlertCircle, Check, Copy, RefreshCw,
} from "lucide-react";

type Status = {
  id: string;
  token: string;
  status: "pending" | "researching" | "writing" | "rendering" | "polishing" | "ready" | "failed" | "sent" | "viewed" | "scheduled";
  stage: string | null;
  progress: number;
  errorMessage: string | null;
  mockupImageUrl: string | null;
  rend3rImageUrl: string | null;
  currentSiteUrl: string | null;
  sentAt: string | null;
  sentToEmail: string | null;
  firstViewedAt: string | null;
  viewCount: number;
  scheduledAt: string | null;
};

export function GenerateFullProposalButton({
  leadId,
  leadName,
  leadEmail,
}: { leadId: string; leadName: string; leadEmail: string | null }) {
  const [open, setOpen] = useState(false);
  const [proposalId, setProposalId] = useState<string | null>(null);
  const [status, setStatus] = useState<Status | null>(null);
  const [startError, setStartError] = useState<string | null>(null);
  const [starting, setStarting] = useState(false);

  // Send form
  const [sendTo, setSendTo] = useState(leadEmail ?? "");
  const [sendMessage, setSendMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const [sendOk, setSendOk] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);

  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Start the pipeline.
  async function start() {
    setStarting(true);
    setStartError(null);
    setStatus(null);
    setProposalId(null);
    setSendOk(false);
    setSendError(null);
    try {
      const res = await fetch(`/api/leads/${leadId}/proposal/generate`, { method: "POST" });
      const json = await res.json();
      if (!res.ok || !json.id) {
        setStartError(json.error || `Failed (HTTP ${res.status})`);
        return;
      }
      setProposalId(json.id);
    } catch (e) {
      setStartError(e instanceof Error ? e.message : "Network error");
    } finally {
      setStarting(false);
    }
  }

  // Poll for status while the pipeline runs.
  useEffect(() => {
    if (!proposalId) return;
    let cancelled = false;
    async function tick() {
      try {
        const res = await fetch(`/api/proposals/${proposalId}/status`);
        const json = await res.json();
        if (cancelled) return;
        if (res.ok && json.proposal) {
          setStatus(json.proposal as Status);
          if (["ready", "sent", "viewed", "scheduled", "failed"].includes(json.proposal.status)) {
            if (pollRef.current) {
              clearInterval(pollRef.current);
              pollRef.current = null;
            }
          }
        }
      } catch {
        // transient — keep polling
      }
    }
    void tick();
    pollRef.current = setInterval(tick, 2500);
    return () => {
      cancelled = true;
      if (pollRef.current) {
        clearInterval(pollRef.current);
        pollRef.current = null;
      }
    };
  }, [proposalId]);

  function openModal() {
    setOpen(true);
    if (!proposalId && !starting) void start();
  }

  function closeModal() {
    setOpen(false);
  }

  async function send() {
    if (!proposalId) return;
    setSending(true);
    setSendError(null);
    setSendOk(false);
    try {
      const res = await fetch(`/api/proposals/${proposalId}/send`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ to: sendTo, customMessage: sendMessage || null }),
      });
      const json = await res.json();
      if (!res.ok) {
        setSendError(json.error || `Failed (HTTP ${res.status})`);
      } else {
        setSendOk(true);
        // refresh status to show sent state
        const sres = await fetch(`/api/proposals/${proposalId}/status`);
        const sjson = await sres.json();
        if (sres.ok) setStatus(sjson.proposal);
      }
    } catch (e) {
      setSendError(e instanceof Error ? e.message : "Network error");
    } finally {
      setSending(false);
    }
  }

  function copyLink() {
    if (!status?.token) return;
    const url = `${window.location.origin}/p/${status.token}`;
    navigator.clipboard.writeText(url);
    setLinkCopied(true);
    setTimeout(() => setLinkCopied(false), 1500);
  }

  const isRunning =
    !!status && ["pending", "researching", "writing", "rendering", "polishing"].includes(status.status);
  const isReady = !!status && ["ready", "sent", "viewed", "scheduled"].includes(status.status);
  const isFailed = !!status && status.status === "failed";
  const previewImage = status?.mockupImageUrl ?? status?.rend3rImageUrl ?? null;

  return (
    <>
      <button
        type="button"
        onClick={openModal}
        style={{
          display: "inline-flex", alignItems: "center", gap: 6,
          padding: "0.5rem 0.85rem", borderRadius: 10, border: "none",
          background: "linear-gradient(135deg, #ea580c, #db2777)",
          color: "white", fontSize: "0.78rem", fontWeight: 700, cursor: "pointer",
          boxShadow: "0 6px 18px -8px rgba(234,88,12,0.55)",
        }}
        title="Generate a full proposal with website mockup and competitor research, then send it to the client"
      >
        <Wand2 size={13} />
        Generate Full Proposal
      </button>

      {open && (
        <div
          role="dialog"
          aria-modal="true"
          onClick={(e) => { if (e.target === e.currentTarget) closeModal(); }}
          style={{
            position: "fixed", inset: 0, zIndex: 1000,
            background: "rgba(15,23,42,0.6)", backdropFilter: "blur(4px)",
            display: "flex", alignItems: "center", justifyContent: "center", padding: "2rem",
          }}
        >
          <div style={{
            background: "white", borderRadius: 16, width: "100%", maxWidth: 760,
            maxHeight: "92vh", display: "flex", flexDirection: "column", overflow: "hidden",
            boxShadow: "0 30px 80px rgba(0,0,0,0.3)",
          }}>
            {/* Header */}
            <div style={{ padding: "1rem 1.25rem", borderBottom: "1px solid #f1f5f9", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
                <div style={{ width: 34, height: 34, borderRadius: 9, background: "linear-gradient(135deg, #ea580c, #db2777)", color: "white", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Wand2 size={16} />
                </div>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontWeight: 800, fontSize: "0.95rem", color: "#0f172a" }}>Full Proposal</div>
                  <div style={{ fontSize: "0.72rem", color: "#64748b" }}>For {leadName}</div>
                </div>
              </div>
              <button onClick={closeModal} aria-label="Close" style={{ ...iconBtn, padding: 8 }}>
                <X size={16} />
              </button>
            </div>

            {/* Body */}
            <div style={{ overflow: "auto", padding: "1.25rem", flex: 1 }}>
              {startError && (
                <ErrorBox title="Couldn't start" message={startError} onRetry={start} />
              )}

              {(starting || (proposalId && !status)) && (
                <CenteredLoader text="Queuing proposal pipeline…" />
              )}

              {isRunning && status && (
                <ProgressView status={status} />
              )}

              {isFailed && status && (
                <ErrorBox
                  title="Generation failed"
                  message={status.errorMessage || "Unknown error"}
                  onRetry={start}
                />
              )}

              {isReady && status && (
                <ReadyView
                  status={status}
                  previewImage={previewImage}
                  sendTo={sendTo}
                  setSendTo={setSendTo}
                  sendMessage={sendMessage}
                  setSendMessage={setSendMessage}
                  sending={sending}
                  sendError={sendError}
                  sendOk={sendOk}
                  onSend={send}
                  onCopyLink={copyLink}
                  linkCopied={linkCopied}
                />
              )}
            </div>
          </div>
        </div>
      )}

      <style jsx global>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes pulseBar { 0%,100% { opacity: 1; } 50% { opacity: 0.6; } }
      `}</style>
    </>
  );
}

function ProgressView({ status }: { status: Status }) {
  const stages: Array<{ key: Status["status"]; label: string }> = [
    { key: "researching", label: "Researching competitors" },
    { key: "writing", label: "Writing proposal copy" },
    { key: "rendering", label: "Designing mockup" },
    { key: "polishing", label: "Polishing visuals" },
  ];
  const currentIdx = stages.findIndex((s) => s.key === status.status);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 12, padding: "1rem 1.1rem" }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: "#0f172a", marginBottom: 10 }}>
          {status.stage || "Working…"}
        </div>
        <div style={{ width: "100%", height: 8, background: "#e2e8f0", borderRadius: 999, overflow: "hidden" }}>
          <div style={{
            width: `${Math.max(5, status.progress)}%`,
            height: "100%",
            background: "linear-gradient(90deg, #ea580c, #db2777)",
            borderRadius: 999,
            transition: "width 0.4s ease",
            animation: "pulseBar 1.6s ease-in-out infinite",
          }} />
        </div>
        <div style={{ marginTop: 6, fontSize: 11, color: "#64748b", display: "flex", justifyContent: "space-between" }}>
          <span>{status.progress}%</span>
          <span>This usually takes 60–120 seconds.</span>
        </div>
      </div>

      <div style={{ display: "grid", gap: 8 }}>
        {stages.map((s, i) => {
          const done = i < currentIdx;
          const active = i === currentIdx;
          return (
            <div key={s.key} style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 13 }}>
              <span style={{
                width: 18, height: 18, borderRadius: 999,
                background: done ? "#22c55e" : active ? "#ea580c" : "#e2e8f0",
                color: "white", display: "grid", placeItems: "center",
                flexShrink: 0,
              }}>
                {done && <Check size={11} />}
                {active && <Loader2 size={11} style={{ animation: "spin 0.9s linear infinite" }} />}
              </span>
              <span style={{ color: done ? "#16a34a" : active ? "#0f172a" : "#94a3b8", fontWeight: active ? 700 : 500 }}>
                {s.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ReadyView({
  status, previewImage, sendTo, setSendTo, sendMessage, setSendMessage,
  sending, sendError, sendOk, onSend, onCopyLink, linkCopied,
}: {
  status: Status;
  previewImage: string | null;
  sendTo: string;
  setSendTo: (s: string) => void;
  sendMessage: string;
  setSendMessage: (s: string) => void;
  sending: boolean;
  sendError: string | null;
  sendOk: boolean;
  onSend: () => void;
  onCopyLink: () => void;
  linkCopied: boolean;
}) {
  const publicUrl = `${typeof window !== "undefined" ? window.location.origin : ""}/p/${status.token}`;
  const wasSent = !!status.sentAt;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      {previewImage && (
        <div style={{ borderRadius: 12, overflow: "hidden", border: "1px solid #e2e8f0", background: "#0f172a" }}>
          <img src={previewImage} alt="Mockup preview" style={{ width: "100%", display: "block" }} />
        </div>
      )}

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <a href={publicUrl} target="_blank" rel="noopener noreferrer" style={iconBtn}>
          <ExternalLink size={13} /> Open public link
        </a>
        <button onClick={onCopyLink} style={iconBtn}>
          {linkCopied ? <><Check size={13} /> Copied</> : <><Copy size={13} /> Copy link</>}
        </button>
        {wasSent && (
          <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12, color: "#16a34a", fontWeight: 700, padding: "6px 10px", background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 8 }}>
            <Check size={13} /> Sent to {status.sentToEmail}
          </span>
        )}
        {status.viewCount > 0 && (
          <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12, color: "#7c3aed", fontWeight: 700, padding: "6px 10px", background: "#f5f3ff", border: "1px solid #ddd6fe", borderRadius: 8 }}>
            Viewed {status.viewCount}×
          </span>
        )}
      </div>

      <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 12, padding: "1rem 1.1rem" }}>
        <div style={{ fontSize: 12, fontWeight: 800, color: "#475569", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 10 }}>
          Send to client
        </div>

        <label style={labelStyle}>
          Recipient email
          <input
            type="email"
            value={sendTo}
            onChange={(e) => setSendTo(e.target.value)}
            placeholder="client@example.com"
            style={inputStyle}
          />
        </label>

        <label style={labelStyle}>
          Optional intro (defaults to a short note from you)
          <textarea
            value={sendMessage}
            onChange={(e) => setSendMessage(e.target.value)}
            placeholder="Hi Sarah, here's the proposal we discussed…"
            rows={3}
            style={{ ...inputStyle, resize: "vertical", fontFamily: "inherit" }}
          />
        </label>

        {sendError && (
          <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 8, padding: "8px 12px", color: "#991b1b", fontSize: 13, marginTop: 8 }}>
            {sendError}
          </div>
        )}

        {sendOk && (
          <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 8, padding: "8px 12px", color: "#166534", fontSize: 13, marginTop: 8, display: "flex", alignItems: "center", gap: 6 }}>
            <Check size={14} /> Sent.
          </div>
        )}

        <button
          onClick={onSend}
          disabled={sending || !sendTo}
          style={{
            display: "inline-flex", alignItems: "center", gap: 6,
            padding: "10px 18px", borderRadius: 10, border: "none",
            background: sending || !sendTo ? "#cbd5e1" : "linear-gradient(135deg, #4318ff, #7c3aed)",
            color: "white", fontSize: 13, fontWeight: 800, cursor: sending || !sendTo ? "not-allowed" : "pointer",
            marginTop: 12,
          }}
        >
          {sending ? <><Loader2 size={13} style={{ animation: "spin 0.9s linear infinite" }} /> Sending…</> : <><Send size={13} /> {wasSent ? "Resend" : "Send proposal"}</>}
        </button>
      </div>
    </div>
  );
}

function CenteredLoader({ text }: { text: string }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "2.5rem 1rem", color: "#64748b", gap: 12 }}>
      <Loader2 size={28} style={{ animation: "spin 0.9s linear infinite", color: "#ea580c" }} />
      <div style={{ fontSize: 14, fontWeight: 600, color: "#0f172a" }}>{text}</div>
    </div>
  );
}

function ErrorBox({ title, message, onRetry }: { title: string; message: string; onRetry: () => void }) {
  return (
    <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 10, padding: "1rem 1.25rem", color: "#991b1b" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, fontWeight: 700, marginBottom: 6 }}>
        <AlertCircle size={16} /> {title}
      </div>
      <div style={{ fontSize: 13, lineHeight: 1.5, marginBottom: 10 }}>{message}</div>
      <button onClick={onRetry} style={{ ...iconBtn, gap: 6 }}>
        <RefreshCw size={13} /> Try again
      </button>
    </div>
  );
}

const iconBtn: React.CSSProperties = {
  display: "inline-flex", alignItems: "center", gap: 6,
  padding: "6px 10px", borderRadius: 8,
  border: "1px solid #e2e8f0", background: "white",
  fontSize: "0.75rem", fontWeight: 700, color: "#475569",
  cursor: "pointer", textDecoration: "none",
};

const labelStyle: React.CSSProperties = {
  display: "flex", flexDirection: "column", gap: 6,
  fontSize: 12, fontWeight: 700, color: "#475569", marginBottom: 10,
  textTransform: "uppercase", letterSpacing: "0.04em",
};

const inputStyle: React.CSSProperties = {
  padding: "10px 12px", borderRadius: 8, border: "1px solid #cbd5e1",
  fontSize: 13, color: "#0f172a", outline: "none", textTransform: "none", letterSpacing: "normal",
  fontWeight: 500,
};
