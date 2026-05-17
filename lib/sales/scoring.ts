// Qualification scoring (0-100) — higher score = bigger opportunity
// Leads WITH websites can still qualify for voice AI, appointments, etc.

import { getNicheMapping } from "./niche-config";

interface LeadData {
  website: string | null;
  googleRating: number | null;
  googleReviewCount: number | null;
  instagramHandle: string | null;
  linkedinUrl: string | null;
  facebookUrl: string | null;
  email: string | null;
  persona?: {
    digitalPresence: string | null;
  } | null;
}

interface QualificationResult {
  score: number;
  qualified: boolean;
  reason: string;
  breakdown: { signal: string; points: number }[];
  recommendedServices: { name: string; tier: "primary" | "secondary" | "nice-to-have"; reason: string }[];
}

const QUALIFICATION_THRESHOLD = 40;

export function qualifyLead(lead: LeadData, niche: string): QualificationResult {
  const breakdown: { signal: string; points: number }[] = [];
  let score = 0;

  let digitalPresence: any = {};
  if (lead.persona?.digitalPresence) {
    try { digitalPresence = JSON.parse(lead.persona.digitalPresence); } catch {}
  }

  // --- No website = biggest opportunity ---
  if (!lead.website) {
    score += 25;
    breakdown.push({ signal: "No website", points: 25 });
  } else {
    // Website EXISTS — check quality and missing features
    const quality = digitalPresence.websiteQuality || "unknown";
    if (quality === "outdated" || quality === "basic") {
      score += 12;
      breakdown.push({ signal: `Website is ${quality} — redesign opportunity`, points: 12 });
    }

    const hasBooking = digitalPresence.hasOnlineBooking === true;
    if (!hasBooking) {
      score += 15;
      breakdown.push({ signal: "No online booking/appointment system", points: 15 });
    }
  }

  // --- No Google Business Profile ---
  if (digitalPresence.hasGoogleBusiness === false) {
    score += 20;
    breakdown.push({ signal: "No Google Business Profile", points: 20 });
  }

  // --- Weak/no SEO ---
  const seoStrength = digitalPresence.seoPresence || "none";
  if (seoStrength === "none" || seoStrength === "weak") {
    score += 15;
    breakdown.push({ signal: `${seoStrength === "none" ? "No" : "Weak"} SEO presence`, points: 15 });
  }

  // --- No call handling / automation ---
  const hasCallHandling = digitalPresence.hasCallHandling === true;
  if (!hasCallHandling) {
    score += 10;
    breakdown.push({ signal: "No AI call handling or automation", points: 10 });
  }

  // --- Low reviews ---
  if (lead.googleReviewCount !== null && lead.googleReviewCount < 10) {
    score += 8;
    breakdown.push({ signal: `Few reviews (${lead.googleReviewCount})`, points: 8 });
  }

  // --- No social media ---
  const hasSocial = lead.instagramHandle || lead.linkedinUrl || lead.facebookUrl;
  if (!hasSocial) {
    score += 8;
    breakdown.push({ signal: "No social media presence", points: 8 });
  }

  // --- No email found ---
  if (!lead.email || lead.email === "") {
    score += 5;
    breakdown.push({ signal: "No contact email found", points: 5 });
  }

  // --- Niche bonus ---
  const nicheMapping = getNicheMapping(niche);
  if (nicheMapping.qualificationBonus > 0) {
    score += nicheMapping.qualificationBonus;
    breakdown.push({ signal: `High-value niche (${niche})`, points: nicheMapping.qualificationBonus });
  }

  score = Math.min(score, 100);
  const qualified = score >= QUALIFICATION_THRESHOLD;

  const topSignals = [...breakdown].sort((a, b) => b.points - a.points).slice(0, 3);
  const reason = qualified
    ? `Qualified (${score}/100): ${topSignals.map((s) => s.signal).join(", ")}`
    : `Not qualified (${score}/100): Score below ${QUALIFICATION_THRESHOLD} threshold`;

  // Build service recommendations — smarter, context-aware
  const services: QualificationResult["recommendedServices"] = [];

  // Always recommend based on gaps, not just niche defaults
  if (!lead.website) {
    services.push({ name: "Landing Page", tier: "primary", reason: "Business has no website — critical need" });
  } else {
    const quality = digitalPresence.websiteQuality || "unknown";
    if (quality === "outdated" || quality === "basic") {
      services.push({ name: "Website Redesign", tier: "primary", reason: `Current website is ${quality} — needs modernization` });
    }
  }

  if (!digitalPresence.hasOnlineBooking) {
    services.push({ name: "Appointment System", tier: "primary", reason: "No online booking — losing customers who want to book instantly" });
  }

  if (!hasCallHandling) {
    services.push({ name: "Voice AI Agent", tier: "primary", reason: "No AI call handling — missed calls = lost revenue" });
  }

  services.push({ name: "Lead Qualification Outreach", tier: "secondary", reason: "Automated follow-up to convert inquiries into appointments" });

  if (digitalPresence.hasGoogleBusiness === false) {
    services.push({ name: "Google Business Setup", tier: "primary", reason: "Missing local search visibility" });
  }

  if (!hasSocial) {
    services.push({ name: "Social Media Marketing", tier: "secondary", reason: "No social media presence detected" });
  }

  if (lead.googleReviewCount !== null && lead.googleReviewCount < 10) {
    services.push({ name: "Review Management", tier: "secondary", reason: "Needs reputation building" });
  }

  if (seoStrength === "none" || seoStrength === "weak") {
    services.push({ name: "SEO", tier: "secondary", reason: "Weak or no search presence" });
  }

  // Add remaining niche-specific nice-to-haves
  const tiers = nicheMapping.servicesTiers;
  for (const svc of tiers.niceToHave) {
    if (!services.some((s) => s.name === svc)) {
      services.push({ name: svc, tier: "nice-to-have", reason: `Optional enhancement for ${niche}` });
    }
  }

  return { score, qualified, reason, breakdown, recommendedServices: services };
}
