import type { WalletSummary } from "@plotpin/shared-types";
import { fetchWallet } from "./wallet";

let cached: WalletSummary | null = null;
let inflight: Promise<WalletSummary> | null = null;

export function getCachedWallet() {
  return cached;
}

export async function fetchWalletCached(): Promise<WalletSummary> {
  if (cached) return cached;
  if (inflight) return inflight;

  inflight = fetchWallet()
    .then((wallet) => {
      cached = wallet;
      inflight = null;
      return wallet;
    })
    .catch((err) => {
      inflight = null;
      throw err;
    });

  return inflight;
}

export function primeWalletCache(wallet: WalletSummary) {
  cached = wallet;
}

export function clearWalletCache() {
  cached = null;
  inflight = null;
}
