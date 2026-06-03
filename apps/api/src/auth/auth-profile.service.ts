import {
  Injectable,
  ServiceUnavailableException,
} from "@nestjs/common";
import { DatabaseService } from "../database/database.service";
import { isTransientDbError, withDbRetry } from "../database/db-retry.util";
import { AuthUser } from "./auth.types";

@Injectable()
export class AuthProfileService {
  constructor(private readonly db: DatabaseService) {}

  async loadAuthUser(userId: string, email?: string): Promise<AuthUser> {
    try {
      const { rows } = await withDbRetry(() =>
        this.db.query<{ role: string }>(
          "SELECT role FROM profiles WHERE id = $1",
          [userId],
        ),
      );

      return {
        id: userId,
        email,
        role: rows[0]?.role ?? "TENANT",
      };
    } catch (error) {
      if (isTransientDbError(error)) {
        throw new ServiceUnavailableException(
          "Authentication is temporarily unavailable. Please try again.",
        );
      }
      throw error;
    }
  }
}
