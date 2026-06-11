import { Module, forwardRef } from "@nestjs/common";
import { UnlocksController, UnlocksListController } from "./unlocks.controller";
import { UnlocksService } from "./unlocks.service";
import { PricingModule } from "../pricing/pricing.module";
import { WalletModule } from "../wallet/wallet.module";
import { PaymentsModule } from "../payments/payments.module";
import { AuthModule } from "../auth/auth.module";
import { BuildingsModule } from "../buildings/buildings.module";

import { MaintenanceModule } from "../maintenance/maintenance.module";

@Module({
  imports: [
    WalletModule,
    PricingModule,
    AuthModule,
    BuildingsModule,
    MaintenanceModule,
    forwardRef(() => PaymentsModule),
  ],
  controllers: [UnlocksController, UnlocksListController],
  providers: [UnlocksService],
  exports: [UnlocksService],
})
export class UnlocksModule {}
