import { Body, Controller, Get, Patch, Post, UseGuards } from "@nestjs/common";
import { DatabaseService } from "../database/database.service";
import { SupabaseAuthGuard } from "../auth/supabase-auth.guard";
import { CurrentUser } from "../auth/current-user.decorator";
import { AuthUser } from "../auth/auth.types";
import { UpdateProfileRoleDto } from "../buildings/dto/building.dto";

@Controller("profiles")
export class ProfilesController {
  constructor(private readonly db: DatabaseService) {}

  @Get("me")
  @UseGuards(SupabaseAuthGuard)
  async me(@CurrentUser() user: AuthUser) {
    const { rows } = await this.db.query(
      `SELECT id, role, first_name, last_name, phone, country_code, is_verified, created_at
       FROM profiles WHERE id = $1`,
      [user.id],
    );
    return rows[0] ?? null;
  }

  @Post("sync")
  @UseGuards(SupabaseAuthGuard)
  async sync(@CurrentUser() user: AuthUser) {
    const { rows } = await this.db.query(
      `INSERT INTO profiles (id, role)
       VALUES ($1, 'TENANT')
       ON CONFLICT (id) DO UPDATE SET updated_at = NOW()
       RETURNING id, role, first_name, last_name, phone, country_code, is_verified`,
      [user.id],
    );
    return rows[0];
  }

  @Patch("me/role")
  @UseGuards(SupabaseAuthGuard)
  async setRole(
    @CurrentUser() user: AuthUser,
    @Body() dto: UpdateProfileRoleDto,
  ) {
    const { rows } = await this.db.query(
      `UPDATE profiles SET role = $2::user_role, updated_at = NOW()
       WHERE id = $1
       RETURNING id, role, first_name, last_name, phone`,
      [user.id, dto.role],
    );
    return rows[0];
  }
}
