// Singleton Anthropic client for proposal pipeline.
import Anthropic from "@anthropic-ai/sdk";

export const anthropic = process.env.ANTHROPIC_API_KEY
  ? new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
  : null;

export function requireAnthropic(): Anthropic {
  if (!anthropic) throw new Error("ANTHROPIC_API_KEY is not configured");
  return anthropic;
}

/** Pull the final text block from a messages.create response. */
export function extractText(response: Anthropic.Messages.Message): string {
  for (let i = response.content.length - 1; i >= 0; i--) {
    const block = response.content[i];
    if (block.type === "text") return block.text;
  }
  return "";
}
