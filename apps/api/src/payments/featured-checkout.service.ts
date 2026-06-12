import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PaymentProvider, findFeaturedTier } from "@plotpin/shared-types";
import { DatabaseService } from "../database/database.service";
import { FlutterwaveService } from "./flutterwave.service";
import { LemonSqueezyService } from "./lemon-squeezy.service";
import {
  resolveUnlockProvider,
  type CheckoutProviderPreference,
} from "./payment-routing.util";
import { resolveFlutterwaveRegion } from "./flutterwave-regions.util";
import { randomUUID } from "node:crypto";

type FeaturedBuildingRow = {
  id: string;
  name: string;
  country_code: string;
  is_verified: boolean;
  rejected_at: Date | null;
  is_featured: boolean;
  featured_until: Date | null;
};

/**
 * Landlord-paid featured boost (S5-08). Mirrors the unlock checkout flow:
 * canonical UGX tier → FW (MoMo markets) or Lemon Squeezy (cards) → webhook /
 * redirect settlement grants `featured_source = 'PAID'`.
 */
@Injectable()
export class FeaturedCheckoutService {
  constructor(
    private readonly db: DatabaseService,
    private readonly flutterwave: FlutterwaveService,
    private readonly lemonSqueezy: LemonSqueezyService,
    private readonly config: ConfigService,
  ) {}

  async createCheckout(
    landlordId: string,
    buildingId: string,
    landlordEmail: string,
    landlordName: string | null,
    options: {
      durationDays: number;
      payerCountryCode?: string;
      providerPreference?: CheckoutProviderPreference;
    },
  ) {
    const tier = findFeaturedTier(options.durationDays);
    if (!tier) {
      throw new BadRequestException("Invalid featured duration.");
    }

    const building = await this.loadOwnedBuilding(buildingId, landlordId);
    if (!building.is_verified || building.rejected_at) {
      throw new BadRequestException(
        "Only verified listings can be featured.",
      );
    }

    const chargeUgx = tier.amountUgx;

    const provider = resolveUnlockProvider({
      tenantCountryCode: options.payerCountryCode,
      buildingCountryCode: building.country_code,
      preference: options.providerPreference,
    });

    if (
      provider === PaymentProvider.FLUTTERWAVE &&
      !this.flutterwave.isConfigured()
    ) {
      throw new BadRequestException(
        "Flutterwave checkout is not configured. Set FLUTTERWAVE_SECRET_KEY.",
      );
    }
    if (
      provider === PaymentProvider.LEMON_SQUEEZY &&
      !this.lemonSqueezy.isConfigured()
    ) {
      throw new BadRequestException(
        "International checkout is not configured. Set Lemon Squeezy env vars.",
      );
    }

    const profile = await this.loadLandlordProfile(landlordId);
    const resolvedName =
      [profile?.first_name, profile?.last_name]
        .filter(Boolean)
        .join(" ")
        .trim() ||
      landlordName?.trim() ||
      "PlotPin landlord";
    const landlordPhone = profile?.phone?.trim() ?? null;

    const txRef = `plotpin-featured-${randomUUID()}`;
    const returnBase = this.appUrl("/landlord/featured/complete");

    const payerCountry = (
      options.payerCountryCode ?? building.country_code
    ).toUpperCase();
    const flutterwaveRegion = resolveFlutterwaveRegion(payerCountry);
    const flutterwavePresentment =
      provider === PaymentProvider.FLUTTERWAVE
        ? await this.resolveFlutterwavePresentment(chargeUgx, flutterwaveRegion)
        : null;
    const lemonPresentment =
      provider === PaymentProvider.LEMON_SQUEEZY
        ? await this.resolveLemonPresentment(chargeUgx, options.payerCountryCode)
        : null;

    const { rows } = await this.db.query<{ id: string }>(
      `INSERT INTO payments (
         user_id, provider, purpose, amount, currency, status, external_ref, metadata
       ) VALUES ($1, $2, 'FEATURED', $3, $4, 'PENDING', $5, $6)
       RETURNING id`,
      [
        landlordId,
        provider,
        chargeUgx,
        provider === PaymentProvider.FLUTTERWAVE
          ? "UGX"
          : (lemonPresentment?.quoteCurrency ?? "USD"),
        txRef,
        JSON.stringify({
          buildingId,
          durationDays: tier.days,
          chargeAmountUgx: chargeUgx,
          buildingName: building.name,
          ...(lemonPresentment
            ? {
                lemonAmountCents: lemonPresentment.amountCents,
                lemonCurrency: lemonPresentment.quoteCurrency,
              }
            : {}),
          ...(flutterwavePresentment
            ? {
                fwChargeAmount: flutterwavePresentment.amount,
                fwChargeCurrency: flutterwavePresentment.currency,
              }
            : {}),
        }),
      ],
    );

    const paymentId = rows[0].id;
    const redirectUrl = `${returnBase}?paymentId=${paymentId}&buildingId=${buildingId}`;

    let checkoutUrl: string;
    if (provider === PaymentProvider.FLUTTERWAVE) {
      if (!landlordPhone) {
        throw new BadRequestException(
          "Add a mobile money phone number to your profile before paying with MoMo.",
        );
      }
      checkoutUrl = await this.flutterwave.createPaymentLink({
        txRef,
        amount: flutterwavePresentment!.amount,
        currency: flutterwavePresentment!.currency,
        email: landlordEmail,
        name: resolvedName,
        phone: landlordPhone,
        redirectUrl,
        paymentOptions: flutterwaveRegion.mobileMoneyOptions,
      });
    } else {
      checkoutUrl = await this.lemonSqueezy.createCheckout({
        customPriceCents: lemonPresentment!.amountCents,
        email: landlordEmail,
        name: resolvedName,
        redirectUrl,
        customData: {
          payment_id: paymentId,
          building_id: buildingId,
          landlord_id: landlordId,
          tx_ref: txRef,
        },
      });
    }

    return {
      mode: "checkout" as const,
      provider,
      paymentId,
      checkoutUrl,
      durationDays: tier.days,
      chargeUgx,
      currency:
        provider === PaymentProvider.FLUTTERWAVE
          ? (flutterwavePresentment?.currency ?? "UGX")
          : (lemonPresentment?.quoteCurrency ?? "USD"),
    };
  }

  private async loadOwnedBuilding(
    buildingId: string,
    landlordId: string,
  ): Promise<FeaturedBuildingRow> {
    const { rows } = await this.db.query<FeaturedBuildingRow>(
      `SELECT id, name, country_code, is_verified, rejected_at, is_featured, featured_until
       FROM buildings
       WHERE id = $1 AND landlord_id = $2`,
      [buildingId, landlordId],
    );
    if (!rows[0]) throw new NotFoundException("Building not found");
    return rows[0];
  }

  private async loadLandlordProfile(landlordId: string) {
    const { rows } = await this.db.query<{
      first_name: string | null;
      last_name: string | null;
      phone: string | null;
    }>(
      `SELECT first_name, last_name, phone FROM profiles WHERE id = $1`,
      [landlordId],
    );
    return rows[0] ?? null;
  }

  /** Same presentment rules as unlock checkout, see UnlockCheckoutService. */
  private async resolveFlutterwavePresentment(
    chargeUgx: number,
    region: { currency: string },
  ): Promise<{ amount: number; currency: string }> {
    if (region.currency === "UGX") {
      return { amount: chargeUgx, currency: "UGX" };
    }
    const { rows } = await this.db.query<{ rate: string }>(
      `SELECT rate FROM fx_rates
       WHERE base_currency = 'UGX' AND quote_currency = $1`,
      [region.currency],
    );
    const rate = Number(rows[0]?.rate ?? 0);
    if (!rate) {
      return { amount: chargeUgx, currency: "UGX" };
    }
    return {
      amount: Math.max(1, Math.round(chargeUgx * rate)),
      currency: region.currency,
    };
  }

  private async resolveLemonPresentment(
    chargeUgx: number,
    payerCountryCode?: string,
  ) {
    const code = (payerCountryCode ?? "US").toUpperCase();
    const { rows: countryRows } = await this.db.query<{ currency: string }>(
      `SELECT currency FROM countries WHERE code = $1`,
      [code],
    );
    const currency = countryRows[0]?.currency ?? "USD";
    const quoteCurrency =
      currency === "GBP" ? "GBP" : currency === "EUR" ? "EUR" : "USD";

    const { rows } = await this.db.query<{ rate: string }>(
      `SELECT rate FROM fx_rates
       WHERE base_currency = 'UGX' AND quote_currency = $1`,
      [quoteCurrency],
    );
    const rate = Number(rows[0]?.rate ?? 0.00026);
    const amountMajor = Math.max(0.5, chargeUgx * rate);
    const amountCents = Math.round(amountMajor * 100);
    return { amountCents, quoteCurrency };
  }

  private appUrl(path: string) {
    const base =
      this.config.get<string>("CORS_ORIGIN")?.split(",")[0]?.trim() ||
      "http://localhost:3000";
    return `${base.replace(/\/$/, "")}${path}`;
  }
}
