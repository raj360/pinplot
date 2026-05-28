import { Controller, Get, Post, UseGuards } from "@nestjs/common";
import { DatabaseService } from "../database/database.service";
import { SupabaseAuthGuard } from "../auth/supabase-auth.guard";
import { CurrentUser } from "../auth/current-user.decorator";
import { AuthUser } from "../auth/auth.types";

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

  /** Ensure profile row exists (fallback if trigger missed) */
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
}
