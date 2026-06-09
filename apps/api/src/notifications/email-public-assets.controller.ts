import { Controller, Get, Res } from "@nestjs/common";
import type { Response } from "express";
import { streamTransactionalEmailLogoPng } from "./stream-transactional-email-logo";

/** Canonical email asset path — matches Next.js `public/plotpin-logo-email.png`. */
@Controller("email-assets")
export class EmailPublicAssetsController {
  @Get("plotpin-logo-email.png")
  logoPng(@Res() res: Response): void {
    streamTransactionalEmailLogoPng(res);
  }
}

/** Root alias when testers hit the API host only. */
@Controller()
export class EmailLogoRootAliasController {
  @Get("plotpin-logo-email.png")
  logoPngAtApiRoot(@Res() res: Response): void {
    streamTransactionalEmailLogoPng(res);
  }
}
