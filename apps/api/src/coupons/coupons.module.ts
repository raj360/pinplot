import { Module } from "@nestjs/common";
import { AdminCouponsController } from "./coupons.controller";
import { CouponsService } from "./coupons.service";
import { PricingModule } from "../pricing/pricing.module";

@Module({
  imports: [PricingModule],
  controllers: [AdminCouponsController],
  providers: [CouponsService],
  exports: [CouponsService],
})
export class CouponsModule {}
