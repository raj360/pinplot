import {
  Controller,
  Headers,
  HttpCode,
  Logger,
  Post,
  Req,
} from "@nestjs/common";
import { PaymentProvider } from "@plotpin/shared-types";
import type { Request } from "express";
import { FlutterwaveService } from "./flutterwave.service";
import { LemonSqueezyService } from "./lemon-squeezy.service";
import { SettleUnlockService } from "./settle-unlock.service";

@Controller("webhooks")
export class WebhooksController {
  private readonly logger = new Logger(WebhooksController.name);

  constructor(
    private readonly flutterwave: FlutterwaveService,
    private readonly lemonSqueezy: LemonSqueezyService,
    private readonly settle: SettleUnlockService,
  ) {}

  @Post("flutterwave")
  @HttpCode(200)
  async handleFlutterwave(
    @Req() req: Request & { rawBody?: Buffer },
    @Headers("verif-hash") verifHash?: string,
  ) {
    if (!this.flutterwave.verifyWebhookSignature(verifHash)) {
      this.logger.warn("Flutterwave webhook rejected: invalid signature");
      return { received: false };
    }

    const payload = req.body as {
      event?: string;
      data?: {
        tx_ref?: string;
        id?: number;
        status?: string;
        amount?: number;
        currency?: string;
      };
    };

    if (payload.event !== "charge.completed" || !payload.data?.tx_ref) {
      return { received: true, skipped: true };
    }

    if (payload.data.status !== "successful") {
      return { received: true, skipped: true };
    }

    const result = await this.settle.settleByExternalRef(
      payload.data.tx_ref,
      PaymentProvider.FLUTTERWAVE,
      {
        providerTransactionId: payload.data.id
          ? String(payload.data.id)
          : undefined,
        amount: payload.data.amount,
        currency: payload.data.currency,
      },
    );

    return { received: true, ...result };
  }

  @Post("lemon-squeezy")
  @HttpCode(200)
  async handleLemonSqueezy(
    @Req() req: Request & { rawBody?: Buffer },
    @Headers("x-signature") signature?: string,
  ) {
    const rawBody = req.rawBody ?? Buffer.from(JSON.stringify(req.body ?? {}));
    if (!this.lemonSqueezy.verifyWebhookSignature(rawBody, signature)) {
      this.logger.warn("Lemon Squeezy webhook rejected: invalid signature");
      return { received: false };
    }

    const payload = JSON.parse(rawBody.toString("utf8")) as {
      meta?: { event_name?: string };
      data?: {
        attributes?: {
          custom_data?: Record<string, string>;
        };
      };
      included?: Array<{
        type?: string;
        attributes?: {
          custom_data?: Record<string, string>;
        };
      }>;
    };

    const eventName = payload.meta?.event_name ?? "";
    if (!eventName.includes("order_created") && !eventName.includes("order_paid")) {
      return { received: true, skipped: true };
    }

    let txRef: string | undefined;
    let paymentId: string | undefined;

    const rootCustom = payload.data?.attributes?.custom_data;
    if (rootCustom?.tx_ref) txRef = rootCustom.tx_ref;
    if (rootCustom?.payment_id) paymentId = rootCustom.payment_id;

    for (const item of payload.included ?? []) {
      const custom = item.attributes?.custom_data;
      if (custom?.tx_ref) txRef = custom.tx_ref;
      if (custom?.payment_id) paymentId = custom.payment_id;
    }

    if (!txRef && paymentId) {
      txRef = (await this.settle.findExternalRefByPaymentId(paymentId)) ?? undefined;
    }

    if (!txRef) {
      this.logger.warn("Lemon Squeezy webhook: missing tx_ref");
      return { received: true, skipped: true };
    }

    const result = await this.settle.settleByExternalRef(
      txRef,
      PaymentProvider.LEMON_SQUEEZY,
    );

    return { received: true, ...result };
  }
}
