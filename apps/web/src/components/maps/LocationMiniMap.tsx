"use client";

import {
  APIProvider,
  AdvancedMarker,
  Map as GoogleMap,
  useMap,
} from "@vis.gl/react-google-maps";
import { useEffect } from "react";
import {
  UNLOCKED_MAP_DEFAULT_ZOOM,
  UNLOCKED_MAP_MAX_ZOOM,
  UNLOCKED_MAP_MIN_ZOOM,
} from "@/lib/maps/config";

const MAPS_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? "";
const MAP_ID = process.env.NEXT_PUBLIC_GOOGLE_MAP_ID ?? "";

type LocationMiniMapProps = {
  lat: number;
  lng: number;
  label?: string;
  className?: string;
};

/** Full interactive controls for paid / unlocked exact-location maps. */
function UnlockedMapOptions() {
  const map = useMap();

  useEffect(() => {
    if (!map) return;
    map.setOptions({
      minZoom: UNLOCKED_MAP_MIN_ZOOM,
      maxZoom: UNLOCKED_MAP_MAX_ZOOM,
      gestureHandling: "greedy",
      zoomControl: true,
      mapTypeControl: true,
      mapTypeControlOptions: {
        mapTypeIds: ["roadmap", "satellite"],
      },
      streetViewControl: true,
      fullscreenControl: true,
    });
  }, [map]);

  return null;
}

export function LocationMiniMap({
  lat,
  lng,
  label,
  className = "h-56",
}: LocationMiniMapProps) {
  if (!MAPS_KEY || MAPS_KEY.startsWith("your-")) {
    return (
      <div
        className={`flex items-center justify-center border border-dashed border-border bg-surface text-xs text-muted ${className}`}
      >
        Map preview unavailable
      </div>
    );
  }

  return (
    <APIProvider apiKey={MAPS_KEY} libraries={["marker"]}>
      <div className={`overflow-hidden border border-border ${className}`}>
        <GoogleMap
          defaultCenter={{ lat, lng }}
          defaultZoom={UNLOCKED_MAP_DEFAULT_ZOOM}
          minZoom={UNLOCKED_MAP_MIN_ZOOM}
          maxZoom={UNLOCKED_MAP_MAX_ZOOM}
          mapId={MAP_ID}
          gestureHandling="greedy"
          disableDefaultUI
          clickableIcons={false}
          className="h-full w-full"
        >
          <UnlockedMapOptions />
          <AdvancedMarker position={{ lat, lng }} title={label} />
        </GoogleMap>
      </div>
    </APIProvider>
  );
}
