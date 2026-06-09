import { Module } from "@nestjs/common";
import { ProfilesController } from "./profiles.controller";
import { AdminUsersController } from "./admin-users.controller";
import { AdminUsersService } from "./admin-users.service";
import { WalletModule } from "../wallet/wallet.module";
import { AuthModule } from "../auth/auth.module";

@Module({
  imports: [WalletModule, AuthModule],
  controllers: [ProfilesController, AdminUsersController],
  providers: [AdminUsersService],
})
export class ProfilesModule {}
