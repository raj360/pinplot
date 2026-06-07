import { IsIn, IsOptional, IsString, MaxLength, MinLength } from "class-validator";
import { LISTING_REPORT_REASONS } from "@plotpin/shared-types";

const REASONS = [...LISTING_REPORT_REASONS] as const;

export class CreateListingReportDto {
  @IsString()
  @IsIn(REASONS)
  reason!: (typeof REASONS)[number];

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  details?: string;
}

export class ReviewListingReportDto {
  @IsIn(["REVIEWED", "DISMISSED"])
  status!: "REVIEWED" | "DISMISSED";

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  adminNotes?: string;
}
