import { Global, Module } from "@nestjs/common";
import { PostmarkService } from "./postmark.service";
import { TenantNotificationsService } from "./tenant-notifications.service";

@Global()
@Module({
  providers: [PostmarkService, TenantNotificationsService],
  exports: [PostmarkService, TenantNotificationsService],
})
export class NotificationsModule {}
