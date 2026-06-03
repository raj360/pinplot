import { Global, Module } from "@nestjs/common";
import { SupabaseAuthGuard } from "./supabase-auth.guard";
import { OptionalSupabaseAuthGuard } from "./optional-supabase-auth.guard";
import { RolesGuard } from "./roles.guard";
import { AuthController } from "./auth.controller";
import { EmailVerificationService, EmailDeliveryService } from "./email-verification.service";
import { SupabaseAdminService } from "./supabase-admin.service";

import { AuthProfileService } from "./auth-profile.service";

@Global()
@Module({
  controllers: [AuthController],
  providers: [
    AuthProfileService,
    SupabaseAuthGuard,
    OptionalSupabaseAuthGuard,
    RolesGuard,
    EmailVerificationService,
    EmailDeliveryService,
    SupabaseAdminService,
  ],
  exports: [
    AuthProfileService,
    SupabaseAuthGuard,
    OptionalSupabaseAuthGuard,
    RolesGuard,
    SupabaseAdminService,
  ],
})
export class AuthModule {}
