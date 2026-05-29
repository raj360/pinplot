import {
  CanActivate,
  ExecutionContext,
  Injectable,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { createClient } from "@supabase/supabase-js";
import { Request } from "express";
import { DatabaseService } from "../database/database.service";
import { AuthUser } from "./auth.types";

/** Sets request.user when a valid bearer token is present; otherwise continues anonymously. */
@Injectable()
export class OptionalSupabaseAuthGuard implements CanActivate {
  private supabase;

  constructor(
    config: ConfigService,
    private readonly db: DatabaseService,
  ) {
    this.supabase = createClient(
      config.getOrThrow<string>("NEXT_PUBLIC_SUPABASE_URL"),
      config.getOrThrow<string>("SUPABASE_SERVICE_ROLE_KEY"),
      { auth: { persistSession: false, autoRefreshToken: false } },
    );
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const header = request.headers.authorization;
    if (!header?.startsWith("Bearer ")) {
      return true;
    }

    const token = header.slice(7);
    const {
      data: { user },
      error,
    } = await this.supabase.auth.getUser(token);

    if (error || !user) {
      return true;
    }

    const { rows } = await this.db.query<{ role: string }>(
      "SELECT role FROM profiles WHERE id = $1",
      [user.id],
    );

    (request as Request & { user: AuthUser }).user = {
      id: user.id,
      email: user.email,
      role: rows[0]?.role ?? "TENANT",
    };

    return true;
  }
}
