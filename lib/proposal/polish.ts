// Stage 4b: take the Puppeteer screenshot of the Rend3r HTML and ask
// gpt-image-1 to polish it — replace stock-y imagery with photorealistic
// industry shots, lift the visual finish, but preserve copy & layout.
//
// We use the EDIT endpoint (image-to-image) so the model is conditioned on
// the screenshot rather than free-imagining the whole site. This is what
// keeps the business name + headlines from getting mangled.

import OpenAI from "openai";
import { toFile } from "openai/uploads";

const openai = process.env.OPENAI_API_KEY
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null;

export type PolishInput = {
  /** PNG buffer of the Rend3r HTML screenshot. */
  screenshot: Buffer;
  /** Industry — used to direct imagery style. */
  industry: string;
  /** Business name — for the prompt context (NOT to be regenerated as text). */
  businessName: string;
  /** Brand color palette hex codes from the design brief, optional. */
  paletteHex?: string[];
};

const POLISH_PROMPT_SUFFIX = `Render as a single photorealistic, production-quality desktop website screenshot. Preserve the layout, sections, navigation, headlines, body copy, and overall structure of the input image EXACTLY — do not invent, alter, or move text. Replace any stock-looking or placeholder imagery with photorealistic, industry-authentic photography. Do not add browser chrome of your own (the input already has its frame). Do not add annotations, watermarks, captions, or labels. No lorem ipsum.`;

/**
 * Polish the Rend3r screenshot. Returns the polished PNG buffer, or null if
 * polishing fails or no API key is set — in which case the caller should
 * fall back to the unpolished screenshot.
 */
export async function polishMockup(input: PolishInput): Promise<Buffer | null> {
  if (!openai) {
    console.warn("[polish] OPENAI_API_KEY not set — skipping polish step");
    return null;
  }

  const palette = input.paletteHex?.length
    ? `Honor this color palette: ${input.paletteHex.join(", ")}.`
    : "";

  const prompt = `Polish this website mockup for ${input.businessName} (${input.industry}). ${palette} ${POLISH_PROMPT_SUFFIX}`;

  try {
    const imageFile = await toFile(input.screenshot, "mockup.png", {
      type: "image/png",
    });

    const response = await openai.images.edit({
      model: "gpt-image-1",
      image: imageFile,
      prompt,
      size: "1536x1024", // closest 3:2 size to a 1440x900 desktop frame
      quality: "high",
    });

    const b64 = response.data?.[0]?.b64_json;
    if (!b64) {
      console.error("[polish] OpenAI returned no image data");
      return null;
    }
    return Buffer.from(b64, "base64");
  } catch (err) {
    console.error("[polish] gpt-image-1 edit failed", err);
    return null;
  }
}
