export function googleMapsDirectionsUrl(lat: number, lng: number) {
  return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
}

export function googleMapsPlaceUrl(lat: number, lng: number) {
  return `https://www.google.com/maps?q=${lat},${lng}`;
}
