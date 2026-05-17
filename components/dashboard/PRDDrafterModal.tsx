"use client";

import { useState } from "react";
import { X, FileText, Upload, Sparkles, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";

type TeamMember = { id: string; name: string | null; email: string | null };

export function PRDDrafterModal({
  open,
  onClose,
  team,
  managers,
}: {
  open: boolean;
  onClose: () => void;
  team: "APPS" | "CRM";
  managers: TeamMember[];
}) {
  const router = useRouter();
  const [step, setStep] = useState<"input" | "review">("input");
  const [projectName, setProjectName] = useState("");
  const [input, setInput] = useState("");
  const [prd, setPrd] = useState("");
  const [pmId, setPmId] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!open) return null;

  function reset() {
    setStep("input");
    setProjectName("");
    setInput("");
    setPrd("");
    setPmId("");
    setError(null);
    setLoading(false);
  }

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    setInput(text);
  }

  async function generate() {
    setError(null);
    if (input.trim().length < 10) {
      setError("Please provide at least 10 characters of source material.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/prd/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ input, projectName: projectName || undefined }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to generate PRD");
      setPrd(data.prd);
      setStep("review");
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function save() {
    setError(null);
    if (!projectName.trim()) {
      setError("Project name is required.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/projects/create-from-prd", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: projectName, prd, projectManagerId: pmId || null, teamId: team }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save project");
      reset();
      onClose();
      router.refresh();
    } catch (e: any) {
      setError(e.message);
      setLoading(false);
    }
  }

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,0.55)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", padding: "1.5rem" }} onClick={() => !loading && onClose()}>
      <div
        onClick={(e) => e.stopPropagation()}
        style={{ background: "white", borderRadius: 16, width: "min(860px, 100%)", maxHeight: "92vh", display: "flex", flexDirection: "column", boxShadow: "0 30px 60px rgba(0,0,0,0.3)" }}
      >
        <div style={{ padding: "1.25rem 1.5rem", borderBottom: "1px solid var(--border-color)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: "linear-gradient(135deg, #4318ff, #06b6d4)", color: "white", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <FileText size={18} />
            </div>
            <div>
              <div style={{ fontWeight: 800, fontSize: "1rem" }}>PRD Drafter</div>
              <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                {step === "input" ? "Paste text or upload a doc, then generate" : "Review the PRD, then save as a project"}
              </div>
            </div>
          </div>
          <button onClick={onClose} disabled={loading} style={{ background: "transparent", border: "none", cursor: "pointer", color: "var(--text-muted)" }}><X size={20} /></button>
        </div>

        <div style={{ padding: "1.25rem 1.5rem", overflowY: "auto", flex: 1 }}>
          {step === "input" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div>
                <label style={{ fontSize: "0.8rem", fontWeight: 700, color: "var(--text-secondary)", marginBottom: 6, display: "block" }}>Project name (optional — included in PRD)</label>
                <input
                  type="text"
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  placeholder="e.g., Customer Onboarding Portal"
                  style={{ width: "100%", padding: "0.65rem 0.8rem", border: "1px solid var(--border-color)", borderRadius: 8, fontSize: "0.9rem" }}
                />
              </div>
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                  <label style={{ fontSize: "0.8rem", fontWeight: 700, color: "var(--text-secondary)" }}>Source material</label>
                  <label style={{ fontSize: "0.75rem", color: "#4318ff", fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}>
                    <Upload size={12} /> Upload .txt / .md
                    <input type="file" accept=".txt,.md,text/plain,text/markdown" style={{ display: "none" }} onChange={handleFileUpload} />
                  </label>
                </div>
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Paste notes, a brief, or upload a document. Claude will structure it into a full PRD."
                  rows={12}
                  style={{ width: "100%", padding: "0.75rem 0.9rem", border: "1px solid var(--border-color)", borderRadius: 8, fontSize: "0.85rem", fontFamily: "inherit", resize: "vertical" }}
                />
              </div>
              {error && <div style={{ color: "#ef4444", fontSize: "0.85rem" }}>{error}</div>}
            </div>
          )}

          {step === "review" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div>
                <label style={{ fontSize: "0.8rem", fontWeight: 700, color: "var(--text-secondary)", marginBottom: 6, display: "block" }}>Project name *</label>
                <input
                  type="text"
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  placeholder="Project name"
                  style={{ width: "100%", padding: "0.65rem 0.8rem", border: "1px solid var(--border-color)", borderRadius: 8, fontSize: "0.9rem" }}
                />
              </div>
              <div>
                <label style={{ fontSize: "0.8rem", fontWeight: 700, color: "var(--text-secondary)", marginBottom: 6, display: "block" }}>Assign Project Manager</label>
                <select
                  value={pmId}
                  onChange={(e) => setPmId(e.target.value)}
                  style={{ width: "100%", padding: "0.65rem 0.8rem", border: "1px solid var(--border-color)", borderRadius: 8, fontSize: "0.9rem", background: "white" }}
                >
                  <option value="">— Unassigned —</option>
                  {managers.map((m) => (
                    <option key={m.id} value={m.id}>{m.name || m.email || m.id}</option>
                  ))}
                </select>
              </div>
              <div>
                <label style={{ fontSize: "0.8rem", fontWeight: 700, color: "var(--text-secondary)", marginBottom: 6, display: "block" }}>PRD (edit freely)</label>
                <textarea
                  value={prd}
                  onChange={(e) => setPrd(e.target.value)}
                  rows={18}
                  style={{ width: "100%", padding: "0.75rem 0.9rem", border: "1px solid var(--border-color)", borderRadius: 8, fontSize: "0.8rem", fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace", resize: "vertical" }}
                />
              </div>
              {error && <div style={{ color: "#ef4444", fontSize: "0.85rem" }}>{error}</div>}
            </div>
          )}
        </div>

        <div style={{ padding: "1rem 1.5rem", borderTop: "1px solid var(--border-color)", display: "flex", justifyContent: "space-between", alignItems: "center", gap: "0.75rem" }}>
          {step === "review" ? (
            <button onClick={() => setStep("input")} disabled={loading} className="btn btn-ghost">← Back</button>
          ) : <div />}
          <div style={{ display: "flex", gap: "0.5rem" }}>
            <button onClick={onClose} disabled={loading} className="btn btn-ghost">Cancel</button>
            {step === "input" ? (
              <button onClick={generate} disabled={loading || input.trim().length < 10} className="btn btn-primary" style={{ background: "linear-gradient(135deg, #4318ff, #06b6d4)", borderColor: "transparent" }}>
                {loading ? <><Loader2 size={14} className="spin" /> Generating…</> : <><Sparkles size={14} /> Generate PRD</>}
              </button>
            ) : (
              <button onClick={save} disabled={loading || !projectName.trim()} className="btn btn-primary" style={{ background: "linear-gradient(135deg, #4318ff, #06b6d4)", borderColor: "transparent" }}>
                {loading ? <><Loader2 size={14} className="spin" /> Saving…</> : "Save Project"}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
