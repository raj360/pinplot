import { IsIn } from "class-validator";
import { UnitStatus } from "@plotpin/shared-types";

const LANDLORD_UNIT_STATUSES = [
  UnitStatus.AVAILABLE,
  UnitStatus.UNAVAILABLE,
  UnitStatus.RENTED,
] as const;

export class UpdateUnitStatusDto {
  @IsIn(LANDLORD_UNIT_STATUSES)
  status!: (typeof LANDLORD_UNIT_STATUSES)[number];
}
