"use client";

import { signOut, useSession } from "next-auth/react";
import Link from "next/link";
import { ChevronDown, LogOut, Shield } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useTimeTracker, TimeTrackerPanel, SessionSummaryModal, phaseColor } from "@/components/sales/SalesTimeTracker";

export function ProfileMenu() {
  const { data: session } = useSession();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const tracker = useTimeTracker();

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

  if (!session) {
    return (
      <Link href="/api/auth/signin" className="btn btn-primary" style={{ padding: "0.4rem 1rem" }}>
        Sign In
      </Link>
    );
  }

  const user = session.user as { id?: string; name?: string | null; email?: string | null; image?: string | null; role?: string };
  const image = user.image || `https://i.pravatar.cc/100?u=${user.email}`;
  const isAdmin = user.role === "ADMIN";

  const showRing = tracker.enabled && (tracker.phase === "WORKING" || tracker.phase === "ON_BREAK" || tracker.phase === "INACTIVE_BREAK");
  const ringColor = phaseColor(tracker.phase);

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button
        type="button"
        className="profile-dropdown"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        style={{ background: "transparent", border: 0, padding: 0 }}
      >
        <div
          className={`avatar-wrap ${showRing ? "avatar-ring" : ""}`}
          style={showRing ? ({ ["--ring-color" as string]: ringColor } as React.CSSProperties) : undefined}
        >
          <div className="profile-avatar">
            <img src={image} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          </div>
        </div>
        <span>{user.name}</span>
        <ChevronDown size={16} color="var(--text-secondary)" />
      </button>

      {open && (
        <div
          role="menu"
          style={{
            position: "absolute",
            top: "calc(100% + 10px)",
            right: 0,
            width: 320,
            background: "var(--bg-surface)",
            borderRadius: 14,
            boxShadow: "var(--shadow-hover)",
            border: "1px solid var(--border-color)",
            zIndex: 50,
            overflow: "hidden",
          }}
        >
          <div style={{ padding: "0.85rem 1rem", borderBottom: "1px solid var(--border-color)" }}>
            <div style={{ fontSize: "0.88rem", fontWeight: 800, color: "var(--text-primary)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
              {user.name || "—"}
            </div>
            <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
              {user.email}
            </div>
          </div>

          {tracker.enabled && (
            <TimeTrackerPanel
              state={tracker.state}
              phase={tracker.phase}
              liveDisplay={tracker.liveDisplay}
              loading={tracker.loading}
              error={tracker.error}
              onStart={tracker.startDay}
              onBreak={tracker.onBreakClick}
              onEnd={tracker.onEndSession}
              onViewSummary={() => { setOpen(false); tracker.setShowSummary(tracker.state); }}
            />
          )}

          {isAdmin && (
            <Link
              href="/admin/users"
              onClick={() => setOpen(false)}
              style={{ display: "flex", alignItems: "center", gap: 10, padding: "0.65rem 1rem", fontSize: "0.85rem", color: "var(--text-primary)", borderBottom: "1px solid var(--border-color)" }}
            >
              <Shield size={15} />
              Team management
            </Link>
          )}

          <button
            type="button"
            onClick={() => { setOpen(false); signOut({ callbackUrl: "/login" }); }}
            style={{ width: "100%", display: "flex", alignItems: "center", gap: 10, padding: "0.7rem 1rem", fontSize: "0.85rem", color: "#ef4444", background: "transparent", border: 0, cursor: "pointer", textAlign: "left", fontWeight: 600 }}
          >
            <LogOut size={15} />
            Sign out
          </button>
        </div>
      )}

      {tracker.showSummary && (
        <SessionSummaryModal payload={tracker.showSummary} onClose={() => tracker.setShowSummary(null)} />
      )}
    </div>
  );
}
