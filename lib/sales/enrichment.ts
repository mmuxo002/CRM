// Website scraping + regex extraction for social profile enrichment

interface EnrichmentResult {
  emails: string[];
  linkedinUrls: string[];
  instagramHandles: string[];
  facebookUrls: string[];
  twitterHandles: string[];
}

const EMAIL_REGEX = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
const LINKEDIN_REGEX = /https?:\/\/(?:www\.)?linkedin\.com\/(?:company|in)\/[a-zA-Z0-9_-]+/g;
const INSTAGRAM_REGEX = /https?:\/\/(?:www\.)?instagram\.com\/([a-zA-Z0-9_.]+)/g;
const FACEBOOK_REGEX = /https?:\/\/(?:www\.)?facebook\.com\/[a-zA-Z0-9_.]+/g;
const TWITTER_REGEX = /https?:\/\/(?:www\.)?(?:twitter|x)\.com\/([a-zA-Z0-9_]+)/g;

// Common emails to filter out (not useful contact emails)
const JUNK_EMAILS = new Set([
  "support@wixpress.com", "info@example.com", "noreply@gmail.com",
  "support@squarespace.com", "support@godaddy.com", "wordpress@wordpress.com",
]);

export async function scrapeWebsite(url: string): Promise<EnrichmentResult> {
  const result: EnrichmentResult = {
    emails: [],
    linkedinUrls: [],
    instagramHandles: [],
    facebookUrls: [],
    twitterHandles: [],
  };

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);

    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; INNOVAT3Bot/1.0)",
        Accept: "text/html",
      },
    });
    clearTimeout(timeout);

    if (!res.ok) return result;

    const html = await res.text();

    // Extract emails
    const emails = html.match(EMAIL_REGEX) || [];
    result.emails = [...new Set(emails)]
      .filter((e) => !JUNK_EMAILS.has(e.toLowerCase()))
      .slice(0, 5);

    // Extract LinkedIn URLs
    const linkedinUrls = html.match(LINKEDIN_REGEX) || [];
    result.linkedinUrls = [...new Set(linkedinUrls)].slice(0, 3);

    // Extract Instagram handles
    const igMatches = [...html.matchAll(INSTAGRAM_REGEX)];
    result.instagramHandles = [...new Set(igMatches.map((m) => m[1]))].slice(0, 3);

    // Extract Facebook URLs
    const fbUrls = html.match(FACEBOOK_REGEX) || [];
    result.facebookUrls = [...new Set(fbUrls)].slice(0, 3);

    // Extract Twitter handles
    const twitterMatches = [...html.matchAll(TWITTER_REGEX)];
    result.twitterHandles = [...new Set(twitterMatches.map((m) => m[1]))].slice(0, 3);
  } catch {
    // Silently fail — website may be unreachable
  }

  return result;
}

// Pattern-based Instagram handle guess
export function guessInstagramHandle(businessName: string, location: string): string {
  const cleaned = businessName
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, "")
    .replace(/\s+/g, "")
    .slice(0, 20);
  const city = location
    .split(",")[0]
    .toLowerCase()
    .replace(/[^a-z]/g, "")
    .slice(0, 10);
  return `@${cleaned}${city}`;
}
