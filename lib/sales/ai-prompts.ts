// Claude prompt templates for all AI-powered phases

// Phase 3: Social enrichment fallback (when scraping finds nothing)
export function enrichmentPrompt(businessName: string, location: string, niche: string): string {
  return `You are a business research assistant. Given this business:
- Name: ${businessName}
- Location: ${location}
- Industry: ${niche}

Find or predict the most likely:
1. Contact email address (use common patterns like info@, contact@, or owner's name)
2. Instagram handle
3. LinkedIn company page URL

Respond in JSON only, no explanation:
{
  "email": "string or null",
  "instagram": "string or null (just the handle, no @)",
  "linkedin": "string or null (full URL)"
}`;
}

// Phase 4: Deep business research / persona generation
export function personaPrompt(
  businessName: string,
  location: string,
  niche: string,
  website: string | null,
  rating: number | null,
  reviewCount: number | null,
  hasEmail: boolean,
  hasSocial: boolean,
  sunbizInfo?: string | null,
  socialLinks?: {
    instagram?: string | null;
    linkedin?: string | null;
    facebook?: string | null;
    twitter?: string | null;
  },
  dbprInfo?: string | null,
): string {
  const sunbizBlock = sunbizInfo
    ? `\n${sunbizInfo}\nIMPORTANT: Use the officer/director names from the Sunbiz filing above as the actual decision maker name. This is verified public record data — prefer it over guessing.\n`
    : "";

  const dbprBlock = dbprInfo
    ? `\n${dbprInfo}\nIMPORTANT: The DBPR record above is verified public licensing data. If the license status is anything other than "Current" or "Active" (e.g. "Delinquent", "Null & Void", "Expired", "Suspended", "Revoked"), flag it as a pain point the rep can open with — regulatory risk is a legitimate talking point.\n`
    : "";

  const socialBlock = socialLinks
    ? `SOCIAL PROFILES DETECTED:
- Instagram: ${socialLinks.instagram || "NOT FOUND"}
- LinkedIn: ${socialLinks.linkedin || "NOT FOUND"}
- Facebook: ${socialLinks.facebook || "NOT FOUND"}
- Twitter/X: ${socialLinks.twitter || "NOT FOUND"}
`
    : "";

  return `You are a senior B2B business-intelligence analyst preparing a sales intelligence brief. Your audience is a sales rep who will call this business tomorrow. They need SPECIFIC, EVIDENCE-BACKED observations — not generic advice.

BUSINESS:
- Name: ${businessName}
- Location: ${location}
- Industry: ${niche}
- Website: ${website || "NONE"}
- Google Rating: ${rating ?? "Unknown"} (${reviewCount ?? 0} reviews)
- Email found: ${hasEmail ? "Yes" : "No"}
- Social media found: ${hasSocial ? "Yes" : "No"}
${socialBlock}${sunbizBlock}${dbprBlock}

═══════════════════════════════════════════════════════════════
SIGNALS YOU CAN USE (since we can't call them yet)
═══════════════════════════════════════════════════════════════
1. **Google / Google Business Profile** — rating, review count, activity, completeness
2. **Reputation** — what the review count + rating imply (volume vs. quality, recency)
3. **Social media** — presence on each platform, likely activity level
4. **Website** — existence, likely quality based on typical ${niche} operators at this scale
5. **Industry context** — what ${niche} businesses commonly complain about (think of the recurring threads on Reddit, industry forums, and trade publications for this niche)

Compare this business against the common ${niche} industry baseline. Where are they underperforming? Where might they be overperforming? Ground every observation in one of the signals above.

═══════════════════════════════════════════════════════════════
OUTPUT — STRICT JSON ONLY
═══════════════════════════════════════════════════════════════
{
  "businessSummary": "2-3 sentence overview of this specific business, who they likely serve, and their apparent scale/stage",

  "digitalPresence": {
    "hasWebsite": boolean,
    "websiteQuality": "good" | "basic" | "outdated" | "none",
    "hasOnlineBooking": boolean,
    "hasCallHandling": boolean,
    "hasGoogleBusiness": boolean,
    "socialMedia": { "facebook": boolean, "instagram": boolean, "linkedin": boolean, "twitter": boolean },
    "seoPresence": "strong" | "moderate" | "weak" | "none",
    "channels": [
      {
        "channel": "Website",
        "status": "strong" | "adequate" | "weak" | "missing",
        "observation": "One specific sentence about what the sales rep will find (or not find) here — e.g. 'WordPress site with no online-booking widget, likely built 2018-2020, no mobile-optimized CTA above the fold'",
        "evidence": "What signal you used — e.g. 'site URL present but no scheduling platform subdomain detected'",
        "talkingPoint": "An actual sentence the rep can say on the call — conversational, not robotic — that opens a conversation about this gap"
      },
      { "channel": "Google Business Profile", "status": "...", "observation": "...", "evidence": "Rating ${rating ?? "unknown"} with ${reviewCount ?? 0} reviews implies...", "talkingPoint": "..." },
      { "channel": "Reputation & Reviews", "status": "...", "observation": "...", "evidence": "...", "talkingPoint": "..." },
      { "channel": "Social Media", "status": "...", "observation": "Name the specific platforms present/missing; comment on activity likelihood", "evidence": "...", "talkingPoint": "..." },
      { "channel": "Local SEO & Discoverability", "status": "...", "observation": "...", "evidence": "...", "talkingPoint": "..." },
      { "channel": "Lead Capture & Follow-up", "status": "...", "observation": "...", "evidence": "...", "talkingPoint": "..." }
    ]
  },

  "decisionMakerName": "The actual owner/officer name from Sunbiz if available, otherwise best educated guess or null",
  "decisionMakerTitle": "Their title/role (e.g., President, Managing Member, Owner/Operator)",
  "decisionMakerStyle": "data-driven" | "relationship-focused" | "results-oriented" | "conservative",

  "painPoints": [
    {
      "category": "Website" | "Google" | "Reputation" | "Social" | "Lead Follow-up" | "Operations" | "Marketing" | "Industry",
      "title": "Short headline of the pain (6–10 words)",
      "observation": "What this business specifically has (or lacks) — 1 sentence",
      "industryContext": "What ${niche} operators commonly struggle with here — the 'Reddit thread' take — 1 sentence",
      "evidence": "The concrete signal: website/rating/review count/social-absence/etc.",
      "talkingPoint": "A conversational line the rep can use to surface this pain without sounding like a robot (15-25 words)",
      "severity": "critical" | "high" | "medium"
    }
    // Produce 5–7 of these. Every one must tie to a REAL signal above — no invented facts.
  ],

  "opportunities": [
    {
      "title": "Short headline of the opportunity",
      "solution": "What we'd actually do — 1 sentence",
      "linkedPainCategory": "Which pain point category this solves",
      "serviceId": "landing-page | website-redesign | crm-platform | google-business | phone-integration | review-mgmt | sms-marketing | email-marketing | voice-ai | social-media | seo | paid-ads | (or null if none fits)",
      "estimatedImpact": "1-sentence outcome the prospect would see (leads/mo, calls captured, review count, etc.)",
      "talkingPoint": "A conversational line the rep can use to propose the fix (15-25 words)"
    }
    // Produce 4–6 of these. Each should map to at least one pain point.
  ],

  "challenges": ["4-6 industry-specific challenges they face (short bullets, NOT the same as pain points — broader market/operational headwinds)"],
  "competitors": ["3-4 specific competitor types or names in this market"],
  "toolsUsed": ["4-6 tools/systems they likely use (booking, CRM, phone, etc.)"],
  "estimatedAge": "e.g., '2-3 years', '10+ years'",
  "demographics": "Brief description of their target customer demographics"
}

Hard rules:
- EVERY pain point and opportunity MUST cite a real signal in "evidence". If you don't have a signal, omit the item. Do not invent.
- TalkingPoints must sound like a human sales rep, not marketing copy. No "synergy", no "leverage", no "empower".
- If the business has a 4.8★ rating with 200+ reviews, DON'T say "bad reviews" — that's lying and the rep will get caught.
- Match observations to what a rep could actually see in 30 seconds of Googling them.`;
}

// Phase 6: Social intro generation
export function socialIntroPrompt(
  businessName: string,
  niche: string,
  location: string,
  painPoints: string[],
  recommendedServices: string[],
  platform: string
): string {
  const toneGuide: Record<string, string> = {
    INSTAGRAM: "casual, friendly, use emojis sparingly, keep it short (under 100 words)",
    LINKEDIN: "professional but warm, no emojis, focus on business value (under 150 words)",
    FACEBOOK: "conversational, community-oriented (under 120 words)",
    TWITTER: "very concise, punchy, under 280 characters for each message",
    SMS: "ultra casual, under 160 characters, text-message style",
  };

  return `You are a sales outreach specialist. Write a personalized ${platform} message to ${businessName}, a ${niche} business in ${location}.

Their pain points: ${painPoints.join(", ")}
Services we can offer: ${recommendedServices.join(", ")}

Tone: ${toneGuide[platform] || "professional and friendly"}

Write TWO messages:
1. INITIAL INTRO - Show genuine interest in their business, mention something specific
2. FOLLOW-UP (3-5 days later) - Reference the first message, offer specific value (free sample website, competitor analysis), no commitment needed

Respond in JSON:
{
  "intro": "the initial message",
  "followUp": "the follow-up message"
}`;
}

// Phase 6: Email outreach
export function emailOutreachPrompt(
  businessName: string,
  niche: string,
  location: string,
  contactName: string | null,
  service: string,
  painPoints: string[]
): string {
  return `Write a sales email for ${businessName} (${niche} in ${location}).
${contactName ? `Contact: ${contactName}` : ""}

Primary service to pitch: ${service}
Pain points: ${painPoints.join(", ")}

The email should:
- Subject line that gets opened (no spam triggers)
- Open with something relevant to their business
- Mention a specific pain point
- Position the service as the solution
- Offer a free sample/demo with no commitment
- Short, scannable, under 200 words

Also write a follow-up email for 5 days later.

Respond in JSON:
{
  "subject": "email subject line",
  "body": "email body (use \\n for line breaks)",
  "followUpSubject": "follow-up subject",
  "followUpBody": "follow-up body"
}`;
}

// Phase 7: Pre-call brief
export function preCallBriefPrompt(
  businessName: string,
  niche: string,
  location: string,
  persona: any,
  qualificationScore: number,
  recommendedServices: any[]
): string {
  return `Generate a pre-call sales brief for calling ${businessName}, a ${niche} in ${location}.

BUSINESS INTEL:
- Qualification Score: ${qualificationScore}/100
- Summary: ${persona?.businessSummary || "N/A"}
- Decision Maker: ${persona?.decisionMakerTitle || "Owner/Operator"} (style: ${persona?.decisionMakerStyle || "unknown"})
- Pain Points: ${JSON.stringify(persona?.painPoints || [])}
- Recommended Services: ${JSON.stringify(recommendedServices.map((s: any) => typeof s === "string" ? s : s.name))}

Generate a structured brief:

Respond in JSON:
{
  "headline": "One compelling line summarizing the opportunity",
  "talkingPoints": ["3-5 key talking points specific to this business"],
  "openingLines": ["2 opening lines - one consultative, one direct"],
  "qualificationQuestions": ["3 questions to ask during the call"],
  "recommendedServices": [{"name": "service", "tier": "primary|secondary", "reason": "why"}]
}`;
}

// Phase 8: Sales coaching
export function coachingPrompt(
  businessName: string,
  niche: string,
  persona: any,
  recommendedServices: any[],
  qualificationScore: number
): string {
  return `Generate a complete sales coaching package for calling ${businessName} (${niche}).

CONTEXT:
- Score: ${qualificationScore}/100
- Decision Maker Style: ${persona?.decisionMakerStyle || "unknown"}
- Pain Points: ${JSON.stringify(persona?.painPoints || [])}
- Services: ${JSON.stringify(recommendedServices.map((s: any) => typeof s === "string" ? s : s.name))}

Generate:

1. CALL SCRIPT: A conversational (not robotic) script with branching paths. Include:
   - Opening (reference something specific about their business)
   - Discovery questions
   - Value presentation
   - Closing / next steps

2. OBJECTION HANDLERS for these common objections:
   - "We already have a website/provider"
   - "It's too expensive"
   - "We're too busy right now"
   - "I need to think about it"
   - "Send me more information"

3. PRICING GUIDANCE: How to position pricing, anchor values, and handle budget discussions.

4. ROI PROJECTIONS: Estimated ROI they could expect from the recommended services.

Respond in JSON:
{
  "callScript": "the full call script (use \\n for formatting)",
  "objectionHandlers": "formatted objection handling guide (use \\n for formatting)",
  "pricingGuidance": "pricing positioning guide (use \\n for formatting)",
  "roiProjections": "ROI projection narrative (use \\n for formatting)"
}`;
}

// Full client proposal — JSON for copy-paste, plus a website-builder prompt
// when a website service is relevant. Output is constrained by proposal-schema.ts.
export function proposalPrompt(args: {
  lead: {
    name: string;
    email: string | null;
    phone: string | null;
    title: string | null;
    website: string | null;
    address: string | null;
    location: string | null;
    instagramHandle: string | null;
    linkedinUrl: string | null;
    facebookUrl: string | null;
    twitterHandle: string | null;
    googleRating: number | null;
    googleReviewCount: number | null;
    qualificationScore: number;
    summary: string | null;
  };
  company: { name: string | null; industry: string | null };
  niche: string;
  targetLocation: string;
  persona: {
    businessSummary: string | null;
    decisionMakerName: string | null;
    decisionMakerTitle: string | null;
    decisionMakerStyle: string | null;
    painPoints: string[];
    opportunities: string[];
    competitors: string[];
    challenges: string[];
    toolsUsed: string[];
    digitalPresence: string | null; // JSON blob from persona
  } | null;
  recommendedServices: Array<{ name: string; tier?: string; reason?: string }>;
  serviceCatalog: Array<{ id: string; name: string; category: string; price: string; monthly: string | null; description: string }>;
  bundles: Array<{ id: string; name: string; tagline: string; setup: number; monthly: number; includes: string[]; services: string[] }>;
}): string {
  return `You are a senior sales consultant at INNOVAT3 Solutions, preparing a written proposal for a prospective client. Generate a complete, structured proposal in JSON and — only if a website build or redesign is clearly warranted — a detailed website-builder prompt that can be pasted directly into an AI website builder (v0, Lovable, Bolt, Claude Artifacts) to produce a high-fidelity landing-page design matching this client's business.

═══════════════════════════════════════════════════════════════
CLIENT INTEL
═══════════════════════════════════════════════════════════════
Contact: ${args.lead.name}${args.lead.title ? ` — ${args.lead.title}` : ""}
Email: ${args.lead.email || "—"}
Phone: ${args.lead.phone || "—"}
Company: ${args.company.name || args.lead.name} (${args.company.industry || args.niche})
Location: ${args.lead.address || args.lead.location || args.targetLocation}
Website: ${args.lead.website || "NO WEBSITE"}
Social presence:
  Instagram: ${args.lead.instagramHandle || "—"}
  LinkedIn: ${args.lead.linkedinUrl || "—"}
  Facebook: ${args.lead.facebookUrl || "—"}
  Twitter/X: ${args.lead.twitterHandle || "—"}
Google reviews: ${args.lead.googleRating ? `${args.lead.googleRating}★ (${args.lead.googleReviewCount || 0} reviews)` : "none"}
Qualification score: ${args.lead.qualificationScore}/100
AI summary: ${args.lead.summary || args.persona?.businessSummary || "(none)"}

${args.persona ? `DECISION MAKER
Name: ${args.persona.decisionMakerName || "(unknown)"}
Title: ${args.persona.decisionMakerTitle || "(unknown)"}
Communication style: ${args.persona.decisionMakerStyle || "(unknown)"}

PAIN POINTS (what we can solve)
${args.persona.painPoints.map((p) => `  • ${p}`).join("\n") || "  (none captured)"}

OPPORTUNITIES IDENTIFIED
${args.persona.opportunities.map((o) => `  • ${o}`).join("\n") || "  (none captured)"}

INDUSTRY CHALLENGES
${args.persona.challenges.map((c) => `  • ${c}`).join("\n") || "  (none captured)"}

LIKELY COMPETITORS
${args.persona.competitors.map((c) => `  • ${c}`).join("\n") || "  (none captured)"}

CURRENT TOOLS / STACK
${args.persona.toolsUsed.map((t) => `  • ${t}`).join("\n") || "  (none captured)"}

DIGITAL PRESENCE (JSON): ${args.persona.digitalPresence || "(none)"}
` : "No deep persona yet — use business summary + niche.\n"}
═══════════════════════════════════════════════════════════════
PREVIOUSLY-RECOMMENDED SERVICES
═══════════════════════════════════════════════════════════════
${args.recommendedServices.length > 0
  ? args.recommendedServices.map((s) => `  • ${s.name}${s.tier ? ` [${s.tier}]` : ""}${s.reason ? ` — ${s.reason}` : ""}`).join("\n")
  : "  (none)"}

═══════════════════════════════════════════════════════════════
INNOVAT3 SERVICE CATALOG (a la carte)
═══════════════════════════════════════════════════════════════
${args.serviceCatalog.map((s) => `  [${s.id}] ${s.name} — ${s.price}${s.monthly ? ` + ${s.monthly}` : ""} (${s.category})\n    ${s.description}`).join("\n\n")}

═══════════════════════════════════════════════════════════════
BUNDLE TIERS (strategic packages)
═══════════════════════════════════════════════════════════════
${args.bundles.map((b) => `  [${b.id}] ${b.name} — "${b.tagline}"\n    Setup: $${b.setup}${b.monthly > 0 ? `, Monthly: $${b.monthly}` : ""}\n    Includes: ${b.includes.join(", ")}\n    Service IDs: ${b.services.join(", ")}`).join("\n\n")}

═══════════════════════════════════════════════════════════════
YOUR TASK
═══════════════════════════════════════════════════════════════
Produce a proposal that a sales rep can hand the client. Base EVERY recommendation on the intel above — no generic fluff, no made-up facts about the business. If something is unknown, say so rather than inventing it.

Decision logic for the website-builder prompt:
  • Include a rich websiteBuilderPrompt IF: client has NO website, has an outdated/weak website, or any of the recommended services relate to web presence ("landing-page", "website-redesign", or similar).
  • Otherwise: set websiteBuilderPrompt to null.

When you DO produce the websiteBuilderPrompt, it must be a single long string, markdown-formatted, covering ALL of:
  1. Business context (name, industry, niche, location, single-sentence value prop)
  2. Target audience (demographics, the specific customer this client serves)
  3. Brand personality & tone (3–5 adjectives + 1 sentence of voice guidance, aligned to decision-maker style)
  4. Color palette (3–5 hex colors with rationale tied to industry norms)
  5. Typography direction (heading font family character + body font family character — describe feel, not exact font names)
  6. Page architecture — for a single-page landing page, list EVERY section in order with: section name, purpose, 1–2 line copy direction, CTA if relevant. Include at minimum: hero, trust/social proof, services/offerings, about, testimonials or reviews (seed with the actual Google-review count if present), FAQ, contact/booking form, footer.
  7. Hero section detail (headline, sub-headline, primary CTA text, imagery direction)
  8. Lead capture form fields tuned to this industry (e.g. auto dealer: make/model/trade-in; dentist: service-type/preferred-time; restaurant: party-size/date)
  9. Conversion goals & success metrics
  10. Technical requirements (mobile-first, fast LCP, accessibility, SEO meta)
  11. Integrations to wire in (Google Business, phone tracking, CRM webhook to their email, SMS)
  12. What NOT to include (cliché stock imagery, generic taglines, unnecessary sliders, etc.)
  13. Final instruction block — literally tell the AI builder: "Produce a complete, production-ready single-page HTML/React landing page. Use the exact palette and tone above. Do not add a blog, portfolio grid, or ecommerce features. Ship one opinionated best design, not options."

Keep prices honest — reference the service catalog prices verbatim where possible. The recommended bundle should genuinely fit the pain points; don't upsell Dominate to someone who needs Starter.`;
}

// ─── Competitor research (Phase 1 of the proposal pipeline) ───────────────────
//
// Asks Claude (with web_search tool enabled by the caller) to find 3 real
// competitors of the prospect, contrast them on the dimensions a sales rep
// actually cares about: where the competitor wins, why they're winning, and
// where INNOVAT3's services close the gap. Output is strict JSON.

export const COMPETITOR_RESEARCH_JSON_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["competitors", "summary"],
  properties: {
    competitors: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["name", "url", "strengths", "weaknesses", "whyOutperforming", "innovat3Angle"],
        properties: {
          name: { type: "string" },
          url: { type: ["string", "null"] },
          strengths: { type: "array", items: { type: "string" } },
          weaknesses: { type: "array", items: { type: "string" } },
          whyOutperforming: { type: "string" },
          innovat3Angle: { type: "string" },
        },
      },
    },
    summary: { type: "string" },
  },
} as const;

export type CompetitorResearchJSON = {
  competitors: Array<{
    name: string;
    url: string | null;
    strengths: string[];
    weaknesses: string[];
    whyOutperforming: string;
    innovat3Angle: string;
  }>;
  summary: string;
};

export function competitorResearchPrompt(args: {
  businessName: string;
  industry: string;
  location: string;
  website: string | null;
  ownStrengths: string[]; // from persona.opportunities + Google rating, etc.
  ownPainPoints: string[];
  knownCompetitors: string[]; // hints from persona.competitors
  serviceCatalogIds: string[]; // so the AI can map competitor weaknesses to our services
}): string {
  return `You are a competitive-intelligence analyst at INNOVAT3 Solutions. Use the web_search tool to find the **3 most relevant local/online competitors** of the prospect below, then write a sales-ready competitive brief.

═══════════════════════════════════════════════════════════════
PROSPECT
═══════════════════════════════════════════════════════════════
Business: ${args.businessName}
Industry: ${args.industry}
Location: ${args.location}
Website: ${args.website || "(no website)"}

What the prospect does well (their strengths / opportunities):
${args.ownStrengths.length ? args.ownStrengths.map((s) => `  • ${s}`).join("\n") : "  (none captured yet)"}

What the prospect struggles with (their pain points):
${args.ownPainPoints.length ? args.ownPainPoints.map((p) => `  • ${p}`).join("\n") : "  (none captured yet)"}

Hints (competitors the rep already mentioned, may be wrong/incomplete):
${args.knownCompetitors.length ? args.knownCompetitors.map((c) => `  • ${c}`).join("\n") : "  (none)"}

═══════════════════════════════════════════════════════════════
INNOVAT3 SERVICE LEVERS (map competitor weaknesses to these)
═══════════════════════════════════════════════════════════════
${args.serviceCatalogIds.join(", ")}

═══════════════════════════════════════════════════════════════
TASK
═══════════════════════════════════════════════════════════════
1. **Use web_search** to find 3 real competitors that are *plausibly winning the same customer* the prospect serves. Prefer local/regional rivals over national giants unless the prospect is national. If the prospect has no website, focus on Google-search and Google-Maps top results for the niche + location.

2. For each competitor, visit (search) their site and Google profile. Capture:
   - **name** and **url** (their actual website if you can find it)
   - **strengths** (3–5 bullets) — be specific: "schema-marked location pages on every service area", "review-acquisition flow that pushes Google reviews after every job", "branded photography on hero", "pricing transparency on landing page", "tap-to-call sticky bar on mobile". Generic bullets like "good website" are FAILURES.
   - **weaknesses** (2–4 bullets) — concrete UX, SEO, or operational gaps you can SEE. e.g. "no Spanish version despite serving a bilingual market", "slow LCP on mobile", "no after-hours capture form", "thin About page erodes trust".
   - **whyOutperforming** — one paragraph (3–5 sentences). Why is this competitor likely beating the prospect *for the customer they both want*? Tie it to specific things you observed.
   - **innovat3Angle** — one paragraph. Which INNOVAT3 services (cite the IDs from the catalog list above) close the gap, and exactly how. e.g. "Voice AI Agent + CRM Platform answers after-hours calls the competitor's static contact form misses." Be concrete.

3. Write a 3–5 sentence **summary** the sales rep can paraphrase on the call: who the prospect is up against, the single biggest gap, and the single highest-leverage move INNOVAT3 can make to close it.

Hard rules:
- **Real businesses only.** If web_search returns nothing credible, lower the count rather than fabricate. (You may return 1 or 2 competitors if that's all that's real.)
- **No marketing fluff.** Sales reps will get caught if you invent details.
- **Cite specifics, not vibes.** "Their hero loads in 1.2s with above-fold pricing" beats "they have a fast modern site".`;
}

// ─── Rend3r website-preview agent ──────────────────────────────────────────────
//
// System prompt for generating a single self-contained HTML file that renders
// like a finished, production-grade website wrapped in browser chrome. Used by
// the proposal pipeline to produce the *source of truth* mockup, which is then
// screenshotted by Puppeteer and (optionally) polished by gpt-image-1.
//
// Distilled from the Rend3r AI v1 spec — anti-patterns and quality bar enforced
// in-prompt so a single Claude call returns ship-quality HTML.

export function rend3rSystemPrompt(): string {
  return `You are **Rend3r AI**, the website-preview generation agent for INNOVAT3 Solutions.

Your sole job: produce a **single self-contained HTML file** that renders like a finished, photorealistic, production-grade website for the business described in the user message. The output goes directly to a prospective client as a "this is what your new site could look like" preview.

═══════════════════════════════════════════════════════════════
HARD OUTPUT CONTRACT
═══════════════════════════════════════════════════════════════
- Return **only the raw HTML**. No markdown fences, no commentary, no preface, no postscript. Your entire response must start with \`<!DOCTYPE html>\` and end with \`</html>\`.
- Single file. No external CSS/JS files. Only CDN imports allowed:
  • Tailwind CSS via \`<script src="https://cdn.tailwindcss.com"></script>\`
  • Google Fonts via \`<link>\`
  • Lucide icons via \`<script src="https://unpkg.com/lucide@latest"></script>\` (or inline SVG)
- Wrap the entire site in a **browser chrome frame**: traffic-light dots top-left, an address bar showing the business's real or inferred domain, refresh icon top-right. Sticky.
- Render at desktop fidelity (target 1440×900 viewport for the screenshot). The underlying HTML must still be responsive — use Tailwind responsive classes — but optimize the look at desktop width.

═══════════════════════════════════════════════════════════════
DESIGN BAR
═══════════════════════════════════════════════════════════════
- Looks **real**, not "AI-generated". No purple-teal gradients by default. No "team pointing at a laptop" hero photos. No rounded blob backgrounds unless the brand calls for it.
- **Industry-authentic imagery only.** Use Unsplash direct-link URLs (\`https://images.unsplash.com/photo-{id}?w=1600&q=80\`). A plumber's site does NOT look like a SaaS site. A law firm does NOT look like a surf shop.
- **Real copy, not Lorem Ipsum.** Use the prospect's actual business name, real city names from the brief, real service names. Specific headlines beat generic ones every time.
- **Conversion-engineered.** Primary CTA above the fold and repeated at every logical decision point. Social proof appears before every ask. Friction minimized.
- **Modern, not trendy.** Generous whitespace, large typography, restrained motion, clean grids. Avoid glassmorphism overload, neon-on-black, heavy skeuomorphism.

═══════════════════════════════════════════════════════════════
REQUIRED INTERACTIVITY (vanilla JS, inline)
═══════════════════════════════════════════════════════════════
1. Sticky nav that adds a shadow on scroll.
2. Smooth anchor scrolling from nav to in-page sections.
3. Hover states on every button and card (lift, shadow, color shift).
4. Working mobile-menu hamburger toggle.
5. At least one demo form with client-side validation feedback (no actual submit).
6. CTA buttons trigger a small "This is a preview — in the live site this would [book / call / submit]" toast.

═══════════════════════════════════════════════════════════════
SECTION VOCABULARY (pick 6–9, ordered for the business goal)
═══════════════════════════════════════════════════════════════
Hero • Trust bar • Value props (3-col benefits) • Services/products grid • How it works (numbered steps) • Featured case study with metrics • Testimonials • About/team • Pricing • FAQ • Calendar/booking block • Lead form/contact • Footer.

═══════════════════════════════════════════════════════════════
PAIN POINT → DESIGN MAPPING (apply explicitly)
═══════════════════════════════════════════════════════════════
- "Low conversion" → CTA above fold + repeated, social proof before every form, friction-reduced contact (phone + form + calendar).
- "Looks outdated" → restrained modern type pairing, generous whitespace, high-quality photography.
- "People don't trust us online" → credentials, real team photos, specific client results with numbers, review badges.
- "We can't explain what we do" → hero with explicit value-prop sentence + 3-step "How it works".
- "Competitors look better" → deliberately invert their weaknesses (their site is sterile? be warm. cluttered? be spacious.).
- "Phone rings for the wrong stuff" → qualifying copy near the CTA, pre-qualification form fields.
- "We need bookings, not inquiries" → embedded calendar UI mockup in the hero, "Book" language everywhere.
- "Regulated industry trust" → conservative palette, professional type, credentials prominent, no hyperbole.

═══════════════════════════════════════════════════════════════
ANTI-PATTERNS (never do)
═══════════════════════════════════════════════════════════════
- Lorem Ipsum or generic filler.
- Stock "team pointing at laptop" hero or equivalent corporate cliché.
- Default purple-to-teal gradient.
- Skipping the browser-chrome wrapper.
- Static page with no interactivity.
- Inventing facts about the business not in the brief — if you don't know, omit.

When you're done, your last character is \`>\` from \`</html>\`.`;
}

// User-side prompt: assembles the brief from proposal JSON + persona +
// competitor research and tells Rend3r to render. Kept short — the system
// prompt above is where the rules live.
export function rend3rUserPrompt(args: {
  proposal: import("@/lib/sales/proposal-schema").ProposalJSON;
  persona: {
    painPoints: string[];
    opportunities: string[];
    decisionMakerStyle: string | null;
  } | null;
  competitorBrief: string | null; // from competitor research summary
  websiteBuilderPrompt: string | null; // already-generated brief from proposalPrompt()
}): string {
  const p = args.proposal;
  const lines: string[] = [];

  lines.push(`# Render a website preview for: ${p.client.businessName}`);
  lines.push("");

  if (args.websiteBuilderPrompt) {
    lines.push("## Design brief (use this as the spec)");
    lines.push(args.websiteBuilderPrompt);
    lines.push("");
  } else {
    lines.push("## Business");
    lines.push(`- **Industry:** ${p.client.industry}`);
    lines.push(`- **Location:** ${p.client.location}`);
    lines.push(`- **Existing website:** ${p.client.website || "(none — they have NO web presence)"}`);
    lines.push(`- **One-line value prop:** ${p.pitch.headline}`);
    lines.push("");
    lines.push("## Pain points to design around");
    p.situation.painPoints.forEach((pp) => lines.push(`- ${pp}`));
    lines.push("");
    lines.push("## Value pillars to surface");
    p.pitch.valuePillars.forEach((v) => lines.push(`- ${v}`));
    lines.push("");
  }

  if (args.competitorBrief) {
    lines.push("## What the competition is doing (design AROUND this — out-class them)");
    lines.push(args.competitorBrief);
    lines.push("");
  }

  if (args.persona?.decisionMakerStyle) {
    lines.push(`## Decision-maker style (tune tone to this)`);
    lines.push(args.persona.decisionMakerStyle);
    lines.push("");
  }

  lines.push("## Primary CTA");
  lines.push(`Use this copy verbatim on the hero CTA: **"${p.pitch.nextSteps[0] || "Book a free consultation"}"**`);
  lines.push("");

  lines.push("Render now. Output raw HTML only — start with <!DOCTYPE html>, end with </html>.");

  return lines.join("\n");
}

