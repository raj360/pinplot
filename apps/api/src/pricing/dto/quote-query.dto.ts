import { Type } from "class-transformer";
import { IsIn, IsInt, IsOptional, IsString, Max, Min } from "class-validator";
import { BUILDING_TYPES, PaymentPurpose } from "@plotpin/shared-types";

const PURPOSES = [PaymentPurpose.UNLOCK, PaymentPurpose.LISTING] as const;

export class QuoteQueryDto {
  @IsOptional()
  @IsIn([...BUILDING_TYPES])
  buildingType?: string;

  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(20)
  bedrooms!: number;

  @IsIn(PURPOSES)
  purpose!: PaymentPurpose;

  @IsOptional()
  @IsString()
  countryCode?: string;
}
