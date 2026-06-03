import { NextResponse } from "next/server";
import { headers } from "next/headers";

export const dynamic = "force-dynamic";

/**
 * Edge geolocation headers, in priority order. Covers the common enterprise
 * hosting/CDN layers so the viewer's country is detected from their IP at the
 * edge without shipping a heavy client-side IP database.
 */
const COUNTRY_HEADERS = [
  "x-vercel-ip-country", // Vercel
  "cf-ipcountry", // Cloudflare
  "x-country-code", // Fastly / generic
  "x-geo-country", // generic / custom proxy
  "x-appengine-country", // Google App Engine
] as const;

/** Region/city give us a finer label later (kept optional for now). */
const REGION_HEADERS = ["x-vercel-ip-country-region", "x-geo-region"] as const;
const CITY_HEADERS = ["x-vercel-ip-city", "x-geo-city"] as const;

function firstHeader(
  store: Headers,
  keys: readonly string[],
): string | null {
  for (const key of keys) {
    const value = store.get(key);
    if (value && value.trim() && value.toUpperCase() !== "XX") {
      return value.trim();
    }
  }
  return null;
}

export async function GET() {
  const store = await headers();

  const country = firstHeader(store, COUNTRY_HEADERS);
  const region = firstHeader(store, REGION_HEADERS);
  const city = firstHeader(store, CITY_HEADERS);

  return NextResponse.json(
    {
      country: country ? country.toUpperCase() : null,
      region,
      city: city ? decodeURIComponent(city) : null,
      source: country ? "edge" : "none",
    },
    {
      headers: {
        // Per-viewer; never share across users at the CDN.
        "Cache-Control": "private, no-store",
      },
    },
  );
}
