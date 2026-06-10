import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from "@nestjs/common";
import { SupabaseAuthGuard } from "../auth/supabase-auth.guard";
import { CurrentUser } from "../auth/current-user.decorator";
import { AuthUser } from "../auth/auth.types";
import { UnlocksService } from "./unlocks.service";
import { UnlockUnitDto } from "./dto/unlock.dto";
import { ListMineUnlocksQueryDto } from "./dto/list-mine.dto";
import { UnlockCheckoutDto } from "../payments/dto/checkout.dto";
import { UnlockCheckoutService } from "../payments/unlock-checkout.service";

@Controller("units")
@UseGuards(SupabaseAuthGuard)
export class UnlocksController {
  constructor(
    private readonly unlocks: UnlocksService,
    private readonly checkout: UnlockCheckoutService,
  ) {}

  @Get(":unitId/unlock")
  getStatus(@Param("unitId") unitId: string, @CurrentUser() user: AuthUser) {
    return this.unlocks.getStatus(unitId, user.id);
  }

  @Post(":unitId/unlock/checkout")
  startCheckout(
    @Param("unitId") unitId: string,
    @CurrentUser() user: AuthUser,
    @Body() dto: UnlockCheckoutDto,
  ) {
    if (!user.email) {
      throw new BadRequestException(
        "Your account needs an email address before checkout.",
      );
    }
    return this.checkout.createCheckout(
      user.id,
      unitId,
      user.email,
      null,
      {
        tenantCountryCode: dto.tenantCountryCode,
        providerPreference: dto.providerPreference,
        acceptTerms: dto.acceptTerms,
      },
    );
  }

  @Post(":unitId/unlock")
  unlock(
    @Param("unitId") unitId: string,
    @CurrentUser() user: AuthUser,
    @Body() dto: UnlockUnitDto,
  ) {
    return this.unlocks.unlockUnit(user.id, unitId, {
      paymentId: dto.paymentId,
      acceptTerms: dto.acceptTerms,
    });
  }
}

@Controller("unlocks")
@UseGuards(SupabaseAuthGuard)
export class UnlocksListController {
  constructor(private readonly unlocks: UnlocksService) {}

  @Get("mine")
  listMine(
    @CurrentUser() user: AuthUser,
    @Query() query: ListMineUnlocksQueryDto,
  ) {
    return this.unlocks.listMine(user.id, query.status ?? "active");
  }

  @Get("building/:buildingId")
  listForBuilding(
    @Param("buildingId") buildingId: string,
    @CurrentUser() user: AuthUser,
  ) {
    return this.unlocks.listForBuilding(buildingId, user.id);
  }
}
