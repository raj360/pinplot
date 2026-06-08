import {
  isSupplyMarket,
  supplyMarketsLabel,
} from "@/lib/filters/search-areas";

/** Footer / chrome tagline — supply market is fixed; browse context follows the viewer. */
export function supplyDiscoveryTagline(
  viewerCountryCode: string,
  viewerCountryName: string,
): string {
  const supply = supplyMarketsLabel();
  if (isSupplyMarket(viewerCountryCode)) {
    return `Map-first rentals · ${supply} supply, global discovery`;
  }
  return `Map-first rentals · ${supply} rentals · Browse from ${viewerCountryName}`;
}

/** Login panel / marketing subcopy with currency context. */
export function supplyDiscoveryHeroHint(
  viewerCountryCode: string,
  viewerCountryName: string,
): string {
  const supply = supplyMarketsLabel();
  if (isSupplyMarket(viewerCountryCode)) {
    return `${supply} supply, global discovery — prices shown in your familiar currency.`;
  }
  return `${supply} listings with rent in local currency — browse from ${viewerCountryName} with a familiar FX hint.`;
}

/** Featured listings section — clarifies supply location for diaspora viewers. */
export function featuredListingsSubtitle(
  viewerCountryCode: string,
): string {
  const supply = supplyMarketsLabel();
  if (isSupplyMarket(viewerCountryCode)) {
    return "Verified properties promoted on PlotPin — browse free, unlock when you are ready.";
  }
  return `Verified ${supply} properties — browse free from anywhere, unlock when you are ready.`;
}
