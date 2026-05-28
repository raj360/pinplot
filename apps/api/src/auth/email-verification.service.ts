import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { DatabaseService } from "../database/database.service";
import {
  CODE_LENGTH,
  DEFAULT_TTL_SECONDS,
} from "./supabase-admin.service";

@Injectable()
export class EmailDeliveryService {
  private readonly logger = new Logger(EmailDeliveryService.name);

  constructor(private readonly config: ConfigService) {}

  /**
   * Dev: log code to API terminal.
   * Prod (later): Postmark transactional email from PlotPin.
   */
  async sendLoginCode(email: string, code: string): Promise<boolean> {
    const postmarkToken = this.config.get<string>("POSTMARK_SERVER_TOKEN");
    const fromEmail =
      this.config.get<string>("POSTMARK_FROM_EMAIL") ?? "noreply@plotpin.app";

    if (postmarkToken?.trim()) {
      // Postmark integration — wire in when credentials are ready.
      this.logger.warn(
        `POSTMARK_SERVER_TOKEN is set but Postmark sender is not implemented yet (${fromEmail})`,
      );
      return false;
    }

    this.logger.log(
      [
        "",
        "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━",
        `  PlotPin sign-in code for ${email}`,
        `  Code: ${code}`,
        "  (Dev mode — configure Postmark for production email)",
        "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━",
        "",
      ].join("\n"),
    );
    return true;
  }
}

@Injectable()
export class EmailVerificationService {
  constructor(
    private readonly config: ConfigService,
    private readonly db: DatabaseService,
    private readonly emailDelivery: EmailDeliveryService,
  ) {}

  private get devCode(): string | undefined {
    const explicit = this.config.get<string>("AUTH_OTP_DEV_CODE")?.trim();
    if (explicit) return explicit;
    if (this.config.get<string>("NODE_ENV") === "production") return undefined;
    return undefined;
  }

  private get codeTtlSeconds(): number {
    const raw = this.config.get<string>("AUTH_OTP_CODE_TTL");
    const parsed = raw ? parseInt(raw, 10) : DEFAULT_TTL_SECONDS;
    return Number.isFinite(parsed) ? parsed : DEFAULT_TTL_SECONDS;
  }

  private generateCode(): string {
    const dev = this.devCode;
    if (dev) return dev.padStart(CODE_LENGTH, "0").slice(-CODE_LENGTH);

    let code = "";
    for (let i = 0; i < CODE_LENGTH; i++) {
      code += Math.floor(Math.random() * 10).toString();
    }
    return code;
  }

  async sendCode(
    email: string,
  ): Promise<{ success: boolean; message?: string; devCode?: string }> {
    const normalized = email.trim().toLowerCase();
    if (!normalized) {
      return { success: false, message: "Email is required" };
    }

    const code = this.generateCode();
    const ttl = this.codeTtlSeconds;

    await this.db.query(
      `INSERT INTO auth_otp_codes (email, code, expires_at)
       VALUES ($1, $2, NOW() + ($3 || ' seconds')::interval)
       ON CONFLICT (email) DO UPDATE
       SET code = EXCLUDED.code,
           expires_at = EXCLUDED.expires_at,
           created_at = NOW()`,
      [normalized, code, ttl.toString()],
    );

    const sent = await this.emailDelivery.sendLoginCode(normalized, code);
    if (!sent) {
      return {
        success: false,
        message: "Could not deliver sign-in code. Try again later.",
      };
    }

    const isProd = this.config.get<string>("NODE_ENV") === "production";
    if (!isProd) {
      return { success: true, devCode: code };
    }

    return { success: true };
  }

  async verifyCode(email: string, code: string): Promise<boolean> {
    const normalized = email.trim().toLowerCase();
    const codeTrimmed = code.trim();
    if (!normalized || codeTrimmed.length !== CODE_LENGTH) return false;

    const { rows } = await this.db.query<{ code: string }>(
      `SELECT code FROM auth_otp_codes
       WHERE email = $1 AND expires_at > NOW()`,
      [normalized],
    );

    const stored = rows[0]?.code;
    if (!stored || stored !== codeTrimmed) return false;

    await this.db.query(`DELETE FROM auth_otp_codes WHERE email = $1`, [
      normalized,
    ]);
    return true;
  }
}
