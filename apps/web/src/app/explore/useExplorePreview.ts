"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { fetchBuildingCached } from "@/lib/api/building-cache";

/** Sidebar list highlight — debounced so brief pin→tooltip gaps do not flicker. */
const HOVER_LEAVE_MS = 180;

/** Map-driven hover highlight only — detail loads on click, not hover. */
export function useExplorePreview() {
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const leaveTimerRef = useRef<number | undefined>(undefined);

  const setHover = useCallback((id: string | null) => {
    window.clearTimeout(leaveTimerRef.current);

    if (id) {
      setHoveredId(id);
      return;
    }

    leaveTimerRef.current = window.setTimeout(() => {
      setHoveredId(null);
    }, HOVER_LEAVE_MS);
  }, []);

  const loadSelectedDetail = useCallback(async (id: string) => {
    try {
      return await fetchBuildingCached(id);
    } catch {
      return null;
    }
  }, []);

  useEffect(() => {
    return () => window.clearTimeout(leaveTimerRef.current);
  }, []);

  return {
    hoveredId,
    setHover,
    loadSelectedDetail,
  };
}
