import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import {
  emailCodeBlock,
  emailMutedParagraph,
  emailParagraph,
  emailPrimaryButton,
  escapeHtml,
  frameTransactionalEmailHtml,
} from "./transactional-email-layout";
import { resolveTransactionalEmailLogoSrc } from "./resolve-transactional-email-logo";

@Injectable()
export class TransactionalEmailBuilder {
  constructor(private readonly config: ConfigService) {}

  private webBaseUrl(): string | null {
    const raw =
      this.config.get<string>("WEB_APP_URL")?.trim() ||
      this.config.get<string>("NEXT_PUBLIC_APP_URL")?.trim() ||
      this.config.get<string>("CORS_ORIGIN")?.split(",")[0]?.trim() ||
      null;
    return raw?.replace(/\/$/, "") ?? null;
  }

  private logoSrc(): string | null {
    return resolveTransactionalEmailLogoSrc(this.config, this.webBaseUrl());
  }

  buildLoginCodeEmail(code: string): { html: string; text: string } {
    const web = this.webBaseUrl();
    const logoSrc = this.logoSrc();

    const html = frameTransactionalEmailHtml({
      preheader: `Your PlotPin sign-in code is ${code}`,
      heading: "Your sign-in code",
      webBaseUrl: web,
      logoSrc,
      bodyHtml: [
        emailParagraph("Use this code to sign in to PlotPin. It expires in a few minutes."),
        emailCodeBlock(code),
        emailMutedParagraph(
          "If you did not request this code, you can ignore this email.",
        ),
      ].join(""),
    });

    const text = [
      "Your PlotPin sign-in code",
      "",
      code,
      "",
      "Enter this code on the sign-in page. It expires shortly.",
      "",
      "If you did not request this, ignore this email.",
      "",
      "— PlotPin",
    ].join("\n");

    return { html, text };
  }

  buildListingApprovedEmail(buildingName: string, manageUrl: string) {
    return this.buildSimpleActionEmail({
      preheader: `"${buildingName}" is live on PlotPin`,
      heading: "Your listing is approved",
      intro: `Your listing <strong>${escapeHtml(buildingName)}</strong> has been approved and is ready for tenants to discover on the map.`,
      detail:
        "Listing is free. Mark at least one unit as available when you are ready for unlock requests.",
      buttonLabel: "Manage building",
      buttonUrl: manageUrl,
      textLines: [
        `Your listing "${buildingName}" has been approved on PlotPin.`,
        "",
        "Listing is free. Mark at least one unit as available when you are ready.",
        "",
        manageUrl,
      ],
    });
  }

  buildListingRejectedEmail(
    buildingName: string,
    reason: string,
    dashboardUrl: string,
  ) {
    return this.buildSimpleActionEmail({
      preheader: `"${buildingName}" needs changes before approval`,
      heading: "Listing needs changes",
      intro: `Your listing <strong>${escapeHtml(buildingName)}</strong> was not approved yet.`,
      detail: `<strong>Reason:</strong><br>${escapeHtml(reason).replace(/\n/g, "<br>")}`,
      buttonLabel: "Open dashboard",
      buttonUrl: dashboardUrl,
      textLines: [
        `Your listing "${buildingName}" was not approved yet.`,
        "",
        "Reason:",
        reason,
        "",
        "Fix the issues in your dashboard and resubmit for review.",
        "",
        dashboardUrl,
      ],
    });
  }

  buildUnlockReceivedEmail(
    buildingName: string,
    unitNumber: string,
    manageUrl: string,
  ) {
    return this.buildSimpleActionEmail({
      preheader: `A tenant unlocked Unit ${unitNumber} at ${buildingName}`,
      heading: "Tenant unlocked contact",
      intro: `A tenant unlocked contact for <strong>${escapeHtml(buildingName)}</strong> — Unit ${escapeHtml(unitNumber)}.`,
      detail:
        "They have a time-limited exclusive window to reach you. Respond promptly while the listing is fresh.",
      buttonLabel: "View building",
      buttonUrl: manageUrl,
      textLines: [
        `A tenant unlocked contact for "${buildingName}" — Unit ${unitNumber}.`,
        "",
        "They have a time-limited exclusive window to reach you.",
        "",
        manageUrl,
      ],
    });
  }

  buildUnlockReceiptEmail(
    buildingName: string,
    unitNumber: string,
    amountUgx: number,
    unlocksUrl: string,
  ) {
    const fee = `${amountUgx.toLocaleString()} UGX (or equivalent charged at checkout)`;
    return this.buildSimpleActionEmail({
      preheader: `Unlock active — ${buildingName} Unit ${unitNumber}`,
      heading: "Your unlock is active",
      intro: `You unlocked <strong>${escapeHtml(buildingName)}</strong> — Unit ${escapeHtml(unitNumber)}.`,
      detail: `Fee: ${escapeHtml(fee)}`,
      buttonLabel: "View contact & directions",
      buttonUrl: unlocksUrl,
      textLines: [
        "Your unlock is active.",
        "",
        `Building: ${buildingName}`,
        `Unit: ${unitNumber}`,
        `Fee: ${fee}`,
        "",
        unlocksUrl,
      ],
    });
  }

  buildUnlockExpiringLandlordEmail(
    buildingName: string,
    unitNumber: string,
    hoursLeft: number,
    manageUrl: string,
  ) {
    return this.buildSimpleActionEmail({
      preheader: `Unlock window ends in ~${hoursLeft}h — ${buildingName}`,
      heading: "Unlock window ending soon",
      intro: `A tenant's exclusive window for <strong>${escapeHtml(buildingName)}</strong> — Unit ${escapeHtml(unitNumber)} ends in about ${hoursLeft} hours.`,
      detail:
        "Respond while you still have their attention. If the unit is rented, mark it unavailable in your dashboard.",
      buttonLabel: "Manage building",
      buttonUrl: manageUrl,
      textLines: [
        `Unlock window ending soon for "${buildingName}" — Unit ${unitNumber}.`,
        "",
        `About ${hoursLeft} hours remain on the tenant's exclusive window.`,
        "",
        manageUrl,
      ],
    });
  }

  buildUnlockExpiringTenantEmail(
    buildingName: string,
    unitNumber: string,
    hoursLeft: number,
    isShortStay: boolean,
    unlocksUrl: string,
  ) {
    const detail = isShortStay
      ? `Your verified contact window ends in about ${hoursLeft} hours. Reach the landlord soon if you have not already.`
      : `Your exclusive window ends in about ${hoursLeft} hours. Contact the landlord or visit the property while access is active.`;
    return this.buildSimpleActionEmail({
      preheader: `Your unlock ends in ~${hoursLeft}h — ${buildingName}`,
      heading: "Unlock ending soon",
      intro: `Your access to <strong>${escapeHtml(buildingName)}</strong> — Unit ${escapeHtml(unitNumber)} expires in about ${hoursLeft} hours.`,
      detail,
      buttonLabel: "View contact",
      buttonUrl: unlocksUrl,
      textLines: [
        `Your unlock for "${buildingName}" — Unit ${unitNumber} ends in about ${hoursLeft} hours.`,
        "",
        detail,
        "",
        unlocksUrl,
      ],
    });
  }

  buildUnlockExpiredTenantEmail(
    buildingName: string,
    unitNumber: string,
    exploreUrl: string,
    isShortStay: boolean,
  ) {
    const detail = isShortStay
      ? "Your verified contact window has ended. You can unlock again on Explore if the unit is still listed."
      : "Your exclusive window has ended and landlord contact is no longer available from this unlock.";
    return this.buildSimpleActionEmail({
      preheader: `Unlock ended — ${buildingName}`,
      heading: "Unlock window ended",
      intro: `Your access to <strong>${escapeHtml(buildingName)}</strong> — Unit ${escapeHtml(unitNumber)} has expired.`,
      detail,
      buttonLabel: "Browse Explore",
      buttonUrl: exploreUrl,
      textLines: [
        `Your unlock for "${buildingName}" — Unit ${unitNumber} has expired.`,
        "",
        detail,
        "",
        exploreUrl,
      ],
    });
  }

  buildUnlockExpiredLandlordEmail(
    buildingName: string,
    unitNumber: string,
    manageUrl: string,
    locksUnit: boolean,
  ) {
    const detail = locksUnit
      ? "The tenant's exclusive window has ended. The unit should appear on the map again — update the status if it is rented."
      : "The tenant's contact window has ended. The listing remains available on the map.";
    return this.buildSimpleActionEmail({
      preheader: `Unlock ended — ${buildingName} Unit ${unitNumber}`,
      heading: "Tenant unlock ended",
      intro: `The unlock window for <strong>${escapeHtml(buildingName)}</strong> — Unit ${escapeHtml(unitNumber)} has ended.`,
      detail,
      buttonLabel: "Manage building",
      buttonUrl: manageUrl,
      textLines: [
        `Unlock ended for "${buildingName}" — Unit ${unitNumber}.`,
        "",
        detail,
        "",
        manageUrl,
      ],
    });
  }

  buildUnitLockEndedEmail(
    buildingName: string,
    unitNumber: string,
    manageUrl: string,
  ) {
    return this.buildSimpleActionEmail({
      preheader: `Unit ${unitNumber} is visible on the map again`,
      heading: "Exclusive lock ended",
      intro: `The exclusive map lock for <strong>${escapeHtml(buildingName)}</strong> — Unit ${escapeHtml(unitNumber)} has ended.`,
      detail:
        "The unit is visible to other tenants again. Mark it rented or unavailable if it is no longer on the market.",
      buttonLabel: "Update unit status",
      buttonUrl: manageUrl,
      textLines: [
        `Exclusive lock ended for "${buildingName}" — Unit ${unitNumber}.`,
        "",
        "The unit is visible on the map again.",
        "",
        manageUrl,
      ],
    });
  }

  buildFeaturedExpiringEmail(
    buildingName: string,
    daysLeft: number,
    manageUrl: string,
  ) {
    return this.buildSimpleActionEmail({
      preheader: `Featured boost ends in ${daysLeft} days — ${buildingName}`,
      heading: "Featured boost ending soon",
      intro: `Your featured placement for <strong>${escapeHtml(buildingName)}</strong> ends in about ${daysLeft} days.`,
      detail: "Renew featured to stay at the top of Explore and the homepage carousel.",
      buttonLabel: "Renew featured",
      buttonUrl: manageUrl,
      textLines: [
        `Featured boost for "${buildingName}" ends in about ${daysLeft} days.`,
        "",
        manageUrl,
      ],
    });
  }

  buildStaleAvailableEmail(
    buildingName: string,
    unitNumber: string,
    manageUrl: string,
  ) {
    return this.buildSimpleActionEmail({
      preheader: `Still available? — ${buildingName} Unit ${unitNumber}`,
      heading: "Listing still available?",
      intro: `Unit ${escapeHtml(unitNumber)} at <strong>${escapeHtml(buildingName)}</strong> has been marked available for over 30 days.`,
      detail:
        "If it is rented, mark the unit unavailable so tenants do not unlock outdated listings.",
      buttonLabel: "Manage building",
      buttonUrl: manageUrl,
      textLines: [
        `"${buildingName}" — Unit ${unitNumber} has been available for 30+ days.`,
        "",
        manageUrl,
      ],
    });
  }

  private buildSimpleActionEmail(opts: {
    preheader: string;
    heading: string;
    intro: string;
    detail: string;
    buttonLabel: string;
    buttonUrl: string;
    textLines: string[];
  }) {
    const web = this.webBaseUrl();
    const html = frameTransactionalEmailHtml({
      preheader: opts.preheader,
      heading: opts.heading,
      webBaseUrl: web,
      logoSrc: this.logoSrc(),
      bodyHtml: [
        emailParagraph(opts.intro),
        emailParagraph(opts.detail),
        emailPrimaryButton(opts.buttonLabel, opts.buttonUrl),
      ].join(""),
    });

    const text = [...opts.textLines, "", "— PlotPin"].join("\n");
    return { html, text };
  }
}
