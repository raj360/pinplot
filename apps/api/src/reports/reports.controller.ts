import { Body, Controller, Get, Param, Patch, Post, UseGuards } from "@nestjs/common";
import { SupabaseAuthGuard } from "../auth/supabase-auth.guard";
import { RolesGuard } from "../auth/roles.guard";
import { RequireRoles } from "../auth/require-roles.decorator";
import { CurrentUser } from "../auth/current-user.decorator";
import { AuthUser } from "../auth/auth.types";
import { ReportsService } from "./reports.service";
import { CreateListingReportDto, ReviewListingReportDto } from "./dto/report.dto";

@Controller("buildings")
@UseGuards(SupabaseAuthGuard)
export class ListingReportsController {
  constructor(private readonly reports: ReportsService) {}

  @Post(":buildingId/report")
  create(
    @Param("buildingId") buildingId: string,
    @CurrentUser() user: AuthUser,
    @Body() dto: CreateListingReportDto,
  ) {
    return this.reports.create(buildingId, user.id, dto);
  }
}

@Controller("admin/reports")
@UseGuards(SupabaseAuthGuard, RolesGuard)
@RequireRoles("ADMIN", "SUPERADMIN")
export class AdminReportsController {
  constructor(private readonly reports: ReportsService) {}

  @Get()
  listOpen() {
    return this.reports.listOpen();
  }

  @Patch(":id")
  review(
    @Param("id") id: string,
    @CurrentUser() user: AuthUser,
    @Body() dto: ReviewListingReportDto,
  ) {
    return this.reports.review(id, user.id, dto);
  }
}
