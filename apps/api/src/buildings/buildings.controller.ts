import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from "@nestjs/common";
import { Throttle, ThrottlerGuard } from "@nestjs/throttler";
import { BuildingsService } from "./buildings.service";
import {
  BuildingBoundsQueryDto,
  CreateBuildingDto,
  CreateUnitDto,
  RegisterImageDto,
  VerifyBuildingDto,
} from "./dto/building.dto";
import { UpdateUnitStatusDto } from "./dto/unit-status.dto";
import { SupabaseAuthGuard } from "../auth/supabase-auth.guard";
import { OptionalSupabaseAuthGuard } from "../auth/optional-supabase-auth.guard";
import { RolesGuard } from "../auth/roles.guard";
import { RequireRoles } from "../auth/require-roles.decorator";
import { CurrentUser } from "../auth/current-user.decorator";
import { AuthUser } from "../auth/auth.types";

@Controller("buildings")
export class BuildingsController {
  constructor(private readonly buildings: BuildingsService) {}

  @Get()
  @UseGuards(OptionalSupabaseAuthGuard, ThrottlerGuard)
  @Throttle({ default: { limit: 60, ttl: 60_000 } })
  findInBounds(
    @Query() query: BuildingBoundsQueryDto,
    @CurrentUser() user?: AuthUser,
  ) {
    return this.buildings.findInBounds(query, user?.id);
  }

  @Get("mine/list")
  @UseGuards(SupabaseAuthGuard)
  findMine(@CurrentUser() user: AuthUser) {
    return this.buildings.findByLandlord(user.id);
  }

  @Get("mine/:id")
  @UseGuards(SupabaseAuthGuard)
  findMineOne(@Param("id") id: string, @CurrentUser() user: AuthUser) {
    return this.buildings.findMineById(id, user.id);
  }

  @Patch(":id/units/:unitId/status")
  @UseGuards(SupabaseAuthGuard)
  updateUnitStatus(
    @Param("id") id: string,
    @Param("unitId") unitId: string,
    @CurrentUser() user: AuthUser,
    @Body() dto: UpdateUnitStatusDto,
  ) {
    return this.buildings.updateUnitStatus(id, unitId, user.id, dto.status);
  }

  @Get(":id")
  @UseGuards(OptionalSupabaseAuthGuard)
  findOne(@Param("id") id: string, @CurrentUser() user?: AuthUser) {
    return this.buildings.findById(id, false, user?.id);
  }

  @Post()
  @UseGuards(SupabaseAuthGuard)
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateBuildingDto) {
    return this.buildings.create(user.id, dto);
  }

  @Post(":id/units")
  @UseGuards(SupabaseAuthGuard)
  addUnit(
    @Param("id") id: string,
    @CurrentUser() user: AuthUser,
    @Body() dto: CreateUnitDto,
  ) {
    return this.buildings.addUnit(id, user.id, dto);
  }

  @Post(":id/images")
  @UseGuards(SupabaseAuthGuard)
  registerImage(
    @Param("id") id: string,
    @CurrentUser() user: AuthUser,
    @Body() dto: RegisterImageDto,
  ) {
    return this.buildings.registerImage(id, user.id, dto);
  }
}

@Controller("admin/buildings")
@UseGuards(SupabaseAuthGuard, RolesGuard)
@RequireRoles("ADMIN", "SUPERADMIN")
export class AdminBuildingsController {
  constructor(private readonly buildings: BuildingsService) {}

  @Get("pending")
  findPending() {
    return this.buildings.findPendingVerification();
  }

  @Patch(":id/verify")
  verify(@Param("id") id: string, @Body() dto: VerifyBuildingDto) {
    return this.buildings.setVerified(id, dto.verified);
  }
}
