"use client";

import { useState, useEffect, useRef } from "react";
import { Share2, ExternalLink, AtSign, Link2, Globe } from "lucide-react";
// Aliases for removed brand icons
const Instagram = Share2;
const Linkedin = Link2;
const Facebook = Globe;
const Twitter = AtSign;

interface SocialMediaPreviewProps {
  instagramHandle?: string | null;
  facebookUrl?: string | null;
  twitterHandle?: string | null;
  linkedinUrl?: string | null;
  compact?: boolean;
}

type Platform = "instagram" | "facebook" | "twitter" | "linkedin";

export function SocialMediaPreview({
  instagramHandle,
  facebookUrl,
  twitterHandle,
  linkedinUrl,
  compact = false,
}: SocialMediaPreviewProps) {
  const available: { platform: Platform; label: string; url: string; icon: typeof Instagram; color: string }[] = [];

  if (instagramHandle) {
    const handle = instagramHandle.replace(/^@/, "").replace(/^https?:\/\/(www\.)?instagram\.com\//, "").replace(/\/$/, "");
    available.push({
      platform: "instagram",
      label: `@${handle}`,
      url: `https://www.instagram.com/${handle}/`,
      icon: Instagram,
      color: "#E4405F",
    });
  }
  if (facebookUrl) {
    available.push({
      platform: "facebook",
      label: "Facebook",
      url: facebookUrl.startsWith("http") ? facebookUrl : `https://${facebookUrl}`,
      icon: Facebook,
      color: "#1877F2",
    });
  }
  if (twitterHandle) {
    const handle = twitterHandle.replace(/^@/, "").replace(/^https?:\/\/(www\.)?(twitter|x)\.com\//, "").replace(/\/$/, "");
    available.push({
      platform: "twitter",
      label: `@${handle}`,
      url: `https://x.com/${handle}`,
      icon: Twitter,
      color: "#000000",
    });
  }
  if (linkedinUrl) {
    available.push({
      platform: "linkedin",
      label: "LinkedIn",
      url: linkedinUrl.startsWith("http") ? linkedinUrl : `https://${linkedinUrl}`,
      icon: Linkedin,
      color: "#0077B5",
    });
  }

  const [activeTab, setActiveTab] = useState<Platform | null>(available.length > 0 ? available[0].platform : null);

  if (available.length === 0) return null;

  const active = available.find((a) => a.platform === activeTab) || available[0];
  const height = compact ? 280 : 380;

  return (
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
          <Share2 size={13} style={{ color: "#8b5cf6" }} />
          <span style={{
            fontWeight: 700,
            fontSize: compact ? "0.72rem" : "0.78rem",
            color: "var(--text-primary)",
          }}>
            Social Media
          </span>
        </div>
        <a
          href={active.url}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 4,
            fontSize: "0.68rem",
            color: active.color,
            textDecoration: "none",
            fontWeight: 600,
          }}
        >
          {active.label}
          <ExternalLink size={10} />
        </a>
      </div>

      {/* Platform Tabs */}
      {available.length > 1 && (
        <div style={{
          display: "flex",
          gap: 0,
          borderBottom: "1px solid var(--border-color)",
          background: "#fafafa",
        }}>
          {available.map((p) => {
            const Icon = p.icon;
            const isActive = activeTab === p.platform;
            return (
              <button
                key={p.platform}
                onClick={() => setActiveTab(p.platform)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 4,
                  padding: "0.4rem 0.65rem",
                  fontSize: "0.68rem",
                  fontWeight: 600,
                  cursor: "pointer",
                  border: "none",
                  borderBottom: isActive ? `2px solid ${p.color}` : "2px solid transparent",
                  background: isActive ? "#fff" : "transparent",
                  color: isActive ? p.color : "var(--text-muted)",
                }}
              >
                <Icon size={12} />
                {!compact && p.label}
              </button>
            );
          })}
        </div>
      )}

      {/* Embed Area */}
      <SocialEmbed platform={active.platform} url={active.url} height={height} />
    </div>
  );
}

function SocialEmbed({ platform, url, height }: { platform: Platform; url: string; height: number }) {
  // For Instagram, use the oEmbed iframe approach
  if (platform === "instagram") {
    const embedUrl = url.endsWith("/") ? `${url}embed` : `${url}/embed`;
    return (
      <div style={{ position: "relative", height, background: "#fff" }}>
        <iframe
          src={embedUrl}
          title="Instagram Profile"
          loading="lazy"
          sandbox="allow-scripts allow-same-origin allow-popups"
          style={{
            width: "100%",
            height: "100%",
            border: "none",
            display: "block",
          }}
        />
      </div>
    );
  }

  // For Facebook, use the Page Plugin
  if (platform === "facebook") {
    const encodedUrl = encodeURIComponent(url);
    const fbSrc = `https://www.facebook.com/plugins/page.php?href=${encodedUrl}&tabs=timeline&width=500&height=${height}&small_header=true&adapt_container_width=true&hide_cover=false&show_facepile=false`;
    return (
      <div style={{ position: "relative", height, background: "#fff" }}>
        <iframe
          src={fbSrc}
          title="Facebook Page"
          loading="lazy"
          sandbox="allow-scripts allow-same-origin allow-popups"
          style={{
            width: "100%",
            height: "100%",
            border: "none",
            display: "block",
          }}
          allow="encrypted-media"
        />
      </div>
    );
  }

  // For Twitter/X, use the embedded timeline
  if (platform === "twitter") {
    return <TwitterEmbed url={url} height={height} />;
  }

  // For LinkedIn, no embeddable widget exists - show a styled link-out card
  if (platform === "linkedin") {
    return (
      <div style={{
        height: Math.min(height, 160),
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 10,
        background: "#f0f7ff",
        padding: "1.5rem",
      }}>
        <div style={{
          width: 48,
          height: 48,
          borderRadius: 12,
          background: "#0077B5",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}>
          <Linkedin size={24} style={{ color: "#fff" }} />
        </div>
        <p style={{
          fontSize: "0.78rem",
          color: "var(--text-muted)",
          textAlign: "center",
          margin: 0,
        }}>
          LinkedIn does not support inline previews.
        </p>
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 5,
            padding: "0.4rem 0.8rem",
            borderRadius: 8,
            background: "#0077B5",
            color: "#fff",
            fontSize: "0.75rem",
            fontWeight: 600,
            textDecoration: "none",
          }}
        >
          <ExternalLink size={12} /> View LinkedIn Profile
        </a>
      </div>
    );
  }

  return null;
}

function TwitterEmbed({ url, height }: { url: string; height: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const [scriptLoaded, setScriptLoaded] = useState(false);

  useEffect(() => {
    // Load the Twitter widget script if not already present
    if (typeof window !== "undefined") {
      const existing = document.querySelector('script[src="https://platform.twitter.com/widgets.js"]');
      if (existing) {
        setScriptLoaded(true);
        return;
      }
      const script = document.createElement("script");
      script.src = "https://platform.twitter.com/widgets.js";
      script.async = true;
      script.onload = () => setScriptLoaded(true);
      document.body.appendChild(script);
    }
  }, []);

  useEffect(() => {
    if (scriptLoaded && ref.current && (window as any).twttr?.widgets) {
      (window as any).twttr.widgets.load(ref.current);
    }
  }, [scriptLoaded, url]);

  return (
    <div
      ref={ref}
      style={{
        height,
        overflowY: "auto",
        background: "#fff",
        padding: "0.5rem",
      }}
    >
      <a
        className="twitter-timeline"
        data-height={height - 16}
        data-chrome="noheader nofooter noborders transparent"
        href={url}
      >
        Loading posts...
      </a>
    </div>
  );
}
