// Stage 4a: render the Rend3r HTML in headless Chromium and screenshot the
// top of the page (1440x900). Works locally (uses your installed Chrome /
// Edge / Brave) and on Vercel (uses @sparticuz/chromium).

import puppeteer, { type Browser } from "puppeteer-core";
import chromium from "@sparticuz/chromium";

// Common Chrome paths to try when running locally. Falls back to
// @sparticuz/chromium's bundled binary if none exist.
const LOCAL_CHROME_PATHS = [
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  "/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge",
  "/Applications/Brave Browser.app/Contents/MacOS/Brave Browser",
  "/Applications/Chromium.app/Contents/MacOS/Chromium",
];

async function findExecutablePath(): Promise<string> {
  // On Vercel/serverless, NEXT_RUNTIME or AWS_LAMBDA_FUNCTION_NAME will be set.
  const isServerless =
    !!process.env.AWS_LAMBDA_FUNCTION_NAME || !!process.env.VERCEL;

  if (isServerless) {
    return await chromium.executablePath();
  }

  // Local: try installed browsers first.
  const fs = await import("node:fs/promises");
  for (const p of LOCAL_CHROME_PATHS) {
    try {
      await fs.access(p);
      return p;
    } catch {
      // try next
    }
  }
  // Fallback: download via @sparticuz/chromium
  return await chromium.executablePath();
}

export type ScreenshotOptions = {
  /** Viewport width — defaults to 1440 (desktop). */
  width?: number;
  /** Viewport height — defaults to 900. Captures full page if `fullPage` is true. */
  height?: number;
  /** Capture entire scrollable page (true) vs. just the viewport (false). */
  fullPage?: boolean;
  /** Extra wait after load before screenshot, for animations to settle. */
  settleMs?: number;
};

/**
 * Render the given HTML string and return a PNG buffer.
 */
export async function screenshotHtml(
  html: string,
  opts: ScreenshotOptions = {},
): Promise<Buffer> {
  const width = opts.width ?? 1440;
  const height = opts.height ?? 900;
  const fullPage = opts.fullPage ?? false;
  const settleMs = opts.settleMs ?? 1500;

  const executablePath = await findExecutablePath();
  const isServerless = !!process.env.AWS_LAMBDA_FUNCTION_NAME || !!process.env.VERCEL;

  let browser: Browser | null = null;
  try {
    browser = await puppeteer.launch({
      args: isServerless ? chromium.args : ["--no-sandbox", "--disable-setuid-sandbox"],
      defaultViewport: { width, height, deviceScaleFactor: 2 },
      executablePath,
      headless: true,
    });

    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "networkidle0", timeout: 45000 });
    await new Promise((r) => setTimeout(r, settleMs));

    const screenshot = await page.screenshot({
      type: "png",
      fullPage,
      omitBackground: false,
    });
    return Buffer.from(screenshot);
  } finally {
    if (browser) await browser.close();
  }
}

/**
 * Render a public URL (used to screenshot the prospect's existing site).
 * Returns null on failure so the pipeline can degrade gracefully.
 */
export async function screenshotUrl(
  url: string,
  opts: ScreenshotOptions = {},
): Promise<Buffer | null> {
  const width = opts.width ?? 1440;
  const height = opts.height ?? 900;
  const fullPage = opts.fullPage ?? false;

  const executablePath = await findExecutablePath();
  const isServerless = !!process.env.AWS_LAMBDA_FUNCTION_NAME || !!process.env.VERCEL;

  let browser: Browser | null = null;
  try {
    browser = await puppeteer.launch({
      args: isServerless ? chromium.args : ["--no-sandbox", "--disable-setuid-sandbox"],
      defaultViewport: { width, height, deviceScaleFactor: 2 },
      executablePath,
      headless: true,
    });

    const page = await browser.newPage();
    // Some sites block default UAs.
    await page.setUserAgent(
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    );
    await page.goto(url, { waitUntil: "networkidle2", timeout: 30000 });
    await new Promise((r) => setTimeout(r, 1500));

    const screenshot = await page.screenshot({ type: "png", fullPage });
    return Buffer.from(screenshot);
  } catch (err) {
    console.error(`[screenshot-url] failed for ${url}:`, err);
    return null;
  } finally {
    if (browser) await browser.close();
  }
}
