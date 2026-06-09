import { apiFetch } from "./client";
import type { PaymentProvider } from "@plotpin/shared-types";

export type UnlockCheckoutResponse =
  | {
      mode: "credit";
      feeUgx: number;
      message: string;
    }
  | {
      mode: "checkout";
      provider: PaymentProvider;
      paymentId: string;
      checkoutUrl: string;
      feeUgx: number;
      chargeUgx: number;
      currency: string;
    };

export async function startUnlockCheckout(
  unitId: string,
  options?: {
    tenantCountryCode?: string;
    providerPreference?: "auto" | "flutterwave" | "lemon_squeezy";
    acceptTerms?: boolean;
  },
) {
  return apiFetch<UnlockCheckoutResponse>(`/units/${unitId}/unlock/checkout`, {
    method: "POST",
    body: JSON.stringify(options ?? {}),
  });
}

export async function fetchUnlockPaymentStatus(paymentId: string) {
  return apiFetch<{
    paymentId: string;
    status: string;
    purpose?: string;
    unitId?: string;
    buildingId?: string;
    unlockState: "pending" | "completed" | "failed";
  }>(`/payments/${paymentId}/unlock-status`);
}

export type FeaturedCheckoutResponse = {
  mode: "checkout";
  provider: PaymentProvider;
  paymentId: string;
  checkoutUrl: string;
  durationDays: number;
  chargeUgx: number;
  currency: string;
};

export async function startFeaturedCheckout(options: {
  buildingId: string;
  durationDays: number;
  payerCountryCode?: string;
  providerPreference?: "auto" | "flutterwave" | "lemon_squeezy";
}) {
  return apiFetch<FeaturedCheckoutResponse>("/payments/featured/checkout", {
    method: "POST",
    body: JSON.stringify(options),
  });
}

export async function confirmFlutterwaveReturn(params: {
  txRef: string;
  transactionId: string;
  status: string;
}) {
  const search = new URLSearchParams({
    tx_ref: params.txRef,
    transaction_id: params.transactionId,
    status: params.status,
  });
  return apiFetch<{ settled?: boolean }>(
    `/payments/flutterwave/confirm?${search}`,
    { method: "POST" },
  );
}

export async function confirmLemonSqueezyReturn(paymentId: string) {
  const search = new URLSearchParams({ paymentId });
  return apiFetch<{ settled?: boolean; reason?: string }>(
    `/payments/lemon-squeezy/confirm?${search}`,
    { method: "POST" },
  );
}
