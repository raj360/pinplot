import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { createClient } from "@supabase/supabase-js";
import { Request } from "express";
import { DatabaseService } from "../database/database.service";
import { AuthUser } from "./auth.types";

@Injectable()
export class SupabaseAuthGuard implements CanActivate {
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
      throw new UnauthorizedException("Missing bearer token");
    }

    const token = header.slice(7);
    const {
      data: { user },
      error,
    } = await this.supabase.auth.getUser(token);

    if (error || !user) {
      throw new UnauthorizedException("Invalid or expired token");
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
