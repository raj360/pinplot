import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  ServiceUnavailableException,
  UnauthorizedException,
} from "@nestjs/common";
import { EmailVerificationService } from "./email-verification.service";
import { SupabaseAdminService } from "./supabase-admin.service";
import { SendCodeDto, VerifyCodeDto } from "./dto/auth-otp.dto";

@Controller("auth")
export class AuthController {
  constructor(
    private readonly emailVerification: EmailVerificationService,
    private readonly supabaseAdmin: SupabaseAdminService,
  ) {}

  @Post("login/send-code")
  @HttpCode(HttpStatus.OK)
  async sendCode(@Body() body: SendCodeDto) {
    const result = await this.emailVerification.sendCode(body.email);
    if (!result.success) {
      return { success: false, message: result.message ?? "Could not send code" };
    }
    return { success: true, devCode: result.devCode };
  }

  @Post("login/verify-code")
  @HttpCode(HttpStatus.OK)
  async verifyCode(@Body() body: VerifyCodeDto) {
    const valid = await this.emailVerification.verifyCode(body.email, body.code);
    if (!valid) {
      throw new UnauthorizedException("Invalid or expired code");
    }

    if (!this.supabaseAdmin.isConfigured) {
      throw new ServiceUnavailableException(
        "Auth service is not configured (missing Supabase service role key)",
      );
    }

    const session = await this.supabaseAdmin.createSessionForEmail(body.email);
    if (!session) {
      throw new ServiceUnavailableException("Could not create sign-in session");
    }

    return {
      success: true,
      access_token: session.access_token,
      refresh_token: session.refresh_token,
      expires_in: session.expires_in,
    };
  }
}
