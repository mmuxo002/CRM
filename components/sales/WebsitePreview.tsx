"use client";

import { useState } from "react";
import { Globe, ExternalLink, AlertTriangle, Smartphone, Monitor, X, Maximize2 } from "lucide-react";

interface WebsitePreviewProps {
  url: string;
  compact?: boolean;
}

function proxyUrl(original: string) {
  return `/api/site-proxy?url=${encodeURIComponent(original)}`;
}

export function WebsitePreview({ url, compact = false }: WebsitePreviewProps) {
  const [failed, setFailed] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalView, setModalView] = useState<"desktop" | "mobile">("desktop");

  const fullUrl = url.startsWith("http") ? url : `https://${url}`;
  const displayUrl = fullUrl.replace(/^https?:\/\//, "").replace(/\/$/, "");
  const proxied = proxyUrl(fullUrl);
  const mobileHeight = compact ? 400 : 500;

  return (
    <>
      <div style={{
        borderRadius: 10,
        border: "1px solid var(--border-color)",
        overflow: "hidden",
        marginBottom: compact ? 8 : 16,
      }}>
        {/* Header */}
        <div style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0.5rem 0.75rem",
          background: "#f8fafc",
          borderBottom: "1px solid var(--border-color)",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <Globe size={13} style={{ color: "#3b82f6" }} />
            <span style={{ fontWeight: 700, fontSize: compact ? "0.72rem" : "0.78rem", color: "var(--text-primary)" }}>
              Website Preview
            </span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <button
              onClick={() => { setModalView("desktop"); setModalOpen(true); }}
              style={{
                display: "flex", alignItems: "center", gap: 3,
                padding: "0.25rem 0.5rem", borderRadius: 6,
                border: "1px solid var(--border-color)", background: "var(--bg-surface)",
                fontSize: "0.65rem", fontWeight: 600, cursor: "pointer",
                color: "var(--text-secondary)",
              }}
              title="Preview in desktop mode"
            >
              <Maximize2 size={10} /> Desktop
            </button>
            <a
              href={fullUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: "flex", alignItems: "center", gap: 4,
                fontSize: "0.68rem", color: "#3b82f6",
                textDecoration: "none", fontWeight: 600,
              }}
            >
              {displayUrl.length > 28 ? displayUrl.slice(0, 28) + "…" : displayUrl}
              <ExternalLink size={10} />
            </a>
          </div>
        </div>

        {/* Mobile-style scrollable preview */}
        {failed ? (
          <FailedState fullUrl={fullUrl} height={200} />
        ) : (
          <div style={{ position: "relative", background: "#1a1a2e", padding: "12px 0", display: "flex", justifyContent: "center" }}>
            {/* Phone frame */}
            <div style={{
              width: compact ? 200 : 240,
              height: mobileHeight,
              borderRadius: 24,
              border: "3px solid #333",
              overflow: "hidden",
              background: "#fff",
              boxShadow: "0 8px 32px rgba(0,0,0,0.3)",
              position: "relative",
            }}>
              {/* Phone notch */}
              <div style={{
                position: "absolute", top: 0, left: "50%", transform: "translateX(-50%)",
                width: 60, height: 16, background: "#333",
                borderRadius: "0 0 12px 12px", zIndex: 2,
              }} />
              {/* Scrollable iframe */}
              <div style={{ width: "100%", height: "100%", overflow: "auto", WebkitOverflowScrolling: "touch" }}>
                <iframe
                  src={proxied}
                  title={`Mobile preview of ${displayUrl}`}
                  sandbox="allow-scripts allow-same-origin"
                  loading="lazy"
                  onError={() => setFailed(true)}
                  style={{
                    width: 1280,
                    height: 3000,
                    border: "none",
                    transform: `scale(${(compact ? 200 : 240) / 1280})`,
                    transformOrigin: "0 0",
                    display: "block",
                  }}
                />
              </div>
            </div>

            {/* Label */}
            <div style={{
              position: "absolute", bottom: 4, left: "50%", transform: "translateX(-50%)",
              display: "flex", alignItems: "center", gap: 4,
              fontSize: "0.6rem", color: "#ffffff88", fontWeight: 600,
            }}>
              <Smartphone size={10} /> Mobile Preview · Scroll to explore
            </div>
          </div>
        )}
      </div>

      {/* Desktop Modal */}
      {modalOpen && (
        <DesktopModal
          url={fullUrl}
          proxiedUrl={proxied}
          displayUrl={displayUrl}
          view={modalView}
          onViewChange={setModalView}
          onClose={() => setModalOpen(false)}
        />
      )}
    </>
  );
}

function DesktopModal({ url, proxiedUrl, displayUrl, view, onViewChange, onClose }: {
  url: string; proxiedUrl: string; displayUrl: string;
  view: "desktop" | "mobile"; onViewChange: (v: "desktop" | "mobile") => void;
  onClose: () => void;
}) {
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 200, display: "flex", flexDirection: "column" }}>
      {/* Backdrop */}
      <div onClick={onClose} style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.6)" }} />

      {/* Modal */}
      <div style={{
        position: "relative", zIndex: 1,
        margin: "24px auto", width: "calc(100vw - 80px)", maxWidth: 1400,
        flex: 1, display: "flex", flexDirection: "column",
        background: "var(--bg-surface)", borderRadius: 16,
        boxShadow: "0 20px 60px rgba(0,0,0,0.3)", overflow: "hidden",
      }}>
        {/* Toolbar */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "0.6rem 1rem",
          background: "#f8fafc", borderBottom: "1px solid var(--border-color)",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Globe size={14} style={{ color: "#3b82f6" }} />
            <span style={{ fontWeight: 700, fontSize: "0.82rem", color: "var(--text-primary)" }}>
              {displayUrl}
            </span>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            {/* View toggle */}
            <div style={{
              display: "flex", borderRadius: 8, overflow: "hidden",
              border: "1.5px solid var(--border-color)",
            }}>
              <button
                onClick={() => onViewChange("desktop")}
                style={{
                  display: "flex", alignItems: "center", gap: 3,
                  padding: "0.3rem 0.6rem", border: "none",
                  background: view === "desktop" ? "var(--accent-primary)" : "var(--bg-surface)",
                  color: view === "desktop" ? "white" : "var(--text-secondary)",
                  fontSize: "0.7rem", fontWeight: 600, cursor: "pointer",
                }}
              >
                <Monitor size={12} /> Desktop
              </button>
              <button
                onClick={() => onViewChange("mobile")}
                style={{
                  display: "flex", alignItems: "center", gap: 3,
                  padding: "0.3rem 0.6rem", border: "none",
                  borderLeft: "1px solid var(--border-color)",
                  background: view === "mobile" ? "var(--accent-primary)" : "var(--bg-surface)",
                  color: view === "mobile" ? "white" : "var(--text-secondary)",
                  fontSize: "0.7rem", fontWeight: 600, cursor: "pointer",
                }}
              >
                <Smartphone size={12} /> Mobile
              </button>
            </div>

            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: "flex", alignItems: "center", gap: 4,
                padding: "0.3rem 0.6rem", borderRadius: 8,
                background: "#3b82f6", color: "white",
                fontSize: "0.7rem", fontWeight: 600, textDecoration: "none",
              }}
            >
              <ExternalLink size={11} /> Open
            </a>

            <button
              onClick={onClose}
              style={{
                display: "flex", alignItems: "center", justifyContent: "center",
                width: 30, height: 30, borderRadius: 8,
                border: "1px solid var(--border-color)", background: "var(--bg-surface)",
                cursor: "pointer",
              }}
            >
              <X size={14} style={{ color: "var(--text-muted)" }} />
            </button>
          </div>
        </div>

        {/* Preview area */}
        <div style={{
          flex: 1, display: "flex", justifyContent: "center", alignItems: "flex-start",
          background: view === "mobile" ? "#1a1a2e" : "#fff",
          overflow: "auto",
          padding: view === "mobile" ? "24px" : 0,
        }}>
          {view === "desktop" ? (
            <iframe
              src={proxiedUrl}
              title={`Desktop preview of ${displayUrl}`}
              sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
              style={{ width: "100%", height: "100%", border: "none", display: "block" }}
            />
          ) : (
            /* Mobile view inside phone frame */
            <div style={{
              width: 375,
              height: 720,
              borderRadius: 36,
              border: "4px solid #333",
              overflow: "hidden",
              background: "#fff",
              boxShadow: "0 12px 48px rgba(0,0,0,0.4)",
              position: "relative",
              flexShrink: 0,
            }}>
              {/* Notch */}
              <div style={{
                position: "absolute", top: 0, left: "50%", transform: "translateX(-50%)",
                width: 80, height: 20, background: "#333",
                borderRadius: "0 0 14px 14px", zIndex: 2,
              }} />
              {/* Scrollable iframe scaled to look mobile */}
              <div style={{ width: "100%", height: "100%", overflow: "auto", WebkitOverflowScrolling: "touch" }}>
                <iframe
                  src={proxiedUrl}
                  title={`Mobile preview of ${displayUrl}`}
                  sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
                  style={{
                    width: 1280,
                    height: 4000,
                    border: "none",
                    transform: "scale(0.293)",
                    transformOrigin: "0 0",
                    display: "block",
                  }}
                />
              </div>
              {/* Home indicator */}
              <div style={{
                position: "absolute", bottom: 6, left: "50%", transform: "translateX(-50%)",
                width: 100, height: 4, borderRadius: 2, background: "#555",
              }} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function FailedState({ fullUrl, height }: { fullUrl: string; height: number }) {
  return (
    <div style={{
      height,
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
      gap: 8, background: "#fafafa", padding: "1rem",
    }}>
      <AlertTriangle size={24} style={{ color: "#f59e0b" }} />
      <p style={{ fontSize: "0.78rem", color: "var(--text-muted)", textAlign: "center", margin: 0, lineHeight: 1.5 }}>
        This website cannot be previewed inline.
      </p>
      <a
        href={fullUrl}
        target="_blank"
        rel="noopener noreferrer"
        style={{
          display: "inline-flex", alignItems: "center", gap: 5,
          padding: "0.4rem 0.8rem", borderRadius: 8,
          background: "#3b82f6", color: "#fff",
          fontSize: "0.75rem", fontWeight: 600, textDecoration: "none",
        }}
      >
        <ExternalLink size={12} /> Open in New Tab
      </a>
    </div>
  );
}
