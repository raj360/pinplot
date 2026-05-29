import { IsOptional, IsUUID } from "class-validator";

export class UnlockUnitDto {
  /** Set when payment provider confirms charge (Stripe / Flutterwave). */
  @IsOptional()
  @IsUUID()
  paymentId?: string;
}
