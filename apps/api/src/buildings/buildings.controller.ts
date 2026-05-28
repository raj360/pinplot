import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from "@nestjs/common";
import { BuildingsService } from "./buildings.service";
import {
  BuildingBoundsQueryDto,
  CreateBuildingDto,
  CreateUnitDto,
} from "./dto/building.dto";
import { SupabaseAuthGuard } from "../auth/supabase-auth.guard";
import { CurrentUser } from "../auth/current-user.decorator";
import { AuthUser } from "../auth/auth.types";

@Controller("buildings")
export class BuildingsController {
  constructor(private readonly buildings: BuildingsService) {}

  @Get()
  findInBounds(@Query() query: BuildingBoundsQueryDto) {
    return this.buildings.findInBounds(query);
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
}
