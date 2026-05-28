import { Body, Controller, Get, Param, Post, UseGuards } from "@nestjs/common";
import { SupabaseAuthGuard } from "../auth/supabase-auth.guard";
import { CurrentUser } from "../auth/current-user.decorator";
import { AuthUser } from "../auth/auth.types";
import { UnlocksService } from "./unlocks.service";
import { UnlockUnitDto } from "./dto/unlock.dto";

@Controller("units")
@UseGuards(SupabaseAuthGuard)
export class UnlocksController {
  constructor(private readonly unlocks: UnlocksService) {}

  @Get(":unitId/unlock")
  getStatus(@Param("unitId") unitId: string, @CurrentUser() user: AuthUser) {
    return this.unlocks.getStatus(unitId, user.id);
  }

  @Post(":unitId/unlock")
  unlock(
    @Param("unitId") unitId: string,
    @CurrentUser() user: AuthUser,
    @Body() dto: UnlockUnitDto,
  ) {
    return this.unlocks.unlockUnit(user.id, unitId, dto.paymentId);
  }
}
