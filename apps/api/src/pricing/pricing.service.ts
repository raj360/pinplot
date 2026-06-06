import { Injectable } from "@nestjs/common";
import {
  DEFAULT_COUNTRY,
  PRICING,
  PaymentPurpose,
  type BuildingType,
  type PriceQuote,
} from "@plotpin/shared-types";
import { DatabaseService } from "../database/database.service";

type PricingRuleRow = {
  unlock_fee_ugx: number;
  listing_fee_ugx: number;
  label: string | null;
};

@Injectable()
export class PricingService {
  constructor(private readonly db: DatabaseService) {}

  async quote(params: {
    buildingType?: BuildingType | null;
    bedrooms: number;
    purpose: PaymentPurpose;
    countryCode?: string;
  }): Promise<PriceQuote> {
    const countryCode = (params.countryCode ?? DEFAULT_COUNTRY.code).toUpperCase();
    const rule = await this.findMatchingRule(
      countryCode,
      params.buildingType ?? null,
      params.bedrooms,
    );

    const unlockFeeUgx = rule?.unlock_fee_ugx ?? PRICING.tenantUnlockFeeUgx;
    const listingFeeUgx = rule?.listing_fee_ugx ?? PRICING.landlordListingFeeUgx;
    const amountUgx =
      params.purpose === PaymentPurpose.LISTING ? listingFeeUgx : unlockFeeUgx;

    return {
      purpose: params.purpose,
      amountUgx,
      unlockFeeUgx,
      listingFeeUgx,
      currency: DEFAULT_COUNTRY.currency,
      countryCode,
      buildingType: params.buildingType ?? null,
      bedrooms: params.bedrooms,
      label: rule?.label ?? undefined,
      note:
        params.purpose === PaymentPurpose.UNLOCK
          ? "Pay via Flutterwave (Uganda) or Lemon Squeezy (international)."
          : undefined,
    };
  }

  private async findMatchingRule(
    countryCode: string,
    buildingType: BuildingType | null,
    bedrooms: number,
  ): Promise<PricingRuleRow | null> {
    const { rows } = await this.db.query<PricingRuleRow>(
      `SELECT unlock_fee_ugx, listing_fee_ugx, label
       FROM pricing_rules
       WHERE country_code = $1
         AND is_active = TRUE
         AND (building_type IS NULL OR building_type = $2::building_type)
         AND bedrooms_min <= $3
         AND (bedrooms_max IS NULL OR bedrooms_max >= $3)
       ORDER BY
         (building_type IS NOT NULL) DESC,
         bedrooms_min DESC,
         sort_order ASC
       LIMIT 1`,
      [countryCode, buildingType, bedrooms],
    );
    return rows[0] ?? null;
  }
}
