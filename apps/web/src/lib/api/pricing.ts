import type { PriceQuote } from "@plotpin/shared-types";
import { apiFetch } from "./client";

export type PriceQuoteParams = {
  bedrooms: number;
  purpose: "UNLOCK" | "LISTING";
  buildingType?: string;
  countryCode?: string;
};

const quoteCache = new globalThis.Map<string, PriceQuote>();
const quoteInflight = new globalThis.Map<string, Promise<PriceQuote>>();

function quoteCacheKey(params: PriceQuoteParams): string {
  return [
    params.purpose,
    params.buildingType ?? "",
    params.countryCode ?? "",
    String(params.bedrooms),
  ].join(":");
}

export async function fetchPriceQuote(
  params: PriceQuoteParams,
): Promise<PriceQuote> {
  const key = quoteCacheKey(params);
  const cached = quoteCache.get(key);
  if (cached) return cached;

  const pending = quoteInflight.get(key);
  if (pending) return pending;

  const search = new URLSearchParams({
    bedrooms: String(params.bedrooms),
    purpose: params.purpose,
  });
  if (params.buildingType) search.set("buildingType", params.buildingType);
  if (params.countryCode) search.set("countryCode", params.countryCode);

  const promise = apiFetch<PriceQuote>(`/pricing/quote?${search}`)
    .then((quote) => {
      quoteCache.set(key, quote);
      quoteInflight.delete(key);
      return quote;
    })
    .catch((err) => {
      quoteInflight.delete(key);
      throw err;
    });

  quoteInflight.set(key, promise);
  return promise;
}

export function clearPriceQuoteCache(): void {
  quoteCache.clear();
  quoteInflight.clear();
}
