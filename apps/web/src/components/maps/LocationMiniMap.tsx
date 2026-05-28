"use client";

import {
  APIProvider,
  AdvancedMarker,
  Map as GoogleMap,
} from "@vis.gl/react-google-maps";

const MAPS_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? "";
const MAP_ID = process.env.NEXT_PUBLIC_GOOGLE_MAP_ID ?? "";

type LocationMiniMapProps = {
  lat: number;
  lng: number;
  label?: string;
  className?: string;
};

export function LocationMiniMap({
  lat,
  lng,
  label,
  className = "h-44",
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
          defaultZoom={16}
          mapId={MAP_ID}
          gestureHandling="cooperative"
          disableDefaultUI
          clickableIcons={false}
          className="h-full w-full"
        >
          <AdvancedMarker position={{ lat, lng }} title={label} />
        </GoogleMap>
      </div>
    </APIProvider>
  );
}
