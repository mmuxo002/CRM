// Proposal generation orchestrator.
//
// Runs the five stages in order:
//   1. researching   — competitor web research (degrades to null)
//   2. writing       — structured proposal copy via Claude Opus + JSON schema
//   3. rendering     — Rend3r HTML via Claude Opus
//   4. polishing     — Puppeteer screenshot → gpt-image-1 edit polish
//   5. ready         — final status; viewer page can render
//
// Updates Proposal.status / .stage / .progress at each transition so the rep
// dashboard can show live progress. Catches errors per-stage and writes
// errorMessage on hard failure.

import { db } from "@/lib/db";
import { saveImage } from "@/lib/storage";
import { researchCompetitors } from "./competitor-research";
import {
  generateProposalCopy,
  SERVICE_CATALOG,
  type LeadWithRelations,
} from "./generate-copy";
import { renderRend3rHtml } from "./rend3r";
import { screenshotHtml, screenshotUrl } from "./screenshot";
import { polishMockup } from "./polish";
import type { ProposalJSON } from "@/lib/sales/proposal-schema";
import type { CompetitorResearchJSON } from "@/lib/sales/ai-prompts";

function safeJsonParse<T>(str: string | null | undefined, fallback: T): T {
  if (!str) return fallback;
  try { return JSON.parse(str) as T; } catch { return fallback; }
}

async function setStage(
  proposalId: string,
  status: string,
  stage: string,
  progress: number,
): Promise<void> {
  await db.proposal.update({
    where: { id: proposalId },
    data: { status, stage, progress },
  });
  console.log(`[proposal:${proposalId}] ${status} — ${stage} (${progress}%)`);
}

async function failProposal(proposalId: string, errorMessage: string): Promise<void> {
  await db.proposal.update({
    where: { id: proposalId },
    data: { status: "failed", stage: "Failed", errorMessage },
  });
  console.error(`[proposal:${proposalId}] FAILED — ${errorMessage}`);
}

/**
 * Run the full pipeline for a Proposal that has already been created in the DB.
 * Long-running — call as `void runProposalPipeline(id)` from a route handler.
 */
export async function runProposalPipeline(proposalId: string): Promise<void> {
  // Reload proposal + lead with everything we need.
  const proposal = await db.proposal.findUnique({
    where: { id: proposalId },
    include: {
      lead: { include: { company: true, persona: true, salesProject: true } },
    },
  });
  if (!proposal) {
    console.error(`[pipeline] proposal ${proposalId} not found`);
    return;
  }
  const lead: LeadWithRelations = proposal.lead;

  try {
    // ── Stage 1: competitor research (parallel with current-site screenshot) ──
    await setStage(proposalId, "researching", "Researching competitors via web search", 10);

    const persona = lead.persona;
    const competitorResearchPromise = researchCompetitors({
      businessName: lead.company?.name || lead.name,
      industry: lead.company?.industry || lead.salesProject?.niche || "(unspecified)",
      location: lead.address || lead.location || lead.salesProject?.targetLocation || "(unspecified)",
      website: lead.website,
      ownStrengths: persona ? safeJsonParse<string[]>(persona.opportunities, []) : [],
      ownPainPoints: persona ? safeJsonParse<string[]>(persona.painPoints, []) : [],
      knownCompetitors: persona ? safeJsonParse<string[]>(persona.competitors, []) : [],
      serviceCatalogIds: SERVICE_CATALOG.map((s) => s.id),
    });

    // Kick off current-site screenshot in parallel — independent of the AI work.
    const currentSiteScreenshotPromise: Promise<string | null> = lead.website
      ? (async () => {
          const png = await screenshotUrl(lead.website!, { width: 1440, height: 900 });
          if (!png) return null;
          const saved = await saveImage(`${proposalId}_current.png`, png);
          return saved.url;
        })()
      : Promise.resolve(null);

    const competitorResearch: CompetitorResearchJSON | null = await competitorResearchPromise;

    if (competitorResearch && competitorResearch.competitors.length > 0) {
      await db.competitor.createMany({
        data: competitorResearch.competitors.map((c) => ({
          proposalId,
          name: c.name,
          url: c.url,
          strengths: JSON.stringify(c.strengths),
          weaknesses: JSON.stringify(c.weaknesses),
          whyOutperforming: c.whyOutperforming,
          innovat3Angle: c.innovat3Angle,
        })),
      });
    }

    // ── Stage 2: proposal copy ──
    await setStage(proposalId, "writing", "Writing tailored proposal copy", 35);
    const proposalCopy: ProposalJSON = await generateProposalCopy(lead, competitorResearch);
    await db.proposal.update({
      where: { id: proposalId },
      data: { proposalJson: JSON.stringify(proposalCopy) },
    });

    // ── Stage 3: Rend3r HTML ──
    await setStage(proposalId, "rendering", "Generating website mockup (HTML)", 55);
    const html = await renderRend3rHtml({
      proposal: proposalCopy,
      persona: persona
        ? {
            painPoints: safeJsonParse<string[]>(persona.painPoints, []),
            opportunities: safeJsonParse<string[]>(persona.opportunities, []),
            decisionMakerStyle: persona.decisionMakerStyle,
          }
        : null,
      competitorResearch,
    });
    await db.proposal.update({
      where: { id: proposalId },
      data: { rend3rHtml: html },
    });

    // ── Stage 4a: Puppeteer full-page screenshot ──
    // fullPage:true captures the entire scrollable site as one tall PNG. The
    // viewer renders this inside a fixed-height browser-chrome window with
    // overflow-y:auto so the prospect can scroll the mockup like a real site.
    await setStage(proposalId, "rendering", "Capturing scrollable mockup", 80);
    const rend3rPng = await screenshotHtml(html, { width: 1440, height: 900, fullPage: true });
    const rend3rImage = await saveImage(`${proposalId}_rend3r.png`, rend3rPng);
    await db.proposal.update({
      where: { id: proposalId },
      data: { rend3rImageUrl: rend3rImage.url },
    });

    // ── Stage 4b: gpt-image-1 polish (opt-in only) ──
    // Polish is incompatible with full-page screenshots (gpt-image-1 max output
    // is 1536x1024 — can't represent a tall website). It's now opt-in via
    // imageQuality === "openai-only", and applied to the above-fold portion
    // only. Default ("rend3r-only" or "hybrid") skips this step.
    let mockupImageUrl = rend3rImage.url;
    if (proposal.imageQuality === "openai-only") {
      await setStage(proposalId, "polishing", "Polishing hero with gpt-image-1", 92);
      // Re-screenshot just the above-fold (1440x900) for the polish input.
      const heroPng = await screenshotHtml(html, { width: 1440, height: 900, fullPage: false });
      const polished = await polishMockup({
        screenshot: heroPng,
        industry: proposalCopy.client.industry,
        businessName: proposalCopy.client.businessName,
      });
      if (polished) {
        const polishedSaved = await saveImage(`${proposalId}_mockup.png`, polished);
        mockupImageUrl = polishedSaved.url;
      } else {
        console.warn(`[proposal:${proposalId}] polish failed; using Rend3r screenshot as final mockup`);
      }
    }

    // ── Wait for the parallel current-site screenshot to settle ──
    const currentSiteUrl = await currentSiteScreenshotPromise;

    // ── Done ──
    await db.proposal.update({
      where: { id: proposalId },
      data: {
        status: "ready",
        stage: "Ready",
        progress: 100,
        mockupImageUrl,
        currentSiteUrl,
      },
    });
    console.log(`[proposal:${proposalId}] ready`);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    await failProposal(proposalId, msg);
  }
}
