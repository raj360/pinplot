/**
 * Transactional HTML email frame, table layout, inline styles only (email clients).
 * Brand aligns with PlotPin web: primary #1d4ed8, soft canvas #f6f8fc.
 *
 * Logo: use hosted PNG (`plotpin-logo-email.png`) — many clients block SVG in `<img>`.
 */

export const PLOTPIN_EMAIL_BRAND = {
  primary: "#1d4ed8",
  primaryDark: "#1e40af",
  primaryForeground: "#ffffff",
  surface: "#ffffff",
  canvas: "#f6f8fc",
  footerBand: "#eaeef3",
  border: "#d4dce7",
  text: "#0f172a",
  textMuted: "#64748b",
  accent: "#1d4ed8",
} as const;

const FONT =
  "-apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif";

export function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export type TransactionalEmailFrameOptions = {
  preheader: string;
  heading: string;
  /** Trusted HTML only, must not include unescaped user input. */
  bodyHtml: string;
  webBaseUrl: string | null;
  privacyUrl?: string | null;
  year?: number;
  logoSrc?: string | null;
  tagline?: string | null;
};

export function frameTransactionalEmailHtml(
  opts: TransactionalEmailFrameOptions,
): string {
  const {
    primary,
    primaryDark,
    primaryForeground,
    surface,
    canvas,
    footerBand,
    border,
    text,
    textMuted,
    accent,
  } = PLOTPIN_EMAIL_BRAND;

  const year = opts.year ?? new Date().getFullYear();
  const exploreUrl = opts.webBaseUrl
    ? `${opts.webBaseUrl.replace(/\/$/, "")}/explore`
    : null;
  const privacy =
    opts.privacyUrl?.trim() ||
    (opts.webBaseUrl
      ? `${opts.webBaseUrl.replace(/\/$/, "")}/privacy`
      : null);

  const logoSrc = opts.logoSrc?.trim() ?? "";

  const logoBlock = logoSrc
    ? `<img src="${escapeHtml(logoSrc)}" width="99" height="46" alt="PlotPin" style="display:block;border:0;outline:none;text-decoration:none;height:32px;width:auto;">`
    : `<span style="font-size:22px;font-weight:700;color:${primaryForeground};">PlotPin</span>`;

  const tagline =
    opts.tagline?.trim() ||
    "Map-first rentals · Uganda supply, global discovery";

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta http-equiv="X-UA-Compatible" content="IE=edge">
<title>${escapeHtml(opts.heading)}</title>
<meta name="color-scheme" content="light">
</head>
<body style="margin:0;padding:0;background-color:${canvas};font-family:${FONT};color:${text};">
<div style="display:none;font-size:1px;line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;">
${escapeHtml(opts.preheader)}
</div>
<table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" bgcolor="${canvas}" style="background-color:${canvas};margin:0;padding:24px 12px;">
<tbody>
<tr>
<td align="center">
<table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width:560px;margin:0 auto;">
<tbody>
<tr>
<td style="background:linear-gradient(135deg, ${primary} 0%, ${primaryDark} 100%);border-radius:8px 8px 0 0;padding:20px 24px;" bgcolor="${primary}">
<table role="presentation" border="0" cellspacing="0" cellpadding="0">
<tbody>
<tr>
<td style="vertical-align:middle;">${logoBlock}</td>
</tr>
</tbody>
</table>
<p style="margin:12px 0 0;font-size:13px;line-height:1.5;color:${primaryForeground};opacity:0.85;font-family:${FONT};">
${escapeHtml(tagline)}
</p>
</td>
</tr>
<tr>
<td style="background-color:${surface};padding:28px 28px 24px;border-left:1px solid ${border};border-right:1px solid ${border};" bgcolor="${surface}">
<p style="margin:0 0 16px;font-size:20px;font-weight:700;letter-spacing:-0.02em;color:${text};font-family:${FONT};line-height:1.25;">
${escapeHtml(opts.heading)}
</p>
<div style="color:${text};font-size:15px;line-height:1.6;font-family:${FONT};">
${opts.bodyHtml}
</div>
</td>
</tr>
<tr>
<td style="background-color:${footerBand};padding:20px 28px 24px;border:1px solid ${border};border-radius:0 0 8px 8px;border-top:0;" bgcolor="${footerBand}">
<p style="margin:0;font-size:12px;line-height:1.65;color:${textMuted};font-family:${FONT};">
This message was sent by PlotPin. If you did not expect this email, you can safely ignore it.
${
  privacy
    ? ` See our <a href="${escapeHtml(privacy)}" style="color:${accent};text-decoration:underline;">Privacy Policy</a>.`
    : ""
}
</p>
${
  exploreUrl
    ? `<p style="margin:14px 0 0;font-size:12px;font-family:${FONT};">
<a href="${escapeHtml(exploreUrl)}" style="color:${accent};font-weight:600;text-decoration:underline;">Open the map →</a>
</p>`
    : ""
}
<p style="margin:18px 0 0;font-size:11px;color:${textMuted};font-family:${FONT};opacity:0.9;">
© ${year} PlotPin. All rights reserved.
</p>
</td>
</tr>
</tbody>
</table>
</td>
</tr>
</tbody>
</table>
</body>
</html>`;
}

export function emailParagraph(html: string): string {
  return `<p style="margin:0 0 16px;">${html}</p>`;
}

export function emailMutedParagraph(html: string): string {
  return `<p style="margin:0 0 16px;color:${PLOTPIN_EMAIL_BRAND.textMuted};font-size:14px;">${html}</p>`;
}

export function emailPrimaryButton(label: string, url: string): string {
  const { primary, primaryForeground } = PLOTPIN_EMAIL_BRAND;
  return `<table role="presentation" border="0" cellspacing="0" cellpadding="0" style="margin:20px 0;">
<tbody><tr>
<td style="border-radius:6px;background-color:${primary};">
<a href="${escapeHtml(url)}" target="_blank" rel="noopener noreferrer" style="display:inline-block;padding:12px 22px;font-size:14px;font-weight:600;color:${primaryForeground};text-decoration:none;font-family:${FONT};border-radius:6px;">
${escapeHtml(label)}
</a>
</td>
</tr></tbody></table>`;
}

export function emailCodeBlock(code: string): string {
  const { primary, canvas, border } = PLOTPIN_EMAIL_BRAND;
  return `<p style="margin:20px 0;font-size:32px;font-weight:700;letter-spacing:0.35em;color:${primary};font-family:${FONT};text-align:center;padding:16px;background-color:${canvas};border:1px solid ${border};border-radius:6px;">
${escapeHtml(code)}
</p>`;
}
