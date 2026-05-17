// Stage 3: render the website preview as a single self-contained HTML file
// using the Rend3r AI agent (Claude Opus + system prompt + user brief).

import { requireAnthropic, extractText } from "./anthropic";
import { rend3rSystemPrompt, rend3rUserPrompt } from "@/lib/sales/ai-prompts";
import type { ProposalJSON } from "@/lib/sales/proposal-schema";
import type { CompetitorResearchJSON } from "@/lib/sales/ai-prompts";

export type Rend3rInput = {
  proposal: ProposalJSON;
  persona: {
    painPoints: string[];
    opportunities: string[];
    decisionMakerStyle: string | null;
  } | null;
  competitorResearch: CompetitorResearchJSON | null;
};

/**
 * Generate the full HTML mockup. Returns the raw HTML string ready to be
 * loaded into Puppeteer.
 */
export async function renderRend3rHtml(input: Rend3rInput): Promise<string> {
  const client = requireAnthropic();

  const userPrompt = rend3rUserPrompt({
    proposal: input.proposal,
    persona: input.persona,
    competitorBrief: input.competitorResearch?.summary ?? null,
    websiteBuilderPrompt: input.proposal.websiteBuilderPrompt,
  });

  // .stream() + finalMessage() instead of .create() because the SDK refuses
  // non-streaming calls whose estimated duration exceeds 10 minutes — and
  // Sonnet at max_tokens=24000 lands right at that threshold. Streaming has
  // no such cap. Final message shape is identical to .create()'s response.
  const stream = client.messages.stream({
    // Sonnet 4.6 produces excellent HTML/Tailwind at ~5x lower output cost than
    // Opus. HTML generation is well-suited to Sonnet — the system prompt does
    // the heavy lifting, the model is mostly structured composition.
    model: "claude-sonnet-4-6",
    max_tokens: 24000,
    system: rend3rSystemPrompt(),
    messages: [{ role: "user", content: userPrompt }],
  });
  const response = await stream.finalMessage();

  const text = extractText(response);
  if (!text) throw new Error("Rend3r returned no HTML");

  // Defensive: strip markdown fences if the model added them despite the
  // system prompt. Then ensure it starts with <!DOCTYPE html>.
  let html = text.trim();
  html = html.replace(/^```(?:html)?\s*/i, "").replace(/```\s*$/i, "").trim();

  // If for some reason there's preamble before <!DOCTYPE, strip to it.
  const doctypeIdx = html.toLowerCase().indexOf("<!doctype html");
  if (doctypeIdx > 0) html = html.slice(doctypeIdx);
  if (doctypeIdx === -1) {
    // No doctype — wrap minimally so puppeteer still renders it. This is a
    // fallback; the system prompt should prevent this branch.
    html = `<!DOCTYPE html><html><head><meta charset="utf-8"></head><body>${html}</body></html>`;
  }

  return html;
}
