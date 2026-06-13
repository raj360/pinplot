import {
  IsArray,
  IsIn,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  ValidateNested,
  ArrayMaxSize,
} from "class-validator";
import { Type } from "class-transformer";

export const LISTING_EVENT_TYPES = [
  "IMPRESSION",
  "DETAIL_VIEW",
  "UNLOCK_CLICK",
  "CONTACT_CALL",
  "CONTACT_WHATSAPP",
  "CONTACT_COPY",
  "DIRECTIONS",
] as const;

export type ListingEventType = (typeof LISTING_EVENT_TYPES)[number];

export class ListingAnalyticsEventDto {
  @IsIn(LISTING_EVENT_TYPES)
  eventType!: ListingEventType;

  @IsUUID()
  buildingId!: string;

  @IsOptional()
  @IsUUID()
  unitId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(32)
  source?: string;

  @IsOptional()
  @IsUUID()
  unlockId?: string;
}

export class TrackListingEventsDto {
  @IsArray()
  @ArrayMaxSize(20)
  @ValidateNested({ each: true })
  @Type(() => ListingAnalyticsEventDto)
  events!: ListingAnalyticsEventDto[];

  @IsOptional()
  @IsString()
  @MaxLength(64)
  sessionId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2)
  countryCode?: string;
}
