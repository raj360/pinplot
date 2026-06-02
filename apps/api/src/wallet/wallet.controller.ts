import { Body, Controller, Get, Post, UseGuards } from "@nestjs/common";
import { SupabaseAuthGuard } from "../auth/supabase-auth.guard";
import { CurrentUser } from "../auth/current-user.decorator";
import { AuthUser } from "../auth/auth.types";
import { WalletService } from "./wallet.service";
import { CouponsService } from "../coupons/coupons.service";
import { RedeemCouponDto } from "../coupons/dto/coupon.dto";

@Controller("wallet")
@UseGuards(SupabaseAuthGuard)
export class WalletController {
  constructor(
    private readonly wallet: WalletService,
    private readonly coupons: CouponsService,
  ) {}

  @Get()
  getWallet(@CurrentUser() user: AuthUser) {
    return this.wallet.getWallet(user.id);
  }

  @Post("redeem-coupon")
  async redeemCoupon(@CurrentUser() user: AuthUser, @Body() dto: RedeemCouponDto) {
    const credit = await this.coupons.redeemCoupon(user.id, dto.code);
    const wallet = await this.wallet.getWallet(user.id);
    return { credit, wallet };
  }
}
