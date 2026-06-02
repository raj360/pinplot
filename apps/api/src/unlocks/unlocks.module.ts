import { Module } from "@nestjs/common";
import { UnlocksController, UnlocksListController } from "./unlocks.controller";
import { UnlocksService } from "./unlocks.service";
import { PricingModule } from "../pricing/pricing.module";
import { WalletModule } from "../wallet/wallet.module";

@Module({
  imports: [WalletModule, PricingModule],
  controllers: [UnlocksController, UnlocksListController],
  providers: [UnlocksService],
  exports: [UnlocksService],
})
export class UnlocksModule {}
