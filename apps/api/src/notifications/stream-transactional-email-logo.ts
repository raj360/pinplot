import { createReadStream } from "fs";
import { NotFoundException } from "@nestjs/common";
import type { Response } from "express";
import { resolveTransactionalEmailLogoPath } from "./resolve-email-static-path";

export function streamTransactionalEmailLogoPng(res: Response): void {
  const logoPath = resolveTransactionalEmailLogoPath();
  if (!logoPath) {
    throw new NotFoundException(
      "Email logo asset missing (expected apps/api/static/email/plotpin-logo-email.png)",
    );
  }
  res.setHeader("Content-Type", "image/png");
  res.setHeader("Cache-Control", "public, max-age=86400");
  createReadStream(logoPath).pipe(res);
}
