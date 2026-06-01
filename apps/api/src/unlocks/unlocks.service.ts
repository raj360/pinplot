import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { PRICING, PaymentPurpose } from "@plotpin/shared-types";
import { DatabaseService } from "../database/database.service";
import { WalletService } from "../wallet/wallet.service";

type UnitRow = {
  id: string;
  building_id: string;
  unit_number: string;
  status: string;
  building_name: string;
  cover_image_path?: string | null;
  video_url?: string | null;
  exact_address: string | null;
  exact_lat: number | null;
  exact_lng: number | null;
  approximate_lat: number;
  approximate_lng: number;
  landlord_phone: string | null;
  landlord_phone_secondary?: string | null;
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

const UNIT_JOIN = `
  FROM units u
  JOIN buildings b ON b.id = u.building_id
  LEFT JOIN profiles p ON p.id = b.landlord_id
  LEFT JOIN auth.users au ON au.id = b.landlord_id
`;

@Injectable()
export class UnlocksService {
  constructor(
    private readonly db: DatabaseService,
    private readonly wallet: WalletService,
  ) {}

  async listMine(tenantId: string) {
    const { rows } = await this.db.query(
      `SELECT uu.*, u.unit_number, u.building_id, b.name AS building_name,
              b.cover_image_path, b.video_url,
              b.exact_lat, b.exact_lng, b.approximate_lat, b.approximate_lng,
              p.phone AS landlord_phone,
              p.phone_secondary AS landlord_phone_secondary,
              au.email AS landlord_email
       FROM unit_unlocks uu
       JOIN units u ON u.id = uu.unit_id
       JOIN buildings b ON b.id = u.building_id
       LEFT JOIN profiles p ON p.id = b.landlord_id
       LEFT JOIN auth.users au ON au.id = b.landlord_id
       WHERE uu.tenant_id = $1
         AND uu.is_winner = TRUE
         AND (uu.expires_at IS NULL OR uu.expires_at > NOW())
       ORDER BY uu.created_at DESC`,
      [tenantId],
    );
    return this.mapUnlockRows(rows as Array<UnlockRow & UnitRow>);
  }

  async listForBuilding(buildingId: string, tenantId: string) {
    const { rows } = await this.db.query(
      `SELECT uu.*, u.unit_number, u.building_id, b.name AS building_name,
              b.cover_image_path, b.video_url,
              b.exact_lat, b.exact_lng, b.approximate_lat, b.approximate_lng,
              p.phone AS landlord_phone,
              p.phone_secondary AS landlord_phone_secondary,
              au.email AS landlord_email
       FROM unit_unlocks uu
       JOIN units u ON u.id = uu.unit_id
       JOIN buildings b ON b.id = u.building_id
       LEFT JOIN profiles p ON p.id = b.landlord_id
       LEFT JOIN auth.users au ON au.id = b.landlord_id
       WHERE b.id = $1
         AND uu.tenant_id = $2
         AND uu.is_winner = TRUE
         AND (uu.expires_at IS NULL OR uu.expires_at > NOW())
       ORDER BY uu.created_at DESC`,
      [buildingId, tenantId],
    );
    return this.mapUnlockRows(rows as Array<UnlockRow & UnitRow>);
  }

  private async mapUnlockRows(rows: Array<UnlockRow & UnitRow>) {
    const imageCache = new Map<string, string[]>();
    const mapped = [];
    for (const row of rows) {
      const buildingId = row.building_id;
      if (!imageCache.has(buildingId)) {
        imageCache.set(
          buildingId,
          await this.fetchBuildingImageUrls(buildingId, row.cover_image_path),
        );
      }
      mapped.push({
        ...this.toUnlockRecord(row),
        imageUrls: imageCache.get(buildingId),
      });
    }
    return mapped;
  }

  private async fetchBuildingImageUrls(
    buildingId: string,
    coverPath?: string | null,
  ) {
    const { rows } = await this.db.query<{ storage_path: string }>(
      `SELECT storage_path
       FROM unit_images
       WHERE building_id = $1
       ORDER BY is_primary DESC, sort_order ASC, created_at ASC`,
      [buildingId],
    );
    const fromTable = rows.map((row) => row.storage_path).filter(Boolean);
    const merged = [...fromTable];
    if (coverPath && !merged.includes(coverPath)) {
      merged.unshift(coverPath);
    }
    if (merged.length > 0) return merged;
    return coverPath ? [coverPath] : [];
  }

  async getStatus(unitId: string, tenantId: string) {
    const unit = await this.loadUnit(unitId);
    const winner = await this.findActiveWinner(unitId);
    const mine = await this.findTenantUnlock(unitId, tenantId);
    const unlockCreditsAvailable = await this.wallet.countAvailableCredits(
      tenantId,
      PaymentPurpose.UNLOCK,
    );

    if (mine?.is_winner && this.isActive(mine)) {
      const response = await this.enrichWithMedia(
        this.toResponse(unit, mine, "winner"),
      );
      return { ...response, unlockCreditsAvailable };
    }

    if (winner && winner.tenant_id !== tenantId) {
      return {
        unitId,
        unitNumber: unit.unit_number,
        buildingId: unit.building_id,
        status: unit.status,
        unlockState: "locked_by_other" as const,
        feeUgx: PRICING.tenantUnlockFeeUgx,
        unlockCreditsAvailable,
        exclusiveHours: PRICING.unlockExclusiveHours,
      };
    }

    return {
      unitId,
      unitNumber: unit.unit_number,
      buildingId: unit.building_id,
      status: unit.status,
      unlockState:
        unit.status === "AVAILABLE"
          ? ("available" as const)
          : ("unavailable" as const),
      feeUgx: PRICING.tenantUnlockFeeUgx,
      unlockCreditsAvailable,
      exclusiveHours: PRICING.unlockExclusiveHours,
    };
  }

  async unlockUnit(tenantId: string, unitId: string, paymentId?: string) {
    await this.db.query("BEGIN");
    try {
      const unit = await this.lockUnit(unitId);

      const winner = await this.findActiveWinner(unitId);
      if (winner) {
        if (winner.tenant_id === tenantId) {
          await this.db.query("COMMIT");
          return this.enrichWithMedia(
            this.toResponse(unit, winner, "winner"),
          );
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

      const resolvedPayment = await this.resolveUnlockPayment(
        tenantId,
        unitId,
        paymentId,
      );

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
          resolvedPayment.paymentId,
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
      const response = await this.enrichWithMedia(
        this.toResponse(unit, rows[0], "winner"),
      );
      return {
        ...response,
        paidWithCredit: resolvedPayment.paidWithCredit,
        creditType: resolvedPayment.creditType,
        unlockCreditsAvailable: await this.wallet.countAvailableCredits(
          tenantId,
          PaymentPurpose.UNLOCK,
        ),
      };
    } catch (err) {
      await this.db.query("ROLLBACK");
      throw err;
    }
  }

  private async lockUnit(unitId: string): Promise<UnitRow> {
    const { rows } = await this.db.query<UnitRow>(
      `SELECT u.id, u.building_id, u.unit_number, u.status,
              b.name AS building_name, b.cover_image_path, b.video_url,
              b.exact_address,
              b.exact_lat, b.exact_lng, b.approximate_lat, b.approximate_lng,
              p.phone AS landlord_phone,
              p.phone_secondary AS landlord_phone_secondary,
              au.email AS landlord_email
       ${UNIT_JOIN}
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
              b.name AS building_name, b.cover_image_path, b.video_url,
              b.exact_address,
              b.exact_lat, b.exact_lng, b.approximate_lat, b.approximate_lng,
              p.phone AS landlord_phone,
              p.phone_secondary AS landlord_phone_secondary,
              au.email AS landlord_email
       ${UNIT_JOIN}
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

  private resolveCoords(unit: UnitRow) {
    const lat = unit.exact_lat ?? unit.approximate_lat;
    const lng = unit.exact_lng ?? unit.approximate_lng;
    return { lat, lng };
  }

  private async resolveUnlockPayment(
    tenantId: string,
    unitId: string,
    paymentId?: string,
  ) {
    if (paymentId) {
      return {
        paymentId,
        paidWithCredit: false,
        creditType: undefined as string | undefined,
      };
    }

    const credit = await this.wallet.consumeUnlockCredit(tenantId);
    if (credit) {
      const id = await this.createCreditPayment(
        tenantId,
        unitId,
        credit.ledgerId,
        credit.amountUgx,
        credit.creditType,
      );
      return {
        paymentId: id,
        paidWithCredit: true,
        creditType: credit.creditType,
      };
    }

    const id = await this.createDevPayment(tenantId, unitId);
    return {
      paymentId: id,
      paidWithCredit: false,
      creditType: undefined as string | undefined,
    };
  }

  private async createCreditPayment(
    tenantId: string,
    unitId: string,
    ledgerId: string,
    nominalAmountUgx: number,
    creditType: string,
  ) {
    const { rows } = await this.db.query<{ id: string }>(
      `INSERT INTO payments (
        user_id, provider, purpose, amount, currency, status, external_ref, metadata
      ) VALUES ($1, 'STRIPE', 'UNLOCK', 0, 'UGX', 'COMPLETED', $2, $3)
      RETURNING id`,
      [
        tenantId,
        `credit-unlock-${ledgerId}`,
        JSON.stringify({
          credit: true,
          creditLedgerId: ledgerId,
          creditType,
          nominalAmountUgx,
          unitId,
        }),
      ],
    );
    return rows[0].id;
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

  private async enrichWithMedia(
    response: ReturnType<UnlocksService["toResponse"]>,
  ) {
    const imageUrls = await this.fetchBuildingImageUrls(
      response.buildingId,
      response.coverImageUrl,
    );
    return { ...response, imageUrls };
  }

  private resolveContact(
    unlock: UnlockRow,
    unit: UnitRow,
  ) {
    const snapshot = unlock.revealed_contact_phone?.trim() || null;
    const livePhone = unit.landlord_phone?.trim() || null;
    const liveSecondary = unit.landlord_phone_secondary?.trim() || null;
    const email = unit.landlord_email?.trim() || null;

    // Snapshot at unlock time; prefer live profile phone when landlord adds one later.
    let primary = snapshot;
    if (livePhone) {
      if (!snapshot || snapshot.includes("@")) {
        primary = livePhone;
      }
    } else if (!primary && email) {
      primary = email;
    }

    return {
      phone: primary,
      phoneSecondary: liveSecondary || null,
      exactAddress: unlock.revealed_exact_address,
      contactIsEmailFallback: Boolean(primary?.includes("@") && !livePhone),
    };
  }

  private toResponse(
    unit: UnitRow,
    unlock: UnlockRow,
    unlockState: "winner",
  ) {
    const { lat, lng } = this.resolveCoords(unit);
    const contact = this.resolveContact(unlock, unit);
    return {
      unlockId: unlock.id,
      unitId: unit.id,
      unitNumber: unit.unit_number,
      buildingId: unit.building_id,
      buildingName: unit.building_name,
      status: "LOCKED",
      unlockState,
      feeUgx: PRICING.tenantUnlockFeeUgx,
      exclusiveHours: PRICING.unlockExclusiveHours,
      unlockedAt: unlock.created_at,
      expiresAt: unlock.expires_at,
      contact,
      location: { lat, lng },
      coverImageUrl: unit.cover_image_path ?? undefined,
      videoUrl: unit.video_url ?? undefined,
    };
  }

  private toUnlockRecord(row: UnlockRow & UnitRow) {
    const unit: UnitRow = row;
    const { lat, lng } = this.resolveCoords(unit);
    const contact = this.resolveContact(row, unit);
    return {
      unlockId: row.id,
      unitId: row.unit_id,
      unitNumber: row.unit_number,
      buildingId: row.building_id,
      buildingName: row.building_name,
      unlockState: "winner" as const,
      unlockedAt: row.created_at,
      expiresAt: row.expires_at,
      exclusiveHours: PRICING.unlockExclusiveHours,
      contact,
      location: { lat, lng },
      coverImageUrl: unit.cover_image_path ?? undefined,
      videoUrl: unit.video_url ?? undefined,
    };
  }
}
