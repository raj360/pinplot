"use client";

import { useEffect, useMemo, useState } from "react";
import { fetchGeoPlacesClient, type GeoPlace } from "@/lib/api/geo-places";
import {
  geoPlacesToPresets,
  setRuntimeAreaPresets,
  type SearchAreaPreset,
} from "@/lib/filters/search-areas";

const cache = new Map<string, GeoPlace[]>();

export function useGeoPlaces(countryCode: string | undefined) {
  const code = countryCode?.trim().toUpperCase() ?? "";
  const [places, setPlaces] = useState<GeoPlace[]>(() =>
    code ? (cache.get(code) ?? []) : [],
  );
  const [loading, setLoading] = useState(Boolean(code && !cache.has(code)));

  useEffect(() => {
    if (!code) {
      setPlaces([]);
      setLoading(false);
      setRuntimeAreaPresets([]);
      return;
    }

    const cached = cache.get(code);
    if (cached) {
      setPlaces(cached);
      setLoading(false);
      setRuntimeAreaPresets(geoPlacesToPresets(cached));
      return;
    }

    let cancelled = false;
    setLoading(true);

    fetchGeoPlacesClient(code)
      .then((rows) => {
        if (cancelled) return;
        cache.set(code, rows);
        setPlaces(rows);
        setRuntimeAreaPresets(geoPlacesToPresets(rows));
      })
      .catch(() => {
        if (cancelled) return;
        setPlaces([]);
        setRuntimeAreaPresets([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [code]);

  const presets = useMemo(() => geoPlacesToPresets(places), [places]);

  return { places, presets, loading, ready: !loading };
}

export type { SearchAreaPreset };
