export const SERVICE_TYPES = [
  { id: "WEBSITE_BUILD",    label: "Website Build",      color: "#3b82f6" },
  { id: "FORM_INTEGRATION", label: "Form Integration",   color: "#06b6d4" },
  { id: "CRM_INTEGRATION",  label: "CRM Integration",    color: "#7c3aed" },
  { id: "AUTOMATION",       label: "Automation",         color: "#a855f7" },
  { id: "VOICE_AI",         label: "Voice AI Agent",     color: "#ec4899" },
  { id: "LEAD_NURTURING",   label: "Lead Nurturing",     color: "#f59e0b" },
  { id: "EMAIL_MARKETING",  label: "Email Marketing",    color: "#10b981" },
] as const;

export function serviceTypeMeta(raw: string | null | undefined) {
  if (!raw) return { id: "OTHER", label: "Other", color: "#94a3b8" };
  const norm = raw.toUpperCase().replace(/[^A-Z0-9]/g, "_");
  const hit = SERVICE_TYPES.find((s) => s.id === norm);
  if (hit) return hit;
  // Heuristic match against seeded free-form values
  const r = raw.toLowerCase();
  if (r.includes("voice")) return SERVICE_TYPES.find((s) => s.id === "VOICE_AI")!;
  if (r.includes("website")) return SERVICE_TYPES.find((s) => s.id === "WEBSITE_BUILD")!;
  if (r.includes("form")) return SERVICE_TYPES.find((s) => s.id === "FORM_INTEGRATION")!;
  if (r.includes("nurtur")) return SERVICE_TYPES.find((s) => s.id === "LEAD_NURTURING")!;
  if (r.includes("email")) return SERVICE_TYPES.find((s) => s.id === "EMAIL_MARKETING")!;
  if (r.includes("automation") || r.includes("ghl")) return SERVICE_TYPES.find((s) => s.id === "AUTOMATION")!;
  if (r.includes("crm") || r.includes("setup")) return SERVICE_TYPES.find((s) => s.id === "CRM_INTEGRATION")!;
  return { id: "OTHER", label: raw, color: "#94a3b8" };
}

export const CRM_STAGES = [
  { id: "ONBOARDED", label: "New Client · Onboarded", short: "Onboarded", color: "#06b6d4" },
  { id: "SCOPING",   label: "Scoping",                short: "Scoping",   color: "#f59e0b" },
  { id: "BUILDING",  label: "Building",               short: "Building",  color: "#7c3aed" },
  { id: "REVIEW",    label: "In Review",              short: "Review",    color: "#a855f7" },
  { id: "LIVE",      label: "Live",                   short: "Live",      color: "#10b981" },
] as const;
export type CrmStage = typeof CRM_STAGES[number]["id"];
