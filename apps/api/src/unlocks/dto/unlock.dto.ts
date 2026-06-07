import { IsBoolean, IsOptional, IsUUID } from "class-validator";

export class UnlockUnitDto {
  /** Set when payment provider confirms charge (Stripe / Flutterwave). */
  @IsOptional()
  @IsUUID()
  paymentId?: string;

  /** Required on first unlock until tenant terms are stored on profile. */
  @IsOptional()
  @IsBoolean()
  acceptTerms?: boolean;
}
