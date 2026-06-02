import type { CountryCatalog } from "@plotpin/shared-types";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

export type FxRateEntry = {
  baseCurrency: string;
  quoteCurrency: string;
  rate: number;
  updatedAt: string;
};

export async function fetchCountryCatalog(): Promise<CountryCatalog[]> {
  const res = await fetch(`${API_URL}/api/v1/countries`, {
    next: { revalidate: 3600 },
  });
  if (!res.ok) throw new Error("Failed to load country catalog");
  return res.json();
}

export async function fetchFxRates(): Promise<FxRateEntry[]> {
  const res = await fetch(`${API_URL}/api/v1/fx/rates`, {
    next: { revalidate: 3600 },
  });
  if (!res.ok) throw new Error("Failed to load FX rates");
  return res.json();
}

/** Client-side fetch (no Next cache) for provider bootstrap. */
export async function fetchCountryCatalogClient(): Promise<CountryCatalog[]> {
  const res = await fetch(`${API_URL}/api/v1/countries`, { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to load country catalog");
  return res.json();
}

export async function fetchFxRatesClient(): Promise<FxRateEntry[]> {
  const res = await fetch(`${API_URL}/api/v1/fx/rates`, { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to load FX rates");
  return res.json();
}
