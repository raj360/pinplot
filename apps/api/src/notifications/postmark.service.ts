import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

type SendEmailInput = {
  to: string;
  subject: string;
  textBody: string;
  htmlBody?: string;
  tag?: string;
};

@Injectable()
export class PostmarkService {
  private readonly logger = new Logger(PostmarkService.name);

  constructor(private readonly config: ConfigService) {}

  isConfigured(): boolean {
    return Boolean(
      this.config.get<string>("POSTMARK_SERVER_TOKEN")?.trim() &&
        this.config.get<string>("POSTMARK_FROM_EMAIL")?.trim(),
    );
  }

  async sendEmail(input: SendEmailInput): Promise<{ delivered: boolean }> {
    const token = this.config.get<string>("POSTMARK_SERVER_TOKEN")?.trim();
    const from = this.config.get<string>("POSTMARK_FROM_EMAIL")?.trim();
    const replyTo = this.config.get<string>("POSTMARK_REPLY_TO_EMAIL")?.trim();

    if (!token || !from) {
      this.logger.warn(
        `Postmark skipped (${input.tag ?? "email"}): POSTMARK_SERVER_TOKEN or POSTMARK_FROM_EMAIL not set`,
      );
      return { delivered: false };
    }

    const payload: Record<string, string | undefined> = {
      From: from,
      To: input.to,
      Subject: input.subject,
      TextBody: input.textBody,
      HtmlBody: input.htmlBody ?? undefined,
      MessageStream: "outbound",
      Tag: input.tag,
    };
    if (replyTo) {
      payload.ReplyTo = replyTo;
    }

    const res = await fetch("https://api.postmarkapp.com/email", {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        "X-Postmark-Server-Token": token,
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const body = await res.text().catch(() => "");
      this.logger.error(
        `Postmark send failed (${res.status}): ${body.slice(0, 500)}`,
      );
      return { delivered: false };
    }

    return { delivered: true };
  }
}
