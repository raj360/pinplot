import {
  IsDateString,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  Min,
} from "class-validator";
import { PaymentPurpose } from "@plotpin/shared-types";

export class CreateCouponDto {
  @IsString()
  @MaxLength(32)
  @Matches(/^[A-Za-z0-9_-]+$/, {
    message: "Code may only contain letters, numbers, hyphens, and underscores",
  })
  code!: string;

  @IsOptional()
  @IsIn([PaymentPurpose.UNLOCK, PaymentPurpose.LISTING, PaymentPurpose.FEATURED])
  purpose?: PaymentPurpose;

  @IsOptional()
  @IsInt()
  @Min(1)
  quantity?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  amountUgx?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  maxRedemptions?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  maxPerUser?: number;

  @IsOptional()
  @IsDateString()
  expiresAt?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  label?: string;
}

export class RedeemCouponDto {
  @IsString()
  @MaxLength(32)
  code!: string;
}
