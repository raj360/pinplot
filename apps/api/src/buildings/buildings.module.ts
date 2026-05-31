import { Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module";
import {
  AdminBuildingsController,
  BuildingsController,
} from "./buildings.controller";
import { BuildingsService } from "./buildings.service";
import { ExploreSearchCacheService } from "./explore-search-cache.service";

@Module({
  imports: [AuthModule],
  controllers: [BuildingsController, AdminBuildingsController],
  providers: [BuildingsService, ExploreSearchCacheService],
})
export class BuildingsModule {}
