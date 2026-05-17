// AI-driven default subject + body for the intro offer email.
//
// Static templates can't pass the "this sounds like a real human researched
// me" bar. This module hands the persona research to Sonnet 4.6 with a tight
// system prompt: banned phrases, banned structural patterns (bullet lists),
// banned tells (em-dashes, "boost your", "AI call handling", etc), and
// positive examples for subject lines that read like meeting threads.
//
// Output is deterministic JSON: { subject, body }. The agent then edits
// freely in the modal. Cost ~$0.003 per generation on Sonnet.

import { requireAnthropic, extractText } from "./anthropic";
import { noEmDashes } from "./intro-offer-email";

// ─── System prompt: hard rules + structure + examples ───────────────────────

const SYSTEM_PROMPT = `You are writing a personalized cold-outreach email for a sales rep at INNOVAT3 Solutions to send to a small or local business owner. INNOVAT3 helps small businesses with their digital presence, website, lead capture, and follow-up automation.

Your job: produce a JSON object with two fields:
  - subject: a single subject line
  - body: 2-3 short, conversational paragraphs (80-150 words total)

═══════════════════════════════════════════════════════════════
HARD RULES — ALL OF THESE OR THE OUTPUT IS REJECTED
═══════════════════════════════════════════════════════════════

1. NO bulleted or numbered lists in the body. Write in flowing paragraphs.
   The body must read like a colleague typing a thought, not a brochure.

2. NO em-dashes (—) or en-dashes (–) anywhere. Use commas, periods, or
   the word "and". This is a hard tell that AI wrote it.

3. NO trigger phrases. NEVER use any of these or close variants:
   • "AI call handling", "AI calling", "AI-powered", "AI-driven", "AI agent"
   • "website redesign", "redesign your website", "refresh your site"
   • "limited SEO", "SEO opportunities", any standalone mention of SEO as
     a value prop. SEO is invisibly bundled with our website work, never
     called out as a selling point.
   • "lacks online booking", "online presence", "digital footprint",
     "digital presence" (verbatim)
   • "boost your", "leverage", "synergy", "robust", "cutting-edge"
   • "industry-leading", "elevate your", "in today's digital age"
   • "drive results", "unlock potential", "transform your business"
   • "I came across your business", "I noticed you", "I hope this finds you"
   • "Quick question" as a subject

4. DO NOT name specific INNOVAT3 services (Voice AI Agent, CRM Platform,
   Google My Business, Phone Integration, etc.). Use casual references:
   • "the intake side"
   • "what happens when someone calls after 5pm"
   • "the way leads come in"
   • "after-hours capture"
   • "the follow-up side"
   • "what someone sees when they hit your site at 9pm"

5. DO NOT mention the 25% off discount or the 24-hour deadline anywhere
   in the body or subject. The locked email template has its own block
   for that. Your body should make the recipient WANT to talk; the offer
   block does the closing.

═══════════════════════════════════════════════════════════════
SUBJECT LINE — make it look like a real person's email
═══════════════════════════════════════════════════════════════

The subject must NOT lead with a discount, urgency, or sales pitch. It
should read like a personal email between two people, or a meeting
invite between two parties. Lowercase is fine, even preferred.

GOOD examples (model after these):
  • "saw your site this morning"
  • "{Business name} x INNOVAT3 — quick call?"   ← but use a regular hyphen, not em-dash
  • "{Business name} + INNOVAT3"
  • "Meeting: {Business name} and INNOVAT3"
  • "quick thought on {websiteDomain}"
  • "{first name}, INNOVAT3 chat?"
  • "your intake setup, quick thought"
  • "{Business name} <> INNOVAT3"

BAD examples (never produce these):
  • "24 hours: 25% off ..."
  • "Boost your {business}"
  • "Quick question about your business"
  • "Transform your {business} today"
  • "Limited time offer"

═══════════════════════════════════════════════════════════════
BODY STRUCTURE — 2 or 3 short paragraphs, NO bullets
═══════════════════════════════════════════════════════════════

Paragraph 1 (OPENER): Reference something specific you "noticed" or "saw".
  • If the prospect has a website, mention something on it (the case
    studies page, the way the homepage opens, their photo carousel,
    their service pages, their reviews section, etc.).
  • If they have a strong Google rating, acknowledge it warmly.
  • If they have no website, frame around what you saw on Google or
    their category presence.
  • DO NOT just dump a generic compliment. Be specific.

Paragraph 2 (OBSERVATION): One or two specific friction points or
  opportunities, woven into prose. Frame in terms of what they're
  missing out on or where they could be capturing more, NEVER as
  "you're doing X wrong." Conversational.

Paragraph 3 (SOFT CLOSE): A single sentence hinting at wanting to
  talk. DO NOT use phrases like "I'd love to..." or "looking forward
  to hearing from you" or any other corporate sign-off filler. Be
  direct and human. Examples:
  • "Worth a 20 min chat?"
  • "Happy to walk you through what I'm thinking if you've got 15 minutes."
  • "Open to comparing notes?"

═══════════════════════════════════════════════════════════════
TONE
═══════════════════════════════════════════════════════════════

A busy small-business owner is reading this on their phone. Direct,
warm, specific, no fluff. Like a colleague texting an idea, not a
salesperson pitching a board.

Write in the rep's voice (they are a real human at INNOVAT3 in
South Florida).

═══════════════════════════════════════════════════════════════
HONESTY
═══════════════════════════════════════════════════════════════

NEVER invent facts. If the research data doesn't include something
specific, write more vaguely. It's better to say "spent some time
on your site" than to invent a detail that isn't real and get caught.

═══════════════════════════════════════════════════════════════
OUTPUT
═══════════════════════════════════════════════════════════════

Return JSON only. No markdown fences. No commentary. Shape:
{
  "subject": "string",
  "body": "string with \\n\\n between paragraphs"
}

Body should NOT include the greeting line ("Hey {name}," is added by
the template) or a signature. Just the 2-3 paragraphs of body content.`;

// ─── Output schema ──────────────────────────────────────────────────────────

const OUTPUT_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["subject", "body"],
  properties: {
    subject: { type: "string" },
    body: { type: "string" },
  },
} as const;

// ─── Input shape (everything the model needs to be specific) ────────────────

export type IntroOfferAIInput = {
  businessName: string;
  recipientFirstName: string; // empty string if unknown
  industry: string | null;
  location: string | null;
  website: string | null;
  websiteDomain: string | null; // e.g. "suarezmonteiro.com"
  painPoints: string[];
  opportunities: string[];
  challenges: string[];
  competitors: string[];
  digitalPresence: string | null;
  googleRating: number | null;
  googleReviewCount: number | null;
  businessSummary: string | null;
};

// ─── Defensive scrubber: belt-and-suspenders if the model leaks a banned phrase ─

const BANNED_PATTERNS: Array<[RegExp, string]> = [
  [/\bAI[- ]?call(?:ing| handling)?\b/gi, "the call side"],
  [/\bAI[- ]?powered\b/gi, ""],
  [/\bAI[- ]?driven\b/gi, ""],
  [/\bAI[- ]?agent\b/gi, ""],
  [/\bwebsite redesign\b/gi, "the site"],
  [/\bredesign your website\b/gi, "rework the site"],
  [/\blimited SEO\b/gi, ""],
  [/\bSEO opportunities?\b/gi, ""],
  [/\blacks online booking\b/gi, "the booking flow"],
  [/\bdigital (?:footprint|presence)\b/gi, "online side"],
  [/\bboost your\b/gi, "help your"],
  [/\bin today's digital age\b/gi, ""],
  [/\bdrive results\b/gi, ""],
  [/\btransform your business\b/gi, ""],
  [/\bI came across your business\b/gi, "Took a look at your business"],
  [/\bI hope this (?:email )?finds you\b/gi, ""],
];

function scrubBanned(s: string): string {
  let out = s;
  for (const [pattern, replacement] of BANNED_PATTERNS) {
    out = out.replace(pattern, replacement);
  }
  // Tidy up double spaces / orphan punctuation that scrubbing can leave behind.
  return out.replace(/\s{2,}/g, " ").replace(/\s+([,.!?])/g, "$1").trim();
}

// ─── Main ────────────────────────────────────────────────────────────────────

export async function generateIntroOfferDefaults(
  input: IntroOfferAIInput,
): Promise<{ subject: string; body: string } | null> {
  const client = requireAnthropic();

  const userPrompt = `RESEARCH FILE FOR THIS PROSPECT
═══════════════════════════════════════════════════════════════
Business: ${input.businessName}
${input.industry ? `Industry: ${input.industry}` : ""}
${input.location ? `Location: ${input.location}` : ""}
${input.website ? `Website: ${input.website}` : "No website on file."}
${input.websiteDomain ? `Domain: ${input.websiteDomain}` : ""}
Recipient first name: ${input.recipientFirstName || "(unknown — open with 'Hey there')"}

Google reviews: ${input.googleRating ? `${input.googleRating} stars (${input.googleReviewCount || 0} reviews)` : "(none)"}

Business summary from earlier research:
${input.businessSummary || "(no summary)"}

Pain points we identified:
${input.painPoints.length ? input.painPoints.map((p) => `  • ${p}`).join("\n") : "  (none captured yet)"}

Opportunities we see:
${input.opportunities.length ? input.opportunities.map((p) => `  • ${p}`).join("\n") : "  (none captured)"}

Industry challenges they face:
${input.challenges.length ? input.challenges.map((p) => `  • ${p}`).join("\n") : "  (none captured)"}

Likely competitors:
${input.competitors.length ? input.competitors.map((p) => `  • ${p}`).join("\n") : "  (none captured)"}

Digital presence notes: ${input.digitalPresence || "(none)"}

═══════════════════════════════════════════════════════════════
TASK
═══════════════════════════════════════════════════════════════
Produce the personalized subject + body per all rules in the system prompt.
The recipient will read this on their phone. Make them want to reply.

Return JSON only.`;

  try {
    const stream = client.messages.stream({
      model: "claude-sonnet-4-6",
      max_tokens: 1500,
      system: SYSTEM_PROMPT,
      output_config: {
        format: { type: "json_schema", schema: OUTPUT_SCHEMA as unknown as Record<string, unknown> },
      },
      messages: [{ role: "user", content: userPrompt }],
    });
    const response = await stream.finalMessage();
    const text = extractText(response);
    if (!text) return null;

    const parsed = JSON.parse(text) as { subject: string; body: string };
    if (!parsed.subject || !parsed.body) return null;

    // Triple-pass cleanup: scrub banned phrases, then strip em-dashes.
    return {
      subject: noEmDashes(scrubBanned(parsed.subject)),
      body: noEmDashes(scrubBanned(parsed.body)),
    };
  } catch (err) {
    console.error("[intro-offer-ai] generation failed", err);
    return null;
  }
}
