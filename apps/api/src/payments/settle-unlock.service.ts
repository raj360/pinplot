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

type PaymentRow = {
  id: string;
  user_id: string;
  provider: string;
  status: string;
  amount: number;
  currency: string;
  external_ref: string | null;
  metadata: {
    unitId?: string;
    chargeAmountUgx?: number;
    creditLedgerId?: string;
    providerTransactionId?: string;
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

    const expectedCharge = meta.chargeAmountUgx ?? payment.amount;
    if (verification?.amount != null && provider === PaymentProvider.FLUTTERWAVE) {
      if (
        Math.round(verification.amount) !== Math.round(expectedCharge) ||
        (verification.currency ?? "UGX").toUpperCase() !== "UGX"
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
