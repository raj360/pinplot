import { IsIn, IsOptional } from "class-validator";

export type UnlockListStatus = "active" | "expired" | "all";

export class ListMineUnlocksQueryDto {
  @IsOptional()
  @IsIn(["active", "expired", "all"])
  status?: UnlockListStatus;
}
