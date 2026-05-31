import { Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module";
import { PricingModule } from "../pricing/pricing.module";
import {
  AdminBuildingsController,
  BuildingsController,
} from "./buildings.controller";
import { BuildingsService } from "./buildings.service";
import { ExploreSearchCacheService } from "./explore-search-cache.service";

@Module({
  imports: [AuthModule, PricingModule],
  controllers: [BuildingsController, AdminBuildingsController],
  providers: [BuildingsService, ExploreSearchCacheService],
})
export class BuildingsModule {}
