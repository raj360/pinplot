import { IsOptional, IsString, MaxLength, MinLength } from "class-validator";

export class UpdateProfileDto {
  @IsString()
  @MinLength(1)
  @MaxLength(80)
  firstName!: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  lastName?: string;

  /** E.164 primary phone, e.g. +256700000000 */
  @IsString()
  @MinLength(8)
  @MaxLength(20)
  phone!: string;

  /** Optional second phone, also stored as E.164. */
  @IsOptional()
  @IsString()
  @MinLength(8)
  @MaxLength(20)
  phoneSecondary?: string;
}
