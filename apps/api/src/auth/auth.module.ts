import { Module } from "@nestjs/common";
import { SupabaseAuthGuard } from "./supabase-auth.guard";
import { RolesGuard } from "./roles.guard";
import { AuthController } from "./auth.controller";
import { EmailVerificationService, EmailDeliveryService } from "./email-verification.service";
import { SupabaseAdminService } from "./supabase-admin.service";

@Module({
  controllers: [AuthController],
  providers: [
    SupabaseAuthGuard,
    RolesGuard,
    EmailVerificationService,
    EmailDeliveryService,
    SupabaseAdminService,
  ],
  exports: [SupabaseAuthGuard, RolesGuard],
})
export class AuthModule {}
