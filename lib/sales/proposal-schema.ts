// JSON Schema for the proposal structured output.
// Constraints: basic types, enums, additionalProperties:false — no min/max on strings or numbers,
// no recursion. This matches Claude's structured-output support.

export const PROPOSAL_JSON_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["client", "situation", "recommendedServices", "recommendedBundle", "pitch", "websiteBuilderPrompt"],
  properties: {
    client: {
      type: "object",
      additionalProperties: false,
      required: ["businessName", "primaryContact", "industry", "location", "website", "decisionMaker", "socialPresence"],
      properties: {
        businessName: { type: "string" },
        primaryContact: {
          type: "object",
          additionalProperties: false,
          required: ["name", "title", "email", "phone"],
          properties: {
            name: { type: "string" },
            title: { type: ["string", "null"] },
            email: { type: ["string", "null"] },
            phone: { type: ["string", "null"] },
          },
        },
        decisionMaker: {
          type: "object",
          additionalProperties: false,
          required: ["name", "title", "communicationStyle"],
          properties: {
            name: { type: ["string", "null"] },
            title: { type: ["string", "null"] },
            communicationStyle: { type: ["string", "null"] },
          },
        },
        industry: { type: "string" },
        location: { type: "string" },
        website: { type: ["string", "null"] },
        socialPresence: {
          type: "object",
          additionalProperties: false,
          required: ["instagram", "linkedin", "facebook", "twitter"],
          properties: {
            instagram: { type: ["string", "null"] },
            linkedin: { type: ["string", "null"] },
            facebook: { type: ["string", "null"] },
            twitter: { type: ["string", "null"] },
          },
        },
      },
    },
    situation: {
      type: "object",
      additionalProperties: false,
      required: ["summary", "painPoints", "opportunities", "digitalPresenceGaps"],
      properties: {
        summary: { type: "string" },
        painPoints: { type: "array", items: { type: "string" } },
        opportunities: { type: "array", items: { type: "string" } },
        digitalPresenceGaps: { type: "array", items: { type: "string" } },
      },
    },
    recommendedServices: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["serviceId", "name", "tier", "price", "rationale"],
        properties: {
          serviceId: { type: "string" },
          name: { type: "string" },
          tier: { type: "string", enum: ["primary", "secondary", "nice_to_have"] },
          price: { type: "string" },
          rationale: { type: "string" },
        },
      },
    },
    recommendedBundle: {
      type: "object",
      additionalProperties: false,
      required: ["id", "name", "setupPriceUSD", "monthlyPriceUSD", "rationale"],
      properties: {
        id: { type: "string", enum: ["starter", "growth", "accelerate", "dominate"] },
        name: { type: "string" },
        setupPriceUSD: { type: "number" },
        monthlyPriceUSD: { type: "number" },
        rationale: { type: "string" },
      },
    },
    pitch: {
      type: "object",
      additionalProperties: false,
      required: ["headline", "valuePillars", "roiProjection", "nextSteps"],
      properties: {
        headline: { type: "string" },
        valuePillars: { type: "array", items: { type: "string" } },
        roiProjection: { type: "string" },
        nextSteps: { type: "array", items: { type: "string" } },
      },
    },
    websiteBuilderPrompt: {
      type: ["string", "null"],
      description: "Markdown prompt pasted into an AI builder (v0, Lovable, Bolt, Claude Artifacts). null if no website service is needed.",
    },
  },
} as const;

export type ProposalJSON = {
  client: {
    businessName: string;
    primaryContact: { name: string; title: string | null; email: string | null; phone: string | null };
    decisionMaker: { name: string | null; title: string | null; communicationStyle: string | null };
    industry: string;
    location: string;
    website: string | null;
    socialPresence: { instagram: string | null; linkedin: string | null; facebook: string | null; twitter: string | null };
  };
  situation: {
    summary: string;
    painPoints: string[];
    opportunities: string[];
    digitalPresenceGaps: string[];
  };
  recommendedServices: Array<{
    serviceId: string;
    name: string;
    tier: "primary" | "secondary" | "nice_to_have";
    price: string;
    rationale: string;
  }>;
  recommendedBundle: {
    id: "starter" | "growth" | "accelerate" | "dominate";
    name: string;
    setupPriceUSD: number;
    monthlyPriceUSD: number;
    rationale: string;
  };
  pitch: {
    headline: string;
    valuePillars: string[];
    roiProjection: string;
    nextSteps: string[];
  };
  websiteBuilderPrompt: string | null;
};
