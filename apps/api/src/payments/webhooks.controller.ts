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

type LemonWebhookPayload = {
  meta?: {
    event_name?: string;
    custom_data?: Record<string, string | number | undefined>;
  };
  data?: {
    attributes?: {
      custom_data?: Record<string, string | number | undefined>;
    };
  };
  included?: Array<{
    attributes?: {
      custom_data?: Record<string, string | number | undefined>;
    };
  }>;
};

function readLemonCustomData(payload: LemonWebhookPayload) {
  const merged: Record<string, string | undefined> = {};

  const absorb = (obj?: Record<string, string | number | undefined>) => {
    if (!obj) return;
    for (const [key, value] of Object.entries(obj)) {
      if (value != null && value !== "") {
        merged[key] = String(value);
      }
    }
  };

  absorb(payload.data?.attributes?.custom_data);
  for (const item of payload.included ?? []) {
    absorb(item.attributes?.custom_data);
  }
  // Lemon Squeezy documents custom checkout fields on meta.custom_data.
  absorb(payload.meta?.custom_data);

  return merged;
}

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

    const payload = JSON.parse(rawBody.toString("utf8")) as LemonWebhookPayload;

    const eventName = payload.meta?.event_name ?? "";
    if (
      !eventName.includes("order_created") &&
      !eventName.includes("order_paid")
    ) {
      return { received: true, skipped: true };
    }

    const custom = readLemonCustomData(payload);
    let txRef = custom.tx_ref;
    const paymentId = custom.payment_id;

    if (!txRef && paymentId) {
      txRef =
        (await this.settle.findExternalRefByPaymentId(paymentId)) ?? undefined;
    }

    if (!txRef) {
      this.logger.warn(
        `Lemon Squeezy webhook: missing tx_ref (event=${eventName}, custom_keys=${Object.keys(custom).join(",") || "none"})`,
      );
      return { received: true, skipped: true };
    }

    const result = await this.settle.settleByExternalRef(
      txRef,
      PaymentProvider.LEMON_SQUEEZY,
    );

    return { received: true, ...result };
  }
}
