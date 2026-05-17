/**
 * Sunbiz (Florida Division of Corporations) business entity lookup.
 * Searches search.sunbiz.org by business name, finds matching entities,
 * and extracts officer/director names and filing details.
 *
 * No API key needed — this is publicly available data.
 */

export interface SunbizOfficer {
  title: string;  // e.g. "President", "Manager", "Registered Agent"
  name: string;
  address?: string;
}

export interface SunbizResult {
  entityName: string;
  documentNumber: string;
  filingDate?: string;
  status?: string;       // e.g. "ACTIVE", "INACTIVE"
  entityType?: string;   // e.g. "Florida Limited Liability Company", "Florida Profit Corporation"
  officers: SunbizOfficer[];
  registeredAgent?: { name: string; address?: string };
  principalAddress?: string;
  detailUrl: string;
}

const SEARCH_BASE = "https://search.sunbiz.org/Inquiry/CorporationSearch/SearchByName";
const DETAIL_BASE = "https://search.sunbiz.org/Inquiry/CorporationSearch/SearchResultDetail";

/**
 * Search Sunbiz for a business name and return the best match with officer info.
 * Returns null if no match found or if the lookup fails.
 */
export async function lookupSunbiz(businessName: string): Promise<SunbizResult | null> {
  try {
    // Step 1: Search by business name
    const cleanName = businessName
      .replace(/[^\w\s]/g, "")
      .replace(/\s+/g, " ")
      .trim()
      .toUpperCase();

    const searchUrl = `${SEARCH_BASE}?searchNameOrder=${encodeURIComponent(cleanName)}&searchTerm=${encodeURIComponent(cleanName)}`;

    const searchRes = await fetch(searchUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; BusinessResearchBot/1.0)",
        "Accept": "text/html",
      },
      signal: AbortSignal.timeout(10000),
    });

    if (!searchRes.ok) return null;
    const searchHtml = await searchRes.text();

    // Step 2: Parse search results to find the best matching entity
    const detailLink = findBestMatch(searchHtml, cleanName);
    if (!detailLink) return null;

    // Step 3: Fetch the detail page
    const detailUrl = detailLink.startsWith("http")
      ? detailLink
      : `https://search.sunbiz.org${detailLink}`;

    const detailRes = await fetch(detailUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; BusinessResearchBot/1.0)",
        "Accept": "text/html",
      },
      signal: AbortSignal.timeout(10000),
    });

    if (!detailRes.ok) return null;
    const detailHtml = await detailRes.text();

    // Step 4: Extract entity details
    return parseDetailPage(detailHtml, detailUrl);
  } catch {
    // Network errors, timeouts, parse failures — return null gracefully
    return null;
  }
}

/**
 * Find the best matching search result link from the search results page.
 */
function findBestMatch(html: string, searchName: string): string | null {
  // Sunbiz search results are in a table with links to detail pages
  // Each result row has an <a> tag with the entity name linking to the detail page
  const resultPattern = /<a\s+href="([^"]*SearchResultDetail[^"]*)"[^>]*>([^<]*)<\/a>/gi;
  const matches: { url: string; name: string }[] = [];

  let match;
  while ((match = resultPattern.exec(html)) !== null) {
    matches.push({ url: match[1], name: match[2].trim() });
  }

  if (matches.length === 0) return null;

  // Prefer ACTIVE entities and exact/close name matches
  const searchWords = searchName.split(" ").filter(Boolean);

  // Score each match
  let best: { url: string; score: number } | null = null;
  for (const m of matches) {
    const upperName = m.name.toUpperCase();
    let score = 0;

    // Exact match bonus
    if (upperName === searchName) score += 100;

    // Word overlap scoring
    for (const word of searchWords) {
      if (word.length > 2 && upperName.includes(word)) score += 10;
    }

    // Starts with the search name
    if (upperName.startsWith(searchWords[0])) score += 20;

    // Penalize very long names (likely not a match)
    if (upperName.length > searchName.length * 2.5) score -= 10;

    if (!best || score > best.score) {
      best = { url: m.url, score };
    }
  }

  // Require a minimum match quality
  return best && best.score >= 10 ? best.url : null;
}

/**
 * Parse a Sunbiz entity detail page and extract structured data.
 */
function parseDetailPage(html: string, detailUrl: string): SunbizResult | null {
  // Entity name — usually in a prominent heading or the detail section
  const entityName = extractField(html, /Document\s*Name[^<]*<[^>]*>([^<]+)/i)
    || extractField(html, /<span[^>]*class="[^"]*detailSection[^"]*"[^>]*>([^<]+)/i)
    || extractField(html, /Filing\s*Name[^<]*<[^>]*>([^<]+)/i)
    || "";

  const documentNumber = extractField(html, /Document\s*Number[^<]*<[^>]*>([^<]+)/i) || "";
  const filingDate = extractField(html, /Filing\s*Date[^<]*<[^>]*>([^<]+)/i)
    || extractField(html, /Date\s*Filed[^<]*<[^>]*>([^<]+)/i);
  const status = extractField(html, /Status[^<]*<[^>]*>([^<]+)/i);
  const entityType = extractField(html, /FEI\/EIN\s*Number|Filing\s*Type[^<]*<[^>]*>([^<]+)/i);
  const principalAddress = extractAddress(html, /Principal\s*Address/i);

  // Extract officers/directors
  const officers = extractOfficers(html);

  // Extract registered agent
  const registeredAgent = extractRegisteredAgent(html);

  if (!entityName && officers.length === 0) return null;

  return {
    entityName: entityName.trim(),
    documentNumber: documentNumber.trim(),
    filingDate: filingDate?.trim(),
    status: status?.trim(),
    entityType: entityType?.trim(),
    officers,
    registeredAgent,
    principalAddress: principalAddress?.trim(),
    detailUrl,
  };
}

/**
 * Extract officer/director names from the detail page.
 * Sunbiz lists officers in a section with titles like "President", "Vice President",
 * "Secretary", "Treasurer", "Director", "Manager", "Member", etc.
 */
function extractOfficers(html: string): SunbizOfficer[] {
  const officers: SunbizOfficer[] = [];

  // Officer section typically follows "Officer/Director Detail" heading
  // Each officer block has a title and name on separate lines
  const officerSection = html.match(/Officer\/Director\s*Detail([\s\S]*?)(?=Annual\s*Report|<\/table|$)/i);
  const section = officerSection ? officerSection[1] : html;

  // Pattern: Title\s+Name — looking for common officer title patterns
  const titlePattern = /(?:Title|Type)\s*<[^>]*>\s*([^<]+)[\s\S]*?(?:Name|Detail)\s*<[^>]*>\s*([^<]+)/gi;
  let match;
  while ((match = titlePattern.exec(section)) !== null) {
    const title = match[1].trim();
    const name = match[2].trim();
    if (name && title && name.length > 1 && !name.includes("http")) {
      officers.push({ title, name });
    }
  }

  // Alternative pattern: look for rows with officer data in table cells
  // <span>Title</span> ... <span>Name</span> pattern
  if (officers.length === 0) {
    const rowPattern = /<span[^>]*>\s*(President|Vice\s*President|Secretary|Treasurer|Director|Manager|Member|CEO|CFO|COO|Owner|Organizer|Managing\s*Member|Authorized\s*(?:Person|Member|Representative))\s*<\/span>[\s\S]*?<span[^>]*>\s*([A-Z][^<]{2,40})\s*<\/span>/gi;
    while ((match = rowPattern.exec(section)) !== null) {
      officers.push({
        title: match[1].trim(),
        name: match[2].trim(),
      });
    }
  }

  // Fallback: look for common name patterns near officer keywords
  if (officers.length === 0) {
    const blockPattern = /(President|Vice President|Secretary|Treasurer|Director|Manager|Member|CEO|CFO|Owner|Managing Member)\s*[\n\r]+\s*([A-Z][A-Za-z\s,.'()-]{2,50})/g;
    while ((match = blockPattern.exec(section)) !== null) {
      const name = match[2].trim();
      if (name && !/^\d/.test(name) && !name.includes("http")) {
        officers.push({ title: match[1].trim(), name });
      }
    }
  }

  // Deduplicate by name
  const seen = new Set<string>();
  return officers.filter((o) => {
    const key = o.name.toUpperCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

/**
 * Extract registered agent info.
 */
function extractRegisteredAgent(html: string): { name: string; address?: string } | undefined {
  const agentSection = html.match(/Registered\s*Agent[\s\S]*?(?=Officer|Annual|<\/table|$)/i);
  if (!agentSection) return undefined;

  const nameMatch = agentSection[0].match(/Name[^<]*<[^>]*>\s*([^<]+)/i);
  const addressMatch = agentSection[0].match(/Address[^<]*<[^>]*>\s*([^<]+(?:<br[^>]*>[^<]+)*)/i);

  if (!nameMatch) return undefined;
  const name = nameMatch[1].trim();
  if (!name || name.length < 2) return undefined;

  return {
    name,
    address: addressMatch ? addressMatch[1].replace(/<br[^>]*>/g, ", ").trim() : undefined,
  };
}

function extractField(html: string, pattern: RegExp): string | null {
  const match = html.match(pattern);
  return match ? (match[1] || match[0]).trim() : null;
}

function extractAddress(html: string, labelPattern: RegExp): string | null {
  const idx = html.search(labelPattern);
  if (idx === -1) return null;
  const chunk = html.slice(idx, idx + 500);
  const addrMatch = chunk.match(/<[^>]*>\s*([^<]*\d{5}[^<]*)/);
  return addrMatch ? addrMatch[1].trim() : null;
}

/**
 * Format Sunbiz results into a human-readable summary for the AI prompt.
 */
export function formatSunbizForPrompt(result: SunbizResult): string {
  const lines: string[] = [
    `FLORIDA BUSINESS ENTITY (from Sunbiz):`,
    `- Registered Name: ${result.entityName}`,
  ];

  if (result.status) lines.push(`- Status: ${result.status}`);
  if (result.entityType) lines.push(`- Entity Type: ${result.entityType}`);
  if (result.filingDate) lines.push(`- Filed: ${result.filingDate}`);
  if (result.principalAddress) lines.push(`- Principal Address: ${result.principalAddress}`);

  if (result.officers.length > 0) {
    lines.push(`- Officers/Directors:`);
    for (const o of result.officers) {
      lines.push(`  · ${o.title}: ${o.name}`);
    }
  }

  if (result.registeredAgent) {
    lines.push(`- Registered Agent: ${result.registeredAgent.name}`);
  }

  return lines.join("\n");
}
