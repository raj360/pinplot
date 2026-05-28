import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { PRICING } from "@plotpin/shared-types";
import { DatabaseService } from "../database/database.service";

type UnitRow = {
  id: string;
  building_id: string;
  unit_number: string;
  status: string;
  exact_address: string | null;
  landlord_phone: string | null;
  landlord_email: string | null;
};

type UnlockRow = {
  id: string;
  unit_id: string;
  tenant_id: string;
  is_winner: boolean;
  revealed_contact_phone: string | null;
  revealed_exact_address: string | null;
  expires_at: Date | null;
  created_at: Date;
};

@Injectable()
export class UnlocksService {
  constructor(private readonly db: DatabaseService) {}

  async getStatus(unitId: string, tenantId: string) {
    const unit = await this.loadUnit(unitId);
    const winner = await this.findActiveWinner(unitId);
    const mine = await this.findTenantUnlock(unitId, tenantId);

    if (mine?.is_winner && this.isActive(mine)) {
      return this.toResponse(unit, mine, "winner");
    }

    if (winner && winner.tenant_id !== tenantId) {
      return {
        unitId,
        unitNumber: unit.unit_number,
        status: unit.status,
        unlockState: "locked_by_other" as const,
        feeUgx: PRICING.tenantUnlockFeeUgx,
        exclusiveHours: PRICING.unlockExclusiveHours,
      };
    }

    return {
      unitId,
      unitNumber: unit.unit_number,
      status: unit.status,
      unlockState:
        unit.status === "AVAILABLE" ? ("available" as const) : ("unavailable" as const),
      feeUgx: PRICING.tenantUnlockFeeUgx,
      exclusiveHours: PRICING.unlockExclusiveHours,
    };
  }

  /** First successful unlock wins — unit row locked with FOR UPDATE. */
  async unlockUnit(tenantId: string, unitId: string, paymentId?: string) {
    await this.db.query("BEGIN");
    try {
      const unit = await this.lockUnit(unitId);

      const winner = await this.findActiveWinner(unitId);
      if (winner) {
        if (winner.tenant_id === tenantId) {
          await this.db.query("COMMIT");
          return this.toResponse(unit, winner, "winner");
        }
        await this.db.query("ROLLBACK");
        throw new ConflictException(
          "Another tenant already unlocked this unit.",
        );
      }

      if (unit.status !== "AVAILABLE") {
        await this.db.query("ROLLBACK");
        throw new ConflictException("This unit is not available to unlock.");
      }

      const resolvedPaymentId =
        paymentId ?? (await this.createDevPayment(tenantId, unitId));

      const expiresAt = new Date(
        Date.now() + PRICING.unlockExclusiveHours * 60 * 60 * 1000,
      );

      const revealedPhone =
        unit.landlord_phone?.trim() ||
        unit.landlord_email?.trim() ||
        null;
      const revealedAddress = unit.exact_address?.trim() || null;

      const { rows } = await this.db.query<UnlockRow>(
        `INSERT INTO unit_unlocks (
          unit_id, tenant_id, payment_id, is_winner,
          revealed_contact_phone, revealed_exact_address, expires_at
        ) VALUES ($1, $2, $3, TRUE, $4, $5, $6)
        RETURNING *`,
        [
          unitId,
          tenantId,
          resolvedPaymentId,
          revealedPhone,
          revealedAddress,
          expiresAt,
        ],
      );

      await this.db.query(
        `UPDATE units
         SET status = 'LOCKED',
             locked_by_tenant_id = $2,
             locked_until = $3,
             updated_at = NOW()
         WHERE id = $1`,
        [unitId, tenantId, expiresAt],
      );

      await this.db.query("COMMIT");
      return this.toResponse(unit, rows[0], "winner");
    } catch (err) {
      await this.db.query("ROLLBACK");
      throw err;
    }
  }

  private async lockUnit(unitId: string): Promise<UnitRow> {
    const { rows } = await this.db.query<UnitRow>(
      `SELECT u.id, u.building_id, u.unit_number, u.status,
              b.exact_address, p.phone AS landlord_phone, au.email AS landlord_email
       FROM units u
       JOIN buildings b ON b.id = u.building_id
       LEFT JOIN profiles p ON p.id = b.landlord_id
       LEFT JOIN auth.users au ON au.id = b.landlord_id
       WHERE u.id = $1 AND b.is_verified = TRUE
       FOR UPDATE OF u`,
      [unitId],
    );
    if (!rows[0]) throw new NotFoundException("Unit not found");
    return rows[0];
  }

  private async loadUnit(unitId: string): Promise<UnitRow> {
    const { rows } = await this.db.query<UnitRow>(
      `SELECT u.id, u.building_id, u.unit_number, u.status,
              b.exact_address, p.phone AS landlord_phone, au.email AS landlord_email
       FROM units u
       JOIN buildings b ON b.id = u.building_id
       LEFT JOIN profiles p ON p.id = b.landlord_id
       LEFT JOIN auth.users au ON au.id = b.landlord_id
       WHERE u.id = $1 AND b.is_verified = TRUE`,
      [unitId],
    );
    if (!rows[0]) throw new NotFoundException("Unit not found");
    return rows[0];
  }

  private async findActiveWinner(unitId: string) {
    const { rows } = await this.db.query<UnlockRow>(
      `SELECT * FROM unit_unlocks
       WHERE unit_id = $1 AND is_winner = TRUE
         AND (expires_at IS NULL OR expires_at > NOW())
       ORDER BY created_at ASC
       LIMIT 1`,
      [unitId],
    );
    return rows[0] ?? null;
  }

  private async findTenantUnlock(unitId: string, tenantId: string) {
    const { rows } = await this.db.query<UnlockRow>(
      `SELECT * FROM unit_unlocks WHERE unit_id = $1 AND tenant_id = $2`,
      [unitId, tenantId],
    );
    return rows[0] ?? null;
  }

  private isActive(unlock: UnlockRow) {
    return !unlock.expires_at || new Date(unlock.expires_at) > new Date();
  }

  private async createDevPayment(tenantId: string, unitId: string) {
    if (process.env.NODE_ENV === "production" && !process.env.ALLOW_DEV_UNLOCK) {
      throw new BadRequestException(
        "Payment required. Connect Stripe or Flutterwave checkout.",
      );
    }

    const { rows } = await this.db.query<{ id: string }>(
      `INSERT INTO payments (
        user_id, provider, purpose, amount, currency, status, external_ref, metadata
      ) VALUES ($1, 'STRIPE', 'UNLOCK', $2, 'UGX', 'COMPLETED', $3, $4)
      RETURNING id`,
      [
        tenantId,
        PRICING.tenantUnlockFeeUgx,
        `dev-unlock-${unitId}-${Date.now()}`,
        JSON.stringify({ dev: true, unitId }),
      ],
    );
    return rows[0].id;
  }

  private toResponse(
    unit: UnitRow,
    unlock: UnlockRow,
    unlockState: "winner",
  ) {
    return {
      unitId: unit.id,
      unitNumber: unit.unit_number,
      status: "LOCKED",
      unlockState,
      feeUgx: PRICING.tenantUnlockFeeUgx,
      exclusiveHours: PRICING.unlockExclusiveHours,
      expiresAt: unlock.expires_at,
      contact: {
        phone: unlock.revealed_contact_phone,
        exactAddress: unlock.revealed_exact_address,
      },
    };
  }
}
