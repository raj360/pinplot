import { Module } from "@nestjs/common";
import { ProfilesController } from "./profiles.controller";
import { WalletModule } from "../wallet/wallet.module";

@Module({
  imports: [WalletModule],
  controllers: [ProfilesController],
})
export class ProfilesModule {}
