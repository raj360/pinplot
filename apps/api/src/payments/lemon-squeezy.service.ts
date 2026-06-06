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
        this.resolveVariantId(),
    );
  }

  /** Lemon Squeezy checkout relationships require a numeric variant id, not a product UUID. */
  private resolveVariantId(): string | null {
    const raw = this.config.get<string>("LEMON_SQUEEZY_VARIANT_ID")?.trim();
    if (!raw) return null;
    if (/^\d+$/.test(raw)) return raw;
    this.logger.warn(
      `LEMON_SQUEEZY_VARIANT_ID="${raw}" is not numeric. Use Products → variant → Copy ID in the Lemon Squeezy dashboard (not the product UUID).`,
    );
    return null;
  }

  async createCheckout(input: CreateCheckoutInput): Promise<string> {
    const apiKey = this.config.get<string>("LEMON_SQUEEZY_API_KEY")?.trim();
    const storeId = this.config.get<string>("LEMON_SQUEEZY_STORE_ID")?.trim();
    const variantId = this.resolveVariantId();

    if (!apiKey || !storeId || !variantId) {
      throw new BadRequestException(
        "Lemon Squeezy is not configured. Set LEMON_SQUEEZY_API_KEY, LEMON_SQUEEZY_STORE_ID, and a numeric LEMON_SQUEEZY_VARIANT_ID (variant Copy ID, not product UUID).",
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

    const body = (await res.json()) as LemonCheckoutResponse & {
      errors?: Array<{ detail?: string; source?: { pointer?: string } }>;
    };
    const url = body.data?.attributes?.url;
    if (!res.ok || !url) {
      this.logger.error(`Lemon Squeezy checkout failed: ${JSON.stringify(body)}`);
      const variantMissing = body.errors?.some(
        (error) => error.source?.pointer === "/data/relationships/variant",
      );
      if (variantMissing) {
        throw new BadRequestException(
          "Lemon Squeezy variant not found. Set LEMON_SQUEEZY_VARIANT_ID to the numeric variant id (Products → your unlock product → variant → Copy ID). Store id must match the same store.",
        );
      }
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

  /**
   * Fallback when webhook is delayed: match a recent paid order by email, amount,
   * and PlotPin unlock variant.
   */
  async findMatchingPaidOrder(params: {
    customerEmail: string;
    amountCents: number;
    notBefore: Date;
  }): Promise<{ orderId: string } | null> {
    const apiKey = this.config.get<string>("LEMON_SQUEEZY_API_KEY")?.trim();
    const storeId = this.config.get<string>("LEMON_SQUEEZY_STORE_ID")?.trim();
    const variantId = this.resolveVariantId();
    if (!apiKey || !storeId || !variantId) return null;

    const res = await fetch(
      `https://api.lemonsqueezy.com/v1/orders?filter[store_id]=${storeId}&page[size]=20&sort=-createdAt`,
      {
        headers: {
          Accept: "application/vnd.api+json",
          Authorization: `Bearer ${apiKey}`,
        },
      },
    );

    if (!res.ok) {
      this.logger.warn(`Lemon Squeezy order lookup failed: HTTP ${res.status}`);
      return null;
    }

    const body = (await res.json()) as {
      data?: Array<{
        id: string;
        attributes?: {
          status?: string;
          user_email?: string;
          total?: number;
          created_at?: string;
          first_order_item?: { variant_id?: number };
        };
      }>;
    };

    const email = params.customerEmail.trim().toLowerCase();
    const notBeforeMs = params.notBefore.getTime() - 60_000;

    for (const order of body.data ?? []) {
      const attrs = order.attributes;
      if (!attrs || attrs.status !== "paid") continue;
      if ((attrs.user_email ?? "").trim().toLowerCase() !== email) continue;
      if (String(attrs.first_order_item?.variant_id ?? "") !== variantId) continue;
      if (Math.abs((attrs.total ?? 0) - params.amountCents) > 2) continue;

      const createdAt = attrs.created_at
        ? new Date(attrs.created_at).getTime()
        : 0;
      if (createdAt < notBeforeMs) continue;

      return { orderId: order.id };
    }

    return null;
  }
}
