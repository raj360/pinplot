import { Body, Controller, Get, Param, Patch, Post, UseGuards } from "@nestjs/common";
import { SupabaseAuthGuard } from "../auth/supabase-auth.guard";
import { RolesGuard } from "../auth/roles.guard";
import { RequireRoles } from "../auth/require-roles.decorator";
import { CurrentUser } from "../auth/current-user.decorator";
import { AuthUser } from "../auth/auth.types";
import { CouponsService } from "./coupons.service";
import { CreateCouponDto } from "./dto/coupon.dto";

@Controller("admin/coupons")
@UseGuards(SupabaseAuthGuard, RolesGuard)
@RequireRoles("ADMIN", "SUPERADMIN")
export class AdminCouponsController {
  constructor(private readonly coupons: CouponsService) {}

  @Get()
  list() {
    return this.coupons.listCoupons();
  }

  @Post()
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateCouponDto) {
    return this.coupons.createCoupon(user.id, dto);
  }

  @Patch(":id/deactivate")
  deactivate(@Param("id") id: string) {
    return this.coupons.deactivateCoupon(id);
  }
}
