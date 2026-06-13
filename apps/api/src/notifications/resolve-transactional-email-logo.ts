import { ConfigService } from "@nestjs/config";

const EMAIL_LOGO_FILENAME = "plotpin-logo-email.png";

function originFromUrl(raw: string | undefined): string | null {
  const trimmed = raw?.trim().replace(/\/$/, "") ?? "";
  if (!trimmed) return null;
  try {
    const url = new URL(
      trimmed.startsWith("http://") || trimmed.startsWith("https://")
        ? trimmed
        : `https://${trimmed}`,
    );
    const host = url.hostname.toLowerCase();
    const isLocal =
      host === "localhost" ||
      host === "127.0.0.1" ||
      host.endsWith(".local");
    if (isLocal) return null;
    return url.origin;
  } catch {
    return null;
  }
}

/**
 * Logo URL for HTML emails. Order:
 * 1. TRANSACTIONAL_EMAIL_LOGO_URL (explicit CDN / ngrok URL)
 * 2. WEB_APP_URL / NEXT_PUBLIC_APP_URL → `{origin}/plotpin-logo-email.png`
 * 3. API_PUBLIC_URL / API_URL → API-hosted PNG (works when web tunnel is down)
 */
export function resolveTransactionalEmailLogoSrc(
  config: ConfigService,
  webBaseUrl: string | null,
): string | null {
  const explicit = config.get<string>("TRANSACTIONAL_EMAIL_LOGO_URL")?.trim();
  if (explicit) return explicit;

  const webOrigin =
    originFromUrl(webBaseUrl ?? undefined) ??
    originFromUrl(config.get<string>("WEB_APP_URL")) ??
    originFromUrl(config.get<string>("NEXT_PUBLIC_APP_URL"));
  if (webOrigin) {
    return `${webOrigin}/${EMAIL_LOGO_FILENAME}`;
  }

  const apiOrigin =
    originFromUrl(config.get<string>("API_PUBLIC_URL")) ??
    originFromUrl(config.get<string>("API_URL"));
  if (apiOrigin) {
    return `${apiOrigin}/${EMAIL_LOGO_FILENAME}`;
  }

  return null;
}

/** Static tagline for emails, supply market is Uganda today. */
export function transactionalEmailTagline(): string {
  return "Map-first rentals · Uganda supply, global discovery";
}
