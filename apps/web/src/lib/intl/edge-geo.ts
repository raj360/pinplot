/** Edge geolocation country headers (Vercel, Cloudflare, etc.). */
export const EDGE_COUNTRY_HEADERS = [
  "x-vercel-ip-country",
  "cf-ipcountry",
  "x-country-code",
  "x-geo-country",
  "x-appengine-country",
] as const;

export function readEdgeCountryFromHeaders(store: Headers): string | null {
  for (const key of EDGE_COUNTRY_HEADERS) {
    const value = store.get(key);
    if (value?.trim() && value.toUpperCase() !== "XX") {
      return value.trim().toUpperCase();
    }
  }
  return null;
}
