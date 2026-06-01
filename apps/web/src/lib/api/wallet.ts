import { apiFetch } from "./client";
import type { WalletSummary } from "@plotpin/shared-types";

export type ProfileSyncResponse = {
  id: string;
  role: string;
  welcomeBonusGranted?: boolean;
  wallet?: WalletSummary;
};

export async function fetchWallet() {
  return apiFetch<WalletSummary>("/wallet");
}

export type { WalletSummary };
