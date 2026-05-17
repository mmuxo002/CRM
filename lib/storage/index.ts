// Storage adapter for proposal artifacts (mockup PNGs, current-site screenshots).
//
// Today: writes to ./public/proposals/ and serves at /proposals/{key} via Next's
// static file handler. Works locally and in any single-server deploy.
//
// To switch to Vercel Blob later, swap this file's implementation to use
// `@vercel/blob`'s `put()` and return its public URL. Callers do not change.

import { mkdir, writeFile, unlink } from "node:fs/promises";
import { join } from "node:path";

const PUBLIC_DIR = join(process.cwd(), "public", "proposals");
const PUBLIC_PREFIX = "/proposals";

export type StoredImage = {
  /** Public URL the browser can fetch (e.g. "/proposals/abc.png"). */
  url: string;
  /** Storage key — usable to delete or overwrite later. */
  key: string;
};

/**
 * Save image bytes (PNG/JPEG) and return a public URL.
 * `key` should be a stable filename including extension, e.g. "p_abc123_mockup.png".
 */
export async function saveImage(key: string, bytes: Uint8Array | Buffer): Promise<StoredImage> {
  await mkdir(PUBLIC_DIR, { recursive: true });
  const buf = Buffer.isBuffer(bytes) ? bytes : Buffer.from(bytes);
  await writeFile(join(PUBLIC_DIR, key), buf);
  // NEXT_PUBLIC_APP_URL lets us serve absolute URLs in emails. Falls back to relative.
  const base = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ?? "";
  return { url: `${base}${PUBLIC_PREFIX}/${key}`, key };
}

/**
 * Best-effort delete; silently ignores missing files.
 */
export async function deleteImage(key: string): Promise<void> {
  try {
    await unlink(join(PUBLIC_DIR, key));
  } catch {
    // ignore
  }
}
