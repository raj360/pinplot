export type GeolocationFailureCode =
  | "unsupported"
  | "denied"
  | "unavailable"
  | "timeout";

export function geolocationErrorMessage(code: GeolocationFailureCode): string {
  switch (code) {
    case "unsupported":
      return "Location is not available in this browser.";
    case "denied":
      return "Location access is blocked. Open site settings (lock icon in the address bar), allow Location for this site, then try again.";
    case "unavailable":
      return "Could not determine your location. Check that Location Services are enabled on your device.";
    case "timeout":
      return "Finding your location took too long. Try again or set the pin manually on the map.";
  }
}

function failureCodeFromError(error: GeolocationPositionError): GeolocationFailureCode {
  switch (error.code) {
    case error.PERMISSION_DENIED:
      return "denied";
    case error.POSITION_UNAVAILABLE:
      return "unavailable";
    case error.TIMEOUT:
      return "timeout";
    default:
      return "unavailable";
  }
}

/** Browser geolocation, user gesture required; rejects with a readable message on failure. */
export function requestBrowserLocation(
  options?: PositionOptions,
): Promise<{ lat: number; lng: number }> {
  return new Promise((resolve, reject) => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      reject(new Error(geolocationErrorMessage("unsupported")));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
      },
      (error) => {
        reject(new Error(geolocationErrorMessage(failureCodeFromError(error))));
      },
      {
        enableHighAccuracy: true,
        timeout: 10_000,
        maximumAge: 0,
        ...options,
      },
    );
  });
}
