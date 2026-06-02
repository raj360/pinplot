"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { isInUganda, type GeoPoint } from "@/lib/geo/uganda";

export type UserGeoLocation = GeoPoint;

export type GeoRequestResult = {
  location: GeoPoint | null;
  error: string | null;
};

type ExploreGeolocationState = {
  location: UserGeoLocation | null;
  inUganda: boolean;
  loading: boolean;
  error: string | null;
  /** True once an automatic mount request has been attempted. */
  autoRequested: boolean;
};

type UseExploreGeolocationOptions = {
  /** Request browser location once on mount (explore bootstrap). */
  autoRequest?: boolean;
};

type RequestLocationOptions = {
  /** Fresh GPS fix (Near me) vs cached position OK (bootstrap hint). */
  highAccuracy?: boolean;
  timeoutMs?: number;
  maximumAgeMs?: number;
};

function geolocationErrorMessage(error: GeolocationPositionError): string {
  if (error.code === error.PERMISSION_DENIED) {
    return "Location access was blocked. Allow location for this site in your browser settings, then try Near me again.";
  }
  if (error.code === error.POSITION_UNAVAILABLE) {
    return "Your device could not determine a location. Check system location services and try again.";
  }
  if (error.code === error.TIMEOUT) {
    return "Finding your location took too long. Try again.";
  }
  return "Could not get your location.";
}

/** Browser geolocation for explore map bootstrap and nearby place sorting. */
export function useExploreGeolocation(
  options: UseExploreGeolocationOptions = {},
): ExploreGeolocationState & {
  requestLocation: (options?: RequestLocationOptions) => Promise<GeoRequestResult>;
  clearLocation: () => void;
} {
  const { autoRequest = false } = options;
  const autoRequestedRef = useRef(false);
  const [state, setState] = useState<ExploreGeolocationState>({
    location: null,
    inUganda: false,
    loading: false,
    error: null,
    autoRequested: false,
  });

  const requestLocation = useCallback(
    (requestOptions: RequestLocationOptions = {}): Promise<GeoRequestResult> => {
      const {
        highAccuracy = false,
        timeoutMs = highAccuracy ? 15_000 : 8_000,
        maximumAgeMs = highAccuracy ? 0 : 5 * 60 * 1000,
      } = requestOptions;

      if (typeof navigator === "undefined" || !navigator.geolocation) {
        const error = "Location is not available in this browser.";
        setState({
          location: null,
          inUganda: false,
          loading: false,
          error,
          autoRequested: true,
        });
        return Promise.resolve({ location: null, error });
      }

      setState((prev) => ({ ...prev, loading: true, error: null }));

      return new Promise((resolve) => {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const location = {
              lat: position.coords.latitude,
              lng: position.coords.longitude,
            };
            setState({
              location,
              inUganda: isInUganda(location.lat, location.lng),
              loading: false,
              error: null,
              autoRequested: true,
            });
            resolve({ location, error: null });
          },
          (geoError) => {
            const error = geolocationErrorMessage(geoError);
            setState({
              location: null,
              inUganda: false,
              loading: false,
              error,
              autoRequested: true,
            });
            resolve({ location: null, error });
          },
          {
            enableHighAccuracy: highAccuracy,
            maximumAge: maximumAgeMs,
            timeout: timeoutMs,
          },
        );
      });
    },
    [],
  );

  const clearLocation = useCallback(() => {
    setState((prev) => ({
      location: null,
      inUganda: false,
      loading: false,
      error: null,
      autoRequested: prev.autoRequested,
    }));
  }, []);

  useEffect(() => {
    if (!autoRequest || autoRequestedRef.current) return;
    autoRequestedRef.current = true;
    void requestLocation();
  }, [autoRequest, requestLocation]);

  return { ...state, requestLocation, clearLocation };
}
