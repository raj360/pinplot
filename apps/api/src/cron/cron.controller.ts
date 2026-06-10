import { Controller, Post, UseGuards } from "@nestjs/common";
import { CronAuthGuard } from "./cron-auth.guard";
import { UnitLocksService } from "../maintenance/unit-locks.service";
import { ScheduledNotificationsService } from "../notifications/scheduled-notifications.service";
import { AnalyticsService } from "../analytics/analytics.service";

@Controller("cron")
@UseGuards(CronAuthGuard)
export class CronController {
  constructor(
    private readonly unitLocks: UnitLocksService,
    private readonly scheduled: ScheduledNotificationsService,
    private readonly analytics: AnalyticsService,
  ) {}

  @Post("release-expired-locks")
  async releaseExpiredLocks() {
    const released = await this.unitLocks.releaseAllExpiredLocks();
    return { released };
  }

  @Post("notifications")
  async runNotifications() {
    const counts = await this.scheduled.runAll();
    return { counts };
  }

  /** Hourly job: notifications first (while lock rows intact), then release expired locks. */
  @Post("hourly")
  async runHourly() {
    const counts = await this.scheduled.runAll();
    const metricsRollupRows = await this.analytics.refreshDailyRollups(3);
    const released = await this.unitLocks.releaseAllExpiredLocks();
    return { counts, metricsRollupRows, released };
  }
}
