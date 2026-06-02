import type { FxRateEntry } from "@/lib/api/catalog";

export type FxRateMap = Map<string, number>;

export function buildFxRateMap(entries: FxRateEntry[]): FxRateMap {
  const map: FxRateMap = new Map();
  for (const entry of entries) {
    map.set(`${entry.baseCurrency}:${entry.quoteCurrency}`, entry.rate);
  }
  return map;
}

export function convertMoney(
  amount: number,
  fromCurrency: string,
  toCurrency: string,
  rates: FxRateMap,
): number | null {
  if (fromCurrency === toCurrency) return amount;
  const direct = rates.get(`${fromCurrency}:${toCurrency}`);
  if (direct != null) return amount * direct;
  return null;
}
