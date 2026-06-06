import { Module, forwardRef } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module";
import { PricingModule } from "../pricing/pricing.module";
import { WalletModule } from "../wallet/wallet.module";
import { UnlocksModule } from "../unlocks/unlocks.module";
import { FlutterwaveService } from "./flutterwave.service";
import { LemonSqueezyService } from "./lemon-squeezy.service";
import { SettleUnlockService } from "./settle-unlock.service";
import { UnlockCheckoutService } from "./unlock-checkout.service";
import { WebhooksController } from "./webhooks.controller";
import { PaymentsController } from "./payments.controller";

@Module({
  imports: [
    AuthModule,
    PricingModule,
    WalletModule,
    forwardRef(() => UnlocksModule),
  ],
  controllers: [WebhooksController, PaymentsController],
  providers: [
    FlutterwaveService,
    LemonSqueezyService,
    SettleUnlockService,
    UnlockCheckoutService,
  ],
  exports: [
    FlutterwaveService,
    LemonSqueezyService,
    SettleUnlockService,
    UnlockCheckoutService,
  ],
})
export class PaymentsModule {}
