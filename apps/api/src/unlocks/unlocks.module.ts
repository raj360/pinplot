import { Module } from "@nestjs/common";
import { UnlocksController, UnlocksListController } from "./unlocks.controller";
import { UnlocksService } from "./unlocks.service";
import { WalletModule } from "../wallet/wallet.module";

@Module({
  imports: [WalletModule],
  controllers: [UnlocksController, UnlocksListController],
  providers: [UnlocksService],
  exports: [UnlocksService],
})
export class UnlocksModule {}
