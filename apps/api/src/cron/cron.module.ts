import { Module } from "@nestjs/common";
import { CronController } from "./cron.controller";
import { CronAuthGuard } from "./cron-auth.guard";
import { MaintenanceModule } from "../maintenance/maintenance.module";
import { NotificationsModule } from "../notifications/notifications.module";
import { AnalyticsModule } from "../analytics/analytics.module";

@Module({
  imports: [MaintenanceModule, NotificationsModule, AnalyticsModule],
  controllers: [CronController],
  providers: [CronAuthGuard],
})
export class CronModule {}
