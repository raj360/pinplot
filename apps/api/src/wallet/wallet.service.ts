import {
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import {
  DEFAULT_COUNTRY,
  PaymentPurpose,
  WALLET_POLICY_NOTE,
  WELCOME_BONUS_EXPIRY_DAYS,
  WalletCreditType,
  type WalletCredit,
  type WalletSummary,
} from "@plotpin/shared-types";
import { DatabaseService } from "../database/database.service";
import { PricingService } from "../pricing/pricing.service";

type LedgerRow = {
  id: string;
  credit_type: string;
  purpose: string;
  amount_ugx: number;
  remaining_ugx: number;
  quantity: number;
  remaining_quantity: number;
  expires_at: Date | null;
  metadata: Record<string, unknown> | null;
};

const CREDIT_LABELS: Record<WalletCreditType, string> = {
  [WalletCreditType.WELCOME_BONUS]: "Welcome unlock credit",
  [WalletCreditType.COUPON]: "Coupon credit",
  [WalletCreditType.ADMIN_GRANT]: "Support credit",
  [WalletCreditType.FEATURED_GRANT]: "Featured listing credit",
};

@Injectable()
export class WalletService {
  constructor(
    private readonly db: DatabaseService,
    private readonly pricing: PricingService,
  ) {}

  async getWallet(userId: string): Promise<WalletSummary> {
    const credits = await this.listActiveCredits(userId);
    return this.toSummary(credits);
  }

  async countAvailableCredits(
    userId: string,
    purpose: PaymentPurpose,
  ): Promise<number> {
    const { rows } = await this.db.query<{ total: string }>(
      `SELECT COALESCE(SUM(remaining_quantity), 0)::text AS total
       FROM wallet_ledger
       WHERE user_id = $1
         AND purpose = $2::payment_purpose
         AND remaining_quantity > 0
         AND (expires_at IS NULL OR expires_at > NOW())`,
      [userId, purpose],
    );
    return Number(rows[0]?.total ?? 0);
  }

  /**
   * Grant one welcome unlock credit on first tenant profile sync (S4-08).
   * Idempotent — safe to call on every sync.
   */
  async grantWelcomeBonusIfEligible(
    userId: string,
    countryCode?: string,
  ): Promise<{ granted: boolean; credit?: WalletCredit }> {
    const resolvedCountry = (countryCode ?? DEFAULT_COUNTRY.code).toUpperCase();
    const { rows: profileRows } = await this.db.query<{ role: string }>(
      "SELECT role FROM profiles WHERE id = $1",
      [userId],
    );
    const role = profileRows[0]?.role;
    if (role && role !== "TENANT") {
      return { granted: false };
    }

    const existing = await this.findWelcomeBonus(userId);
    if (existing) {
      return { granted: false, credit: this.mapRow(existing) };
    }

    const quote = await this.pricing.quote({
      purpose: PaymentPurpose.UNLOCK,
      bedrooms: 1,
      countryCode: resolvedCountry,
    });

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + WELCOME_BONUS_EXPIRY_DAYS);

    try {
      const { rows } = await this.db.query<LedgerRow>(
        `INSERT INTO wallet_ledger (
           user_id, credit_type, purpose,
           amount_ugx, remaining_ugx, quantity, remaining_quantity,
           expires_at, metadata
         ) VALUES ($1, 'WELCOME_BONUS', 'UNLOCK', $2, $2, 1, 1, $3, $4)
         RETURNING *`,
        [
          userId,
          quote.unlockFeeUgx,
          expiresAt,
          JSON.stringify({
            source: "profile_sync",
            countryCode: quote.countryCode,
          }),
        ],
      );

      return { granted: true, credit: this.mapRow(rows[0]) };
    } catch (err) {
      if (
        err &&
        typeof err === "object" &&
        "code" in err &&
        (err as { code: string }).code === "23505"
      ) {
        const bonus = await this.findWelcomeBonus(userId);
        return {
          granted: false,
          credit: bonus ? this.mapRow(bonus) : undefined,
        };
      }
      throw err;
    }
  }

  /**
   * Consume one unlock credit (FIFO). Caller must run inside a transaction when
   * composing with unlock.
   */
  async peekUnlockCredit(
    userId: string,
  ): Promise<{ ledgerId: string; creditType: WalletCreditType; amountUgx: number } | null> {
    const { rows } = await this.db.query<LedgerRow>(
      `SELECT *
       FROM wallet_ledger
       WHERE user_id = $1
         AND purpose = 'UNLOCK'
         AND remaining_quantity > 0
         AND (expires_at IS NULL OR expires_at > NOW())
       ORDER BY created_at ASC
       LIMIT 1`,
      [userId],
    );
    const row = rows[0];
    if (!row) return null;
    return {
      ledgerId: row.id,
      creditType: row.credit_type as WalletCreditType,
      amountUgx: row.amount_ugx,
    };
  }

  async consumeCreditById(ledgerId: string, userId: string) {
    const { rows } = await this.db.query<LedgerRow>(
      `SELECT *
       FROM wallet_ledger
       WHERE id = $1 AND user_id = $2
         AND purpose = 'UNLOCK'
         AND remaining_quantity > 0
         AND (expires_at IS NULL OR expires_at > NOW())
       FOR UPDATE`,
      [ledgerId, userId],
    );
    const row = rows[0];
    if (!row) {
      throw new NotFoundException("Wallet credit not found or already used.");
    }

    const nextQuantity = row.remaining_quantity - 1;
    await this.db.query(
      `UPDATE wallet_ledger
       SET remaining_quantity = $2,
           remaining_ugx = CASE WHEN $2 = 0 THEN 0 ELSE remaining_ugx END,
           updated_at = NOW()
       WHERE id = $1`,
      [row.id, nextQuantity],
    );

    return {
      ledgerId: row.id,
      creditType: row.credit_type as WalletCreditType,
      amountUgx: row.amount_ugx,
    };
  }

  async consumeUnlockCredit(
    userId: string,
  ): Promise<{ ledgerId: string; creditType: WalletCreditType; amountUgx: number } | null> {
    const { rows } = await this.db.query<LedgerRow>(
      `SELECT *
       FROM wallet_ledger
       WHERE user_id = $1
         AND purpose = 'UNLOCK'
         AND remaining_quantity > 0
         AND (expires_at IS NULL OR expires_at > NOW())
       ORDER BY created_at ASC
       LIMIT 1
       FOR UPDATE`,
      [userId],
    );

    const row = rows[0];
    if (!row) {
      return null;
    }

    const nextQuantity = row.remaining_quantity - 1;
    const nextRemainingUgx = nextQuantity === 0 ? 0 : row.remaining_ugx;

    await this.db.query(
      `UPDATE wallet_ledger
       SET remaining_quantity = $2,
           remaining_ugx = $3,
           updated_at = NOW()
       WHERE id = $1`,
      [row.id, nextQuantity, nextRemainingUgx],
    );

    return {
      ledgerId: row.id,
      creditType: row.credit_type as WalletCreditType,
      amountUgx: row.amount_ugx,
    };
  }

  async getCreditById(ledgerId: string, userId: string): Promise<WalletCredit> {
    const { rows } = await this.db.query<LedgerRow>(
      `SELECT * FROM wallet_ledger WHERE id = $1 AND user_id = $2`,
      [ledgerId, userId],
    );
    if (!rows[0]) throw new NotFoundException("Wallet credit not found");
    return this.mapRow(rows[0]);
  }

  private async findWelcomeBonus(userId: string) {
    const { rows } = await this.db.query<LedgerRow>(
      `SELECT * FROM wallet_ledger
       WHERE user_id = $1 AND credit_type = 'WELCOME_BONUS'
       LIMIT 1`,
      [userId],
    );
    return rows[0] ?? null;
  }

  private async listActiveCredits(userId: string): Promise<WalletCredit[]> {
    const { rows } = await this.db.query<LedgerRow>(
      `SELECT *
       FROM wallet_ledger
       WHERE user_id = $1
         AND remaining_quantity > 0
         AND (expires_at IS NULL OR expires_at > NOW())
       ORDER BY created_at ASC`,
      [userId],
    );
    return rows.map((row) => this.mapRow(row));
  }

  private mapRow(row: LedgerRow): WalletCredit {
    const creditType = row.credit_type as WalletCreditType;
    const metadata = row.metadata ?? {};
    const metadataLabel =
      typeof metadata.label === "string" ? metadata.label : undefined;

    return {
      id: row.id,
      creditType,
      purpose: row.purpose as PaymentPurpose,
      quantity: row.quantity,
      remainingQuantity: row.remaining_quantity,
      amountUgx: row.amount_ugx,
      remainingUgx: row.remaining_ugx,
      expiresAt: row.expires_at?.toISOString() ?? null,
      label: metadataLabel ?? CREDIT_LABELS[creditType],
    };
  }

  private toSummary(credits: WalletCredit[]): WalletSummary {
    const sumFor = (purpose: PaymentPurpose) =>
      credits
        .filter((c) => c.purpose === purpose)
        .reduce((sum, c) => sum + c.remainingQuantity, 0);

    return {
      credits,
      unlockCredits: sumFor(PaymentPurpose.UNLOCK),
      listingCredits: sumFor(PaymentPurpose.LISTING),
      featuredCredits: sumFor(PaymentPurpose.FEATURED),
      policyNote: WALLET_POLICY_NOTE,
    };
  }
}
