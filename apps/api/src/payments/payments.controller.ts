import { Controller, Get, Param, Post, Query, UseGuards } from "@nestjs/common";
import { SupabaseAuthGuard } from "../auth/supabase-auth.guard";
import { CurrentUser } from "../auth/current-user.decorator";
import { AuthUser } from "../auth/auth.types";
import { SettleUnlockService } from "./settle-unlock.service";

@Controller("payments")
export class PaymentsController {
  constructor(private readonly settle: SettleUnlockService) {}

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
