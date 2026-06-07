import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import {
  PaymentProvider,
  PaymentPurpose,
  type BuildingType,
} from "@plotpin/shared-types";
import { DatabaseService } from "../database/database.service";
import { PricingService } from "../pricing/pricing.service";
import { WalletService } from "../wallet/wallet.service";
import { FlutterwaveService } from "./flutterwave.service";
import { LemonSqueezyService } from "./lemon-squeezy.service";
import {
  resolveUnlockProvider,
  type CheckoutProviderPreference,
} from "./payment-routing.util";
import { randomUUID } from "node:crypto";

type UnitCheckoutRow = {
  id: string;
  bedrooms: number;
  status: string;
  building_type: string;
  country_code: string;
  building_name: string;
};

@Injectable()
export class UnlockCheckoutService {
  constructor(
    private readonly db: DatabaseService,
    private readonly pricing: PricingService,
    private readonly wallet: WalletService,
    private readonly flutterwave: FlutterwaveService,
    private readonly lemonSqueezy: LemonSqueezyService,
    private readonly config: ConfigService,
  ) {}

  async createCheckout(
    tenantId: string,
    unitId: string,
    tenantEmail: string,
    tenantName: string | null,
    options?: {
      tenantCountryCode?: string;
      providerPreference?: CheckoutProviderPreference;
      acceptTerms?: boolean;
    },
  ) {
    await this.ensureUnlockTerms(tenantId, options?.acceptTerms);

    const unit = await this.loadUnit(unitId);
    if (unit.status !== "AVAILABLE") {
      throw new BadRequestException("This unit is not available to unlock.");
    }

    const quote = await this.pricing.quote({
      purpose: PaymentPurpose.UNLOCK,
      buildingType: unit.building_type as BuildingType,
      bedrooms: unit.bedrooms,
      countryCode: unit.country_code,
    });

    const credit = await this.wallet.peekUnlockCredit(tenantId);
    if (credit && credit.amountUgx >= quote.amountUgx) {
      return {
        mode: "credit" as const,
        feeUgx: quote.amountUgx,
        message: "Use POST /units/:unitId/unlock to redeem your credit.",
      };
    }

    let chargeUgx = quote.amountUgx;
    let creditLedgerId: string | null = null;
    if (credit) {
      chargeUgx = Math.max(0, quote.amountUgx - credit.amountUgx);
      creditLedgerId = credit.ledgerId;
    }

    if (chargeUgx <= 0) {
      return {
        mode: "credit" as const,
        feeUgx: quote.amountUgx,
        message: "Use POST /units/:unitId/unlock to complete.",
      };
    }

    const provider = resolveUnlockProvider({
      tenantCountryCode: options?.tenantCountryCode,
      buildingCountryCode: unit.country_code,
      preference: options?.providerPreference,
    });

    if (provider === PaymentProvider.FLUTTERWAVE && !this.flutterwave.isConfigured()) {
      throw new BadRequestException(
        "Flutterwave checkout is not configured. Set FLUTTERWAVE_SECRET_KEY.",
      );
    }
    if (provider === PaymentProvider.LEMON_SQUEEZY && !this.lemonSqueezy.isConfigured()) {
      throw new BadRequestException(
        "International checkout is not configured. Set Lemon Squeezy env vars.",
      );
    }

    const profile = await this.loadTenantProfile(tenantId);
    const resolvedName =
      [profile?.first_name, profile?.last_name].filter(Boolean).join(" ").trim() ||
      tenantName?.trim() ||
      "PlotPin tenant";
    const tenantPhone = profile?.phone?.trim() ?? null;

    const txRef = `plotpin-unlock-${randomUUID()}`;
    const returnBase = this.appUrl("/tenant/unlocks/complete");
    const lemonPresentment =
      provider === PaymentProvider.LEMON_SQUEEZY
        ? await this.resolveLemonPresentment(
            chargeUgx,
            options?.tenantCountryCode,
          )
        : null;

    const { rows } = await this.db.query<{ id: string }>(
      `INSERT INTO payments (
         user_id, provider, purpose, amount, currency, status, external_ref, metadata
       ) VALUES ($1, $2, 'UNLOCK', $3, $4, 'PENDING', $5, $6)
       RETURNING id`,
      [
        tenantId,
        provider,
        chargeUgx,
        provider === PaymentProvider.FLUTTERWAVE
          ? "UGX"
          : await this.checkoutCurrency(tenantId, options?.tenantCountryCode),
        txRef,
        JSON.stringify({
          unitId,
          quoteAmountUgx: quote.amountUgx,
          chargeAmountUgx: chargeUgx,
          creditLedgerId,
          buildingName: unit.building_name,
          ...(lemonPresentment
            ? {
                lemonAmountCents: lemonPresentment.amountCents,
                lemonCurrency: lemonPresentment.quoteCurrency,
              }
            : {}),
        }),
      ],
    );

    const paymentId = rows[0].id;
    const redirectUrl = `${returnBase}?paymentId=${paymentId}&unitId=${unitId}`;

    let checkoutUrl: string;
    if (provider === PaymentProvider.FLUTTERWAVE) {
      if (!tenantPhone) {
        throw new BadRequestException(
          "Add a mobile money phone number to your profile before paying with MoMo.",
        );
      }
      checkoutUrl = await this.flutterwave.createPaymentLink({
        txRef,
        amountUgx: chargeUgx,
        email: tenantEmail,
        name: resolvedName,
        phone: tenantPhone,
        redirectUrl,
        mobileMoneyOnly:
          options?.providerPreference === "flutterwave",
      });
    } else {
      checkoutUrl = await this.lemonSqueezy.createCheckout({
        customPriceCents: lemonPresentment!.amountCents,
        email: tenantEmail,
        name: resolvedName,
        redirectUrl,
        customData: {
          payment_id: paymentId,
          unit_id: unitId,
          tenant_id: tenantId,
          tx_ref: txRef,
        },
      });
    }

    return {
      mode: "checkout" as const,
      provider,
      paymentId,
      checkoutUrl,
      feeUgx: quote.amountUgx,
      chargeUgx,
      currency: provider === PaymentProvider.FLUTTERWAVE ? "UGX" : "USD",
    };
  }

  private appUrl(path: string) {
    const base =
      this.config.get<string>("CORS_ORIGIN")?.split(",")[0]?.trim() ||
      "http://localhost:3000";
    return `${base.replace(/\/$/, "")}${path}`;
  }

  private async loadTenantProfile(tenantId: string) {
    const { rows } = await this.db.query<{
      first_name: string | null;
      last_name: string | null;
      phone: string | null;
    }>(
      `SELECT first_name, last_name, phone FROM profiles WHERE id = $1`,
      [tenantId],
    );
    return rows[0] ?? null;
  }

  private async ensureUnlockTerms(tenantId: string, acceptTerms?: boolean) {
    const { rows } = await this.db.query<{
      tenant_unlock_terms_accepted_at: Date | null;
    }>(
      `SELECT tenant_unlock_terms_accepted_at FROM profiles WHERE id = $1`,
      [tenantId],
    );
    if (!rows[0]?.tenant_unlock_terms_accepted_at) {
      if (!acceptTerms) {
        throw new BadRequestException(
          "Accept the Terms of Service and Privacy Policy before checkout.",
        );
      }
      await this.db.query(
        `UPDATE profiles
         SET tenant_unlock_terms_accepted_at = NOW(), updated_at = NOW()
         WHERE id = $1`,
        [tenantId],
      );
    }
  }

  private async loadUnit(unitId: string): Promise<UnitCheckoutRow> {
    const { rows } = await this.db.query<UnitCheckoutRow>(
      `SELECT u.id, u.bedrooms, u.status, b.building_type, b.country_code, b.name AS building_name
       FROM units u
       JOIN buildings b ON b.id = u.building_id
       WHERE u.id = $1 AND b.is_verified = TRUE`,
      [unitId],
    );
    if (!rows[0]) throw new NotFoundException("Unit not found");
    return rows[0];
  }

  private async checkoutCurrency(tenantId: string, tenantCountryCode?: string) {
    const code = (tenantCountryCode ?? "US").toUpperCase();
    const { rows } = await this.db.query<{ currency: string }>(
      `SELECT currency FROM countries WHERE code = $1`,
      [code],
    );
    return rows[0]?.currency ?? "USD";
  }

  private async resolveLemonPresentment(chargeUgx: number, tenantCountryCode?: string) {
    const currency = await this.checkoutCurrency("", tenantCountryCode ?? "US");
    const quoteCurrency =
      currency === "GBP" ? "GBP" : currency === "EUR" ? "EUR" : "USD";

    const { rows } = await this.db.query<{ rate: string }>(
      `SELECT rate FROM fx_rates
       WHERE base_currency = 'UGX' AND quote_currency = $1`,
      [quoteCurrency],
    );
    const rate = Number(rows[0]?.rate ?? 0.00026);
    const amountMajor = Math.max(0.5, (chargeUgx * rate));
    const amountCents = Math.round(amountMajor * 100);
    return { amountCents, quoteCurrency };
  }
}
