import {
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
} from "class-validator";
import { Type } from "class-transformer";

export class BuildingBoundsQueryDto {
  @Type(() => Number)
  @IsNumber()
  north!: number;

  @Type(() => Number)
  @IsNumber()
  south!: number;

  @Type(() => Number)
  @IsNumber()
  east!: number;

  @Type(() => Number)
  @IsNumber()
  west!: number;

  @IsOptional()
  @IsString()
  city?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  minRent?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  maxRent?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(10)
  bedrooms?: number;
}

export class CreateBuildingDto {
  @IsString()
  name!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsString()
  city!: string;

  @IsOptional()
  @IsString()
  district?: string;

  @Type(() => Number)
  @IsNumber()
  approximateLat!: number;

  @Type(() => Number)
  @IsNumber()
  approximateLng!: number;

  @IsOptional()
  @IsString()
  exactAddress?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  exactLat?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  exactLng?: number;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  totalUnits!: number;
}

export class CreateUnitDto {
  @IsString()
  unitNumber!: string;

  @Type(() => Number)
  @IsInt()
  @Min(0)
  bedrooms!: number;

  @Type(() => Number)
  @IsInt()
  @Min(0)
  bathrooms!: number;

  @Type(() => Number)
  @IsInt()
  @Min(0)
  rentAmount!: number;
}
