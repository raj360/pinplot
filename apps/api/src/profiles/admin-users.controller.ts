import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  NotFoundException,
  Param,
  Patch,
  Query,
  UseGuards,
} from "@nestjs/common";
import { IsIn, IsOptional, IsString, MaxLength } from "class-validator";
import { SupabaseAuthGuard } from "../auth/supabase-auth.guard";
import { RolesGuard } from "../auth/roles.guard";
import { RequireRoles } from "../auth/require-roles.decorator";
import { CurrentUser } from "../auth/current-user.decorator";
import { AuthUser } from "../auth/auth.types";
import { AdminUsersService } from "./admin-users.service";

class AdminUpdateUserRoleDto {
  @IsString()
  @IsIn(["TENANT", "LANDLORD", "ADMIN", "SUPERADMIN"])
  role!: "TENANT" | "LANDLORD" | "ADMIN" | "SUPERADMIN";
}

class AdminListUsersQueryDto {
  @IsOptional()
  @IsString()
  @MaxLength(120)
  q?: string;
}

@Controller("admin/users")
@UseGuards(SupabaseAuthGuard, RolesGuard)
@RequireRoles("ADMIN", "SUPERADMIN")
export class AdminUsersController {
  constructor(private readonly users: AdminUsersService) {}

  @Get()
  list(@Query() query: AdminListUsersQueryDto) {
    return this.users.listUsers(query.q);
  }

  @Patch(":id/role")
  async updateRole(
    @Param("id") id: string,
    @CurrentUser() actor: AuthUser,
    @Body() dto: AdminUpdateUserRoleDto,
  ) {
    if (id === actor.id) {
      throw new ForbiddenException("You cannot change your own role.");
    }

    const updated = await this.users.updateUserRole(
      actor.role ?? "ADMIN",
      id,
      dto.role,
    );
    if (!updated) {
      throw new NotFoundException("User not found");
    }
    return updated;
  }
}
