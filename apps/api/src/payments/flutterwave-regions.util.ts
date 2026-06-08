/**
 * Per-country Flutterwave presentment: charge currency + hosted-checkout
 * `payment_options`. Uganda is the canonical rail (UGX + mobile money); other
 * regions activate once the Flutterwave account is enabled for that currency.
 *
 * `payment_options` values follow Flutterwave's hosted checkout vocabulary
 * (mobilemoneyuganda, mpesa, mobilemoneyrwanda, card, banktransfer, ussd, …).
 */
export type FlutterwaveRegion = {
  /** ISO 4217 currency Flutterwave charges in for this market. */
  currency: string;
  /** Mobile-money first option set for the "Mobile money" checkout method. */
  mobileMoneyOptions: string;
  /** Broader option set (cards/bank) for non-MoMo or "card on Flutterwave". */
  cardOptions: string;
};

const FLUTTERWAVE_REGIONS: Record<string, FlutterwaveRegion> = {
  UG: {
    currency: "UGX",
    mobileMoneyOptions: "mobilemoneyuganda",
    cardOptions: "card",
  },
  KE: {
    currency: "KES",
    mobileMoneyOptions: "mpesa,mobilemoneykenya",
    cardOptions: "card",
  },
  TZ: {
    currency: "TZS",
    mobileMoneyOptions: "mobilemoneytanzania",
    cardOptions: "card",
  },
  RW: {
    currency: "RWF",
    mobileMoneyOptions: "mobilemoneyrwanda",
    cardOptions: "card",
  },
  GH: {
    currency: "GHS",
    mobileMoneyOptions: "mobilemoneyghana",
    cardOptions: "card",
  },
  NG: {
    currency: "NGN",
    mobileMoneyOptions: "card,banktransfer,ussd",
    cardOptions: "card,banktransfer,ussd",
  },
  ZA: {
    currency: "ZAR",
    mobileMoneyOptions: "card",
    cardOptions: "card",
  },
};

const DEFAULT_REGION = FLUTTERWAVE_REGIONS.UG;

/**
 * Resolve the Flutterwave region config for a payer country. Falls back to the
 * Uganda rail when the country is not explicitly supported, so existing UGX
 * checkout behaviour is preserved.
 */
export function resolveFlutterwaveRegion(
  countryCode?: string | null,
): FlutterwaveRegion {
  const code = (countryCode ?? "").toUpperCase();
  return FLUTTERWAVE_REGIONS[code] ?? DEFAULT_REGION;
}

/** Whether we have an explicit (non-fallback) Flutterwave config for a country. */
export function isSupportedFlutterwaveRegion(
  countryCode?: string | null,
): boolean {
  const code = (countryCode ?? "").toUpperCase();
  return code in FLUTTERWAVE_REGIONS;
}
