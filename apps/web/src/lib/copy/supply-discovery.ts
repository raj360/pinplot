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

/** Featured listings section — local-first with optional worldwide strip. */
export function featuredListingsHeadline(): string {
  return "Featured listings";
}

export function featuredListingsIntro(
  viewerCountryName: string,
  hasLocalFeatured: boolean,
  hasGlobalFeatured: boolean,
): string {
  if (hasLocalFeatured && hasGlobalFeatured) {
    return `Promoted homes in ${viewerCountryName}, plus featured rentals from our other markets.`;
  }
  if (hasLocalFeatured) {
    return `Promoted homes in ${viewerCountryName} — browse free, unlock when you are ready.`;
  }
  if (hasGlobalFeatured) {
    const supply = supplyMarketsLabel();
    return `Featured ${supply} rentals — browse from ${viewerCountryName}, unlock when you are ready.`;
  }
  return "Verified properties promoted on PlotPin — browse free, unlock when you are ready.";
}

export function featuredListingsLocalHeading(viewerCountryName: string): string {
  return `In ${viewerCountryName}`;
}

export function featuredListingsGlobalHeading(): string {
  return "Featured around the world";
}

export function featuredListingsGlobalHint(viewerCountryName: string): string {
  const supply = supplyMarketsLabel();
  return `Verified ${supply} supply and other markets — discover from ${viewerCountryName}.`;
}

export function featuredListingsGlobalStats(
  marketCount: number,
  unitCount: number,
): string {
  const markets =
    marketCount === 1 ? "1 market" : `${marketCount} markets`;
  const units =
    unitCount === 1 ? "1 unit available" : `${unitCount} units available`;
  return `${markets} · ${units}`;
}
