import {
  cityPresetsForCountry,
  isSupplyMarket,
  SUPPLY_HUB_VALUE,
} from "@/lib/filters/search-areas";

/** Deep link that pans explore to a sensible default for a listing's country. */
export function exploreHrefForCountry(countryCode: string): string {
  const code = countryCode.trim().toUpperCase();
  if (code === "UG") {
    return `/explore?area=${encodeURIComponent(SUPPLY_HUB_VALUE)}`;
  }

  const cities = cityPresetsForCountry(code);
  if (cities.length > 0) {
    return `/explore?area=${encodeURIComponent(cities[0].value)}`;
  }

  if (isSupplyMarket(code)) {
    return "/explore";
  }

  return "/explore";
}

export function exploreCountryLinkLabel(countryName: string): string {
  return `Explore ${countryName} on map`;
}
