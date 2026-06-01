import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Patch,
  Post,
  UseGuards,
} from "@nestjs/common";
import {
  combineToE164,
  DEFAULT_PHONE_DIAL_CODE,
  isValidE164,
  isValidStoredPhone,
  normalizePhoneE164,
} from "@plotpin/shared-types";
import { DatabaseService } from "../database/database.service";
import { SupabaseAuthGuard } from "../auth/supabase-auth.guard";
import { CurrentUser } from "../auth/current-user.decorator";
import { AuthUser } from "../auth/auth.types";
import { WalletService } from "../wallet/wallet.service";
import { UpdateProfileRoleDto } from "../buildings/dto/building.dto";
import { UpdateProfileDto } from "./dto/profile.dto";

function normalizePhoneField(value: string, label: string) {
  const trimmed = value.trim();
  if (!trimmed) {
    throw new BadRequestException(`Enter a valid ${label}.`);
  }

  const normalized = trimmed.startsWith("+")
    ? normalizePhoneE164(trimmed)
    : combineToE164(DEFAULT_PHONE_DIAL_CODE, trimmed);

  if (!normalized || !isValidE164(normalized)) {
    throw new BadRequestException(`Enter a valid ${label}.`);
  }

  return normalized;
}

@Controller("profiles")
export class ProfilesController {
  constructor(
    private readonly db: DatabaseService,
    private readonly wallet: WalletService,
  ) {}

  private profileSelect = `
    id, role, first_name, last_name, phone, phone_secondary,
    phone_verified_at, phone_secondary_verified_at,
    country_code, is_verified, created_at
  `;

  @Get("me")
  @UseGuards(SupabaseAuthGuard)
  async me(@CurrentUser() user: AuthUser) {
    const { rows } = await this.db.query(
      `SELECT ${this.profileSelect} FROM profiles WHERE id = $1`,
      [user.id],
    );
    return rows[0] ?? null;
  }

  @Post("sync")
  @UseGuards(SupabaseAuthGuard)
  async sync(@CurrentUser() user: AuthUser) {
    const { rows } = await this.db.query<{
      id: string;
      role: string;
      country_code: string;
    }>(
      `INSERT INTO profiles (id, role)
       VALUES ($1, 'TENANT')
       ON CONFLICT (id) DO UPDATE SET updated_at = NOW()
       RETURNING id, role, country_code`,
      [user.id],
    );
    const profile = rows[0];

    const welcome = await this.wallet.grantWelcomeBonusIfEligible(
      user.id,
      profile?.country_code,
    );
    const wallet = await this.wallet.getWallet(user.id);

    const { rows: fullRows } = await this.db.query(
      `SELECT ${this.profileSelect} FROM profiles WHERE id = $1`,
      [user.id],
    );

    return {
      ...fullRows[0],
      welcomeBonusGranted: welcome.granted,
      wallet,
    };
  }

  @Patch("me")
  @UseGuards(SupabaseAuthGuard)
  async updateMe(@CurrentUser() user: AuthUser, @Body() dto: UpdateProfileDto) {
    const firstName = dto.firstName.trim();
    const lastName = dto.lastName?.trim() || null;
    const phone = normalizePhoneField(dto.phone, "primary phone number");

    let phoneSecondary: string | null = null;
    if (dto.phoneSecondary?.trim()) {
      phoneSecondary = normalizePhoneField(
        dto.phoneSecondary,
        "secondary phone number",
      );
      if (phoneSecondary === phone) {
        throw new BadRequestException(
          "Secondary phone must be different from your primary number.",
        );
      }
    }

    if (!isValidStoredPhone(phone)) {
      throw new BadRequestException("Invalid primary phone number.");
    }

    const { rows: existingRows } = await this.db.query<{
      role: string;
      phone: string | null;
      phone_secondary: string | null;
    }>(`SELECT role, phone, phone_secondary FROM profiles WHERE id = $1`, [
      user.id,
    ]);
    const existing = existingRows[0];
    const role = existing?.role ?? "TENANT";

    if (role === "LANDLORD" && !phone) {
      throw new BadRequestException(
        "Landlords need a reachable phone number for tenant contact.",
      );
    }

    const phoneChanged = existing?.phone !== phone;
    const secondaryChanged = (existing?.phone_secondary ?? null) !== phoneSecondary;

    const { rows } = await this.db.query(
      `UPDATE profiles
       SET first_name = $2,
           last_name = $3,
           phone = $4,
           phone_secondary = $5,
           phone_verified_at = CASE WHEN $6 THEN NULL ELSE phone_verified_at END,
           phone_secondary_verified_at = CASE WHEN $7 THEN NULL ELSE phone_secondary_verified_at END,
           updated_at = NOW()
       WHERE id = $1
       RETURNING ${this.profileSelect}`,
      [
        user.id,
        firstName,
        lastName,
        phone,
        phoneSecondary,
        phoneChanged,
        secondaryChanged,
      ],
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
       RETURNING id, role, first_name, last_name, phone, phone_secondary`,
      [user.id, dto.role],
    );
    return rows[0];
  }
}
