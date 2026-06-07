import {
  BadRequestException,
  Injectable,
  Logger,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

type InitializePaymentInput = {
  txRef: string;
  /** Amount in the charge currency (already converted from canonical UGX). */
  amount: number;
  /** ISO 4217 currency Flutterwave charges in (e.g. UGX, KES, NGN). */
  currency: string;
  email: string;
  name: string;
  phone: string;
  redirectUrl: string;
  /**
   * Flutterwave hosted-checkout `payment_options` (e.g. "mobilemoneyuganda",
   * "mpesa,mobilemoneykenya", "card,banktransfer,ussd").
   */
  paymentOptions: string;
};

type FlutterwaveInitResponse = {
  status: string;
  message: string;
  data?: { link: string };
};

type FlutterwaveVerifyResponse = {
  status: string;
  data?: {
    status: string;
    amount: number;
    currency: string;
    tx_ref: string;
    id: number;
  };
};

@Injectable()
export class FlutterwaveService {
  private readonly logger = new Logger(FlutterwaveService.name);

  constructor(private readonly config: ConfigService) {}

  isConfigured(): boolean {
    return Boolean(this.config.get<string>("FLUTTERWAVE_SECRET_KEY")?.trim());
  }

  async createPaymentLink(input: InitializePaymentInput): Promise<string> {
    const secret = this.config.get<string>("FLUTTERWAVE_SECRET_KEY")?.trim();
    if (!secret) {
      throw new BadRequestException("Flutterwave is not configured.");
    }

    const res = await fetch("https://api.flutterwave.com/v3/payments", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${secret}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        tx_ref: input.txRef,
        amount: input.amount,
        currency: input.currency,
        redirect_url: input.redirectUrl,
        payment_options: input.paymentOptions,
        customer: {
          email: input.email,
          name: input.name,
          phonenumber: input.phone,
        },
        customizations: {
          title: "PlotPin — Unlock contact",
          description: "Tenant unlock fee",
        },
      }),
    });

    const body = (await res.json()) as FlutterwaveInitResponse;
    if (!res.ok || body.status !== "success" || !body.data?.link) {
      this.logger.error(`Flutterwave init failed: ${JSON.stringify(body)}`);
      throw new BadRequestException("Could not start Flutterwave checkout.");
    }

    return body.data.link;
  }

  async verifyTransaction(transactionId: string | number) {
    const secret = this.config.get<string>("FLUTTERWAVE_SECRET_KEY")?.trim();
    if (!secret) {
      throw new BadRequestException("Flutterwave is not configured.");
    }

    const res = await fetch(
      `https://api.flutterwave.com/v3/transactions/${transactionId}/verify`,
      {
        headers: {
          Authorization: `Bearer ${secret}`,
          "Content-Type": "application/json",
        },
      },
    );

    const body = (await res.json()) as FlutterwaveVerifyResponse;
    if (!res.ok || body.status !== "success" || !body.data) {
      return null;
    }

    return body.data;
  }

  verifyWebhookSignature(verifHash: string | undefined): boolean {
    const secret = this.config.get<string>("FLUTTERWAVE_WEBHOOK_SECRET")?.trim();
    if (!secret) return false;
    return verifHash === secret;
  }
}
