import {
  BadRequestException,
  Injectable,
  Logger,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { createHmac, timingSafeEqual } from "node:crypto";

type CreateCheckoutInput = {
  customPriceCents: number;
  email?: string;
  name?: string;
  redirectUrl: string;
  customData: Record<string, string>;
};

type LemonCheckoutResponse = {
  data?: {
    attributes?: { url?: string };
  };
};

@Injectable()
export class LemonSqueezyService {
  private readonly logger = new Logger(LemonSqueezyService.name);

  constructor(private readonly config: ConfigService) {}

  isConfigured(): boolean {
    return Boolean(
      this.config.get<string>("LEMON_SQUEEZY_API_KEY")?.trim() &&
        this.config.get<string>("LEMON_SQUEEZY_STORE_ID")?.trim() &&
        this.config.get<string>("LEMON_SQUEEZY_VARIANT_ID")?.trim(),
    );
  }

  async createCheckout(input: CreateCheckoutInput): Promise<string> {
    const apiKey = this.config.get<string>("LEMON_SQUEEZY_API_KEY")?.trim();
    const storeId = this.config.get<string>("LEMON_SQUEEZY_STORE_ID")?.trim();
    const variantId = this.config.get<string>("LEMON_SQUEEZY_VARIANT_ID")?.trim();

    if (!apiKey || !storeId || !variantId) {
      throw new BadRequestException(
        "Lemon Squeezy is not configured (API key, store, variant).",
      );
    }

    const res = await fetch("https://api.lemonsqueezy.com/v1/checkouts", {
      method: "POST",
      headers: {
        Accept: "application/vnd.api+json",
        "Content-Type": "application/vnd.api+json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        data: {
          type: "checkouts",
          attributes: {
            custom_price: input.customPriceCents,
            product_options: {
              redirect_url: input.redirectUrl,
              name: "PlotPin unlock",
              description:
                "Time-limited access to landlord contact and exact location.",
            },
            checkout_data: {
              email: input.email,
              name: input.name,
              custom: input.customData,
            },
          },
          relationships: {
            store: {
              data: { type: "stores", id: storeId },
            },
            variant: {
              data: { type: "variants", id: variantId },
            },
          },
        },
      }),
    });

    const body = (await res.json()) as LemonCheckoutResponse;
    const url = body.data?.attributes?.url;
    if (!res.ok || !url) {
      this.logger.error(`Lemon Squeezy checkout failed: ${JSON.stringify(body)}`);
      throw new BadRequestException("Could not start Lemon Squeezy checkout.");
    }

    return url;
  }

  verifyWebhookSignature(rawBody: Buffer, signature: string | undefined): boolean {
    const secret = this.config.get<string>("LEMON_SQUEEZY_WEBHOOK_SECRET")?.trim();
    if (!secret || !signature) return false;

    const digest = createHmac("sha256", secret).update(rawBody).digest("hex");
    if (digest.length !== signature.length) return false;
    try {
      return timingSafeEqual(Buffer.from(digest), Buffer.from(signature));
    } catch {
      return false;
    }
  }
}
