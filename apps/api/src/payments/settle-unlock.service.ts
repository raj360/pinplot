import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from "@nestjs/common";
import { PaymentProvider } from "@plotpin/shared-types";
import { DatabaseService } from "../database/database.service";
import { WalletService } from "../wallet/wallet.service";
import { UnlocksService } from "../unlocks/unlocks.service";
import { FlutterwaveService } from "./flutterwave.service";
import { LemonSqueezyService } from "./lemon-squeezy.service";

type PaymentRow = {
  id: string;
  user_id: string;
  provider: string;
  purpose: string;
  status: string;
  amount: number;
  currency: string;
  external_ref: string | null;
  created_at?: Date;
  metadata: {
    unitId?: string;
    /** FEATURED payments, building boosted on settlement. */
    buildingId?: string;
    durationDays?: number;
    chargeAmountUgx?: number;
    creditLedgerId?: string;
    providerTransactionId?: string;
    lemonAmountCents?: number;
    lemonCurrency?: string;
    /** What Flutterwave was actually told to charge (payer-country currency). */
    fwChargeAmount?: number;
    fwChargeCurrency?: string;
  };
};

@Injectable()
export class SettleUnlockService {
  private readonly logger = new Logger(SettleUnlockService.name);

  constructor(
    private readonly db: DatabaseService,
    private readonly wallet: WalletService,
    private readonly unlocks: UnlocksService,
    private readonly flutterwave: FlutterwaveService,
    private readonly lemonSqueezy: LemonSqueezyService,
  ) {}

  async settleByExternalRef(
    externalRef: string,
    provider: PaymentProvider.FLUTTERWAVE | PaymentProvider.LEMON_SQUEEZY,
    verification?: {
      providerTransactionId?: string;
      amount?: number;
      currency?: string;
    },
  ) {
    const { rows } = await this.db.query<PaymentRow>(
      `SELECT id, user_id, provider, purpose, status, amount, currency, external_ref, metadata
       FROM payments
       WHERE external_ref = $1
       LIMIT 1`,
      [externalRef],
    );

    const payment = rows[0];
    if (!payment) {
      this.logger.warn(`No payment for external_ref=${externalRef}`);
      return { settled: false, reason: "payment_not_found" as const };
    }

    const isFeatured = payment.purpose === "FEATURED";

    if (payment.status === "COMPLETED") {
      return isFeatured
        ? this.idempotentFeaturedResult(payment)
        : this.idempotentUnlockResult(payment);
    }

    if (payment.status !== "PENDING") {
      return { settled: false, reason: "invalid_status" as const };
    }

    if (payment.provider !== provider) {
      throw new BadRequestException("Payment provider mismatch.");
    }

    const meta = payment.metadata ?? {};
    const unitId = meta.unitId;
    if (!isFeatured && !unitId) {
      throw new BadRequestException("Payment missing unit metadata.");
    }
    if (isFeatured && !meta.buildingId) {
      throw new BadRequestException("Payment missing building metadata.");
    }

    // Flutterwave charges in the payer-country currency; verify against what we
    // actually told it to charge (falls back to canonical UGX for older rows).
    const expectedAmount =
      meta.fwChargeAmount ?? meta.chargeAmountUgx ?? payment.amount;
    const expectedCurrency = (meta.fwChargeCurrency ?? "UGX").toUpperCase();
    if (verification?.amount != null && provider === PaymentProvider.FLUTTERWAVE) {
      if (
        Math.round(verification.amount) !== Math.round(expectedAmount) ||
        (verification.currency ?? "UGX").toUpperCase() !== expectedCurrency
      ) {
        throw new BadRequestException("Flutterwave amount mismatch.");
      }
    }

    const { rows: updated } = await this.db.query<{ id: string }>(
      `UPDATE payments
       SET status = 'COMPLETED',
           metadata = metadata || $2::jsonb,
           updated_at = NOW()
       WHERE id = $1 AND status = 'PENDING'
       RETURNING id`,
      [
        payment.id,
        JSON.stringify({
          settledAt: new Date().toISOString(),
          providerTransactionId: verification?.providerTransactionId,
        }),
      ],
    );

    if (!updated[0]) {
      return this.idempotentUnlockResult(payment);
    }

    if (meta.creditLedgerId) {
      await this.wallet.consumeCreditById(meta.creditLedgerId, payment.user_id);
    }

    if (isFeatured) {
      const featured = await this.grantPaidFeatured(payment);
      return { settled: true, featured, paymentId: payment.id };
    }

    const unlock = await this.unlocks.unlockUnit(payment.user_id, unitId!, {
      paymentId: payment.id,
      acceptTerms: true,
    });

    return { settled: true, unlock, paymentId: payment.id };
  }

  /**
   * Activate a paid featured boost, extends any active window so landlords
   * never lose remaining days when topping up.
   */
  private async grantPaidFeatured(payment: PaymentRow) {
    const buildingId = payment.metadata?.buildingId;
    const durationDays = payment.metadata?.durationDays ?? 7;
    if (!buildingId) {
      throw new BadRequestException("Payment missing building metadata.");
    }

    const { rows } = await this.db.query<{
      id: string;
      name: string;
      featured_until: Date;
    }>(
      `UPDATE buildings
       SET is_featured = TRUE,
           featured_granted_at = NOW(),
           featured_until = GREATEST(COALESCE(featured_until, NOW()), NOW())
             + ($2 * INTERVAL '1 day'),
           featured_source = 'PAID',
           updated_at = NOW()
       WHERE id = $1
         AND is_verified = TRUE
         AND rejected_at IS NULL
       RETURNING id, name, featured_until`,
      [buildingId, durationDays],
    );
    if (!rows[0]) {
      throw new NotFoundException("Verified building not found");
    }

    await this.db.query(
      `INSERT INTO featured_grants (building_id, admin_id, source, expires_at)
       VALUES ($1, $2, 'PAID', $3)`,
      [buildingId, payment.user_id, rows[0].featured_until],
    );

    return {
      buildingId: rows[0].id,
      buildingName: rows[0].name,
      featuredUntil: rows[0].featured_until.toISOString(),
      durationDays,
    };
  }

  private async idempotentFeaturedResult(payment: PaymentRow) {
    const { rows } = await this.db.query<{ id: string }>(
      `SELECT id FROM featured_grants
       WHERE building_id = $1 AND source = 'PAID' AND granted_at >= $2::timestamptz - INTERVAL '1 hour'
       LIMIT 1`,
      [payment.metadata?.buildingId, payment.created_at ?? new Date()],
    );
    if (rows[0]) {
      return {
        settled: true,
        alreadyCompleted: true,
        paymentId: payment.id,
      };
    }
    if (payment.metadata?.buildingId && payment.status === "COMPLETED") {
      const featured = await this.grantPaidFeatured(payment);
      return { settled: true, recovered: true, featured, paymentId: payment.id };
    }
    return { settled: false, alreadyCompleted: true, paymentId: payment.id };
  }

  async settleFlutterwaveFromRedirect(params: {
    txRef: string;
    transactionId: string;
    status: string;
  }) {
    if (params.status !== "successful") {
      return { settled: false, reason: "not_successful" as const };
    }

    const verified = await this.flutterwave.verifyTransaction(params.transactionId);
    if (!verified || verified.status !== "successful") {
      return { settled: false, reason: "verification_failed" as const };
    }

    return this.settleByExternalRef(params.txRef, PaymentProvider.FLUTTERWAVE, {
      providerTransactionId: String(verified.id),
      amount: verified.amount,
      currency: verified.currency,
    });
  }

  async settleLemonSqueezyFromReturn(params: {
    paymentId: string;
    userId: string;
    userEmail?: string;
  }) {
    const { rows } = await this.db.query<PaymentRow>(
      `SELECT id, user_id, provider, purpose, status, amount, currency, external_ref, metadata, created_at
       FROM payments
       WHERE id = $1`,
      [params.paymentId],
    );
    const payment = rows[0];
    if (!payment) throw new NotFoundException("Payment not found");
    if (payment.user_id !== params.userId) {
      throw new BadRequestException("Payment does not belong to this account.");
    }
    if (payment.status === "COMPLETED") {
      return payment.purpose === "FEATURED"
        ? this.idempotentFeaturedResult(payment)
        : this.idempotentUnlockResult(payment);
    }
    if (payment.provider !== PaymentProvider.LEMON_SQUEEZY) {
      throw new BadRequestException("Payment is not a Lemon Squeezy checkout.");
    }
    if (!payment.external_ref) {
      throw new BadRequestException("Payment missing external reference.");
    }

    const amountCents =
      payment.metadata?.lemonAmountCents ??
      Math.round((payment.metadata?.chargeAmountUgx ?? payment.amount) * 0.00026 * 100);

    if (!params.userEmail) {
      return { settled: false, reason: "order_not_found" as const };
    }

    const order = await this.lemonSqueezy.findMatchingPaidOrder({
      customerEmail: params.userEmail,
      amountCents,
      notBefore: payment.created_at ?? new Date(Date.now() - 3_600_000),
    });

    if (!order) {
      return { settled: false, reason: "order_not_found" as const };
    }

    return this.settleByExternalRef(
      payment.external_ref,
      PaymentProvider.LEMON_SQUEEZY,
      { providerTransactionId: order.orderId },
    );
  }

  async findExternalRefByPaymentId(paymentId: string) {
    const { rows } = await this.db.query<{ external_ref: string | null }>(
      `SELECT external_ref FROM payments WHERE id = $1`,
      [paymentId],
    );
    return rows[0]?.external_ref ?? null;
  }

  async getPaymentStatus(paymentId: string, userId: string) {
    const { rows } = await this.db.query<PaymentRow>(
      `SELECT id, user_id, purpose, status, metadata
       FROM payments WHERE id = $1`,
      [paymentId],
    );
    const payment = rows[0];
    if (!payment) throw new NotFoundException("Payment not found");
    if (payment.user_id !== userId) {
      throw new BadRequestException("Payment does not belong to this account.");
    }

    if (payment.purpose === "FEATURED") {
      const buildingId = payment.metadata?.buildingId;
      let unlockState: "pending" | "completed" | "failed" = "pending";
      if (payment.status === "COMPLETED" && buildingId) {
        const { rows: featuredRows } = await this.db.query(
          `SELECT 1 FROM buildings
           WHERE id = $1 AND is_featured = TRUE
             AND (featured_until IS NULL OR featured_until > NOW())
           LIMIT 1`,
          [buildingId],
        );
        unlockState = featuredRows[0] ? "completed" : "pending";
      } else if (payment.status === "FAILED") {
        unlockState = "failed";
      }
      return {
        paymentId: payment.id,
        status: payment.status,
        purpose: payment.purpose,
        buildingId,
        unlockState,
      };
    }

    const unitId = payment.metadata?.unitId;
    let unlockState: "pending" | "completed" | "failed" = "pending";
    if (payment.status === "COMPLETED" && unitId) {
      const { rows: unlockRows } = await this.db.query(
        `SELECT 1 FROM unit_unlocks WHERE payment_id = $1 LIMIT 1`,
        [paymentId],
      );
      unlockState = unlockRows[0] ? "completed" : "pending";
    } else if (payment.status === "FAILED") {
      unlockState = "failed";
    }

    return {
      paymentId: payment.id,
      status: payment.status,
      purpose: payment.purpose,
      unitId,
      unlockState,
    };
  }

  private async idempotentUnlockResult(payment: PaymentRow) {
    const { rows } = await this.db.query<{ id: string }>(
      `SELECT id FROM unit_unlocks WHERE payment_id = $1 LIMIT 1`,
      [payment.id],
    );
    if (rows[0]) {
      return {
        settled: true,
        alreadyCompleted: true,
        paymentId: payment.id,
        unlockId: rows[0].id,
      };
    }

    const unitId = payment.metadata?.unitId;
    if (unitId && payment.status === "COMPLETED") {
      const unlock = await this.unlocks.unlockUnit(payment.user_id, unitId, {
        paymentId: payment.id,
        acceptTerms: true,
      });
      return { settled: true, recovered: true, unlock, paymentId: payment.id };
    }

    return {
      settled: false,
      alreadyCompleted: true,
      paymentId: payment.id,
    };
  }
}
