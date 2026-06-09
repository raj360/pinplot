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
