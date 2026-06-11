import { Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module";
import { PricingModule } from "../pricing/pricing.module";
import {
  AdminBuildingsController,
  AdminFeaturedController,
  BuildingsController,
} from "./buildings.controller";
import { BuildingsService } from "./buildings.service";
import { ExploreSearchCacheService } from "./explore-search-cache.service";
import { LandlordNotificationsService } from "./landlord-notifications.service";
import { AnalyticsModule } from "../analytics/analytics.module";
import { AnalyticsService } from "../analytics/analytics.service";

@Module({
  imports: [AuthModule, PricingModule, AnalyticsModule],
  controllers: [BuildingsController, AdminBuildingsController, AdminFeaturedController],
  providers: [
    BuildingsService,
    ExploreSearchCacheService,
    LandlordNotificationsService,
  ],
  exports: [LandlordNotificationsService],
})
export class BuildingsModule {}
