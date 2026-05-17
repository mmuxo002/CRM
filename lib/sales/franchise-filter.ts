/**
 * Franchise / chain / publicly-traded filter.
 *
 * Applied to DBPR results before creating leads. The goal is to drop big-box
 * retailers and national brands that happen to hold FL licenses — they aren't
 * the mom-and-pop prospects we're targeting.
 *
 * Two filtering layers:
 *  1. **Name pattern blocklist** — explicit list of known chain/public-company
 *     business-name substrings (case-insensitive regex).
 *  2. **DBPR-count threshold** — businesses whose name appears in more than
 *     FRANCHISE_LICENSE_COUNT_THRESHOLD DBPR records across the state are
 *     treated as franchises. Applied against the combined result set the
 *     discover flow already has, no extra queries needed.
 *
 * Add patterns to `FRANCHISE_NAME_PATTERNS` whenever a new chain slips through.
 */

export const FRANCHISE_LICENSE_COUNT_THRESHOLD = 10;

// Case-insensitive substrings / regex fragments that mark a business as a chain
// or publicly-traded operation. Grouped by category for readability — group
// membership has no effect at runtime.
const NAMES: string[] = [
  // ── Big-box retail / home improvement ─────────────────────────
  "home depot",
  "lowe'?s",
  "ace hardware",
  "true value",
  "menards",
  "harbor freight",
  "costco",
  "sam'?s club",
  "bj'?s wholesale",
  "walmart",
  "target",
  "kmart",
  "sears",
  "kohl'?s",
  "macy'?s",
  "dillard'?s",
  "jcpenney",
  "nordstrom",
  "best buy",

  // ── Grocery / pharmacy / convenience chains ────────────────────
  "publix",
  "winn[- ]dixie",
  "whole foods",
  "trader joe'?s",
  "walgreens",
  "cvs pharmacy",
  "cvs health",
  "rite aid",
  "7[- ]eleven",
  "circle k",
  "wawa",

  // ── National restaurants / QSR ────────────────────────────────
  "mcdonald'?s",
  "burger king",
  "wendy'?s",
  "taco bell",
  "chipotle",
  "subway",
  "starbucks",
  "dunkin",
  "panera",
  "chick[- ]fil[- ]a",
  "domino'?s",
  "pizza hut",
  "papa john'?s",
  "olive garden",
  "applebee'?s",
  "chili'?s",
  "outback steakhouse",
  "ihop",
  "denny'?s",

  // ── National home-services / franchises ───────────────────────
  "mr\\. rooter",
  "roto[- ]rooter",
  "ars\\b",
  "one hour air",
  "service experts",
  "carrier commercial",
  "trane u\\.s\\.",
  "lennox international",
  "adt",
  "orkin",
  "terminix",
  "truegreen",
  "servpro",
  "stanley steemer",
  "molly maid",
  "merry maids",
  "two men and a truck",

  // ── National legal / professional services ────────────────────
  "morgan ?(?:and|&) ?morgan",
  "kelley ?(?:and|&) ?uustal",
  "h&r block",
  "jackson hewitt",
  "liberty tax",
  "intuit",
  "turbotax",

  // ── Publicly-traded national corps (common FL presence) ────────
  "amazon\\.com",
  "amazon services",
  "fedex",
  "ups\\b",
  "united parcel service",
  "verizon",
  "at&t",
  "t[- ]mobile",
  "xfinity",
  "comcast",
  "spectrum cable",
  "waste management",
  "republic services",
  "disney",
  "universal studios",
  "hilton",
  "marriott",
  "hyatt",
  "hertz",
  "enterprise rent",
  "avis budget",
];

const FRANCHISE_NAME_PATTERNS: RegExp[] = NAMES.map(
  (n) => new RegExp(`\\b${n}\\b`, "i")
);

/**
 * True if the business name matches a known franchise / chain / public-company
 * pattern. The caller should skip the lead entirely when this returns true.
 */
export function matchesFranchiseName(businessName: string): boolean {
  return FRANCHISE_NAME_PATTERNS.some((re) => re.test(businessName));
}

/**
 * Given the full set of DBPR results for a query, returns the set of business
 * names that appear more than FRANCHISE_LICENSE_COUNT_THRESHOLD times — those
 * are likely multi-location chains even if they don't match the name blocklist.
 *
 * Normalizes names by stripping store-number suffixes ("HOME DEPOT #6302" →
 * "HOME DEPOT") so all locations of one chain cluster together.
 */
export function detectFrequentNames(names: string[]): Set<string> {
  const counts = new Map<string, number>();
  for (const raw of names) {
    const key = normalizeForFrequency(raw);
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  const frequent = new Set<string>();
  for (const [key, count] of counts) {
    if (count > FRANCHISE_LICENSE_COUNT_THRESHOLD) frequent.add(key);
  }
  return frequent;
}

export function normalizeForFrequency(name: string): string {
  return name
    .toUpperCase()
    .replace(/#\s*[\w\d-]+/g, " ")         // strip "#6302"
    .replace(/\b(inc|llc|ltd|corp|co|pa|pllc|dba)\b\.?/gi, " ")
    .replace(/[^\w\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Combined filter — returns true if the lead should be dropped as a franchise.
 * Use `frequentNames` from `detectFrequentNames()` once per query batch.
 */
export function isFranchise(businessName: string, frequentNames?: Set<string>): boolean {
  if (matchesFranchiseName(businessName)) return true;
  if (frequentNames && frequentNames.has(normalizeForFrequency(businessName))) return true;
  return false;
}
