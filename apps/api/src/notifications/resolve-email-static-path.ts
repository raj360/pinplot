import { existsSync } from "fs";
import { join } from "path";

const EMAIL_LOGO_SEGMENTS = [
  "static",
  "email",
  "plotpin-logo-email.png",
] as const;

/** Resolve bundled PNG for transactional email `<img>` tags. */
export function resolveTransactionalEmailLogoPath(): string | null {
  const candidates = [
    join(__dirname, "..", "..", "..", ...EMAIL_LOGO_SEGMENTS),
    join(__dirname, "..", "..", ...EMAIL_LOGO_SEGMENTS),
    join(process.cwd(), ...EMAIL_LOGO_SEGMENTS),
    join(process.cwd(), "apps", "api", ...EMAIL_LOGO_SEGMENTS),
  ];
  for (const path of candidates) {
    if (existsSync(path)) {
      return path;
    }
  }
  return null;
}
