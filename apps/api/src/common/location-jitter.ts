const EARTH_RADIUS_M = 6_371_000;

function hashUuid(id: string): number {
  let hash = 0;
  for (let i = 0; i < id.length; i += 1) {
    hash = (hash * 31 + id.charCodeAt(i)) >>> 0;
  }
  return hash;
}

export function haversineMeters(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
) {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS_M * Math.asin(Math.sqrt(a));
}

/** Deterministic offset so public map pins never sit on the exact doorstep. */
export function jitterPublicMapCoords(
  buildingId: string,
  lat: number,
  lng: number,
  minRadiusM = 150,
  maxRadiusM = 280,
) {
  const hash = hashUuid(buildingId);
  const angle = ((hash % 360) * Math.PI) / 180;
  const radius =
    minRadiusM + ((hash >>> 8) % 1000) / 1000 * (maxRadiusM - minRadiusM);
  const latOffset = (radius * Math.cos(angle)) / 111_320;
  const lngOffset =
    (radius * Math.sin(angle)) /
    (111_320 * Math.cos((lat * Math.PI) / 180));
  return {
    lat: lat + latOffset,
    lng: lng + lngOffset,
  };
}

export function publicMapCoords(
  buildingId: string,
  approximateLat: number,
  approximateLng: number,
  exactLat: number | null,
  exactLng: number | null,
) {
  if (exactLat == null || exactLng == null) {
    return { lat: approximateLat, lng: approximateLng };
  }

  const gapM = haversineMeters(
    approximateLat,
    approximateLng,
    exactLat,
    exactLng,
  );

  if (gapM > 120) {
    return { lat: approximateLat, lng: approximateLng };
  }

  return jitterPublicMapCoords(buildingId, exactLat, exactLng);
}
