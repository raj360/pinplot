import {
  Controller,
  Delete,
  Get,
  Param,
  Post,
  UseGuards,
} from "@nestjs/common";
import { SupabaseAuthGuard } from "../auth/supabase-auth.guard";
import { CurrentUser } from "../auth/current-user.decorator";
import { AuthUser } from "../auth/auth.types";
import { SavedBuildingsService } from "./saved-buildings.service";

@Controller("saved-buildings")
@UseGuards(SupabaseAuthGuard)
export class SavedBuildingsController {
  constructor(private readonly saved: SavedBuildingsService) {}

  @Get("mine")
  listMine(@CurrentUser() user: AuthUser) {
    return this.saved.listMine(user.id);
  }

  @Get("ids")
  listIds(@CurrentUser() user: AuthUser) {
    return this.saved.listSavedIds(user.id);
  }

  @Post(":buildingId")
  save(@Param("buildingId") buildingId: string, @CurrentUser() user: AuthUser) {
    return this.saved.save(user.id, buildingId);
  }

  @Delete(":buildingId")
  unsave(@Param("buildingId") buildingId: string, @CurrentUser() user: AuthUser) {
    return this.saved.unsave(user.id, buildingId);
  }
}
