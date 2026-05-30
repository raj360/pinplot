"use client";

import { useCallback, useState } from "react";
import { isInUganda, type GeoPoint } from "@/lib/geo/uganda";

export type UserGeoLocation = GeoPoint;

type ExploreGeolocationState = {
  location: UserGeoLocation | null;
  inUganda: boolean;
  loading: boolean;
  error: string | null;
};

/** Opt-in browser geolocation for nearby area suggestions (never prompts on mount). */
export function useExploreGeolocation(): ExploreGeolocationState & {
  requestLocation: () => void;
  clearLocation: () => void;
} {
  const [state, setState] = useState<ExploreGeolocationState>({
    location: null,
    inUganda: false,
    loading: false,
    error: null,
  });

  const requestLocation = useCallback(() => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setState({
        location: null,
        inUganda: false,
        loading: false,
        error: "Location is not available in this browser.",
      });
      return;
    }

    setState((prev) => ({ ...prev, loading: true, error: null }));

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
        });
      },
      () => {
        setState({
          location: null,
          inUganda: false,
          loading: false,
          error: null,
        });
      },
      {
        enableHighAccuracy: false,
        maximumAge: 5 * 60 * 1000,
        timeout: 8000,
      },
    );
  }, []);

  const clearLocation = useCallback(() => {
    setState({
      location: null,
      inUganda: false,
      loading: false,
      error: null,
    });
  }, []);

  return { ...state, requestLocation, clearLocation };
}
