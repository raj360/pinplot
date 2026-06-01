import type { PriceQuote } from "@plotpin/shared-types";
import { apiFetch } from "./client";

export async function fetchPriceQuote(params: {
  bedrooms: number;
  purpose: "UNLOCK" | "LISTING";
  buildingType?: string;
  countryCode?: string;
}) {
  const search = new URLSearchParams({
    bedrooms: String(params.bedrooms),
    purpose: params.purpose,
  });
  if (params.buildingType) search.set("buildingType", params.buildingType);
  if (params.countryCode) search.set("countryCode", params.countryCode);

  return apiFetch<PriceQuote>(`/pricing/quote?${search}`);
}
