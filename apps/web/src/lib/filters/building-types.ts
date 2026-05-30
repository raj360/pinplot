/** Property types — UI ready; wire to API when building.type exists. */
export const BUILDING_TYPE_OPTIONS = [
  { value: "", label: "Any type" },
  { value: "apartment", label: "Apartment" },
  { value: "studio", label: "Studio room" },
  { value: "bungalow", label: "Bungalow" },
  { value: "house", label: "House / property" },
  { value: "airbnb", label: "Airbnb / short stay" },
] as const;

export function buildingTypeLabel(value: string): string | null {
  if (!value) return null;
  return BUILDING_TYPE_OPTIONS.find((option) => option.value === value)?.label ?? null;
}

export const BUILDING_TYPE_FILTER_ENABLED = false;
