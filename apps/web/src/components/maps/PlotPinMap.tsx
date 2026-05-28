"use client";

import {
  APIProvider,
  Map as GoogleMap,
  useMap,
} from "@vis.gl/react-google-maps";
import { MarkerClusterer } from "@googlemaps/markerclusterer";
import { useEffect, useMemo, useRef } from "react";
import type { BuildingSummary } from "@plotpin/shared-types";

const MAPS_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? "";
const MAP_ID = process.env.NEXT_PUBLIC_GOOGLE_MAP_ID ?? "";
const KAMPALA_CENTER = { lat: 0.3476, lng: 32.5825 };

type AdvancedMarkerWithMeta = google.maps.marker.AdvancedMarkerElement & {
  plotpinEl?: HTMLDivElement;
};

type Props = {
  buildings: BuildingSummary[];
  selectedId?: string | null;
  hoveredId?: string | null;
  onSelect?: (id: string) => void;
  onClusterSelect?: (ids: string[]) => void;
  onHover?: (id: string | null) => void;
};

export function PlotPinMap({
  buildings,
  selectedId,
  hoveredId,
  onSelect,
  onClusterSelect,
  onHover,
}: Props) {
  if (!MAPS_KEY || MAPS_KEY.startsWith("your-")) {
    return (
      <MapFallback
        buildings={buildings}
        onSelect={onSelect}
        onClusterSelect={onClusterSelect}
      />
    );
  }

  return (
    <APIProvider apiKey={MAPS_KEY} libraries={["marker"]}>
      <GoogleMap
        defaultCenter={KAMPALA_CENTER}
        defaultZoom={13}
        mapId={MAP_ID}
        gestureHandling="greedy"
        className="h-full w-full"
      >
        <ClusteredMarkers
          buildings={buildings}
          selectedId={selectedId}
          hoveredId={hoveredId}
          onSelect={onSelect}
          onClusterSelect={onClusterSelect}
          onHover={onHover}
        />
      </GoogleMap>
    </APIProvider>
  );
}

function markerClasses(active: boolean, hovered: boolean) {
  return [
    "flex h-9 w-9 cursor-pointer items-center justify-center text-sm font-semibold text-white shadow transition-transform",
    active || hovered ? "scale-110 ring-2 ring-primary ring-offset-1" : "",
    active ? "bg-primary" : "bg-accent-orange",
  ]
    .filter(Boolean)
    .join(" ");
}

function ClusteredMarkers({
  buildings,
  selectedId,
  hoveredId,
  onSelect,
  onClusterSelect,
  onHover,
}: {
  buildings: BuildingSummary[];
  selectedId?: string | null;
  hoveredId?: string | null;
  onSelect?: (id: string) => void;
  onClusterSelect?: (ids: string[]) => void;
  onHover?: (id: string | null) => void;
}) {
  const map = useMap();
  const clustererRef = useRef<MarkerClusterer | null>(null);
  const markersRef = useRef<AdvancedMarkerWithMeta[]>([]);
  const markerIdsRef = useRef(
    new globalThis.Map<google.maps.marker.AdvancedMarkerElement, string>(),
  );

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
    markerIdsRef.current.clear();

    clustererRef.current?.clearMarkers();
    clustererRef.current = new MarkerClusterer({
      map,
      onClusterClick: (_event, cluster) => {
        const ids = cluster.markers
          .map((m) =>
            markerIdsRef.current.get(
              m as google.maps.marker.AdvancedMarkerElement,
            ),
          )
          .filter((id): id is string => Boolean(id));

        if (ids.length > 0) {
          onClusterSelect?.(ids);
          onSelect?.(ids[0]!);
        }
      },
    });

    for (const pos of positions) {
      const el = document.createElement("div");
      el.className = markerClasses(false, false);
      el.textContent = pos.label;
      el.onclick = (e) => {
        e.stopPropagation();
        onSelect?.(pos.id);
        onClusterSelect?.([pos.id]);
      };
      el.onmouseenter = () => onHover?.(pos.id);
      el.onmouseleave = () => onHover?.(null);

      const marker = new google.maps.marker.AdvancedMarkerElement({
        map,
        position: { lat: pos.lat, lng: pos.lng },
        content: el,
      }) as AdvancedMarkerWithMeta;
      marker.plotpinEl = el;
      markerIdsRef.current.set(marker, pos.id);
      markersRef.current.push(marker);
      clustererRef.current.addMarker(marker);
    }

    return () => {
      clustererRef.current?.clearMarkers();
      markersRef.current.forEach((m) => (m.map = null));
    };
  }, [map, positions, onSelect, onClusterSelect, onHover]);

  useEffect(() => {
    for (const marker of markersRef.current) {
      const id = markerIdsRef.current.get(marker);
      const el = marker.plotpinEl;
      if (!el || !id) continue;
      el.className = markerClasses(selectedId === id, hoveredId === id);
      marker.zIndex = selectedId === id || hoveredId === id ? 2 : 1;
    }
  }, [selectedId, hoveredId]);

  return null;
}

function MapFallback({
  buildings,
  onSelect,
  onClusterSelect,
}: {
  buildings: BuildingSummary[];
  onSelect?: (id: string) => void;
  onClusterSelect?: (ids: string[]) => void;
}) {
  return (
    <div className="flex h-full min-h-[420px] flex-col items-center justify-center gap-4 bg-slate-200 p-8 text-center">
      <div className="flex flex-wrap justify-center gap-3">
        {buildings.map((b) => (
          <button
            key={b.id}
            type="button"
            onClick={() => {
              onSelect?.(b.id);
              onClusterSelect?.([b.id]);
            }}
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
