import { Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module";
import { SavedBuildingsController } from "./saved-buildings.controller";
import { SavedBuildingsService } from "./saved-buildings.service";

@Module({
  imports: [AuthModule],
  controllers: [SavedBuildingsController],
  providers: [SavedBuildingsService],
  exports: [SavedBuildingsService],
})
export class SavedBuildingsModule {}
