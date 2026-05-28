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
import { BuildingsService } from "./buildings.service";
import {
  BuildingBoundsQueryDto,
  CreateBuildingDto,
  CreateUnitDto,
  RegisterImageDto,
  VerifyBuildingDto,
} from "./dto/building.dto";
import { SupabaseAuthGuard } from "../auth/supabase-auth.guard";
import { RolesGuard } from "../auth/roles.guard";
import { RequireRoles } from "../auth/require-roles.decorator";
import { CurrentUser } from "../auth/current-user.decorator";
import { AuthUser } from "../auth/auth.types";

@Controller("buildings")
export class BuildingsController {
  constructor(private readonly buildings: BuildingsService) {}

  @Get()
  findInBounds(@Query() query: BuildingBoundsQueryDto) {
    return this.buildings.findInBounds(query);
  }

  @Get("mine/list")
  @UseGuards(SupabaseAuthGuard)
  findMine(@CurrentUser() user: AuthUser) {
    return this.buildings.findByLandlord(user.id);
  }

  @Get(":id")
  findOne(@Param("id") id: string) {
    return this.buildings.findById(id, false);
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
