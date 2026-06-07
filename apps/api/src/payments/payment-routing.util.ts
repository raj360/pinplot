import { PaymentProvider, isFlutterwaveMoMoCountry } from "@plotpin/shared-types";

export type CheckoutProviderPreference = "auto" | "flutterwave" | "lemon_squeezy";

/**
 * Resolves unlock checkout PSP.
 *
 * - Explicit `flutterwave` / `lemon_squeezy` always win (driven by the UI's
 *   payment-method picker).
 * - `auto` is region-aware: payers in Flutterwave mobile-money markets (UG, KE,
 *   TZ, RW, …) route to Flutterwave (local rail); everyone else routes to Lemon
 *   Squeezy (diaspora cards, Merchant of Record). The viewer's own country takes
 *   precedence over the listing's country.
 */
export function resolveUnlockProvider(params: {
  tenantCountryCode?: string | null;
  buildingCountryCode: string;
  preference?: CheckoutProviderPreference;
}): PaymentProvider.FLUTTERWAVE | PaymentProvider.LEMON_SQUEEZY {
  const preference = params.preference ?? "auto";
  if (preference === "flutterwave") return PaymentProvider.FLUTTERWAVE;
  if (preference === "lemon_squeezy") return PaymentProvider.LEMON_SQUEEZY;

  const payerCountry = params.tenantCountryCode ?? params.buildingCountryCode;
  if (isFlutterwaveMoMoCountry(payerCountry)) {
    return PaymentProvider.FLUTTERWAVE;
  }
  return PaymentProvider.LEMON_SQUEEZY;
}
