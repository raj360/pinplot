import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PostmarkService } from "../notifications/postmark.service";
import { TransactionalEmailBuilder } from "../notifications/transactional-email-builder.service";
import { InAppNotificationsService } from "../notifications/in-app-notifications.service";
import { IN_APP_NOTIFICATION_TYPES } from "../notifications/in-app-notification.types";

export type ListingRejectedNotification = {
  landlordId: string;
  landlordEmail: string | null;
  buildingId: string;
  buildingName: string;
  reason: string;
};

export type UnlockReceivedNotification = {
  landlordId: string;
  landlordEmail: string | null;
  buildingId: string;
  buildingName: string;
  unitNumber: string;
  paymentId: string;
};

export type ListingApprovedNotification = {
  landlordId: string;
  landlordEmail: string | null;
  buildingId: string;
  buildingName: string;
};

@Injectable()
export class LandlordNotificationsService {
  private readonly logger = new Logger(LandlordNotificationsService.name);

  constructor(
    private readonly postmark: PostmarkService,
    private readonly config: ConfigService,
    private readonly emails: TransactionalEmailBuilder,
    private readonly inApp: InAppNotificationsService,
  ) {}

  private appUrl(path: string) {
    const base =
      this.config.get<string>("CORS_ORIGIN")?.trim() ||
      "http://localhost:3000";
    return `${base.replace(/\/$/, "")}${path}`;
  }

  async notifyUnlockReceived(
    payload: UnlockReceivedNotification,
  ): Promise<{ delivered: boolean; channel: "postmark" | "stub" }> {
    const manageUrl = this.appUrl(
      `/landlord/buildings/${payload.buildingId}`,
    );

    await this.inApp.create({
      userId: payload.landlordId,
      type: IN_APP_NOTIFICATION_TYPES.UNLOCK_RECEIVED,
      title: `Tenant unlocked Unit ${payload.unitNumber}`,
      body: `${payload.buildingName}. A tenant paid to contact you.`,
      ctaUrl: manageUrl,
      payload: {
        buildingId: payload.buildingId,
        unitNumber: payload.unitNumber,
        paymentId: payload.paymentId,
      },
      dedupeKey: `payment:${payload.paymentId}:unlock_received`,
    });

    const email = payload.landlordEmail?.trim();
    if (!email) {
      this.logger.warn(
        `Unlock received (no email): building=${payload.buildingId} landlord=${payload.landlordId}`,
      );
      return { delivered: false, channel: "stub" };
    }

    const { html, text } = this.emails.buildUnlockReceivedEmail(
      payload.buildingName,
      payload.unitNumber,
      manageUrl,
    );

    const result = await this.postmark.sendEmail({
      to: email,
      subject: `PlotPin: tenant unlocked Unit ${payload.unitNumber}`,
      textBody: text,
      htmlBody: html,
      tag: "landlord_unlock_received",
    });

    return {
      delivered: result.delivered,
      channel: result.delivered ? "postmark" : "stub",
    };
  }

  async notifyListingApproved(
    payload: ListingApprovedNotification,
  ): Promise<{ delivered: boolean; channel: "postmark" | "stub" }> {
    const manageUrl = this.appUrl(
      `/landlord/buildings/${payload.buildingId}`,
    );

    await this.inApp.create({
      userId: payload.landlordId,
      type: IN_APP_NOTIFICATION_TYPES.LISTING_APPROVED,
      title: `"${payload.buildingName}" is approved`,
      body: "Mark units available when you are ready for tenant unlocks.",
      ctaUrl: manageUrl,
      payload: { buildingId: payload.buildingId },
      dedupeKey: `building:${payload.buildingId}:approved`,
    });

    const email = payload.landlordEmail?.trim();
    if (!email) {
      this.logger.warn(
        `Listing approved (no email): building=${payload.buildingId} landlord=${payload.landlordId}`,
      );
      return { delivered: false, channel: "stub" };
    }

    const { html, text } = this.emails.buildListingApprovedEmail(
      payload.buildingName,
      manageUrl,
    );

    const result = await this.postmark.sendEmail({
      to: email,
      subject: `PlotPin: "${payload.buildingName}" is approved`,
      textBody: text,
      htmlBody: html,
      tag: "landlord_listing_approved",
    });

    return {
      delivered: result.delivered,
      channel: result.delivered ? "postmark" : "stub",
    };
  }

  async notifyListingRejected(
    payload: ListingRejectedNotification,
  ): Promise<{ delivered: boolean; channel: "postmark" | "stub" }> {
    const dashboardUrl = this.appUrl("/landlord/dashboard");

    await this.inApp.create({
      userId: payload.landlordId,
      type: IN_APP_NOTIFICATION_TYPES.LISTING_REJECTED,
      title: `"${payload.buildingName}" needs changes`,
      body: payload.reason,
      ctaUrl: dashboardUrl,
      payload: {
        buildingId: payload.buildingId,
        reason: payload.reason,
      },
      dedupeKey: `building:${payload.buildingId}:rejected:${payload.reason.slice(0, 64)}`,
    });

    const email = payload.landlordEmail?.trim();
    if (!email) {
      this.logger.log(
        [
          "Listing rejected (no email)",
          `building=${payload.buildingId}`,
          `landlord=${payload.landlordId}`,
          `reason=${payload.reason}`,
        ].join(" · "),
      );
      return { delivered: false, channel: "stub" };
    }

    const { html, text } = this.emails.buildListingRejectedEmail(
      payload.buildingName,
      payload.reason,
      dashboardUrl,
    );

    const result = await this.postmark.sendEmail({
      to: email,
      subject: `PlotPin: "${payload.buildingName}" needs changes`,
      textBody: text,
      htmlBody: html,
      tag: "landlord_listing_rejected",
    });

    return {
      delivered: result.delivered,
      channel: result.delivered ? "postmark" : "stub",
    };
  }
}
