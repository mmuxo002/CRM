"use client";

import { Bell, Clock } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

type Notification = {
  id: string;
  kind: string;
  title: string;
  body: string | null;
  teamId: string;
  createdAt: string;
  actor: { id: string; name: string | null; image: string | null } | null;
  project: { id: string; name: string; teamId: string; companyName: string | null } | null;
  lead: { id: string; name: string } | null;
};

const TEAM_COLOR: Record<string, string> = { APPS: "#4318ff", CRM: "#7c3aed", SALES: "#f59e0b", GLOBAL: "#94a3b8" };
const READ_KEY = "innovat3:notificationsReadAt";

function timeAgo(d: Date) {
  const ms = Date.now() - d.getTime();
  const m = Math.floor(ms / 60000);
  if (m < 1) return "now";
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  return `${Math.floor(h / 24)}d`;
}

function linkFor(n: Notification): string | null {
  if (n.project) return `/records/project/${n.project.id}`;
  if (n.lead) return `/prospecting`;
  return null;
}

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const [readAt, setReadAt] = useState<number>(0);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try {
      const v = window.localStorage.getItem(READ_KEY);
      setReadAt(v ? parseInt(v, 10) : 0);
    } catch {}
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      try {
        const r = await fetch("/api/notifications", { cache: "no-store" });
        if (!r.ok) return;
        const data = (await r.json()) as Notification[];
        if (!cancelled) setItems(data);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    const id = window.setInterval(load, 60_000);
    return () => { cancelled = true; window.clearInterval(id); };
  }, []);

  useEffect(() => {
    if (!open) return;
    function onDocClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    function onEsc(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("keydown", onEsc);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onEsc);
    };
  }, [open]);

  const unreadCount = items.filter((n) => new Date(n.createdAt).getTime() > readAt).length;

  function toggle() {
    const next = !open;
    setOpen(next);
    if (next) {
      const now = Date.now();
      try { window.localStorage.setItem(READ_KEY, String(now)); } catch {}
      setReadAt(now);
    }
  }

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button
        type="button"
        className="notification-btn"
        onClick={toggle}
        aria-label="Notifications"
        aria-expanded={open}
        style={{ background: "transparent", border: 0, padding: 4, cursor: "pointer" }}
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span
            className="notification-dot"
            style={{
              minWidth: 16,
              height: 16,
              borderRadius: 999,
              top: -2,
              right: -4,
              fontSize: 10,
              fontWeight: 800,
              color: "#fff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "0 4px",
            }}
          >
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div
          role="menu"
          style={{
            position: "absolute",
            top: "calc(100% + 10px)",
            right: 0,
            width: 380,
            maxHeight: 480,
            background: "var(--bg-surface)",
            borderRadius: 14,
            boxShadow: "var(--shadow-hover)",
            border: "1px solid var(--border-color)",
            zIndex: 50,
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
          }}
        >
          <div style={{ padding: "0.8rem 1rem", borderBottom: "1px solid var(--border-color)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ fontSize: "0.9rem", fontWeight: 800 }}>Notifications</span>
            <span style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>{items.length} recent</span>
          </div>

          <div style={{ overflowY: "auto", flex: 1 }}>
            {loading && items.length === 0 && (
              <div style={{ padding: "1.25rem", fontSize: "0.8rem", color: "var(--text-muted)" }}>Loading…</div>
            )}
            {!loading && items.length === 0 && (
              <div style={{ padding: "1.5rem", textAlign: "center", fontSize: "0.85rem", color: "var(--text-muted)" }}>
                No activity yet.
              </div>
            )}
            {items.map((n) => {
              const color = TEAM_COLOR[n.teamId] || "#94a3b8";
              const href = linkFor(n);
              const createdAt = new Date(n.createdAt);
              const context = n.project?.companyName || n.project?.name || n.lead?.name || null;
              const content = (
                <div style={{ display: "flex", gap: "0.6rem", padding: "0.65rem 0.9rem", borderBottom: "1px solid var(--border-color)", cursor: href ? "pointer" : "default" }}>
                  <div style={{ position: "relative", flexShrink: 0 }}>
                    {n.actor?.image ? (
                      <img src={n.actor.image} alt="" style={{ width: 34, height: 34, borderRadius: "50%" }} />
                    ) : (
                      <div style={{ width: 34, height: 34, borderRadius: "50%", background: "#e2e8f0", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.7rem", fontWeight: 800, color: "#64748b" }}>
                        {(n.actor?.name || "S").slice(0, 1).toUpperCase()}
                      </div>
                    )}
                    <span style={{ position: "absolute", bottom: -1, right: -1, width: 10, height: 10, borderRadius: "50%", background: color, border: "2px solid var(--bg-surface)" }} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: "0.8rem" }}>
                      <span style={{ fontWeight: 700 }}>{n.actor?.name || "System"}</span>
                      {context && <span style={{ color: "var(--text-muted)" }}> · {context}</span>}
                    </div>
                    <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{n.title}</div>
                  </div>
                  <span style={{ fontSize: "0.65rem", color: "var(--text-muted)", whiteSpace: "nowrap", display: "flex", alignItems: "center", gap: 3, flexShrink: 0 }}>
                    <Clock size={9} /> {timeAgo(createdAt)}
                  </span>
                </div>
              );
              return href ? (
                <Link key={n.id} href={href} onClick={() => setOpen(false)} style={{ color: "inherit" }}>
                  {content}
                </Link>
              ) : (
                <div key={n.id}>{content}</div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
