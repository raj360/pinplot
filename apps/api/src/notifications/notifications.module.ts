import { Global, Module } from "@nestjs/common";
import { PostmarkService } from "./postmark.service";
import { TenantNotificationsService } from "./tenant-notifications.service";
import { TransactionalEmailBuilder } from "./transactional-email-builder.service";

@Global()
@Module({
  providers: [
    PostmarkService,
    TransactionalEmailBuilder,
    TenantNotificationsService,
  ],
  exports: [PostmarkService, TransactionalEmailBuilder, TenantNotificationsService],
})
export class NotificationsModule {}
