/**
 * Apollo.io people finder — optional enrichment layer for decision-maker lookup.
 *
 * When APOLLO_API_KEY is configured, we hit /v1/mixed_people/search with the
 * business name + location + likely executive titles and return the top match.
 * When the key is missing (or Apollo returns nothing), we no-op gracefully so
 * Sunbiz remains the primary source.
 */

export interface ApolloPerson {
  name: string;
  title: string;
  email?: string;
  linkedinUrl?: string;
  city?: string;
  state?: string;
  source: "apollo";
}

export interface ApolloLookupResult {
  people: ApolloPerson[];
  searchedDomain: string | null;
  searchedCompany: string;
}

const DECISION_MAKER_TITLES = [
  "Owner",
  "Founder",
  "Co-Founder",
  "CEO",
  "President",
  "Managing Member",
  "Managing Partner",
  "General Manager",
  "Operations Manager",
];

function normalizeDomain(website: string | null): string | null {
  if (!website) return null;
  try {
    const u = new URL(website.startsWith("http") ? website : `https://${website}`);
    return u.hostname.replace(/^www\./, "");
  } catch {
    return null;
  }
}

export async function lookupApolloDecisionMakers(args: {
  businessName: string;
  website: string | null;
  location: string | null;
}): Promise<ApolloLookupResult | null> {
  const apiKey = process.env.APOLLO_API_KEY;
  if (!apiKey) return null;

  const domain = normalizeDomain(args.website);

  const payload: Record<string, unknown> = {
    q_organization_name: args.businessName,
    person_titles: DECISION_MAKER_TITLES,
    page: 1,
    per_page: 5,
  };
  if (domain) payload.q_organization_domains = [domain];
  if (args.location) {
    const locParts = args.location.split(",").map((s) => s.trim()).filter(Boolean);
    if (locParts.length) payload.person_locations = locParts;
  }

  try {
    const res = await fetch("https://api.apollo.io/v1/mixed_people/search", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-cache",
        "X-Api-Key": apiKey,
      },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) return null;

    const data = await res.json();
    const raw = Array.isArray(data?.people) ? data.people : [];

    const people: ApolloPerson[] = raw.slice(0, 5).map((p: any) => ({
      name: [p.first_name, p.last_name].filter(Boolean).join(" ").trim() || p.name || "",
      title: p.title || p.headline || "",
      email: typeof p.email === "string" && !p.email.startsWith("email_not_unlocked") ? p.email : undefined,
      linkedinUrl: p.linkedin_url || undefined,
      city: p.city,
      state: p.state,
      source: "apollo" as const,
    })).filter((p: ApolloPerson) => p.name.length > 1);

    if (people.length === 0) return null;

    return {
      people,
      searchedDomain: domain,
      searchedCompany: args.businessName,
    };
  } catch {
    return null;
  }
}

export function apolloConfigured(): boolean {
  return Boolean(process.env.APOLLO_API_KEY);
}
