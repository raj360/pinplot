import { Module } from "@nestjs/common";
import { UnlocksController, UnlocksListController } from "./unlocks.controller";
import { UnlocksService } from "./unlocks.service";

@Module({
  controllers: [UnlocksController, UnlocksListController],
  providers: [UnlocksService],
  exports: [UnlocksService],
})
export class UnlocksModule {}
