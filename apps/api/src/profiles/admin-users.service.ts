import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { DatabaseService } from "../database/database.service";

export type AdminUserSummary = {
  id: string;
  email: string | null;
  role: string;
  firstName: string | null;
  lastName: string | null;
  phone: string | null;
  countryCode: string | null;
  createdAt: string;
};

const ASSIGNABLE_BY_ADMIN = new Set(["TENANT", "LANDLORD"]);
const ASSIGNABLE_BY_SUPERADMIN = new Set([
  "TENANT",
  "LANDLORD",
  "ADMIN",
  "SUPERADMIN",
]);

@Injectable()
export class AdminUsersService {
  constructor(private readonly db: DatabaseService) {}

  async listUsers(query?: string): Promise<AdminUserSummary[]> {
    const q = query?.trim();
    const params: unknown[] = [];
    let where = "";

    if (q) {
      params.push(`%${q}%`);
      where = `WHERE (
        au.email ILIKE $1
        OR p.first_name ILIKE $1
        OR p.last_name ILIKE $1
        OR p.phone ILIKE $1
      )`;
    }

    params.push(80);
    const limitIdx = params.length;

    const { rows } = await this.db.query<{
      id: string;
      email: string | null;
      role: string;
      first_name: string | null;
      last_name: string | null;
      phone: string | null;
      country_code: string | null;
      created_at: string;
    }>(
      `SELECT p.id,
              au.email,
              p.role,
              p.first_name,
              p.last_name,
              p.phone,
              p.country_code,
              p.created_at
       FROM profiles p
       LEFT JOIN auth.users au ON au.id = p.id
       ${where}
       ORDER BY p.created_at DESC
       LIMIT $${limitIdx}`,
      params,
    );

    return rows.map((row) => ({
      id: row.id,
      email: row.email,
      role: row.role,
      firstName: row.first_name,
      lastName: row.last_name,
      phone: row.phone,
      countryCode: row.country_code,
      createdAt: row.created_at,
    }));
  }

  async updateUserRole(
    actorRole: string,
    userId: string,
    role: string,
  ): Promise<AdminUserSummary | null> {
    const allowed =
      actorRole === "SUPERADMIN"
        ? ASSIGNABLE_BY_SUPERADMIN
        : ASSIGNABLE_BY_ADMIN;

    if (!allowed.has(role)) {
      throw new ForbiddenException(
        "You cannot assign that role with your permissions.",
      );
    }

    const { rows: targetRows } = await this.db.query<{ role: string }>(
      `SELECT role FROM profiles WHERE id = $1`,
      [userId],
    );
    const target = targetRows[0];
    if (!target) {
      throw new NotFoundException("User not found");
    }

    if (
      actorRole !== "SUPERADMIN" &&
      (target.role === "ADMIN" ||
        target.role === "SUPERADMIN" ||
        role === "ADMIN" ||
        role === "SUPERADMIN")
    ) {
      throw new ForbiddenException(
        "Only superadmins can change admin roles.",
      );
    }

    const { rows } = await this.db.query<{
      id: string;
      role: string;
      first_name: string | null;
      last_name: string | null;
      phone: string | null;
      country_code: string | null;
      created_at: string;
    }>(
      `UPDATE profiles
       SET role = $2::user_role, updated_at = NOW()
       WHERE id = $1
       RETURNING id, role, first_name, last_name, phone, country_code, created_at`,
      [userId, role],
    );

    const row = rows[0];
    if (!row) return null;

    const { rows: emailRows } = await this.db.query<{ email: string | null }>(
      `SELECT email FROM auth.users WHERE id = $1`,
      [userId],
    );

    return {
      id: row.id,
      email: emailRows[0]?.email ?? null,
      role: row.role,
      firstName: row.first_name,
      lastName: row.last_name,
      phone: row.phone,
      countryCode: row.country_code,
      createdAt: row.created_at,
    };
  }
}
