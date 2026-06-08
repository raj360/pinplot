import type { FxRateEntry } from "@/lib/api/catalog";

export type FxRateMap = Map<string, number>;

export function buildFxRateMap(entries: FxRateEntry[]): FxRateMap {
  const map: FxRateMap = new Map();
  for (const entry of entries) {
    map.set(`${entry.baseCurrency}:${entry.quoteCurrency}`, entry.rate);
  }
  return map;
}

const HUB_CURRENCY = "UGX";

export function convertMoney(
  amount: number,
  fromCurrency: string,
  toCurrency: string,
  rates: FxRateMap,
): number | null {
  if (fromCurrency === toCurrency) return amount;
  const direct = rates.get(`${fromCurrency}:${toCurrency}`);
  if (direct != null) return amount * direct;

  // Cross via canonical UGX hub (matches refresh-fx-rates.mjs seeding model).
  if (fromCurrency !== HUB_CURRENCY && toCurrency !== HUB_CURRENCY) {
    const toHub = rates.get(`${fromCurrency}:${HUB_CURRENCY}`);
    const fromHub = rates.get(`${HUB_CURRENCY}:${toCurrency}`);
    if (toHub != null && fromHub != null) return amount * toHub * fromHub;
  }

  return null;
}
