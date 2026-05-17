// Stage 2: structured proposal copy via Claude Opus + JSON schema output.
// Extracted from src/app/api/leads/[id]/proposal/route.ts so the pipeline can
// invoke it directly (no internal HTTP fetch).

import type { Lead, Persona, Company, SalesProject } from "@prisma/client";
import { requireAnthropic, extractText } from "./anthropic";
import { proposalPrompt } from "@/lib/sales/ai-prompts";
import {
  PROPOSAL_JSON_SCHEMA,
  type ProposalJSON,
} from "@/lib/sales/proposal-schema";
import type { CompetitorResearchJSON } from "@/lib/sales/ai-prompts";

// Mirror of the catalog/bundles used by the existing generation route. Inlined
// so this module is self-contained.
export const SERVICE_CATALOG = [
  { id: "landing-page", name: "Landing Page", price: "$800", monthly: null, category: "Digital Presence", description: "Custom landing page built in 32 hours — mobile responsive, SEO foundation, and lead capture forms." },
  { id: "website-redesign", name: "Website Redesign", price: "$1,000 – $2,500", monthly: null, category: "Digital Presence", description: "Modernize existing website with updated design, faster load times, and conversion optimization." },
  { id: "crm-platform", name: "CRM Platform", price: "$1,500 setup", monthly: "$250/mo", category: "Operations", description: "Full CRM implementation — lead tracking, pipeline management, conversion workflows, form automation, and triggers. Includes a custom landing page." },
  { id: "google-business", name: "Google My Business", price: "$350", monthly: null, category: "Local SEO", description: "Full Google Business Profile optimization — photos, descriptions, categories, and review strategy." },
  { id: "phone-integration", name: "Phone System Integration", price: "$500 setup", monthly: "$99/mo", category: "Automation", description: "Business phone system tied into CRM — call tracking, routing, and lead attribution." },
  { id: "review-mgmt", name: "Review Management", price: "$200 setup", monthly: "$99/mo", category: "Reputation", description: "Automated review requests, monitoring, and response management to build 5-star reputation." },
  { id: "sms-marketing", name: "SMS Marketing", price: "$300 setup", monthly: "$149/mo", category: "Marketing", description: "Automated text message campaigns — follow-ups, appointment reminders, and promotional blasts." },
  { id: "email-marketing", name: "Email Marketing", price: "$300 setup", monthly: "$149/mo", category: "Marketing", description: "Newsletter campaigns, drip sequences, and promotional emails to nurture your customer base." },
  { id: "voice-ai", name: "Voice AI Agent", price: "$750 setup", monthly: "$149/mo", category: "Automation", description: "AI-powered phone agent answers calls 24/7, qualifies leads, schedules appointments, and never misses a call." },
  { id: "social-media", name: "Social Media Marketing", price: "$300 setup", monthly: "$399/mo", category: "Marketing", description: "Content creation, scheduling, and community management across Instagram, Facebook, and LinkedIn." },
  { id: "seo", name: "SEO Package", price: "$500 setup", monthly: "$299/mo", category: "Local SEO", description: "Local SEO targeting — keyword optimization, citation building, and monthly performance reporting." },
  { id: "paid-ads", name: "Google/Meta Ads", price: "$500 setup", monthly: "$299/mo + ad spend", category: "Marketing", description: "Targeted ad campaigns on Google and Meta platforms with conversion tracking and optimization." },
];

export const BUNDLES = [
  { id: "starter", name: "Starter", tagline: "Get Online Fast", setup: 800, monthly: 0, includes: ["Custom landing page", "Mobile responsive design", "SEO foundation", "Lead capture forms"], services: ["landing-page"] },
  { id: "growth", name: "Growth", tagline: "Capture & Convert Leads", setup: 1500, monthly: 250, includes: ["Everything in Starter", "CRM platform setup", "Lead tracking & pipeline", "Form automation & triggers", "Google My Business optimization", "Phone system integration"], services: ["landing-page", "crm-platform", "google-business", "phone-integration"] },
  { id: "accelerate", name: "Accelerate", tagline: "Automate & Scale", setup: 2800, monthly: 499, includes: ["Everything in Growth", "Review management", "SMS marketing", "Email marketing", "Voice AI agent"], services: ["landing-page", "crm-platform", "google-business", "phone-integration", "review-mgmt", "sms-marketing", "email-marketing", "voice-ai"] },
  { id: "dominate", name: "Dominate", tagline: "Full-Stack Growth", setup: 4200, monthly: 899, includes: ["Everything in Accelerate", "Social media marketing", "SEO package", "Google/Meta ads management", "Dedicated account manager"], services: ["landing-page", "crm-platform", "google-business", "phone-integration", "review-mgmt", "sms-marketing", "email-marketing", "voice-ai", "social-media", "seo", "paid-ads"] },
];

function safeJsonParse<T>(str: string | null | undefined, fallback: T): T {
  if (!str) return fallback;
  try { return JSON.parse(str) as T; } catch { return fallback; }
}

export type LeadWithRelations = Lead & {
  company: Company | null;
  persona: Persona | null;
  salesProject: SalesProject | null;
};

/**
 * Generate the full structured ProposalJSON for a Lead. If competitor research
 * is provided, we append a synthesized brief to the prompt so the model can
 * reference it in the situation/value-pillar sections.
 */
export async function generateProposalCopy(
  lead: LeadWithRelations,
  competitorResearch: CompetitorResearchJSON | null,
): Promise<ProposalJSON> {
  const client = requireAnthropic();

  const recommendedServices = safeJsonParse<Array<{ name: string; tier?: string; reason?: string } | string>>(
    lead.recommendedServices,
    []
  ).map((s) => (typeof s === "string" ? { name: s } : s));

  const persona = lead.persona ? {
    businessSummary: lead.persona.businessSummary,
    decisionMakerName: lead.persona.decisionMakerName,
    decisionMakerTitle: lead.persona.decisionMakerTitle,
    decisionMakerStyle: lead.persona.decisionMakerStyle,
    painPoints: safeJsonParse<string[]>(lead.persona.painPoints, []),
    opportunities: safeJsonParse<string[]>(lead.persona.opportunities, []),
    competitors: safeJsonParse<string[]>(lead.persona.competitors, []),
    challenges: safeJsonParse<string[]>(lead.persona.challenges, []),
    toolsUsed: safeJsonParse<string[]>(lead.persona.toolsUsed, []),
    digitalPresence: lead.persona.digitalPresence,
  } : null;

  let prompt = proposalPrompt({
    lead: {
      name: lead.name,
      email: lead.email,
      phone: lead.phone,
      title: lead.title,
      website: lead.website,
      address: lead.address,
      location: lead.location,
      instagramHandle: lead.instagramHandle,
      linkedinUrl: lead.linkedinUrl,
      facebookUrl: lead.facebookUrl,
      twitterHandle: lead.twitterHandle,
      googleRating: lead.googleRating,
      googleReviewCount: lead.googleReviewCount,
      qualificationScore: lead.qualificationScore,
      summary: lead.summary,
    },
    company: { name: lead.company?.name ?? null, industry: lead.company?.industry ?? null },
    niche: lead.salesProject?.niche || lead.company?.industry || "(unspecified)",
    targetLocation: lead.salesProject?.targetLocation || lead.address || lead.location || "(unspecified)",
    persona,
    recommendedServices,
    serviceCatalog: SERVICE_CATALOG,
    bundles: BUNDLES,
  });

  // Append competitive intel so it lands in the situation analysis + value pillars.
  if (competitorResearch && competitorResearch.competitors.length > 0) {
    prompt += `

═══════════════════════════════════════════════════════════════
COMPETITIVE INTELLIGENCE (fresh — gathered via web search)
═══════════════════════════════════════════════════════════════
${competitorResearch.summary}

Real competitors and how they're winning vs. this prospect:
${competitorResearch.competitors.map((c) => `
  ${c.name}${c.url ? ` (${c.url})` : ""}
    Strengths: ${c.strengths.join("; ")}
    Weaknesses: ${c.weaknesses.join("; ")}
    Why winning: ${c.whyOutperforming}
    Our angle: ${c.innovat3Angle}`).join("\n")}

USE this intel to: (1) sharpen the situation summary so it acknowledges the competitive reality, (2) ground the value pillars in concrete gaps INNOVAT3 closes vs. these specific competitors, (3) make the ROI projection believable by referencing what a competitor's win actually costs the prospect.`;
  }

  // .stream() + finalMessage() — see rend3r.ts for the rationale (SDK's
  // 10-min non-streaming cap). Same response shape, just bypasses the limit.
  const stream = client.messages.stream({
    // Sonnet 4.6 handles structured-output generation reliably; the JSON schema
    // does most of the constraint work. Adaptive thinking dropped — schema-bound
    // output doesn't benefit much from it and it ~doubles input cost.
    model: "claude-sonnet-4-6",
    max_tokens: 16000,
    output_config: {
      format: { type: "json_schema", schema: PROPOSAL_JSON_SCHEMA as unknown as Record<string, unknown> },
    },
    messages: [{ role: "user", content: prompt }],
  });
  const response = await stream.finalMessage();

  const text = extractText(response);
  if (!text) throw new Error("Model returned no text for proposal copy");
  return JSON.parse(text) as ProposalJSON;
}
