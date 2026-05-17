// Send the short outreach email with a link to the public proposal viewer.

import { Resend } from "resend";
import type { ProposalJSON } from "@/lib/sales/proposal-schema";

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

export type SendProposalEmailInput = {
  to: string;
  fromName: string; // sales rep's name to personalize sign-off
  fromEmail: string; // optional override for the From address
  proposal: ProposalJSON;
  proposalUrl: string; // absolute URL to /p/[token]
  mockupImageUrl: string | null; // absolute URL — embedded inline as <img>
  customMessage?: string | null; // rep can tweak the body before send
};

function buildHtml(args: SendProposalEmailInput): string {
  const headline = args.proposal.pitch.headline;
  const bizName = args.proposal.client.businessName;
  const personalNote = args.customMessage?.trim();

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>A proposal for ${escapeHtml(bizName)}</title>
</head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:#0f172a;line-height:1.5;">
  <div style="max-width:560px;margin:0 auto;padding:32px 24px;">
    <p style="margin:0 0 16px;font-size:15px;">Hi ${escapeHtml(args.proposal.client.primaryContact.name?.split(" ")[0] || "there")},</p>

    ${personalNote
      ? `<p style="margin:0 0 16px;font-size:15px;white-space:pre-wrap;">${escapeHtml(personalNote)}</p>`
      : `<p style="margin:0 0 16px;font-size:15px;">I put together a proposal for ${escapeHtml(bizName)} — including a preview of what your new website could look like. Take a look:</p>`}

    ${args.mockupImageUrl
      ? `<a href="${args.proposalUrl}" style="display:block;margin:24px 0;text-decoration:none;">
          <img src="${args.mockupImageUrl}" alt="${escapeHtml(bizName)} website preview" style="display:block;width:100%;max-width:512px;height:auto;border-radius:12px;border:1px solid #e2e8f0;">
        </a>`
      : ""}

    <p style="margin:24px 0 8px;font-size:18px;font-weight:700;">${escapeHtml(headline)}</p>

    <a href="${args.proposalUrl}" style="display:inline-block;margin:16px 0 24px;padding:12px 22px;background:#4318ff;color:white;border-radius:10px;text-decoration:none;font-weight:700;font-size:14px;">View the full proposal →</a>

    <p style="margin:24px 0 4px;font-size:14px;color:#475569;">— ${escapeHtml(args.fromName)}<br>INNOVAT3 Solutions</p>
  </div>
</body>
</html>`;
}

function buildText(args: SendProposalEmailInput): string {
  const lines: string[] = [];
  lines.push(`Hi ${args.proposal.client.primaryContact.name?.split(" ")[0] || "there"},`);
  lines.push("");
  if (args.customMessage?.trim()) {
    lines.push(args.customMessage.trim());
  } else {
    lines.push(`I put together a proposal for ${args.proposal.client.businessName} — including a preview of what your new website could look like.`);
  }
  lines.push("");
  lines.push(args.proposal.pitch.headline);
  lines.push("");
  lines.push(`View the full proposal: ${args.proposalUrl}`);
  lines.push("");
  lines.push(`— ${args.fromName}`);
  lines.push("INNOVAT3 Solutions");
  return lines.join("\n");
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export type SendResult = { ok: true; messageId: string } | { ok: false; error: string };

export async function sendProposalEmail(input: SendProposalEmailInput): Promise<SendResult> {
  if (!resend) {
    return { ok: false, error: "RESEND_API_KEY is not configured on the server." };
  }
  if (!process.env.RESEND_FROM_EMAIL && !input.fromEmail) {
    return { ok: false, error: "RESEND_FROM_EMAIL is not configured on the server." };
  }

  const from = input.fromEmail || process.env.RESEND_FROM_EMAIL!;
  const subject = `${input.proposal.pitch.headline} — for ${input.proposal.client.businessName}`;

  try {
    const { data, error } = await resend.emails.send({
      from,
      to: input.to,
      subject,
      html: buildHtml(input),
      text: buildText(input),
    });
    if (error) return { ok: false, error: error.message || "Resend error" };
    return { ok: true, messageId: data?.id || "" };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown send error";
    return { ok: false, error: msg };
  }
}
