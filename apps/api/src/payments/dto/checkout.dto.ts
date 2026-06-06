import { IsBoolean, IsIn, IsOptional, IsString, Length } from "class-validator";

export class UnlockCheckoutDto {
  @IsOptional()
  @IsString()
  @Length(2, 2)
  tenantCountryCode?: string;

  @IsOptional()
  @IsIn(["auto", "flutterwave", "lemon_squeezy"])
  providerPreference?: "auto" | "flutterwave" | "lemon_squeezy";

  @IsOptional()
  @IsBoolean()
  acceptTerms?: boolean;
}
