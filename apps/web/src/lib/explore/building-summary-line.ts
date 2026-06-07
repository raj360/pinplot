import type { BuildingSummary } from "@plotpin/shared-types";

/** One-line availability + rent for map tooltips and cards. */
export function formatBuildingSummaryLine(
  building: Pick<
    BuildingSummary,
    "availableUnitCount" | "rentFrom" | "currency" | "countryCode"
  >,
  formatRent: (
    amount: number | null | undefined,
    currency: string,
    countryCode: string,
  ) => string,
): string {
  if (building.availableUnitCount > 0) {
    const rent = formatRent(
      building.rentFrom,
      building.currency,
      building.countryCode,
    );
    return `${building.availableUnitCount} available · from ${rent}`;
  }
  return "Click for details";
}
