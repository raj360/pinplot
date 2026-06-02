import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import {
  DEFAULT_COUNTRY,
  PaymentPurpose,
  WalletCreditType,
  type WalletCredit,
} from "@plotpin/shared-types";
import { DatabaseService } from "../database/database.service";
import { PricingService } from "../pricing/pricing.service";
import { CreateCouponDto } from "./dto/coupon.dto";

type CouponRow = {
  id: string;
  code: string;
  credit_type: string;
  purpose: string;
  quantity: number;
  amount_ugx: number;
  max_redemptions: number | null;
  redemption_count: number;
  max_per_user: number;
  expires_at: Date | null;
  is_active: boolean;
  label: string | null;
  metadata: Record<string, unknown> | null;
  created_at: Date;
};

@Injectable()
export class CouponsService {
  constructor(
    private readonly db: DatabaseService,
    private readonly pricing: PricingService,
  ) {}

  async listCoupons() {
    const { rows } = await this.db.query<CouponRow>(
      `SELECT *
       FROM coupons
       ORDER BY created_at DESC`,
    );
    return rows.map((row) => this.toAdminCoupon(row));
  }

  async createCoupon(adminId: string, dto: CreateCouponDto) {
    const code = dto.code.trim().toUpperCase();
    const purpose = dto.purpose ?? PaymentPurpose.UNLOCK;
    const quantity = dto.quantity ?? 1;

    let amountUgx = dto.amountUgx;
    if (amountUgx == null) {
      if (purpose === PaymentPurpose.FEATURED) {
        throw new BadRequestException(
          "Set a nominal amount for featured coupons — there is no default featured fee yet.",
        );
      }
      const quote = await this.pricing.quote({
        purpose,
        bedrooms: 1,
        countryCode: DEFAULT_COUNTRY.code,
      });
      amountUgx =
        purpose === PaymentPurpose.LISTING
          ? quote.listingFeeUgx
          : quote.unlockFeeUgx;
    }

    try {
      const { rows } = await this.db.query<CouponRow>(
        `INSERT INTO coupons (
           code, purpose, quantity, amount_ugx,
           max_redemptions, max_per_user, expires_at, label,
           created_by, metadata
         ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
         RETURNING *`,
        [
          code,
          purpose,
          quantity,
          amountUgx,
          dto.maxRedemptions ?? null,
          dto.maxPerUser ?? 1,
          dto.expiresAt ? new Date(dto.expiresAt) : null,
          dto.label?.trim() || null,
          adminId,
          JSON.stringify({}),
        ],
      );
      return this.toAdminCoupon(rows[0]);
    } catch (err) {
      if (
        err &&
        typeof err === "object" &&
        "code" in err &&
        (err as { code: string }).code === "23505"
      ) {
        throw new ConflictException("A coupon with this code already exists.");
      }
      throw err;
    }
  }

  async deactivateCoupon(id: string) {
    const { rows } = await this.db.query<CouponRow>(
      `UPDATE coupons
       SET is_active = FALSE, updated_at = NOW()
       WHERE id = $1
       RETURNING *`,
      [id],
    );
    if (!rows[0]) throw new NotFoundException("Coupon not found");
    return this.toAdminCoupon(rows[0]);
  }

  async redeemCoupon(userId: string, rawCode: string): Promise<WalletCredit> {
    const code = rawCode.trim().toUpperCase();
    if (!code) {
      throw new BadRequestException("Coupon code is required.");
    }

    await this.db.query("BEGIN");
    try {
      const { rows } = await this.db.query<CouponRow>(
        `SELECT *
         FROM coupons
         WHERE UPPER(code) = $1
         FOR UPDATE`,
        [code],
      );
      const coupon = rows[0];
      if (!coupon) {
        throw new NotFoundException("Invalid or expired coupon code.");
      }

      this.assertRedeemable(coupon);

      const { rows: prior } = await this.db.query<{ count: string }>(
        `SELECT COUNT(*)::text AS count
         FROM coupon_redemptions
         WHERE coupon_id = $1 AND user_id = $2`,
        [coupon.id, userId],
      );
      const userCount = Number(prior[0]?.count ?? 0);
      if (userCount >= coupon.max_per_user) {
        throw new ConflictException("You have already redeemed this coupon.");
      }

      const expiresAt = coupon.expires_at;
      const label = coupon.label?.trim() || `Coupon ${coupon.code}`;
      const metadata = {
        couponId: coupon.id,
        couponCode: coupon.code,
        label,
      };

      const { rows: ledgerRows } = await this.db.query<{
        id: string;
        credit_type: string;
        purpose: string;
        amount_ugx: number;
        remaining_ugx: number;
        quantity: number;
        remaining_quantity: number;
        expires_at: Date | null;
        metadata: Record<string, unknown> | null;
      }>(
        `INSERT INTO wallet_ledger (
           user_id, credit_type, purpose,
           amount_ugx, remaining_ugx, quantity, remaining_quantity,
           expires_at, reference_id, metadata
         ) VALUES ($1, 'COUPON', $2, $3, $3, $4, $4, $5, $6, $7)
         RETURNING *`,
        [
          userId,
          coupon.purpose,
          coupon.amount_ugx,
          coupon.quantity,
          expiresAt,
          coupon.id,
          JSON.stringify(metadata),
        ],
      );

      await this.db.query(
        `INSERT INTO coupon_redemptions (coupon_id, user_id, ledger_id)
         VALUES ($1, $2, $3)`,
        [coupon.id, userId, ledgerRows[0].id],
      );

      await this.db.query(
        `UPDATE coupons
         SET redemption_count = redemption_count + 1, updated_at = NOW()
         WHERE id = $1`,
        [coupon.id],
      );

      await this.db.query("COMMIT");

      const row = ledgerRows[0];
      return {
        id: row.id,
        creditType: row.credit_type as WalletCreditType,
        purpose: row.purpose as PaymentPurpose,
        quantity: row.quantity,
        remainingQuantity: row.remaining_quantity,
        amountUgx: row.amount_ugx,
        remainingUgx: row.remaining_ugx,
        expiresAt: row.expires_at?.toISOString() ?? null,
        label,
      };
    } catch (err) {
      await this.db.query("ROLLBACK");
      throw err;
    }
  }

  private assertRedeemable(coupon: CouponRow) {
    if (!coupon.is_active) {
      throw new BadRequestException("This coupon is no longer active.");
    }
    if (coupon.expires_at && new Date(coupon.expires_at) <= new Date()) {
      throw new BadRequestException("This coupon has expired.");
    }
    if (
      coupon.max_redemptions != null &&
      coupon.redemption_count >= coupon.max_redemptions
    ) {
      throw new BadRequestException("This coupon has reached its redemption limit.");
    }
  }

  private toAdminCoupon(row: CouponRow) {
    return {
      id: row.id,
      code: row.code,
      purpose: row.purpose as PaymentPurpose,
      quantity: row.quantity,
      amountUgx: row.amount_ugx,
      maxRedemptions: row.max_redemptions,
      redemptionCount: row.redemption_count,
      maxPerUser: row.max_per_user,
      expiresAt: row.expires_at?.toISOString() ?? null,
      isActive: row.is_active,
      label: row.label,
      createdAt: row.created_at.toISOString(),
    };
  }
}
