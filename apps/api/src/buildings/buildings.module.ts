import { Module } from "@nestjs/common";
import {
  AdminBuildingsController,
  BuildingsController,
} from "./buildings.controller";
import { BuildingsService } from "./buildings.service";

@Module({
  controllers: [BuildingsController, AdminBuildingsController],
  providers: [BuildingsService],
})
export class BuildingsModule {}
