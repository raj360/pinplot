"use client";

import { Minus, Plus } from "lucide-react";
import {
  ControlPosition,
  MapControl,
  useMap,
} from "@vis.gl/react-google-maps";
import { useCallback, useEffect, useState } from "react";
import {
  EXPLORE_MAP_DEFAULT_ZOOM,
  EXPLORE_MAP_MAX_ZOOM,
  EXPLORE_MAP_MIN_ZOOM,
} from "@/lib/maps/config";
import { cn } from "@/lib/utils/cn";

type MapZoomControlsProps = {
  disabled?: boolean;
  className?: string;
};

function MapZoomButtons({ disabled, className }: MapZoomControlsProps) {
  const map = useMap();
  const [zoom, setZoom] = useState<number | null>(null);

  useEffect(() => {
    if (!map) return;

    const sync = () => setZoom(map.getZoom() ?? null);
    sync();
    const listener = map.addListener("zoom_changed", sync);
    return () => listener.remove();
  }, [map]);

  const changeZoom = useCallback(
    (delta: number) => {
      if (!map || disabled) return;
      const current = map.getZoom() ?? EXPLORE_MAP_DEFAULT_ZOOM;
      const next = Math.min(
        EXPLORE_MAP_MAX_ZOOM,
        Math.max(EXPLORE_MAP_MIN_ZOOM, current + delta),
      );
      if (next !== current) map.setZoom(next);
    },
    [map, disabled],
  );

  const atMin = zoom != null && zoom <= EXPLORE_MAP_MIN_ZOOM;
  const atMax = zoom != null && zoom >= EXPLORE_MAP_MAX_ZOOM;

  return (
    <div
      className={cn(
        "m-2 flex flex-col overflow-hidden rounded-lg border border-border bg-surface shadow-md",
        className,
      )}
      role="group"
      aria-label="Map zoom"
    >
      <button
        type="button"
        disabled={disabled || atMax}
        aria-label="Zoom in"
        onClick={() => changeZoom(1)}
        className={cn(
          "flex size-9 items-center justify-center text-foreground transition-colors",
          "hover:bg-background focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary/20",
          "disabled:cursor-not-allowed disabled:opacity-40",
        )}
      >
        <Plus className="size-4" aria-hidden />
      </button>
      <div className="h-px bg-border" aria-hidden />
      <button
        type="button"
        disabled={disabled || atMin}
        aria-label="Zoom out"
        onClick={() => changeZoom(-1)}
        className={cn(
          "flex size-9 items-center justify-center text-foreground transition-colors",
          "hover:bg-background focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary/20",
          "disabled:cursor-not-allowed disabled:opacity-40",
        )}
      >
        <Minus className="size-4" aria-hidden />
      </button>
    </div>
  );
}

/** Explore map zoom +/- — top-left, away from search chip and disclaimer. */
export function MapZoomControls(props: MapZoomControlsProps) {
  return (
    <MapControl position={ControlPosition.LEFT_TOP}>
      <MapZoomButtons {...props} />
    </MapControl>
  );
}
