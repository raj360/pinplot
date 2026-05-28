"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { BuildingDetail } from "@/lib/api/buildings";
import {
  fetchBuildingCached,
  getCachedBuilding,
  primeBuildingCache,
} from "@/lib/api/building-cache";

const HOVER_LEAVE_MS = 120;
const FETCH_DELAY_MS = 180;

type PreviewState = {
  id: string | null;
  loading: boolean;
  detail: BuildingDetail | null;
};

const EMPTY_PREVIEW: PreviewState = {
  id: null,
  loading: false,
  detail: null,
};

export function useExplorePreview() {
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [preview, setPreview] = useState<PreviewState>(EMPTY_PREVIEW);
  const leaveTimerRef = useRef<number | undefined>(undefined);
  const fetchTimerRef = useRef<number | undefined>(undefined);
  const fetchGenRef = useRef(0);

  const clearHoverTimers = useCallback(() => {
    window.clearTimeout(leaveTimerRef.current);
    window.clearTimeout(fetchTimerRef.current);
  }, []);

  const beginPreview = useCallback((id: string) => {
    window.clearTimeout(fetchTimerRef.current);
    const generation = ++fetchGenRef.current;

    const cached = getCachedBuilding(id);
    if (cached) {
      setPreview({ id, loading: false, detail: cached });
      return;
    }

    setPreview({ id, loading: true, detail: null });

    fetchTimerRef.current = window.setTimeout(() => {
      fetchBuildingCached(id)
        .then((detail) => {
          if (fetchGenRef.current !== generation) return;
          setPreview({ id, loading: false, detail });
        })
        .catch(() => {
          if (fetchGenRef.current !== generation) return;
          setPreview({ id, loading: false, detail: null });
        });
    }, FETCH_DELAY_MS);
  }, []);

  const setHover = useCallback(
    (id: string | null) => {
      window.clearTimeout(leaveTimerRef.current);

      if (id) {
        setHoveredId(id);
        beginPreview(id);
        return;
      }

      leaveTimerRef.current = window.setTimeout(() => {
        fetchGenRef.current += 1;
        window.clearTimeout(fetchTimerRef.current);
        setHoveredId(null);
        setPreview(EMPTY_PREVIEW);
      }, HOVER_LEAVE_MS);
    },
    [beginPreview],
  );

  const loadSelectedDetail = useCallback(async (id: string) => {
    const cached = getCachedBuilding(id);
    if (cached) return cached;

    setPreview((prev) =>
      prev.id === id ? prev : { id, loading: true, detail: null },
    );

    try {
      const detail = await fetchBuildingCached(id);
      setPreview({ id, loading: false, detail });
      return detail;
    } catch {
      setPreview({ id, loading: false, detail: null });
      return null;
    }
  }, []);

  const primeDetail = useCallback((id: string, detail: BuildingDetail) => {
    primeBuildingCache(id, detail);
    setPreview({ id, loading: false, detail });
  }, []);

  useEffect(() => clearHoverTimers, [clearHoverTimers]);

  return {
    hoveredId,
    preview,
    setHover,
    loadSelectedDetail,
    primeDetail,
  };
}
