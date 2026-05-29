import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { HealthModule } from "./health/health.module";
import { DatabaseModule } from "./database/database.module";
import { AuthModule } from "./auth/auth.module";
import { BuildingsModule } from "./buildings/buildings.module";
import { ProfilesModule } from "./profiles/profiles.module";
import { UnlocksModule } from "./unlocks/unlocks.module";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ["../../.env", "../../.env.local", ".env"],
    }),
    DatabaseModule,
    AuthModule,
    HealthModule,
    BuildingsModule,
    ProfilesModule,
    UnlocksModule,
  ],
})
export class AppModule {}
