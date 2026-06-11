import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { ThrottlerModule } from "@nestjs/throttler";
import { HealthModule } from "./health/health.module";
import { DatabaseModule } from "./database/database.module";
import { AuthModule } from "./auth/auth.module";
import { BuildingsModule } from "./buildings/buildings.module";
import { ProfilesModule } from "./profiles/profiles.module";
import { UnlocksModule } from "./unlocks/unlocks.module";
import { PricingModule } from "./pricing/pricing.module";
import { WalletModule } from "./wallet/wallet.module";
import { CouponsModule } from "./coupons/coupons.module";
import { CountriesModule } from "./countries/countries.module";
import { NotificationsModule } from "./notifications/notifications.module";
import { ReportsModule } from "./reports/reports.module";
import { PaymentsModule } from "./payments/payments.module";
import { GeoModule } from "./geo/geo.module";
import { CronModule } from "./cron/cron.module";
import { AnalyticsModule } from "./analytics/analytics.module";
import { SavedBuildingsModule } from "./saved-buildings/saved-buildings.module";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ["../../.env", "../../.env.local", ".env"],
    }),
    ThrottlerModule.forRoot([
      {
        name: "default",
        ttl: 60_000,
        limit: 120,
      },
    ]),
    DatabaseModule,
    AuthModule,
    HealthModule,
    BuildingsModule,
    ProfilesModule,
    UnlocksModule,
    PricingModule,
    WalletModule,
    CouponsModule,
    CountriesModule,
    NotificationsModule,
    ReportsModule,
    PaymentsModule,
    GeoModule,
    CronModule,
    AnalyticsModule,
    SavedBuildingsModule,
  ],
})
export class AppModule {}
