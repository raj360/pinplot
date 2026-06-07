import type { AddressHints } from "@/lib/maps/address-hints";

/** One-line summary shown under the map pin on step 1. */
export function formatPinNearLine(hints: {
  areaLabel?: string;
  streetHint?: string;
  landmarkHint?: string;
}): string | null {
  const parts = [hints.areaLabel, hints.streetHint, hints.landmarkHint].filter(
    Boolean,
  );
  return parts.length > 0 ? parts.join(" · ") : null;
}

/** Suggested exact-address starter from geocoder hints (step 2 helper). */
export function buildSuggestedExactAddress(hints: {
  addressHint?: string;
  streetHint?: string;
  landmarkHint?: string;
  areaLabel?: string;
  district?: string;
  city?: string;
}): string {
  const lineParts = [
    hints.addressHint,
    hints.landmarkHint,
    hints.streetHint,
  ].filter(Boolean);

  const locality = [hints.district, hints.city].filter(Boolean).join(", ");
  const area = hints.areaLabel?.trim();

  if (lineParts.length > 0 && locality) {
    return `${lineParts.join(", ")}, ${locality}`;
  }
  if (lineParts.length > 0 && area) {
    return `${lineParts.join(", ")}, ${area}`;
  }
  if (lineParts.length > 0) {
    return lineParts.join(", ");
  }
  if (area && locality) {
    return `${area}, ${locality}`;
  }
  return area || locality || "";
}

export function hasMapPinHints(
  hints: Partial<AddressHints> & {
    areaLabel?: string;
    streetHint?: string;
    landmarkHint?: string;
    addressHint?: string;
  },
): boolean {
  return Boolean(
    hints.areaLabel?.trim() ||
      hints.streetHint?.trim() ||
      hints.landmarkHint?.trim() ||
      hints.addressHint?.trim(),
  );
}
