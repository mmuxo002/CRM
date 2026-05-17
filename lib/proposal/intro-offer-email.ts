// Intro offer email — short, urgency-driven, personalized to the lead's
// actual pain points and persona data. Links to /offer/[token].
//
// Two surfaces:
//   • buildIntroOfferEmail() — pure renderer; returns { subject, html, text }.
//     Used by the preview endpoint AND by sendIntroOfferEmail. Single source
//     of truth so the agent's preview matches what gets sent.
//   • sendIntroOfferEmail() — calls Resend with the rendered output.
//
// Design rules (per Juan):
//   • NEVER use em-dashes (—) or en-dashes (–). Use commas, periods, "and".
//   • NEVER show specific bundle prices. Anchor only with "starting at $800".
//   • The greeting + body content are the agent's editable surface. Header
//     pill, deadline, CTA, signature, and footer stay locked for brand.
//   • Default body is auto-built from persona pain points + recommended
//     services. Agent can keep, tweak, or rewrite.

import { Resend } from "resend";

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

// ─── String hygiene ──────────────────────────────────────────────────────────

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Strip em-dashes / en-dashes — these read as "AI wrote this." */
export function noEmDashes(s: string): string {
  return s
    .replace(/\s*[—–]\s*/g, ", ") // ` — ` / ` – ` → `, `
    .replace(/[—–]/g, ",");        // bare em/en dash → `,`
}

/** Try to make a website-name-as-business-name look reasonable. The agent
 * can always override the resulting display name. */
export function cleanBusinessName(raw: string): string {
  if (!raw) return "";
  let s = raw.trim();
  // Drop common URL pieces
  s = s.replace(/^https?:\/\//i, "")
       .replace(/^www\./i, "")
       .replace(/\.(com|net|org|io|co|us|biz)\b.*$/i, "");
  // Hyphens → spaces
  s = s.replace(/[-_]+/g, " ");
  // CamelCase → spaced words
  s = s.replace(/([a-z])([A-Z])/g, "$1 $2");
  // Collapse whitespace
  s = s.replace(/\s+/g, " ").trim();
  return s;
}

/** "John Smith" → "John". Returns "" if no usable name. */
export function firstNameFrom(raw: string | null | undefined): string {
  if (!raw) return "";
  const n = raw.trim().split(/\s+/)[0];
  return n && /^[A-Za-z]/.test(n) ? n : "";
}

// ─── Body markup (lightweight: paragraphs + bullets) ─────────────────────────

/** Convert agent-edited plain text body into safe HTML. Supports:
 *  - blank-line-separated paragraphs
 *  - lines starting with "- " or "• " become bulleted lists
 *  - everything escaped; no inline HTML allowed */
function bodyToHtml(body: string): string {
  const cleaned = noEmDashes(body).trim();
  if (!cleaned) return "";

  const blocks = cleaned.split(/\n\s*\n/);
  const parts: string[] = [];

  for (const block of blocks) {
    const lines = block.split("\n");
    const isList = lines.every((l) => /^\s*[-•]\s+/.test(l));
    if (isList) {
      const items = lines.map((l) =>
        `<li style="margin:0 0 6px;line-height:1.55;">${escapeHtml(l.replace(/^\s*[-•]\s+/, ""))}</li>`,
      );
      parts.push(
        `<ul style="margin:0 0 16px;padding-left:20px;font-size:15px;color:#334155;">${items.join("")}</ul>`,
      );
    } else {
      parts.push(
        `<p style="margin:0 0 14px;font-size:15px;color:#334155;line-height:1.6;">${escapeHtml(block).replace(/\n/g, "<br>")}</p>`,
      );
    }
  }
  return parts.join("");
}

// ─── Default body builder (uses persona + services when available) ──────────

export type DefaultBodyContext = {
  businessNameDisplay: string;
  hasWebsite: boolean;
  painPoints: string[];        // from persona.painPoints
  opportunities: string[];     // from persona.opportunities
  recommendedServiceNames: string[]; // from lead.recommendedServices
  industry: string | null;
};

/** Build a smart, conversational default body that references the lead's
 * real pain points and the services we'd map to. Falls back gracefully when
 * persona data is missing. */
export function defaultIntroOfferBody(ctx: DefaultBodyContext): string {
  const lines: string[] = [];

  // Opening: did we actually research them, or are we generic?
  const haveSpecifics = ctx.painPoints.length > 0;

  if (haveSpecifics) {
    const opener = ctx.hasWebsite
      ? `Took a look at ${ctx.businessNameDisplay} and your website. Here's what jumped out:`
      : `Took a look at ${ctx.businessNameDisplay}. Here's what jumped out:`;
    lines.push(opener);
    lines.push("");

    // Top 3 pain points as bullets, em-dashes scrubbed.
    for (const p of ctx.painPoints.slice(0, 3)) {
      lines.push(`- ${noEmDashes(p)}`);
    }
    lines.push("");

    // Bridge: what we do that maps to those pains.
    if (ctx.recommendedServiceNames.length > 0) {
      const services = ctx.recommendedServiceNames.slice(0, 3).join(", ");
      lines.push(
        `These are the kinds of things we fix every day. A few of ours that would map to what you're working with: ${services}.`,
      );
    } else {
      const niche = ctx.industry ? `${ctx.industry} businesses` : "businesses like yours";
      lines.push(
        `These are the kinds of things we fix every day for ${niche}. We can talk through which pieces would help most.`,
      );
    }
    lines.push("");

    lines.push(
      `If any of that lands, I'd love to walk you through it. I'll knock 25% off our onboarding cost if you book a quick call in the next 24 hours.`,
    );
  } else {
    // No persona data yet, keep it generic but warm.
    const niche = ctx.industry || "your industry";
    lines.push(
      `We've been working with ${niche} businesses lately and there's a lot we can help with on the digital side, websites, lead capture, follow-up automation, all of it.`,
    );
    lines.push("");
    lines.push(
      `I'd love to talk through what would move the needle for ${ctx.businessNameDisplay}. I'll knock 25% off our onboarding cost if you book a quick call in the next 24 hours.`,
    );
  }

  return lines.join("\n");
}

// ─── Email render ────────────────────────────────────────────────────────────

export type IntroOfferEmailParams = {
  /** First name shown in the greeting. Empty string → "Hey there,". */
  recipientFirstName: string;
  /** Cleaned business name shown in the email. */
  businessNameDisplay: string;
  /** Sales rep's name shown in the signature. */
  fromName: string;
  /** Public URL to the offer landing page (with countdown + booking link). */
  offerUrl: string;
  /** When the offer expires, used in the deadline block. */
  expiresAt: Date;
  /** Subject line. Required, but the agent's edit OR a default. */
  subject: string;
  /** Body (paragraphs + bullets). Required, agent's edit OR built default. */
  body: string;
};

export type IntroOfferEmailRendered = {
  subject: string;
  html: string;
  text: string;
};

function formatDeadline(d: Date): string {
  const opts: Intl.DateTimeFormatOptions = {
    weekday: "long", month: "long", day: "numeric",
    hour: "numeric", minute: "2-digit", hour12: true,
    timeZone: "America/New_York",
  };
  return `${new Intl.DateTimeFormat("en-US", opts).format(d)} ET`;
}

export function defaultIntroOfferSubject(businessName: string): string {
  return `24 hours: 25% off onboarding for ${businessName}`;
}

/**
 * Pure email renderer. No I/O. Everything em-dash-free.
 */
export function buildIntroOfferEmail(args: IntroOfferEmailParams): IntroOfferEmailRendered {
  const subject = noEmDashes(args.subject);
  const greeting = args.recipientFirstName
    ? `Hey ${escapeHtml(args.recipientFirstName)},`
    : `Hey there,`;
  const deadline = formatDeadline(args.expiresAt);
  const businessName = escapeHtml(args.businessNameDisplay);
  const fromName = escapeHtml(args.fromName);

  const bodyHtml = bodyToHtml(args.body);

  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>${escapeHtml(subject)}</title>
</head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:#0f172a;line-height:1.55;">
  <div style="max-width:560px;margin:0 auto;padding:36px 24px;">

    <div style="font-size:11px;font-weight:800;letter-spacing:0.18em;color:#ea580c;text-transform:uppercase;margin-bottom:14px;">
      24-hour offer
    </div>

    <h1 style="font-size:24px;line-height:1.25;font-weight:800;margin:0 0 22px;color:#0f172a;">
      25% off onboarding for ${businessName}
    </h1>

    <p style="margin:0 0 14px;font-size:15px;color:#334155;">${greeting}</p>

    ${bodyHtml}

    <div style="background:#fff7ed;border:1px solid #fed7aa;border-radius:12px;padding:16px 18px;margin:22px 0;">
      <div style="font-size:11px;font-weight:800;color:#c2410c;text-transform:uppercase;letter-spacing:0.08em;margin-bottom:6px;">Offer expires</div>
      <div style="font-size:15px;font-weight:700;color:#9a3412;">${escapeHtml(deadline)}</div>
      <div style="font-size:12px;color:#9a3412;margin-top:6px;">Starting at $800 for a single landing page.</div>
    </div>

    <a href="${args.offerUrl}" style="display:inline-block;padding:14px 26px;background:linear-gradient(135deg,#ea580c,#db2777);color:white;border-radius:12px;text-decoration:none;font-weight:800;font-size:15px;">
      Claim my 25% off
    </a>

    <p style="margin:32px 0 4px;font-size:14px;color:#475569;">Talk soon,</p>
    <p style="margin:0;font-size:14px;color:#475569;font-weight:700;">${fromName}<br><span style="font-weight:400;color:#94a3b8;">INNOVAT3 Solutions</span></p>

    <p style="margin:24px 0 0;font-size:11px;color:#94a3b8;">
      If you'd rather we don't reach out again, just reply with "not interested" and I'll take you off the list.
    </p>
  </div>
</body>
</html>`;

  // Plain-text version. Simple newline-preserved.
  const text = [
    greeting.replace(/<[^>]+>/g, ""),
    "",
    noEmDashes(args.body),
    "",
    `Offer expires: ${deadline}`,
    `Starting at $800 for a single landing page.`,
    "",
    `Claim it here: ${args.offerUrl}`,
    "",
    `Talk soon,`,
    `${args.fromName}`,
    `INNOVAT3 Solutions`,
    "",
    `(Not interested? Just reply "not interested" and I'll take you off the list.)`,
  ].join("\n");

  return { subject, html, text };
}

// ─── Send (Resend) ───────────────────────────────────────────────────────────

export type SendIntroOfferEmailInput = IntroOfferEmailParams & {
  to: string;
  fromEmail: string;
};

export type SendIntroOfferResult = { ok: true; messageId: string } | { ok: false; error: string };

export async function sendIntroOfferEmail(input: SendIntroOfferEmailInput): Promise<SendIntroOfferResult> {
  if (!resend) return { ok: false, error: "RESEND_API_KEY is not configured." };
  if (!input.fromEmail && !process.env.RESEND_FROM_EMAIL) {
    return { ok: false, error: "RESEND_FROM_EMAIL is not configured." };
  }
  const from = input.fromEmail || process.env.RESEND_FROM_EMAIL!;

  const rendered = buildIntroOfferEmail(input);

  try {
    const { data, error } = await resend.emails.send({
      from,
      to: input.to,
      subject: rendered.subject,
      html: rendered.html,
      text: rendered.text,
    });
    if (error) return { ok: false, error: error.message || "Resend error" };
    return { ok: true, messageId: data?.id || "" };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Unknown send error" };
  }
}
