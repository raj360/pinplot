import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PostmarkService } from "../notifications/postmark.service";

export type ListingRejectedNotification = {
  landlordId: string;
  landlordEmail: string | null;
  buildingId: string;
  buildingName: string;
  reason: string;
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
  ) {}

  private appUrl(path: string) {
    const base =
      this.config.get<string>("CORS_ORIGIN")?.trim() ||
      "http://localhost:3000";
    return `${base.replace(/\/$/, "")}${path}`;
  }

  async notifyListingApproved(
    payload: ListingApprovedNotification,
  ): Promise<{ delivered: boolean; channel: "postmark" | "stub" }> {
    const email = payload.landlordEmail?.trim();
    if (!email) {
      this.logger.warn(
        `Listing approved (no email): building=${payload.buildingId} landlord=${payload.landlordId}`,
      );
      return { delivered: false, channel: "stub" };
    }

    const manageUrl = this.appUrl(
      `/landlord/buildings/${payload.buildingId}`,
    );
    const subject = `PlotPin: "${payload.buildingName}" is approved`;
    const textBody = [
      `Your listing "${payload.buildingName}" has been approved on PlotPin.`,
      "",
      "Listing is free. Mark at least one unit as available when you are ready for tenants to discover it on the map.",
      "",
      `Manage your building: ${manageUrl}`,
      "",
      "— PlotPin",
    ].join("\n");

    const result = await this.postmark.sendEmail({
      to: email,
      subject,
      textBody,
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

    const dashboardUrl = this.appUrl("/landlord/dashboard");
    const subject = `PlotPin: "${payload.buildingName}" needs changes`;
    const textBody = [
      `Your listing "${payload.buildingName}" was not approved yet.`,
      "",
      "Reason:",
      payload.reason,
      "",
      "Fix the issues in your dashboard and resubmit for review.",
      "",
      dashboardUrl,
      "",
      "— PlotPin",
    ].join("\n");

    const result = await this.postmark.sendEmail({
      to: email,
      subject,
      textBody,
      tag: "landlord_listing_rejected",
    });

    return {
      delivered: result.delivered,
      channel: result.delivered ? "postmark" : "stub",
    };
  }
}
