"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Check, X } from "lucide-react";
import { CAMPAIGN_SERVICES, CAMPAIGN_NICHES } from "@/lib/campaign-taxonomy";

type Field = "service" | "niche" | "entityName" | "websiteUrl" | "funnelUrl" | "description";

type Props = {
  campaignId: string;
  coverColor: string;
  initial: Record<Field, string | null>;
};

const FIELD_LABELS: Record<Field, string> = {
  service: "Service",
  niche: "Niche",
  entityName: "Entity",
  websiteUrl: "Website",
  funnelUrl: "Funnel URL",
  description: "Description",
};

export function CampaignDetailsEditor({ campaignId, coverColor, initial }: Props) {
  const router = useRouter();
  const [values, setValues] = useState(initial);
  const [editing, setEditing] = useState<Field | null>(null);
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);

  function startEdit(f: Field) {
    setEditing(f);
    setDraft(values[f] ?? "");
  }

  async function save(f: Field) {
    setBusy(true);
    const body = { [f]: draft.trim() || null };
    const res = await fetch(`/api/campaigns/${campaignId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    setBusy(false);
    if (res.ok) {
      setValues({ ...values, [f]: draft.trim() || null });
      setEditing(null);
      router.refresh();
    }
  }

  const fields: Field[] = ["service", "niche", "entityName", "websiteUrl", "funnelUrl", "description"];

  return (
    <div className="card" style={{ padding: "1rem 1.25rem", marginBottom: "1.25rem" }}>
      <div style={{ fontSize: "0.72rem", textTransform: "uppercase", color: "var(--text-secondary)", letterSpacing: "0.05em", fontWeight: 700, marginBottom: "0.75rem" }}>
        Details
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "0.5rem 1.25rem" }}>
        {fields.map((f) => {
          const isEditing = editing === f;
          const isLong = f === "description";
          return (
            <div key={f} style={{ display: "flex", alignItems: "flex-start", gap: 8, padding: "0.4rem 0", borderBottom: "1px dashed var(--border-color)", gridColumn: isLong ? "1 / -1" : undefined }}>
              <div style={{ fontSize: "0.72rem", fontWeight: 700, color: "var(--text-secondary)", width: 90, flexShrink: 0, paddingTop: 4 }}>{FIELD_LABELS[f]}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                {isEditing ? (
                  <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                    {f === "service" || f === "niche" ? (
                      <select
                        value={draft}
                        onChange={(e) => setDraft(e.target.value)}
                        autoFocus
                        style={inputStyle}
                      >
                        <option value="">— None —</option>
                        {(f === "service" ? CAMPAIGN_SERVICES : CAMPAIGN_NICHES).map((o) => (
                          <option key={o} value={o}>{o}</option>
                        ))}
                      </select>
                    ) : isLong ? (
                      <textarea
                        value={draft}
                        onChange={(e) => setDraft(e.target.value)}
                        rows={3}
                        autoFocus
                        style={inputStyle}
                      />
                    ) : (
                      <input
                        value={draft}
                        onChange={(e) => setDraft(e.target.value)}
                        autoFocus
                        onKeyDown={(e) => { if (e.key === "Enter") save(f); if (e.key === "Escape") setEditing(null); }}
                        style={inputStyle}
                      />
                    )}
                    <button onClick={() => save(f)} disabled={busy} className="btn btn-primary" style={{ padding: "0.3rem 0.55rem", background: coverColor, borderColor: coverColor }}>
                      <Check size={12} />
                    </button>
                    <button onClick={() => setEditing(null)} className="btn btn-ghost" style={{ padding: "0.3rem 0.55rem" }}>
                      <X size={12} />
                    </button>
                  </div>
                ) : (
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <div style={{ fontSize: "0.85rem", color: values[f] ? "var(--text-primary)" : "var(--text-muted)", flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: isLong ? "normal" : "nowrap" }}>
                      {values[f] || "—"}
                    </div>
                    <button onClick={() => startEdit(f)} className="btn btn-ghost" style={{ padding: "0.25rem 0.45rem", fontSize: "0.7rem" }}>
                      <Pencil size={11} />
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  flex: 1,
  padding: "0.4rem 0.6rem",
  fontSize: "0.85rem",
  border: "1px solid var(--border-color)",
  borderRadius: 8,
  outline: "none",
  fontFamily: "inherit",
};
