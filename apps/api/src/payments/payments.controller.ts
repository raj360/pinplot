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
import {
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  MinLength,
} from "class-validator";
import { Type } from "class-transformer";
import { SupabaseAuthGuard } from "../auth/supabase-auth.guard";
import { CurrentUser } from "../auth/current-user.decorator";
import { AuthUser } from "../auth/auth.types";
import { SettleUnlockService } from "./settle-unlock.service";
import { FeaturedCheckoutService } from "./featured-checkout.service";

export class FeaturedCheckoutDto {
  @IsUUID()
  buildingId!: string;

  @Type(() => Number)
  @IsInt()
  durationDays!: number;

  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(2)
  payerCountryCode?: string;

  @IsOptional()
  @IsIn(["auto", "flutterwave", "lemon_squeezy"])
  providerPreference?: "auto" | "flutterwave" | "lemon_squeezy";
}

@Controller("payments")
export class PaymentsController {
  constructor(
    private readonly settle: SettleUnlockService,
    private readonly featuredCheckout: FeaturedCheckoutService,
  ) {}

  @Post("featured/checkout")
  @UseGuards(SupabaseAuthGuard)
  startFeaturedCheckout(
    @CurrentUser() user: AuthUser,
    @Body() dto: FeaturedCheckoutDto,
  ) {
    if (!user.email) {
      throw new BadRequestException(
        "Your account needs an email address before checkout.",
      );
    }
    return this.featuredCheckout.createCheckout(
      user.id,
      dto.buildingId,
      user.email,
      null,
      {
        durationDays: dto.durationDays,
        payerCountryCode: dto.payerCountryCode,
        providerPreference: dto.providerPreference,
      },
    );
  }

  @Get(":paymentId/unlock-status")
  @UseGuards(SupabaseAuthGuard)
  getUnlockStatus(
    @Param("paymentId") paymentId: string,
    @CurrentUser() user: AuthUser,
  ) {
    return this.settle.getPaymentStatus(paymentId, user.id);
  }

  @Post("flutterwave/confirm")
  @UseGuards(SupabaseAuthGuard)
  confirmFlutterwave(
    @CurrentUser() user: AuthUser,
    @Query("tx_ref") txRef: string,
    @Query("transaction_id") transactionId: string,
    @Query("status") status: string,
  ) {
    void user;
    return this.settle.settleFlutterwaveFromRedirect({
      txRef,
      transactionId,
      status,
    });
  }

  @Post("lemon-squeezy/confirm")
  @UseGuards(SupabaseAuthGuard)
  confirmLemonSqueezy(
    @CurrentUser() user: AuthUser,
    @Query("paymentId") paymentId: string,
  ) {
    return this.settle.settleLemonSqueezyFromReturn({
      paymentId,
      userId: user.id,
      userEmail: user.email,
    });
  }
}
