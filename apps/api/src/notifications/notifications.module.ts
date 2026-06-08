import { Global, Module } from "@nestjs/common";
import { PostmarkService } from "./postmark.service";
import { TenantNotificationsService } from "./tenant-notifications.service";
import { TransactionalEmailBuilder } from "./transactional-email-builder.service";
import {
  EmailLogoRootAliasController,
  EmailPublicAssetsController,
} from "./email-public-assets.controller";

@Global()
@Module({
  controllers: [EmailPublicAssetsController, EmailLogoRootAliasController],
  providers: [
    PostmarkService,
    TransactionalEmailBuilder,
    TenantNotificationsService,
  ],
  exports: [PostmarkService, TransactionalEmailBuilder, TenantNotificationsService],
})
export class NotificationsModule {}
