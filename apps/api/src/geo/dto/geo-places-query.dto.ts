import { IsIn, IsOptional, IsString, Length, Max, Min } from "class-validator";
import { Type } from "class-transformer";

export class GeoPlacesQueryDto {
  @IsString()
  @Length(2, 2)
  country!: string;

  /** Filter by place kind — omit for all kinds returned to the picker. */
  @IsOptional()
  @IsIn(["region", "district", "city", "neighborhood"])
  kind?: "region" | "district" | "city" | "neighborhood";

  @IsOptional()
  @Type(() => Number)
  @Min(1)
  @Max(200)
  limit?: number;
}
