// Stage 1: competitor research via Claude + the server-side web_search tool.
// Returns 1-3 real competitors with sales-ready strengths/weaknesses analysis.

import type Anthropic from "@anthropic-ai/sdk";
import { requireAnthropic, extractText } from "./anthropic";
import {
  competitorResearchPrompt,
  type CompetitorResearchJSON,
} from "@/lib/sales/ai-prompts";

export type CompetitorResearchInput = {
  businessName: string;
  industry: string;
  location: string;
  website: string | null;
  ownStrengths: string[];
  ownPainPoints: string[];
  knownCompetitors: string[];
  serviceCatalogIds: string[];
};

// Server-side tool spec for Claude's web_search. The SDK doesn't export a
// stable type for this in every version, so we type it loosely and cast.
const WEB_SEARCH_TOOL = {
  type: "web_search_20250305",
  name: "web_search",
  max_uses: 8,
} as unknown as Anthropic.Messages.Tool;

/**
 * Run competitor research with web_search enabled. Returns null on hard failure
 * so the caller can degrade gracefully (the proposal can still ship without it).
 */
export async function researchCompetitors(
  input: CompetitorResearchInput,
): Promise<CompetitorResearchJSON | null> {
  const client = requireAnthropic();
  const prompt =
    competitorResearchPrompt(input) +
    `\n\nReturn JSON only — no markdown fences, no commentary. Shape:\n` +
    `{\n  "competitors": [{ "name": str, "url": str|null, "strengths": [str], "weaknesses": [str], "whyOutperforming": str, "innovat3Angle": str }],\n  "summary": str\n}`;

  try {
    // .stream() + finalMessage() — bypasses the SDK's 10-min non-streaming cap.
    // web_search tool rounds work the same in streaming mode.
    const stream = client.messages.stream({
      // Sonnet handles competitor analysis with web_search just as well as Opus
      // and is ~5x cheaper on output tokens. The web_search tool itself does
      // the heavy lifting; the model's job is to synthesize.
      model: "claude-sonnet-4-6",
      max_tokens: 8000,
      tools: [WEB_SEARCH_TOOL],
      messages: [{ role: "user", content: prompt }],
    });
    const response = await stream.finalMessage();

    const text = extractText(response);
    if (!text) return null;

    const cleaned = text
      .replace(/^```(?:json)?\s*/i, "")
      .replace(/```\s*$/i, "")
      .trim();

    const parsed = JSON.parse(cleaned) as CompetitorResearchJSON;
    if (!parsed.competitors || !Array.isArray(parsed.competitors)) return null;
    return parsed;
  } catch (err) {
    console.error("[competitor-research] failed", err);
    return null;
  }
}
