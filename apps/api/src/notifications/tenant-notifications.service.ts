import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PostmarkService } from "./postmark.service";

export type UnlockReceiptNotification = {
  tenantId: string;
  tenantEmail: string | null;
  buildingName: string;
  unitNumber: string;
  amountUgx: number;
};

@Injectable()
export class TenantNotificationsService {
  private readonly logger = new Logger(TenantNotificationsService.name);

  constructor(
    private readonly postmark: PostmarkService,
    private readonly config: ConfigService,
  ) {}

  async notifyUnlockReceipt(
    payload: UnlockReceiptNotification,
  ): Promise<{ delivered: boolean }> {
    const email = payload.tenantEmail?.trim();
    if (!email) {
      this.logger.warn(`Unlock receipt skipped (no email): tenant=${payload.tenantId}`);
      return { delivered: false };
    }

    const unlocksUrl = this.appUrl("/tenant/unlocks");
    const result = await this.postmark.sendEmail({
      to: email,
      subject: `PlotPin unlock — ${payload.buildingName} Unit ${payload.unitNumber}`,
      textBody: [
        "Your unlock is active.",
        "",
        `Building: ${payload.buildingName}`,
        `Unit: ${payload.unitNumber}`,
        `Fee: ${payload.amountUgx.toLocaleString()} UGX (or equivalent charged at checkout)`,
        "",
        `View contact and directions: ${unlocksUrl}`,
        "",
        "— PlotPin",
      ].join("\n"),
      tag: "tenant_unlock_receipt",
    });

    return { delivered: result.delivered };
  }

  private appUrl(path: string) {
    const base =
      this.config.get<string>("CORS_ORIGIN")?.split(",")[0]?.trim() ||
      "http://localhost:3000";
    return `${base.replace(/\/$/, "")}${path}`;
  }
}
