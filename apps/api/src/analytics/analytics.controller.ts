import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from "@nestjs/common";
import { Throttle, ThrottlerGuard } from "@nestjs/throttler";
import { SupabaseAuthGuard } from "../auth/supabase-auth.guard";
import { OptionalSupabaseAuthGuard } from "../auth/optional-supabase-auth.guard";
import { RolesGuard } from "../auth/roles.guard";
import { RequireRoles } from "../auth/require-roles.decorator";
import { CurrentUser } from "../auth/current-user.decorator";
import type { AuthUser } from "../auth/auth.types";
import { AnalyticsService } from "./analytics.service";
import { TrackListingEventsDto } from "./dto/track-events.dto";

@Controller("analytics")
export class AnalyticsController {
  constructor(private readonly analytics: AnalyticsService) {}

  @Post("events")
  @UseGuards(OptionalSupabaseAuthGuard, ThrottlerGuard)
  @Throttle({ default: { limit: 60, ttl: 60_000 } })
  trackEvents(
    @Body() dto: TrackListingEventsDto,
    @CurrentUser() user?: AuthUser,
  ) {
    return this.analytics
      .trackEvents(dto.events, {
        viewerId: user?.id ?? null,
        sessionId: dto.sessionId ?? null,
        countryCode: dto.countryCode ?? null,
      })
      .then((accepted) => ({ accepted }));
  }

  @Get("buildings/:buildingId/metrics")
  @UseGuards(SupabaseAuthGuard)
  getBuildingMetrics(
    @Param("buildingId") buildingId: string,
    @Query("days") days?: string,
  ) {
    return this.analytics.getBuildingMetrics(
      buildingId,
      days ? Number(days) : 30,
    );
  }
}

@Controller("admin/analytics")
@UseGuards(SupabaseAuthGuard, RolesGuard)
@RequireRoles("ADMIN", "SUPERADMIN")
export class AdminAnalyticsController {
  constructor(private readonly analytics: AnalyticsService) {}

  @Get("overview")
  overview(@Query("days") days?: string) {
    return this.analytics.getAdminOverview(days ? Number(days) : 30);
  }
}
