import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { readEdgeCountryFromHeaders } from "@/lib/intl/edge-geo";

export const dynamic = "force-dynamic";

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

  const country = readEdgeCountryFromHeaders(store);
  const region = firstHeader(store, REGION_HEADERS);
  const city = firstHeader(store, CITY_HEADERS);

  return NextResponse.json(
    {
      country,
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
