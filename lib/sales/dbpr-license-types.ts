/**
 * Niche → DBPR board + license-type mapping.
 *
 * When a project's niche is in this map, the discovery flow becomes DBPR-first:
 * pull every actively-licensed business of that type in the target county, then
 * enrich each via Google Places for phone/website/reviews. Niches not in this
 * map (pharmacy, medical, legal, dental, etc.) use the Google-first flow.
 *
 * Board and license-type codes were captured directly from the DBPR search form
 * at myfloridalicense.com — they're the option values on the Board and
 * LicenseType dropdowns. Add a new niche here only after probing the actual
 * dropdown values for the target board.
 *
 * County codes match DBPR's internal IDs (not FIPS) — extract via probe against
 * the County dropdown.
 */

export interface DbprNicheConfig {
  /** DBPR "Board" dropdown value (e.g. "06" = Construction Industry). */
  boardCode: string;
  /** All LicenseType dropdown values that match this niche. A project will query each in sequence and merge results. */
  licenseTypeCodes: string[];
  /** Human label for debugging / error messages. */
  boardName: string;
}

// Niche keys match the lowercased keys in niche-config.ts (NICHE_MAP).
// Extend this object to add more DBPR-gated niches.
export const DBPR_NICHES: Record<string, DbprNicheConfig> = {
  hvac: {
    boardCode: "06",
    boardName: "Construction Industry",
    licenseTypeCodes: ["0601", "0614", "0606", "0620"], // Certified AC, Registered AC, Certified Mechanical, Registered Mechanical
  },
  plumbers: {
    boardCode: "06",
    boardName: "Construction Industry",
    licenseTypeCodes: ["0604", "0617"], // Certified Plumbing, Registered Plumbing
  },
  roofing: {
    boardCode: "06",
    boardName: "Construction Industry",
    licenseTypeCodes: ["0603", "0616"], // Certified Roofing, Registered Roofing
  },
};

export function getDbprNicheConfig(niche: string): DbprNicheConfig | null {
  return DBPR_NICHES[niche.toLowerCase()] ?? null;
}

export function isDbprGatedNiche(niche: string): boolean {
  return getDbprNicheConfig(niche) !== null;
}

/**
 * DBPR county dropdown values. Index = county name (lowercased), value = DBPR's internal ID.
 * Not FIPS codes — DBPR uses its own numbering. Captured from the County select on the
 * "Search by City or County" form.
 */
export const DBPR_COUNTIES: Record<string, string> = {
  alachua: "11",
  baker: "12",
  bay: "13",
  bradford: "14",
  brevard: "15",
  broward: "16",
  calhoun: "17",
  charlotte: "18",
  citrus: "19",
  clay: "20",
  collier: "21",
  columbia: "22",
  dade: "23",        // Miami-Dade
  "miami-dade": "23",
  miami: "23",        // common alias
  desoto: "24",
  dixie: "25",
  duval: "26",        // Jacksonville
  escambia: "27",
  flagler: "28",
};

/**
 * Extract a DBPR county code from a freeform target location string like
 * "Miami, 33175" or "Dade County" or "Fort Lauderdale".
 * Returns null if we can't confidently identify the county — in which case
 * the caller should either prompt the user for county or skip DBPR-first.
 */
export function resolveDbprCountyCode(targetLocation: string): string | null {
  const lower = targetLocation.toLowerCase();

  // Fast path: explicit county name.
  for (const [name, code] of Object.entries(DBPR_COUNTIES)) {
    if (lower.includes(name)) return code;
  }

  // ZIP prefix → county heuristic (South Florida starter set — expand as needed).
  // 331xx-334xx roughly covers Miami-Dade + Broward + parts of Palm Beach.
  const zipMatch = lower.match(/\b(\d{3})\d{2}\b/);
  if (zipMatch) {
    const prefix = zipMatch[1];
    // Miami-Dade ZIPs: 331, 332, 333
    if (["331", "332", "333"].includes(prefix)) return "23";
    // Broward ZIPs: 330, 333 (overlaps), 334 (some)
    if (["330"].includes(prefix)) return "16";
  }

  return null;
}
