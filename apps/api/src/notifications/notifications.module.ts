import { Global, Module } from "@nestjs/common";
import { PostmarkService } from "./postmark.service";
import { TenantNotificationsService } from "./tenant-notifications.service";
import { TransactionalEmailBuilder } from "./transactional-email-builder.service";
import { NotificationLogService } from "./notification-log.service";
import { ScheduledNotificationsService } from "./scheduled-notifications.service";
import { InAppNotificationsService } from "./in-app-notifications.service";
import { InAppNotificationsController } from "./in-app-notifications.controller";
import {
  EmailLogoRootAliasController,
  EmailPublicAssetsController,
} from "./email-public-assets.controller";

@Global()
@Module({
  controllers: [
    EmailPublicAssetsController,
    EmailLogoRootAliasController,
    InAppNotificationsController,
  ],
  providers: [
    PostmarkService,
    TransactionalEmailBuilder,
    TenantNotificationsService,
    NotificationLogService,
    ScheduledNotificationsService,
    InAppNotificationsService,
  ],
  exports: [
    PostmarkService,
    TransactionalEmailBuilder,
    TenantNotificationsService,
    NotificationLogService,
    ScheduledNotificationsService,
    InAppNotificationsService,
  ],
})
export class NotificationsModule {}
