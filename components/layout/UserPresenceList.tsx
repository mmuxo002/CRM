"use client";

import { useEffect, useState } from "react";

type PresenceUser = {
  id: string;
  name: string | null;
  email: string | null;
  image: string | null;
  role: string;
  status: "active" | "away" | "offline";
};

const STATUS_META: Record<PresenceUser["status"], { color: string; label: string }> = {
  active: { color: "#10b981", label: "Active" },
  away: { color: "#f59e0b", label: "Away" },
  offline: { color: "#94a3b8", label: "Offline" },
};

export function UserPresenceList({ department }: { department?: string | null }) {
  const [users, setUsers] = useState<PresenceUser[]>([]);

  useEffect(() => {
    let cancelled = false;
    const heartbeat = () => fetch("/api/presence", { method: "POST" }).catch(() => {});
    const url = department ? `/api/presence?department=${encodeURIComponent(department)}` : "/api/presence";
    const load = async () => {
      try {
        const res = await fetch(url);
        if (!res.ok) return;
        const data = await res.json();
        if (!cancelled && Array.isArray(data)) setUsers(data);
      } catch {}
    };
    heartbeat().then(load);
    const beatTimer = setInterval(heartbeat, 60_000);
    const pollTimer = setInterval(load, 60_000);
    return () => { cancelled = true; clearInterval(beatTimer); clearInterval(pollTimer); };
  }, [department]);

  if (users.length === 0) return null;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 2, padding: "0.25rem 0.5rem" }}>
      {users.map((u) => {
        const meta = STATUS_META[u.status];
        const initial = (u.name || u.email || "?").slice(0, 1).toUpperCase();
        return (
          <div key={u.id} title={`${u.name || u.email} · ${meta.label}`} style={{ display: "flex", alignItems: "center", gap: 8, padding: "0.4rem 0.5rem", borderRadius: 8 }}>
            <div style={{ position: "relative", flexShrink: 0 }}>
              {u.image ? (
                <img src={u.image} alt="" style={{ width: 24, height: 24, borderRadius: "50%", objectFit: "cover" }} />
              ) : (
                <div style={{ width: 24, height: 24, borderRadius: "50%", background: "#e2e8f0", color: "#64748b", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 800 }}>{initial}</div>
              )}
              <span style={{ position: "absolute", right: -1, bottom: -1, width: 9, height: 9, borderRadius: "50%", background: meta.color, border: "2px solid var(--bg-surface, white)" }} />
            </div>
            <div style={{ minWidth: 0, flex: 1 }}>
              <div style={{ fontSize: "0.8rem", fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{u.name || u.email}</div>
              <div style={{ fontSize: "0.65rem", color: meta.color, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.04em" }}>{meta.label}</div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
