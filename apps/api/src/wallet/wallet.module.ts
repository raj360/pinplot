import { Module } from "@nestjs/common";
import { WalletController } from "./wallet.controller";
import { WalletService } from "./wallet.service";
import { PricingModule } from "../pricing/pricing.module";
import { CouponsModule } from "../coupons/coupons.module";

@Module({
  imports: [PricingModule, CouponsModule],
  controllers: [WalletController],
  providers: [WalletService],
  exports: [WalletService],
})
export class WalletModule {}
