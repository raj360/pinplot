import { Injectable, Logger } from "@nestjs/common";

export type ListingRejectedNotification = {
  landlordId: string;
  landlordEmail: string | null;
  buildingId: string;
  buildingName: string;
  reason: string;
};

/** Dev/stub landlord notifications until Postmark (or similar) is wired in Sprint 5+. */
@Injectable()
export class LandlordNotificationsService {
  private readonly logger = new Logger(LandlordNotificationsService.name);

  async notifyListingRejected(
    payload: ListingRejectedNotification,
  ): Promise<{ delivered: boolean; channel: "stub" }> {
    this.logger.log(
      [
        "Listing rejected (notification stub)",
        `building=${payload.buildingId}`,
        `landlord=${payload.landlordId}`,
        payload.landlordEmail ? `email=${payload.landlordEmail}` : "email=unknown",
        `reason=${payload.reason}`,
      ].join(" · "),
    );

    return { delivered: false, channel: "stub" };
  }
}
