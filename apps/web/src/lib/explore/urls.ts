export function exploreBuildingUrl(
  buildingId: string,
  options?: { hideMap?: boolean },
) {
  const params = new URLSearchParams({ building: buildingId });
  if (options?.hideMap) params.set("map", "0");
  return `/explore?${params.toString()}`;
}
