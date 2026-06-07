import { PaymentProvider } from "@plotpin/shared-types";

export type CheckoutProviderPreference = "auto" | "flutterwave" | "lemon_squeezy";

/**
 * Resolves unlock checkout PSP. Default (`auto`) is Lemon Squeezy so diaspora and
 * local tenants can pay by card. Flutterwave is opt-in for mobile money (UG, KE, …).
 */
export function resolveUnlockProvider(params: {
  tenantCountryCode?: string | null;
  buildingCountryCode: string;
  preference?: CheckoutProviderPreference;
}): PaymentProvider.FLUTTERWAVE | PaymentProvider.LEMON_SQUEEZY {
  const preference = params.preference ?? "auto";
  if (preference === "flutterwave") return PaymentProvider.FLUTTERWAVE;
  if (preference === "lemon_squeezy") return PaymentProvider.LEMON_SQUEEZY;

  return PaymentProvider.LEMON_SQUEEZY;
}
