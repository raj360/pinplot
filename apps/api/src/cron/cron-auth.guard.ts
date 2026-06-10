import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import type { Request } from "express";

@Injectable()
export class CronAuthGuard implements CanActivate {
  constructor(private readonly config: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const secret = this.config.get<string>("CRON_SECRET")?.trim();
    if (!secret) {
      throw new UnauthorizedException("CRON_SECRET is not configured");
    }

    const req = context.switchToHttp().getRequest<Request>();
    const auth = req.headers.authorization?.trim();
    const headerSecret = req.headers["x-cron-secret"]?.toString().trim();

    const bearer =
      auth?.startsWith("Bearer ") ? auth.slice("Bearer ".length).trim() : null;

    if (bearer === secret || headerSecret === secret) {
      return true;
    }

    throw new UnauthorizedException("Invalid cron credentials");
  }
}
