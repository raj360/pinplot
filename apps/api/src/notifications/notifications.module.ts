import { Global, Module } from "@nestjs/common";
import { PostmarkService } from "./postmark.service";
import { TenantNotificationsService } from "./tenant-notifications.service";
import { TransactionalEmailBuilder } from "./transactional-email-builder.service";
import { NotificationLogService } from "./notification-log.service";
import { ScheduledNotificationsService } from "./scheduled-notifications.service";
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
    NotificationLogService,
    ScheduledNotificationsService,
  ],
  exports: [
    PostmarkService,
    TransactionalEmailBuilder,
    TenantNotificationsService,
    NotificationLogService,
    ScheduledNotificationsService,
  ],
})
export class NotificationsModule {}
