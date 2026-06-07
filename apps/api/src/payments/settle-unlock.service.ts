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
  status: string;
  amount: number;
  currency: string;
  external_ref: string | null;
  created_at?: Date;
  metadata: {
    unitId?: string;
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
      `SELECT id, user_id, provider, status, amount, currency, external_ref, metadata
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

    if (payment.status === "COMPLETED") {
      return this.idempotentUnlockResult(payment);
    }

    if (payment.status !== "PENDING") {
      return { settled: false, reason: "invalid_status" as const };
    }

    if (payment.provider !== provider) {
      throw new BadRequestException("Payment provider mismatch.");
    }

    const meta = payment.metadata ?? {};
    const unitId = meta.unitId;
    if (!unitId) {
      throw new BadRequestException("Payment missing unit metadata.");
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

    const unlock = await this.unlocks.unlockUnit(payment.user_id, unitId, {
      paymentId: payment.id,
      acceptTerms: true,
    });

    return { settled: true, unlock, paymentId: payment.id };
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
      `SELECT id, user_id, provider, status, amount, currency, external_ref, metadata, created_at
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
      return this.idempotentUnlockResult(payment);
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
      `SELECT id, user_id, status, metadata
       FROM payments WHERE id = $1`,
      [paymentId],
    );
    const payment = rows[0];
    if (!payment) throw new NotFoundException("Payment not found");
    if (payment.user_id !== userId) {
      throw new BadRequestException("Payment does not belong to this account.");
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
