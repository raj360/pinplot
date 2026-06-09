import type { CountryCatalog } from "@plotpin/shared-types";
import {
  CATALOG_CACHE_TTL_MS,
  readClientCache,
  writeClientCache,
} from "@/lib/api/client-cache";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

export type FxRateEntry = {
  baseCurrency: string;
  quoteCurrency: string;
  rate: number;
  updatedAt: string;
};

const COUNTRIES_CACHE_KEY = "countries:v1";
const FX_CACHE_KEY = "fx:v1";

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

/** Client-side fetch with localStorage cache for fast hard refreshes. */
export async function fetchCountryCatalogClient(): Promise<CountryCatalog[]> {
  const cached = readClientCache<CountryCatalog[]>(
    COUNTRIES_CACHE_KEY,
    CATALOG_CACHE_TTL_MS,
  );
  if (cached?.length) return cached;

  const res = await fetch(`${API_URL}/api/v1/countries`);
  if (!res.ok) throw new Error("Failed to load country catalog");
  const data = (await res.json()) as CountryCatalog[];
  if (data.length > 0) writeClientCache(COUNTRIES_CACHE_KEY, data);
  return data;
}

export async function fetchFxRatesClient(): Promise<FxRateEntry[]> {
  const cached = readClientCache<FxRateEntry[]>(FX_CACHE_KEY, CATALOG_CACHE_TTL_MS);
  if (cached?.length) return cached;

  const res = await fetch(`${API_URL}/api/v1/fx/rates`);
  if (!res.ok) throw new Error("Failed to load FX rates");
  const data = (await res.json()) as FxRateEntry[];
  if (data.length > 0) writeClientCache(FX_CACHE_KEY, data);
  return data;
}
