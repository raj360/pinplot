import { Controller, Get, UseGuards } from "@nestjs/common";
import { SupabaseAuthGuard } from "../auth/supabase-auth.guard";
import { CurrentUser } from "../auth/current-user.decorator";
import { AuthUser } from "../auth/auth.types";
import { WalletService } from "./wallet.service";

@Controller("wallet")
@UseGuards(SupabaseAuthGuard)
export class WalletController {
  constructor(private readonly wallet: WalletService) {}

  @Get()
  getWallet(@CurrentUser() user: AuthUser) {
    return this.wallet.getWallet(user.id);
  }
}
