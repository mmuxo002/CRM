/**
 * Florida Department of Business & Professional Regulation (DBPR) license lookup.
 *
 * Drives the public license search at https://www.myfloridalicense.com/wl11.asp
 * using a headless browser (the site is a stateful legacy ASP app that resists
 * plain HTTP scraping — session cookies, multi-step form flow, server-side
 * validation). Runs during the research phase alongside Sunbiz.
 *
 * Covers: construction/contractors, HVAC, plumbing, electrical, real estate,
 * cosmetology, barbers, restaurants, hotels, architecture, engineering,
 * accountants, veterinarians. Returns null for unlicensed or out-of-state
 * businesses — the caller treats null as "no licensing data found."
 *
 * Cost: ~3-5s per call (browser launch + 2 navigations + result parse).
 */

import puppeteer, { type Browser, type Page } from "puppeteer-core";
import chromium from "@sparticuz/chromium";

const SEARCH_URL = "https://www.myfloridalicense.com/wl11.asp?mode=0&SID=";

export interface DbprLicense {
  licenseNumber: string;
  licenseeName: string;
  licenseType: string;
  status: string;
  detailUrl?: string;
  rank: number; // 0-based position in the results list
}

export interface DbprResult {
  searchedName: string;
  licenses: DbprLicense[];
}

export interface DbprLookupOptions {
  maxResults?: number;
  timeoutMs?: number;
}

const LOCAL_CHROME_PATHS = [
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  "/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge",
  "/Applications/Brave Browser.app/Contents/MacOS/Brave Browser",
  "/Applications/Chromium.app/Contents/MacOS/Chromium",
];

async function findChrome(): Promise<string> {
  const isServerless = !!process.env.AWS_LAMBDA_FUNCTION_NAME || !!process.env.VERCEL;
  if (isServerless) return await chromium.executablePath();

  const fs = await import("node:fs/promises");
  for (const p of LOCAL_CHROME_PATHS) {
    try { await fs.access(p); return p; } catch {}
  }
  return await chromium.executablePath();
}

export async function lookupDbpr(
  businessName: string,
  opts: DbprLookupOptions = {},
): Promise<DbprResult | null> {
  const maxResults = opts.maxResults ?? 5;
  const timeoutMs = opts.timeoutMs ?? 20000;

  const cleaned = cleanBusinessName(businessName);
  if (cleaned.length < 3) return null;

  const executablePath = await findChrome();
  const isServerless = !!process.env.AWS_LAMBDA_FUNCTION_NAME || !!process.env.VERCEL;

  let browser: Browser | null = null;
  const deadline = Date.now() + timeoutMs;

  try {
    browser = await puppeteer.launch({
      args: isServerless ? chromium.args : ["--no-sandbox", "--disable-setuid-sandbox"],
      defaultViewport: { width: 1280, height: 900 },
      executablePath,
      headless: true,
    });

    const page = await browser.newPage();
    await page.setUserAgent(
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    );
    page.setDefaultTimeout(Math.max(5000, deadline - Date.now()));

    // Step 1: landing page, pick "Search by Name", submit.
    await page.goto(SEARCH_URL, { waitUntil: "domcontentloaded" });
    await page.evaluate(() => {
      const radio = document.querySelector<HTMLInputElement>('input[name="SearchType"][value="Name"]');
      if (radio) radio.checked = true;
    });
    await Promise.all([
      page.waitForNavigation({ waitUntil: "domcontentloaded" }).catch(() => null),
      page.evaluate(() => {
        const btn = Array.from(document.querySelectorAll("button"))
          .find((b) => /search/i.test(b.textContent || "") && !/back|clear/i.test(b.textContent || ""));
        if (btn) (btn as HTMLButtonElement).click();
        else (document.forms.namedItem("reportForm") as HTMLFormElement | null)?.submit();
      }),
    ]);

    // Step 2: fill OrgName, submit.
    const hasOrgNameInput = await page.$('input[name="OrgName"]');
    if (!hasOrgNameInput) return null; // site layout changed

    await page.type('input[name="OrgName"]', cleaned);

    await Promise.all([
      page.waitForNavigation({ waitUntil: "domcontentloaded" }).catch(() => null),
      page.evaluate(() => {
        const form = document.forms.namedItem("reportForm") as HTMLFormElement | null;
        if (form) {
          const hAction = form.elements.namedItem("hAction") as HTMLInputElement | null;
          if (hAction) hAction.value = "Search";
          form.submit();
        }
      }),
    ]);

    // Step 3: parse results. DBPR renders a table of licensees; rows link to detail pages.
    const results = await scrapeResults(page, maxResults);
    if (results.length === 0) return null;

    return { searchedName: businessName, licenses: results };
  } catch {
    return null;
  } finally {
    if (browser) await browser.close().catch(() => {});
  }
}

async function scrapeResults(page: Page, maxResults: number): Promise<DbprLicense[]> {
  return page.evaluate((max: number) => {
    // DBPR's result table has a header row:
    //   [License Type | Name | NameType | LicenseNumber/Rank | Status/Expires]
    // and then each license is 1 data row (5 cells) followed by 1-3 address rows
    // (1-3 cells). Find the table by that header and then walk its data rows.

    const tables = Array.from(document.querySelectorAll<HTMLTableElement>("table"));
    let resultsTable: HTMLTableElement | null = null;
    for (const t of tables) {
      const firstRow = t.querySelector("tr");
      if (!firstRow) continue;
      const headerCells = Array.from(firstRow.querySelectorAll("td,th"))
        .map((c) => (c.textContent || "").trim());
      if (
        headerCells.length === 5 &&
        /License Type/i.test(headerCells[0]) &&
        /Name/i.test(headerCells[1]) &&
        /License\s*Number/i.test(headerCells[3])
      ) {
        resultsTable = t;
        break;
      }
    }
    if (!resultsTable) return [];

    const licenses: Array<{
      licenseNumber: string; licenseeName: string; licenseType: string;
      status: string; detailUrl?: string; rank: number;
    }> = [];

    const seen = new Set<string>();
    const rows = Array.from(resultsTable.querySelectorAll("tr"));

    for (const row of rows) {
      if (licenses.length >= max) break;
      const cells = Array.from(row.querySelectorAll("td")).map((c) => (c.textContent || "").trim());
      if (cells.length !== 5) continue;

      const [licenseType, licenseeName, nameType, licenseNumberRaw, statusRaw] = cells;

      // Skip the header row.
      if (/^License Type$/i.test(licenseType)) continue;
      // Skip rows that are actually address fragments (shouldn't be 5-cell but be defensive).
      if (/^(License Location|Main|Mailing)\s*Address/i.test(licenseType)) continue;
      if (!licenseeName || licenseeName.length < 2) continue;

      // "LicenseNumber/Rank" cells look like "323815Med O2-Ret Est." or
      // "VEN5104621Vending" — split where digits end and type suffix begins.
      const numMatch = licenseNumberRaw.match(/^([A-Z]{0,4}\s*\d[\d-]*)(.*)$/);
      const licenseNumber = (numMatch?.[1] ?? licenseNumberRaw).trim();

      // "Status/Expires" cells look like "Current, Active12/01/2026" or
      // "Null and Void, 02/28/2021" or "Null and Void," (no date).
      const statusMatch = statusRaw.match(/^(.+?)(?:,\s*)?(\d{1,2}\/\d{1,2}\/\d{4})?$/);
      const status = (statusMatch?.[1] ?? statusRaw).replace(/,\s*$/, "").trim();
      const expires = statusMatch?.[2];

      // Find the detail link (licensee name is usually linked). Fall back to row link.
      const anchor = row.querySelector<HTMLAnchorElement>('a[href*="wl11.asp"]');

      const key = `${licenseeName}|${licenseNumber}`;
      if (seen.has(key)) continue;
      seen.add(key);

      licenses.push({
        licenseeName,
        licenseNumber,
        licenseType: `${licenseType}${nameType && nameType !== "Primary" ? ` (${nameType})` : ""}`,
        status: expires ? `${status} — expires ${expires}` : status,
        detailUrl: anchor?.href,
        rank: licenses.length,
      });
    }

    return licenses;
  }, maxResults);
}

// Strip punctuation and common suffixes so "Villa Clara Pharmacy, Inc." hits
// "VILLA CLARA PHARMACY" in DBPR. Keep it conservative — DBPR's own search is
// fuzzy enough that over-aggressive cleaning loses matches.
function cleanBusinessName(name: string): string {
  return name
    .replace(/,|\./g, " ")
    .replace(/\b(inc|llc|ltd|corp|co|pa|pllc|dba)\b\.?/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

// ─── DBPR-first discovery: pull every licensed business of a given type in a county ───
//
// Unlike lookupDbpr (name search used for persona enrichment), this drives the
// "Search by City or County" flow to produce a full candidate list for project
// kickoff. Caller specifies board + license type + county, gets back every
// actively-licensed business.

export interface DbprLicensee {
  licenseType: string;      // e.g. "Registered Air Conditioning Contractor"
  businessName: string;     // e.g. "A & E AIR CONDITIONING INC"
  nameType: string;         // "Primary" | "DBA"
  licenseNumber: string;    // e.g. "RA13067649"
  status: string;           // e.g. "Current, Active" | "Null and Void"
  expirationDate: string | null;
  // "Original License Date" from the licensee detail page. Format mm/dd/yyyy.
  // Populated only when the caller passes `fetchIssueDate: true` — the lookup
  // costs 1 extra page navigation per licensee.
  originalLicenseDate: string | null;
  locationAddress: string | null;
  mainAddress: string | null;
  detailUrl?: string;
  // True iff status normalizes to an active, not-expired license.
  isActive: boolean;
}

export interface DbprQueryOptions {
  boardCode: string;                 // e.g. "06" for Construction Industry
  licenseTypeCode: string;           // e.g. "0614" for Registered Air Conditioning Contractor
  countyCode?: string;               // e.g. "23" for Dade
  city?: string;
  activeOnly?: boolean;              // default true
  limit?: number;                    // default 100 (kickoff cap; 2 DBPR pages of 50)
  timeoutMs?: number;                // default 60000 (this flow is slower — pagination)
  // When true, follow each licensee's detail link to scrape "Original License Date".
  // Adds ~2-3s per licensee — only enable when license-issue dates are needed.
  fetchIssueDate?: boolean;
}

/**
 * Query DBPR's City/County search for every licensee matching the given
 * board + license type + county. Returns the full page-1 result set up to `limit`.
 * Caller is responsible for franchise filtering and Google Places enrichment.
 */
export class DbprQueryError extends Error {
  constructor(message: string, public stage: string) {
    super(message);
    this.name = "DbprQueryError";
  }
}

export async function queryDbprByLicenseType(
  opts: DbprQueryOptions
): Promise<DbprLicensee[]> {
  const limit = opts.limit ?? 100;
  const timeoutMs = opts.timeoutMs ?? 60000;
  const activeOnly = opts.activeOnly ?? true;
  const fetchIssueDate = opts.fetchIssueDate ?? false;
  const tag = `[dbpr ${opts.boardCode}/${opts.licenseTypeCode} co=${opts.countyCode ?? "?"}]`;

  let executablePath: string;
  try {
    executablePath = await findChrome();
  } catch (err) {
    throw new DbprQueryError(`Chrome not found: ${(err as Error).message}`, "chrome-resolve");
  }
  const isServerless = !!process.env.AWS_LAMBDA_FUNCTION_NAME || !!process.env.VERCEL;

  let browser: Browser | null = null;
  const deadline = Date.now() + timeoutMs;

  try {
    browser = await puppeteer.launch({
      args: isServerless ? chromium.args : ["--no-sandbox", "--disable-setuid-sandbox"],
      defaultViewport: { width: 1280, height: 900 },
      executablePath,
      headless: true,
    });

    const page = await browser.newPage();
    await page.setUserAgent(
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    );
    page.setDefaultTimeout(Math.max(5000, deadline - Date.now()));

    // Step 1: landing → pick "City or County" radio → submit.
    await page.goto(SEARCH_URL, { waitUntil: "domcontentloaded" });
    await page.evaluate(() => {
      const r = document.querySelector<HTMLInputElement>('input[name="SearchType"][value="City"]');
      if (r) r.checked = true;
    });
    await Promise.all([
      page.waitForNavigation({ waitUntil: "domcontentloaded" }).catch(() => null),
      page.evaluate(() => {
        const btn = Array.from(document.querySelectorAll("button"))
          .find((b) => /search/i.test(b.textContent || "") && !/back|clear/i.test(b.textContent || ""));
        if (btn) (btn as HTMLButtonElement).click();
        else (document.forms.namedItem("reportForm") as HTMLFormElement | null)?.submit();
      }),
    ]);

    // Step 2: verify the Board code exists on the dropdown, then trigger the
    // ASP postback that repopulates LicenseType. `page.select` races with the
    // onchange navigation — use waitForSelector afterwards to re-synchronize
    // with the fresh page context before touching any further elements.
    try {
      await page.waitForSelector(
        `select[name="Board"] option[value="${opts.boardCode}"]`,
        { timeout: 8000 }
      );
    } catch {
      throw new DbprQueryError(
        `Board code ${opts.boardCode} not on the Board dropdown — DBPR may have re-numbered boards. ${tag}`,
        "board-missing"
      );
    }

    // Trigger the Board postback. We DON'T wait inside Promise.all here
    // because page.select() internally does a DOM lookup that races with
    // navigation ("Cannot find context" errors). Fire the change via
    // page.evaluate instead, then wait explicitly for nav completion.
    await Promise.all([
      page.waitForNavigation({ waitUntil: "domcontentloaded", timeout: 15000 }).catch(() => null),
      page.evaluate((boardCode: string) => {
        const sel = document.querySelector<HTMLSelectElement>('select[name="Board"]');
        if (!sel) return;
        sel.value = boardCode;
        // Fire the site's DDChange() handler which sets hDDChange + submits.
        sel.dispatchEvent(new Event("change", { bubbles: true }));
      }, opts.boardCode),
    ]);

    // Step 3: wait for LicenseType dropdown to populate on the new page.
    try {
      await page.waitForSelector(
        `select[name="LicenseType"] option[value="${opts.licenseTypeCode}"]`,
        { timeout: 10000 }
      );
    } catch {
      throw new DbprQueryError(
        `LicenseType code ${opts.licenseTypeCode} not under Board ${opts.boardCode} (dropdown didn't populate). ${tag}`,
        "license-type-missing"
      );
    }

    if (opts.countyCode) {
      try {
        await page.waitForSelector(
          `select[name="County"] option[value="${opts.countyCode}"]`,
          { timeout: 5000 }
        );
      } catch {
        throw new DbprQueryError(
          `County code ${opts.countyCode} missing from County dropdown. ${tag}`,
          "county-missing"
        );
      }
    }

    // Atomic step-3 form fill + submit — everything in one page.evaluate so
    // no lookups race with the submit-navigation.
    await Promise.all([
      page.waitForNavigation({ waitUntil: "domcontentloaded", timeout: 30000 }).catch(() => null),
      page.evaluate((licenseTypeCode: string, countyCode: string, city: string) => {
        const form = document.forms.namedItem("reportForm") as HTMLFormElement | null;
        if (!form) return;
        const lt = form.elements.namedItem("LicenseType") as HTMLSelectElement | null;
        if (lt) lt.value = licenseTypeCode;
        if (countyCode) {
          const cty = form.elements.namedItem("County") as HTMLSelectElement | null;
          if (cty) cty.value = countyCode;
        }
        if (city) {
          const ci = form.elements.namedItem("City") as HTMLInputElement | null;
          if (ci) ci.value = city;
        }
        const rpp = form.elements.namedItem("RecsPerPage") as HTMLSelectElement | null;
        if (rpp) rpp.value = "50";
        const hAction = form.elements.namedItem("hAction") as HTMLInputElement | null;
        if (hAction) hAction.value = "Search";
        form.submit();
      }, opts.licenseTypeCode, opts.countyCode ?? "", opts.city ?? ""),
    ]);

    // Step 4: parse the results table + walk pagination if needed.
    // Wait for the results table (or a "no results" indicator) to be rendered
    // before the first parse — prevents a race where we evaluate() too soon.
    await page
      .waitForFunction(
        () => {
          const body = document.body.textContent || "";
          return /Search Results/i.test(body) || /No Records Match/i.test(body);
        },
        { timeout: 15000 }
      )
      .catch(() => null);

    const results: DbprLicensee[] = [];
    let pageNum = 1;
    const maxPages = Math.ceil(limit / 50);

    while (results.length < limit && pageNum <= maxPages && Date.now() < deadline) {
      const parsed = await scrapeLicenseeResults(page, limit - results.length);
      results.push(...parsed);
      if (parsed.length === 0) break;

      // Probe whether more pages exist BEFORE we trigger a navigation.
      const hasNext = await page.evaluate(() => {
        const form = document.forms.namedItem("reportForm") as HTMLFormElement | null;
        if (!form) return false;
        const curr = Number((form.elements.namedItem("hCurrPage") as HTMLInputElement | null)?.value) || 1;
        const total = Number((form.elements.namedItem("hTotalPages") as HTMLInputElement | null)?.value) || 1;
        return curr < total;
      });
      if (!hasNext) break;

      // Fire the Next-Page submit inside Promise.all with the nav wait — the
      // form.submit() triggers navigation and we need both to resolve together.
      await Promise.all([
        page.waitForNavigation({ waitUntil: "domcontentloaded", timeout: 15000 }).catch(() => null),
        page.evaluate(() => {
          const form = document.forms.namedItem("reportForm") as HTMLFormElement | null;
          if (!form) return;
          const pa = form.elements.namedItem("hPageAction") as HTMLInputElement | null;
          if (pa) pa.value = "4"; // 4 = Next Page
          form.submit();
        }),
      ]);
      pageNum++;
    }

    const filtered = activeOnly ? results.filter((r) => r.isActive) : results;

    // Optionally enrich each licensee with its Original License Date from the
    // detail page. Sequential to avoid hammering DBPR's session-bound state;
    // a parallel fan-out drops cookies and the next nav 500s.
    if (fetchIssueDate) {
      for (const lic of filtered) {
        if (!lic.detailUrl) continue;
        if (Date.now() >= deadline) break;
        try {
          lic.originalLicenseDate = await scrapeOriginalLicenseDate(page, lic.detailUrl);
        } catch {
          // Detail page misses are non-fatal — license stays without an issue date.
        }
      }
    }

    console.log(`${tag} returned ${filtered.length} licenses (${activeOnly ? "active-only" : "all"}${fetchIssueDate ? ", +issue dates" : ""})`);
    return filtered;
  } catch (err) {
    if (err instanceof DbprQueryError) throw err;
    throw new DbprQueryError(
      `${tag} ${(err as Error).message ?? err}`,
      "scrape-failed"
    );
  } finally {
    if (browser) await browser.close().catch(() => {});
  }
}

async function scrapeLicenseeResults(page: Page, remaining: number): Promise<DbprLicensee[]> {
  return page.evaluate((max: number) => {
    // DBPR's result table: 5-cell header row [License Type | Name | NameType |
    // LicenseNumber/Rank | Status/Expires], followed by 1-3 address sub-rows per
    // license. Walk rows linearly, associating address fragments with the most
    // recent 5-cell row.
    const tables = Array.from(document.querySelectorAll<HTMLTableElement>("table"));
    let resultsTable: HTMLTableElement | null = null;
    for (const t of tables) {
      const firstRow = t.querySelector("tr");
      if (!firstRow) continue;
      const hdr = Array.from(firstRow.querySelectorAll("td,th"))
        .map((c) => (c.textContent || "").trim());
      if (
        hdr.length === 5 &&
        /License Type/i.test(hdr[0]) &&
        /License\s*Number/i.test(hdr[3])
      ) {
        resultsTable = t;
        break;
      }
    }
    if (!resultsTable) return [];

    type Row = {
      licenseType: string; businessName: string; nameType: string;
      licenseNumber: string; status: string; expirationDate: string | null;
      originalLicenseDate: string | null;
      locationAddress: string | null; mainAddress: string | null;
      detailUrl?: string; isActive: boolean;
    };

    const out: Row[] = [];
    let current: Row | null = null;

    for (const tr of Array.from(resultsTable.querySelectorAll("tr"))) {
      const cells = Array.from(tr.querySelectorAll("td")).map((c) => (c.textContent || "").trim());

      // Header row (5 cells, first is data not a label)
      if (cells.length === 5 && !/^License Type$/i.test(cells[0]) &&
          !/^(License Location|Main|Mailing)\s*Address/i.test(cells[0])) {
        if (out.length >= max) break;
        const [licenseType, businessName, nameType, licenseNumberRaw, statusRaw] = cells;
        if (!businessName || businessName.length < 2) continue;

        const numMatch = licenseNumberRaw.match(/^([A-Z]{0,4}\s*\d[\d-]*)(.*)$/);
        const licenseNumber = (numMatch?.[1] ?? licenseNumberRaw).trim();

        const statusMatch = statusRaw.match(/^(.+?)(?:,\s*)?(\d{1,2}\/\d{1,2}\/\d{4})?$/);
        const status = (statusMatch?.[1] ?? statusRaw).replace(/,\s*$/, "").trim();
        const expirationDate = statusMatch?.[2] ?? null;

        const isActive =
          /current/i.test(status) || /active/i.test(status);

        const anchor = tr.querySelector<HTMLAnchorElement>('a[href*="wl11.asp"]');

        current = {
          licenseType, businessName, nameType,
          licenseNumber, status, expirationDate,
          originalLicenseDate: null,
          locationAddress: null, mainAddress: null,
          detailUrl: anchor?.href, isActive,
        };
        out.push(current);
        continue;
      }

      // Address sub-row — attach to current license
      if (current && cells.length >= 2) {
        const label = cells[0];
        const value = cells[cells.length - 1]; // rightmost cell has the address
        if (/^License Location\s*Address/i.test(label) && !current.locationAddress) {
          current.locationAddress = value;
        } else if (/^Main\s*Address/i.test(label) && !current.mainAddress) {
          current.mainAddress = value;
        }
      }
    }

    return out;
  }, remaining);
}

/**
 * Navigate to a licensee's detail page and parse "Original License Date".
 * Detail pages are server-rendered tables of label/value pairs — find the
 * cell whose text matches /Original License Date/ and read the next sibling.
 * Returns mm/dd/yyyy or null if absent.
 */
async function scrapeOriginalLicenseDate(page: Page, detailUrl: string): Promise<string | null> {
  try {
    await page.goto(detailUrl, { waitUntil: "domcontentloaded", timeout: 12000 });
  } catch {
    return null;
  }
  return page.evaluate(() => {
    const cells = Array.from(document.querySelectorAll<HTMLTableCellElement>("td,th"));
    for (let i = 0; i < cells.length; i++) {
      const txt = (cells[i].textContent || "").trim();
      if (/^Original\s+License(?:ure)?\s+Date/i.test(txt)) {
        // Value usually in the next td; walk siblings + same-row neighbors.
        const next = cells[i + 1];
        const candidate = (next?.textContent || "").trim();
        const m = candidate.match(/\b(\d{1,2}\/\d{1,2}\/\d{4})\b/);
        if (m) return m[1];
      }
      // Some pages render label and value in the same cell ("Original License Date: 03/15/2026").
      const inline = txt.match(/Original\s+License(?:ure)?\s+Date[^0-9]*(\d{1,2}\/\d{1,2}\/\d{4})/i);
      if (inline) return inline[1];
    }
    return null;
  });
}

/**
 * Format DBPR results into a block suitable for the persona AI prompt.
 * Returns null if there's nothing worth including.
 */
export function formatDbprForPrompt(result: DbprResult): string | null {
  if (!result.licenses.length) return null;

  const lines: string[] = ["FLORIDA DBPR LICENSE RECORD:"];
  for (const lic of result.licenses.slice(0, 5)) {
    const parts: string[] = [`· ${lic.licenseeName}`];
    if (lic.licenseType) parts.push(lic.licenseType);
    if (lic.licenseNumber) parts.push(`#${lic.licenseNumber}`);
    if (lic.status) parts.push(`[${lic.status}]`);
    lines.push(parts.join(" — "));
  }
  return lines.join("\n");
}
