"use client";

import { useState } from "react";
import {
  Globe, MapPin, Star, Share2, Search, Inbox,
  MessageCircle, Copy, Check, ChevronDown, ChevronUp,
} from "lucide-react";

export interface PresenceChannel {
  channel: string;
  status: "strong" | "adequate" | "weak" | "missing";
  observation: string;
  evidence?: string;
  talkingPoint: string;
}

interface Props {
  channels: PresenceChannel[] | null;
  // Fallback: old-style flat structure like { hasWebsite: true, websiteQuality: "basic", ... }
  legacy?: Record<string, any> | null;
}

const CHANNEL_ICONS: Record<string, React.ComponentType<any>> = {
  "website": Globe,
  "google business profile": MapPin,
  "google": MapPin,
  "reputation & reviews": Star,
  "reputation": Star,
  "reviews": Star,
  "social media": Share2,
  "social": Share2,
  "local seo & discoverability": Search,
  "seo": Search,
  "lead capture & follow-up": Inbox,
  "lead capture": Inbox,
  "lead follow-up": Inbox,
};

const STATUS_CONFIG: Record<PresenceChannel["status"], { color: string; label: string; bg: string }> = {
  strong:   { color: "#10b981", label: "Strong",   bg: "#ecfdf5" },
  adequate: { color: "#0ea5e9", label: "Adequate", bg: "#f0f9ff" },
  weak:     { color: "#f59e0b", label: "Weak",     bg: "#fffbeb" },
  missing:  { color: "#ef4444", label: "Missing",  bg: "#fef2f2" },
};

function iconFor(channel: string): React.ComponentType<any> {
  const key = channel.toLowerCase();
  for (const [k, icon] of Object.entries(CHANNEL_ICONS)) {
    if (key.includes(k)) return icon;
  }
  return Globe;
}

export function DigitalPresenceBreakdown({ channels, legacy }: Props) {
  // If we have the structured "channels" array, use it. Otherwise synthesize
  // from the legacy flat structure so we still render something useful.
  const effectiveChannels = channels && channels.length > 0
    ? channels
    : legacyToChannels(legacy);

  if (!effectiveChannels || effectiveChannels.length === 0) return null;

  const [expanded, setExpanded] = useState<number | null>(null);
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);

  const copy = (text: string, idx: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIdx(idx);
    setTimeout(() => setCopiedIdx(null), 1500);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      {effectiveChannels.map((ch, idx) => {
        const status = STATUS_CONFIG[ch.status] || STATUS_CONFIG.adequate;
        const Icon = iconFor(ch.channel);
        const isOpen = expanded === idx;

        return (
          <div key={idx} style={{
            borderRadius: 10,
            border: `1px solid ${status.color}30`,
            background: "#fff",
            overflow: "hidden",
          }}>
            <div
              onClick={() => setExpanded(isOpen ? null : idx)}
              style={{
                display: "flex", alignItems: "center", gap: 10,
                padding: "0.6rem 0.85rem", cursor: "pointer",
                background: isOpen ? status.bg : "transparent",
              }}
            >
              <div style={{
                width: 30, height: 30, borderRadius: 8,
                background: `${status.color}14`, color: status.color,
                display: "flex", alignItems: "center", justifyContent: "center",
                flexShrink: 0,
              }}>
                <Icon size={15} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 1 }}>
                  <span style={{ fontSize: "0.82rem", fontWeight: 700, color: "var(--text-primary)" }}>
                    {ch.channel}
                  </span>
                  <span style={{
                    padding: "1px 6px", borderRadius: 4,
                    fontSize: "0.58rem", fontWeight: 800,
                    background: `${status.color}14`, color: status.color,
                    textTransform: "uppercase", letterSpacing: "0.04em",
                  }}>
                    {status.label}
                  </span>
                </div>
                <div style={{
                  fontSize: "0.74rem", color: "var(--text-secondary)",
                  overflow: "hidden", textOverflow: "ellipsis",
                  whiteSpace: isOpen ? "normal" : "nowrap",
                  lineHeight: 1.4,
                }}>
                  {ch.observation}
                </div>
              </div>
              {isOpen
                ? <ChevronUp size={13} style={{ color: "var(--text-muted)", flexShrink: 0 }} />
                : <ChevronDown size={13} style={{ color: "var(--text-muted)", flexShrink: 0 }} />}
            </div>

            {isOpen && (
              <div style={{
                padding: "0.75rem 0.85rem",
                borderTop: `1px solid ${status.color}20`,
                background: "#fafafa",
                display: "flex", flexDirection: "column", gap: 10,
              }}>
                {ch.evidence && (
                  <div>
                    <div style={{ fontSize: "0.62rem", fontWeight: 800, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 3 }}>
                      Evidence
                    </div>
                    <div style={{ fontSize: "0.78rem", color: "var(--text-secondary)", lineHeight: 1.5 }}>
                      {ch.evidence}
                    </div>
                  </div>
                )}
                <div style={{
                  padding: "0.6rem 0.75rem", borderRadius: 8,
                  background: "#fff",
                  border: `1.5px solid ${status.color}40`,
                  position: "relative",
                }}>
                  <div style={{
                    display: "flex", alignItems: "center", gap: 5,
                    fontSize: "0.6rem", fontWeight: 800, color: status.color,
                    textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 4,
                  }}>
                    <MessageCircle size={10} /> Use This on the Call
                  </div>
                  <div style={{ fontSize: "0.82rem", color: "var(--text-primary)", lineHeight: 1.55, fontStyle: "italic" }}>
                    &ldquo;{ch.talkingPoint}&rdquo;
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); copy(ch.talkingPoint, idx); }}
                    style={{
                      position: "absolute", top: 6, right: 6,
                      background: "none", border: "none", cursor: "pointer",
                      display: "flex", alignItems: "center", gap: 3,
                      fontSize: "0.65rem", color: copiedIdx === idx ? "#10b981" : "var(--text-muted)",
                      fontWeight: 600,
                    }}
                  >
                    {copiedIdx === idx ? <><Check size={10} /> Copied</> : <><Copy size={10} /> Copy</>}
                  </button>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// Convert a legacy { hasWebsite: boolean, websiteQuality: "basic", ... } object
// into channel rows so old personas still render something meaningful.
function legacyToChannels(legacy: Record<string, any> | null | undefined): PresenceChannel[] {
  if (!legacy) return [];

  const rows: PresenceChannel[] = [];

  // Website
  if ("hasWebsite" in legacy || "websiteQuality" in legacy) {
    const quality = legacy.websiteQuality as string | undefined;
    const status: PresenceChannel["status"] =
      !legacy.hasWebsite ? "missing"
      : quality === "good" ? "strong"
      : quality === "basic" ? "adequate"
      : "weak";
    rows.push({
      channel: "Website",
      status,
      observation: !legacy.hasWebsite
        ? "No website detected — they're invisible to anyone searching for them."
        : `Website exists, quality looks ${quality ?? "unknown"}.`,
      talkingPoint: !legacy.hasWebsite
        ? "I looked you up online and couldn't find a website — is that intentional, or is it on the to-do list?"
        : "I took a quick look at your site — what's been the biggest pain keeping it updated?",
    });
  }

  // Google Business
  if ("hasGoogleBusiness" in legacy) {
    rows.push({
      channel: "Google Business Profile",
      status: legacy.hasGoogleBusiness ? "adequate" : "missing",
      observation: legacy.hasGoogleBusiness
        ? "Google Business Profile appears claimed."
        : "No Google Business Profile detected — missing the #1 local-search surface.",
      talkingPoint: legacy.hasGoogleBusiness
        ? "When's the last time you added photos or a post to your Google profile?"
        : "Most of your customers find you on Google Maps first — do you know what your Business Profile looks like there?",
    });
  }

  // Social media
  if (legacy.socialMedia) {
    const sm = legacy.socialMedia;
    const count = [sm.facebook, sm.instagram, sm.linkedin, sm.twitter].filter(Boolean).length;
    const status: PresenceChannel["status"] = count >= 3 ? "adequate" : count >= 1 ? "weak" : "missing";
    const present = [
      sm.facebook && "Facebook",
      sm.instagram && "Instagram",
      sm.linkedin && "LinkedIn",
      sm.twitter && "Twitter/X",
    ].filter(Boolean).join(", ") || "none";
    rows.push({
      channel: "Social Media",
      status,
      observation: `Found on: ${present}.`,
      talkingPoint: count === 0
        ? "I couldn't find you on any social platforms — is that by design or just not a priority yet?"
        : `I saw you on ${present.split(",")[0]} — are you driving real leads from it, or is it more of a billboard right now?`,
    });
  }

  // Booking
  if ("hasOnlineBooking" in legacy) {
    rows.push({
      channel: "Lead Capture & Follow-up",
      status: legacy.hasOnlineBooking ? "adequate" : "weak",
      observation: legacy.hasOnlineBooking
        ? "Online booking is in place."
        : "No online booking or scheduling widget detected.",
      talkingPoint: legacy.hasOnlineBooking
        ? "Walk me through what happens when someone books — who follows up, and how fast?"
        : "If someone wants to book with you at 9pm, what happens?",
    });
  }

  // SEO
  if ("seoPresence" in legacy) {
    const seo = legacy.seoPresence;
    const status: PresenceChannel["status"] =
      seo === "strong" ? "strong"
      : seo === "moderate" ? "adequate"
      : seo === "weak" ? "weak"
      : "missing";
    rows.push({
      channel: "Local SEO & Discoverability",
      status,
      observation: `SEO presence appears ${seo || "unknown"}.`,
      talkingPoint: "When someone in your city searches for what you do — where do you rank?",
    });
  }

  return rows;
}
