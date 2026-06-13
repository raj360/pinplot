import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PostmarkService } from "../notifications/postmark.service";
import { TransactionalEmailBuilder } from "../notifications/transactional-email-builder.service";
import { InAppNotificationsService } from "./in-app-notifications.service";
import { IN_APP_NOTIFICATION_TYPES } from "./in-app-notification.types";

export type UnlockReceiptNotification = {
  tenantId: string;
  tenantEmail: string | null;
  buildingName: string;
  unitNumber: string;
  amountUgx: number;
  paymentId: string;
  unlockId: string;
};

@Injectable()
export class TenantNotificationsService {
  private readonly logger = new Logger(TenantNotificationsService.name);

  constructor(
    private readonly postmark: PostmarkService,
    private readonly config: ConfigService,
    private readonly emails: TransactionalEmailBuilder,
    private readonly inApp: InAppNotificationsService,
  ) {}

  async notifyUnlockReceipt(
    payload: UnlockReceiptNotification,
  ): Promise<{ delivered: boolean }> {
    const unlocksUrl = this.appUrl(
      `/tenant/unlocks?unlock=${encodeURIComponent(payload.unlockId)}`,
    );

    await this.inApp.create({
      userId: payload.tenantId,
      type: IN_APP_NOTIFICATION_TYPES.UNLOCK_RECEIPT,
      title: `Unlock confirmed for ${payload.buildingName}`,
      body: `Unit ${payload.unitNumber}. Your contact access is active.`,
      ctaUrl: unlocksUrl,
      payload: {
        paymentId: payload.paymentId,
        amountUgx: payload.amountUgx,
      },
      dedupeKey: `payment:${payload.paymentId}:unlock_receipt`,
    });

    const email = payload.tenantEmail?.trim();
    if (!email) {
      this.logger.warn(`Unlock receipt skipped (no email): tenant=${payload.tenantId}`);
      return { delivered: false };
    }

    const { html, text } = this.emails.buildUnlockReceiptEmail(
      payload.buildingName,
      payload.unitNumber,
      payload.amountUgx,
      unlocksUrl,
    );

    const result = await this.postmark.sendEmail({
      to: email,
      subject: `PlotPin unlock for ${payload.buildingName} Unit ${payload.unitNumber}`,
      textBody: text,
      htmlBody: html,
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
