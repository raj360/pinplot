import { apiFetch } from "./client";
import type { WalletCredit, WalletSummary } from "@plotpin/shared-types";

export type ProfileSyncResponse = {
  id: string;
  role: string;
  welcomeBonusGranted?: boolean;
  wallet?: WalletSummary;
};

export async function fetchWallet() {
  return apiFetch<WalletSummary>("/wallet");
}

export async function redeemCoupon(code: string) {
  return apiFetch<{ credit: WalletCredit; wallet: WalletSummary }>(
    "/wallet/redeem-coupon",
    {
      method: "POST",
      body: JSON.stringify({ code }),
    },
  );
}

export type { WalletSummary };
