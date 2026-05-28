"use client";

import {
  APIProvider,
  Map,
  AdvancedMarker,
  useMap,
} from "@vis.gl/react-google-maps";
import { MarkerClusterer } from "@googlemaps/markerclusterer";
import { useEffect, useMemo, useRef } from "react";
import type { BuildingSummary } from "@plotpin/shared-types";

const MAPS_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? "";
const MAP_ID = process.env.NEXT_PUBLIC_GOOGLE_MAP_ID ?? "";
const KAMPALA_CENTER = { lat: 0.3476, lng: 32.5825 };

type Props = {
  buildings: BuildingSummary[];
  selectedId?: string | null;
  onSelect?: (id: string) => void;
};

export function PlotPinMap({ buildings, selectedId, onSelect }: Props) {
  if (!MAPS_KEY || MAPS_KEY.startsWith("your-")) {
    return <MapFallback buildings={buildings} onSelect={onSelect} />;
  }

  return (
    <APIProvider apiKey={MAPS_KEY} libraries={["marker"]}>
      <Map
        defaultCenter={KAMPALA_CENTER}
        defaultZoom={13}
        mapId={MAP_ID}
        gestureHandling="greedy"
        className="h-full w-full"
      >
        <ClusteredMarkers
          buildings={buildings}
          selectedId={selectedId}
          onSelect={onSelect}
        />
      </Map>
    </APIProvider>
  );
}

function ClusteredMarkers({
  buildings,
  selectedId,
  onSelect,
}: {
  buildings: BuildingSummary[];
  selectedId?: string | null;
  onSelect?: (id: string) => void;
}) {
  const map = useMap();
  const clustererRef = useRef<MarkerClusterer | null>(null);
  const markersRef = useRef<google.maps.marker.AdvancedMarkerElement[]>([]);

  const positions = useMemo(
    () =>
      buildings.map((b) => ({
        id: b.id,
        lat: b.approximateLat,
        lng: b.approximateLng,
        label: String(b.availableUnitCount),
      })),
    [buildings],
  );

  useEffect(() => {
    if (!map) return;

    markersRef.current.forEach((m) => (m.map = null));
    markersRef.current = [];

    clustererRef.current?.clearMarkers();
    clustererRef.current = new MarkerClusterer({ map });

    for (const pos of positions) {
      const el = document.createElement("div");
      el.className =
        "flex h-9 w-9 cursor-pointer items-center justify-center bg-accent-orange text-sm font-semibold text-white shadow";
      el.textContent = pos.label;
      el.onclick = () => onSelect?.(pos.id);

      const marker = new google.maps.marker.AdvancedMarkerElement({
        map,
        position: { lat: pos.lat, lng: pos.lng },
        content: el,
      });
      markersRef.current.push(marker);
      clustererRef.current.addMarker(marker);
    }

    return () => {
      clustererRef.current?.clearMarkers();
      markersRef.current.forEach((m) => (m.map = null));
    };
  }, [map, positions, onSelect]);

  return (
    <>
      {buildings.map((b) =>
        selectedId === b.id ? (
          <AdvancedMarker
            key={`sel-${b.id}`}
            position={{ lat: b.approximateLat, lng: b.approximateLng }}
          />
        ) : null,
      )}
    </>
  );
}

function MapFallback({
  buildings,
  onSelect,
}: {
  buildings: BuildingSummary[];
  onSelect?: (id: string) => void;
}) {
  return (
    <div className="flex h-full min-h-[420px] flex-col items-center justify-center gap-4 bg-slate-200 p-8 text-center">
      <div className="flex flex-wrap justify-center gap-3">
        {buildings.map((b) => (
          <button
            key={b.id}
            type="button"
            onClick={() => onSelect?.(b.id)}
            className="flex h-10 w-10 items-center justify-center bg-accent-orange text-sm font-semibold text-white shadow"
          >
            {b.availableUnitCount}
          </button>
        ))}
      </div>
      <p className="text-sm text-muted">
        Add <code className="text-xs">NEXT_PUBLIC_GOOGLE_MAPS_API_KEY</code> for
        live Google Maps. Showing cluster fallback.
      </p>
    </div>
  );
}
