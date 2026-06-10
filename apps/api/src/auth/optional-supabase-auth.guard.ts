import {
  CanActivate,
  ExecutionContext,
  Injectable,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { createClient } from "@supabase/supabase-js";
import type { Request } from "express";
import { AuthProfileService } from "./auth-profile.service";
import type { AuthUser } from "./auth.types";

/** Sets request.user when a valid bearer token is present; otherwise continues anonymously. */
@Injectable()
export class OptionalSupabaseAuthGuard implements CanActivate {
  private supabase;

  constructor(
    config: ConfigService,
    private readonly authProfile: AuthProfileService,
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
    } = await this.supabase.auth.getUser(token);

    if (user) {
      (request as Request & { user?: AuthUser }).user =
        await this.authProfile.loadAuthUser(user.id, user.email);
    }

    return true;
  }
}
