import {
  IsArray,
  IsBoolean,
  IsIn,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
  MinLength,
  ValidateNested,
} from "class-validator";
import { Type } from "class-transformer";
import {
  BUILDING_TYPES,
  type AdminVerificationChecklist,
} from "@plotpin/shared-types";

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

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(10)
  bathrooms?: number;

  @IsOptional()
  @IsString()
  countryCode?: string;

  @IsOptional()
  @IsIn([...BUILDING_TYPES])
  buildingType?: string;
}

export class FeaturedBuildingsQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(24)
  limit?: number;
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

  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(2)
  countryCode?: string;

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
  @IsString()
  @Matches(/^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\//i, {
    message: "videoUrl must be a YouTube link",
  })
  videoUrl?: string;

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

  @IsOptional()
  @IsIn([...BUILDING_TYPES])
  buildingType?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateUnitDto)
  units?: CreateUnitDto[];

  @IsBoolean()
  acceptTerms!: boolean;

  @IsBoolean()
  ownershipAttestation!: boolean;
}

export class VerificationChecklistDto implements AdminVerificationChecklist {
  @IsBoolean()
  phoneMatchesListing!: boolean;

  @IsBoolean()
  photosAuthentic!: boolean;

  @IsBoolean()
  pinPlausible!: boolean;

  @IsBoolean()
  rentConsistent!: boolean;

  @IsBoolean()
  duplicatePinReviewed!: boolean;

  @IsBoolean()
  landlordNotSuspended!: boolean;

  @IsBoolean()
  ownershipAttestationRecorded!: boolean;
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

export class VerifyBuildingDto {
  @IsBoolean()
  verified!: boolean;

  @IsOptional()
  @ValidateNested()
  @Type(() => VerificationChecklistDto)
  checklist?: VerificationChecklistDto;

  /** Required when duplicate verified pins exist within 50m. */
  @IsOptional()
  @IsBoolean()
  acknowledgeDuplicatePin?: boolean;
}

export class RejectBuildingDto {
  @IsString()
  @MinLength(10, { message: "Rejection reason must be at least 10 characters" })
  @MaxLength(2000)
  reason!: string;
}

export class AdminUpdateBuildingDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  city?: string;

  @IsOptional()
  @IsString()
  district?: string;

  @IsOptional()
  @IsString()
  exactAddress?: string;

  @IsOptional()
  @IsString()
  coverImagePath?: string;

  @IsOptional()
  @IsString()
  @Matches(/^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\//i, {
    message: "videoUrl must be a YouTube link",
  })
  videoUrl?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  exactLat?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  exactLng?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  totalUnits?: number;

  @IsOptional()
  @IsIn([...BUILDING_TYPES])
  buildingType?: string;
}

export class UpdateUnitDto {
  @IsOptional()
  @IsString()
  unitNumber?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  bedrooms?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  bathrooms?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  rentAmount?: number;
}

export class RegisterImageDto {
  @IsString()
  storagePath!: string;

  @IsOptional()
  @IsString()
  thumbStoragePath?: string;

  @IsOptional()
  @IsBoolean()
  isPrimary?: boolean;
}

export class UpdateProfileRoleDto {
  @IsString()
  role!: "LANDLORD" | "TENANT";
}

export class SetBuildingFeaturedDto {
  @IsBoolean()
  featured!: boolean;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(365)
  durationDays?: number;
}

export class LaunchFeaturedGrantDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(20)
  limit?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(365)
  durationDays?: number;
}
