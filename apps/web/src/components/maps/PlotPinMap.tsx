"use client";

import {
  APIProvider,
  Map as GoogleMap,
  useMap,
} from "@vis.gl/react-google-maps";
import { MarkerClusterer } from "@googlemaps/markerclusterer";
import { useEffect, useMemo, useRef } from "react";
import type { BuildingSummary } from "@plotpin/shared-types";
import {
  EXPLORE_MAP_CLUSTER_ZOOM_STEP,
  EXPLORE_MAP_DEFAULT_ZOOM,
  EXPLORE_MAP_MAX_ZOOM,
  EXPLORE_MAP_MIN_ZOOM,
} from "@/lib/maps/config";
import { cn } from "@/lib/utils/cn";

const MAPS_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? "";
const MAP_ID = process.env.NEXT_PUBLIC_GOOGLE_MAP_ID ?? "";
const KAMPALA_CENTER = { lat: 0.3476, lng: 32.5825 };

type AdvancedMarkerWithMeta = google.maps.marker.AdvancedMarkerElement & {
  plotpinEl?: HTMLDivElement;
  plotpinTooltip?: HTMLDivElement;
  plotpinLabel?: HTMLSpanElement;
  plotpinSpinner?: HTMLSpanElement;
  plotpinWrap?: HTMLDivElement;
  plotpinUnlocked?: boolean;
};

type HoverPreview = {
  id: string;
  name: string;
  loading: boolean;
} | null;

type Props = {
  buildings: BuildingSummary[];
  selectedId?: string | null;
  hoveredId?: string | null;
  hoverPreview?: HoverPreview;
  unlockedBuildingIds?: ReadonlySet<string>;
  unlockedLocations?: ReadonlyMap<string, { lat: number; lng: number }>;
  onSelect?: (id: string) => void;
  onAccessOpen?: (id: string) => void;
  onHover?: (id: string | null) => void;
};

export function PlotPinMap({
  buildings,
  selectedId,
  hoveredId,
  hoverPreview,
  unlockedBuildingIds,
  unlockedLocations,
  onSelect,
  onAccessOpen,
  onHover,
}: Props) {
  if (!MAPS_KEY || MAPS_KEY.startsWith("your-")) {
    return (
      <MapFallback
        buildings={buildings}
        unlockedBuildingIds={unlockedBuildingIds}
        onSelect={onSelect}
        onAccessOpen={onAccessOpen}
        onHover={onHover}
      />
    );
  }

  return (
    <APIProvider apiKey={MAPS_KEY} libraries={["marker"]}>
      <GoogleMap
        defaultCenter={KAMPALA_CENTER}
        defaultZoom={EXPLORE_MAP_DEFAULT_ZOOM}
        minZoom={EXPLORE_MAP_MIN_ZOOM}
        maxZoom={EXPLORE_MAP_MAX_ZOOM}
        mapId={MAP_ID}
        mapTypeId="roadmap"
        mapTypeControl={false}
        streetViewControl={false}
        gestureHandling="greedy"
        className="h-full w-full"
      >
        <ExploreMapConstraints />
        <ClusteredMarkers
          buildings={buildings}
          selectedId={selectedId}
          hoveredId={hoveredId}
          hoverPreview={hoverPreview}
          unlockedBuildingIds={unlockedBuildingIds}
          unlockedLocations={unlockedLocations}
          onSelect={onSelect}
          onAccessOpen={onAccessOpen}
          onHover={onHover}
        />
      </GoogleMap>
    </APIProvider>
  );
}

function ExploreMapConstraints() {
  const map = useMap();

  useEffect(() => {
    if (!map) return;

    map.setOptions({
      maxZoom: EXPLORE_MAP_MAX_ZOOM,
      minZoom: EXPLORE_MAP_MIN_ZOOM,
      mapTypeControl: false,
      mapTypeId: "roadmap",
      streetViewControl: false,
    });

    const listener = map.addListener("zoom_changed", () => {
      const zoom = map.getZoom();
      if (zoom != null && zoom > EXPLORE_MAP_MAX_ZOOM) {
        map.setZoom(EXPLORE_MAP_MAX_ZOOM);
      }
    });

    return () => listener.remove();
  }, [map]);

  return null;
}

function mapMarkerLabel(building: BuildingSummary) {
  if (building.availableUnitCount > 0) {
    return String(building.availableUnitCount);
  }
  if (building.myUnlockCount && building.myUnlockCount > 0) {
    return String(building.myUnlockCount);
  }
  return "1";
}

function isUnlockedBuilding(
  building: BuildingSummary,
  unlockedBuildingIds?: ReadonlySet<string>,
) {
  return (
    unlockedBuildingIds?.has(building.id) === true ||
    (building.myUnlockCount ?? 0) > 0
  );
}
function markerClasses(active: boolean, hovered: boolean, unlocked: boolean) {
  if (unlocked) {
    return [
      "flex h-8 w-8 items-center justify-center text-xs font-semibold text-white shadow",
      active || hovered ? "ring-2 ring-lime-800 ring-offset-1" : "",
      active ? "bg-lime-700" : "bg-lime-500",
    ]
      .filter(Boolean)
      .join(" ");
  }

  return [
    "flex h-8 w-8 items-center justify-center text-xs font-semibold text-white shadow",
    active || hovered ? "ring-2 ring-primary ring-offset-1" : "",
    active ? "bg-primary" : "bg-accent-orange",
  ]
    .filter(Boolean)
    .join(" ");
}

function createMapTooltip() {
  const tooltip = document.createElement("div");
  tooltip.className = "plotpin-map-tooltip";

  const row = document.createElement("div");
  row.className = "plotpin-map-tooltip__row";

  const spinner = document.createElement("span");
  spinner.className = "plotpin-map-tooltip__spinner";
  spinner.setAttribute("aria-hidden", "true");

  const label = document.createElement("span");
  label.className = "plotpin-map-tooltip__label";

  row.appendChild(spinner);
  row.appendChild(label);
  tooltip.appendChild(row);

  return { tooltip, label, spinner };
}

function ClusteredMarkers({
  buildings,
  selectedId,
  hoveredId,
  hoverPreview,
  unlockedBuildingIds,
  unlockedLocations,
  onSelect,
  onAccessOpen,
  onHover,
}: {
  buildings: BuildingSummary[];
  selectedId?: string | null;
  hoveredId?: string | null;
  hoverPreview?: HoverPreview;
  unlockedBuildingIds?: ReadonlySet<string>;
  unlockedLocations?: ReadonlyMap<string, { lat: number; lng: number }>;
  onSelect?: (id: string) => void;
  onAccessOpen?: (id: string) => void;
  onHover?: (id: string | null) => void;
}) {
  const map = useMap();
  const clustererRef = useRef<MarkerClusterer | null>(null);
  const colocatedWindowRef = useRef<google.maps.InfoWindow | null>(null);
  const buildingsRef = useRef(buildings);
  const onHoverRef = useRef(onHover);
  const onSelectRef = useRef(onSelect);
  const onAccessOpenRef = useRef(onAccessOpen);
  const unlockedIdsRef = useRef(unlockedBuildingIds);
  const unlockedLocationsRef = useRef(unlockedLocations);
  const markersRef = useRef<AdvancedMarkerWithMeta[]>([]);
  const markerIdsRef = useRef(
    new globalThis.Map<google.maps.marker.AdvancedMarkerElement, string>(),
  );

  useEffect(() => {
    buildingsRef.current = buildings;
    onHoverRef.current = onHover;
    onSelectRef.current = onSelect;
    onAccessOpenRef.current = onAccessOpen;
    unlockedIdsRef.current = unlockedBuildingIds;
    unlockedLocationsRef.current = unlockedLocations;
  }, [buildings, onHover, onSelect, onAccessOpen, unlockedBuildingIds, unlockedLocations]);

  const positions = useMemo(
    () =>
      buildings.map((b) => {
        const exact = unlockedLocations?.get(b.id);
        const unlocked = isUnlockedBuilding(b, unlockedBuildingIds);
        return {
          id: b.id,
          name: b.name,
          lat: exact?.lat ?? b.approximateLat,
          lng: exact?.lng ?? b.approximateLng,
          label: mapMarkerLabel(b),
          unlocked,
        };
      }),
    [buildings, unlockedBuildingIds, unlockedLocations],
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
        colocatedWindowRef.current?.close();

        const currentZoom = map.getZoom() ?? EXPLORE_MAP_DEFAULT_ZOOM;

        const bounds = new google.maps.LatLngBounds();
        for (const marker of cluster.markers) {
          const position = (
            marker as google.maps.marker.AdvancedMarkerElement
          ).position;
          if (position) bounds.extend(position);
        }

        if (bounds.isEmpty()) return;

        const ne = bounds.getNorthEast();
        const sw = bounds.getSouthWest();
        const samePoint =
          Math.abs(ne.lat() - sw.lat()) < 0.00001 &&
          Math.abs(ne.lng() - sw.lng()) < 0.00001;

        if (samePoint || currentZoom >= EXPLORE_MAP_MAX_ZOOM) {
          showColocatedList(cluster, map);
          return;
        }

        if (cluster.position) {
          map.panTo(cluster.position);
        }

        map.setZoom(
          Math.min(
            currentZoom + EXPLORE_MAP_CLUSTER_ZOOM_STEP,
            EXPLORE_MAP_MAX_ZOOM,
          ),
        );
      },
    });

    for (const pos of positions) {
      const wrap = document.createElement("div");
      wrap.className =
        "relative flex h-10 w-10 cursor-pointer items-center justify-center overflow-visible";

      const { tooltip, label, spinner } = createMapTooltip();

      const el = document.createElement("div");
      el.className = markerClasses(false, false, pos.unlocked);
      el.textContent = pos.label;

      wrap.appendChild(tooltip);
      wrap.appendChild(el);

      wrap.onmouseenter = () => onHoverRef.current?.(pos.id);
      wrap.onmouseleave = () => onHoverRef.current?.(null);
      wrap.onclick = (e) => {
        e.stopPropagation();
        colocatedWindowRef.current?.close();
        if (pos.unlocked) {
          onAccessOpenRef.current?.(pos.id);
        }
        onSelectRef.current?.(pos.id);
      };

      const marker = new google.maps.marker.AdvancedMarkerElement({
        map,
        position: { lat: pos.lat, lng: pos.lng },
        content: wrap,
      }) as AdvancedMarkerWithMeta;
      marker.plotpinEl = el;
      marker.plotpinTooltip = tooltip;
      marker.plotpinLabel = label;
      marker.plotpinSpinner = spinner;
      marker.plotpinWrap = wrap;
      marker.plotpinUnlocked = pos.unlocked;
      markerIdsRef.current.set(marker, pos.id);
      markersRef.current.push(marker);
      clustererRef.current.addMarker(marker);
    }

    function showColocatedList(
      cluster: Parameters<
        NonNullable<ConstructorParameters<typeof MarkerClusterer>[0]["onClusterClick"]>
      >[1],
      targetMap: google.maps.Map,
    ) {
      const ids = cluster.markers
        .map((m) =>
          markerIdsRef.current.get(
            m as google.maps.marker.AdvancedMarkerElement,
          ),
        )
        .filter((id): id is string => Boolean(id));

      if (ids.length <= 1) {
        if (ids[0]) onSelectRef.current?.(ids[0]);
        return;
      }

      const items = ids.map((id, index) => {
        const building = buildingsRef.current.find((b) => b.id === id);
        return {
          index: index + 1,
          id,
          name: building?.name ?? "Listing",
        };
      });

      const container = document.createElement("div");
      container.className = "max-w-xs p-1";
      const title = document.createElement("p");
      title.className = "mb-2 text-sm font-semibold";
      title.textContent = `${items.length} listings here`;
      container.appendChild(title);

      const list = document.createElement("ol");
      list.className = "space-y-1";
      for (const item of items) {
        const li = document.createElement("li");
        const button = document.createElement("button");
        button.type = "button";
        button.className =
          "w-full text-left text-sm text-[#2563eb] hover:underline";
        button.textContent = `${item.index}. ${item.name}`;
        button.onclick = (event) => {
          event.stopPropagation();
          onSelectRef.current?.(item.id);
          colocatedWindowRef.current?.close();
        };
        li.appendChild(button);
        list.appendChild(li);
      }
      container.appendChild(list);

      if (!colocatedWindowRef.current) {
        colocatedWindowRef.current = new google.maps.InfoWindow();
      }
      colocatedWindowRef.current.setContent(container);
      colocatedWindowRef.current.setPosition(cluster.position);
      colocatedWindowRef.current.open(targetMap);
    }

    return () => {
      colocatedWindowRef.current?.close();
      clustererRef.current?.clearMarkers();
      markersRef.current.forEach((m) => (m.map = null));
    };
  }, [map, positions]);

  useEffect(() => {
    for (const marker of markersRef.current) {
      const id = markerIdsRef.current.get(marker);
      const el = marker.plotpinEl;
      const tooltip = marker.plotpinTooltip;
      const label = marker.plotpinLabel;
      const spinner = marker.plotpinSpinner;
      if (!el || !id) continue;

      const active = selectedId === id;
      const hovered = hoveredId === id;
      const unlocked =
        marker.plotpinUnlocked ?? unlockedIdsRef.current?.has(id) ?? false;
      el.className = markerClasses(active, hovered, unlocked);
      marker.zIndex = active || hovered ? 2 : 1;

      if (!tooltip || !label || !spinner) continue;

      if (hovered) {
        const name =
          hoverPreview?.id === id
            ? hoverPreview.name
            : (buildingsRef.current.find((b) => b.id === id)?.name ??
              "Listing");
        const loading = hoverPreview?.id === id ? hoverPreview.loading : false;

        if (label.textContent !== name) label.textContent = name;
        spinner.classList.toggle("is-visible", loading);
        tooltip.classList.add("is-visible");
      } else {
        spinner.classList.remove("is-visible");
        tooltip.classList.remove("is-visible");
      }
    }
  }, [selectedId, hoveredId, hoverPreview]);

  return null;
}

function MapFallback({
  buildings,
  unlockedBuildingIds,
  onSelect,
  onAccessOpen,
  onHover,
}: {
  buildings: BuildingSummary[];
  unlockedBuildingIds?: ReadonlySet<string>;
  onSelect?: (id: string) => void;
  onAccessOpen?: (id: string) => void;
  onHover?: (id: string | null) => void;
}) {
  return (
    <div className="flex h-full min-h-[420px] flex-col items-center justify-center gap-4 bg-slate-200 p-8 text-center">
      <div className="flex flex-wrap justify-center gap-3">
        {buildings.map((b) => {
          const unlocked = isUnlockedBuilding(b, unlockedBuildingIds);
          return (
            <button
              key={b.id}
              type="button"
              title={b.name}
              onMouseEnter={() => onHover?.(b.id)}
              onMouseLeave={() => onHover?.(null)}
              onClick={() => {
                if (unlocked) onAccessOpen?.(b.id);
                onSelect?.(b.id);
              }}
              className={cn(
                "flex h-10 w-10 items-center justify-center text-sm font-semibold text-white shadow",
                unlocked ? "bg-lime-500" : "bg-accent-orange",
              )}
            >
              {mapMarkerLabel(b)}
            </button>
          );
        })}
      </div>
      <p className="text-sm text-muted">
        Add <code className="text-xs">NEXT_PUBLIC_GOOGLE_MAPS_API_KEY</code> for
        live Google Maps.
      </p>
    </div>
  );
}
