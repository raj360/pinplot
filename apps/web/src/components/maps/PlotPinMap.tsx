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
import { PlotPinClusterRenderer } from "@/lib/maps/plotpin-cluster-renderer";
import { MapSearchAreaButton } from "@/components/maps/MapSearchAreaButton";
import { cn } from "@/lib/utils/cn";

const MAPS_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? "";
const MAP_ID = process.env.NEXT_PUBLIC_GOOGLE_MAP_ID ?? "";
const KAMPALA_CENTER = { lat: 0.3476, lng: 32.5825 };

type AdvancedMarkerWithMeta = google.maps.marker.AdvancedMarkerElement & {
  plotpinPin?: HTMLDivElement;
  plotpinBody?: HTMLDivElement;
  plotpinTooltip?: HTMLDivElement;
  plotpinLabel?: HTMLSpanElement;
  plotpinSpinner?: HTMLSpanElement;
  plotpinWrap?: HTMLDivElement;
  plotpinUnlocked?: boolean;
};

type MarkerUiEntry = {
  id: string;
  pin: HTMLDivElement;
  body: HTMLDivElement;
  tooltip: HTMLDivElement;
  titleButton: HTMLButtonElement;
  summary: HTMLParagraphElement;
  unlocked: boolean;
  marker: AdvancedMarkerWithMeta;
};

type HoverPreview = {
  id: string;
  name: string;
  summaryLine?: string;
} | null;

type MapViewport = {
  bounds: { north: number; south: number; east: number; west: number };
  zoom: number;
};

type Props = {
  buildings: BuildingSummary[];
  selectedId?: string | null;
  hoveredId?: string | null;
  hoverPreview?: HoverPreview;
  unlockedBuildingIds?: ReadonlySet<string>;
  unlockedLocations?: ReadonlyMap<string, { lat: number; lng: number }>;
  onSelect?: (id: string) => void;
  onHoverOpenDetail?: (id: string) => void;
  onAccessOpen?: (id: string) => void;
  onHover?: (id: string | null) => void;
  /** cooperative = page scroll passes through on mobile; greedy = map captures all gestures */
  gestureHandling?: "greedy" | "cooperative" | "none" | "auto";
  /** Increment after search to fit map to result markers. */
  fitBoundsToken?: number;
  /** When results are empty, zoom map to the searched area. */
  focusBounds?: { north: number; south: number; east: number; west: number } | null;
  onViewportChange?: (viewport: MapViewport) => void;
  onUserMapInteraction?: () => void;
  onProgrammaticMapMove?: () => void;
  showSearchAreaButton?: boolean;
  mapAreaSearching?: boolean;
  onSearchMapArea?: () => void;
  className?: string;
};

export function PlotPinMap({
  buildings,
  selectedId,
  hoveredId,
  hoverPreview,
  unlockedBuildingIds,
  unlockedLocations,
  onSelect,
  onHoverOpenDetail,
  onAccessOpen,
  onHover,
  gestureHandling = "greedy",
  fitBoundsToken = 0,
  focusBounds = null,
  onViewportChange,
  onUserMapInteraction,
  onProgrammaticMapMove,
  showSearchAreaButton = false,
  mapAreaSearching = false,
  onSearchMapArea,
  className,
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
    <div className={cn("relative h-full w-full", className)}>
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
          gestureHandling={gestureHandling}
          className="h-full w-full"
        >
          <ExploreMapConstraints />
          <MapViewportTracker
            onViewportChange={onViewportChange}
            onUserMapInteraction={onUserMapInteraction}
          />
          <MapFitBounds
            buildings={buildings}
            unlockedLocations={unlockedLocations}
            fitToken={fitBoundsToken}
            focusBounds={focusBounds}
            onProgrammaticMapMove={onProgrammaticMapMove}
          />
          <ClusteredMarkers
            buildings={buildings}
            selectedId={selectedId}
            hoveredId={hoveredId}
            hoverPreview={hoverPreview}
            unlockedBuildingIds={unlockedBuildingIds}
            unlockedLocations={unlockedLocations}
            onSelect={onSelect}
            onHoverOpenDetail={onHoverOpenDetail}
            onAccessOpen={onAccessOpen}
            onHover={onHover}
          />
        </GoogleMap>
      </APIProvider>
      <MapSearchAreaButton
        visible={showSearchAreaButton}
        searching={mapAreaSearching}
        disabled={!onSearchMapArea}
        onSearch={() => onSearchMapArea?.()}
      />
    </div>
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

function MapViewportTracker({
  onViewportChange,
  onUserMapInteraction,
}: {
  onViewportChange?: (viewport: MapViewport) => void;
  onUserMapInteraction?: () => void;
}) {
  const map = useMap();
  const onViewportChangeRef = useRef(onViewportChange);
  const onUserMapInteractionRef = useRef(onUserMapInteraction);

  useEffect(() => {
    onViewportChangeRef.current = onViewportChange;
    onUserMapInteractionRef.current = onUserMapInteraction;
  }, [onViewportChange, onUserMapInteraction]);

  useEffect(() => {
    if (!map) return;

    function emitViewport() {
      const bounds = map!.getBounds();
      const zoom = map!.getZoom();
      if (!bounds || zoom == null) return;

      const ne = bounds.getNorthEast();
      const sw = bounds.getSouthWest();
      onViewportChangeRef.current?.({
        bounds: {
          north: ne.lat(),
          south: sw.lat(),
          east: ne.lng(),
          west: sw.lng(),
        },
        zoom,
      });
    }

    const idleListener = map.addListener("idle", emitViewport);
    const dragListener = map.addListener("dragstart", () => {
      onUserMapInteractionRef.current?.();
    });
    const zoomListener = map.addListener("zoom_changed", () => {
      onUserMapInteractionRef.current?.();
    });

    emitViewport();

    return () => {
      idleListener.remove();
      dragListener.remove();
      zoomListener.remove();
    };
  }, [map]);

  return null;
}

function MapFitBounds({
  buildings,
  unlockedLocations,
  fitToken,
  focusBounds,
  onProgrammaticMapMove,
}: {
  buildings: BuildingSummary[];
  unlockedLocations?: ReadonlyMap<string, { lat: number; lng: number }>;
  fitToken: number;
  focusBounds?: { north: number; south: number; east: number; west: number } | null;
  onProgrammaticMapMove?: () => void;
}) {
  const map = useMap();
  const lastFitTokenRef = useRef(0);

  useEffect(() => {
    if (!map || fitToken === 0) return;
    if (fitToken === lastFitTokenRef.current) return;
    lastFitTokenRef.current = fitToken;

    onProgrammaticMapMove?.();

    function applyZoomCap() {
      google.maps.event.addListenerOnce(map!, "idle", () => {
        const zoom = map!.getZoom();
        if (zoom != null && zoom > EXPLORE_MAP_MAX_ZOOM) {
          map!.setZoom(EXPLORE_MAP_MAX_ZOOM);
        }
        if (zoom != null && zoom < EXPLORE_MAP_MIN_ZOOM) {
          map!.setZoom(EXPLORE_MAP_MIN_ZOOM);
        }
      });
    }

    if (focusBounds) {
      const bounds = new google.maps.LatLngBounds(
        { lat: focusBounds.south, lng: focusBounds.west },
        { lat: focusBounds.north, lng: focusBounds.east },
      );
      map.fitBounds(bounds, 64);
      applyZoomCap();
      return;
    }

    if (buildings.length === 0) {
      map.setCenter(KAMPALA_CENTER);
      map.setZoom(EXPLORE_MAP_DEFAULT_ZOOM);
      return;
    }

    if (buildings.length === 1) {
      const building = buildings[0];
      const exact = unlockedLocations?.get(building.id);
      map.setCenter({
        lat: exact?.lat ?? building.approximateLat,
        lng: exact?.lng ?? building.approximateLng,
      });
      map.setZoom(EXPLORE_MAP_MAX_ZOOM);
      return;
    }

    const bounds = new google.maps.LatLngBounds();
    for (const building of buildings) {
      const exact = unlockedLocations?.get(building.id);
      bounds.extend({
        lat: exact?.lat ?? building.approximateLat,
        lng: exact?.lng ?? building.approximateLng,
      });
    }

    map.fitBounds(bounds, 72);
    applyZoomCap();
  }, [map, buildings, unlockedLocations, fitToken, focusBounds, onProgrammaticMapMove]);

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
function markerVariantClasses(
  active: boolean,
  hovered: boolean,
  unlocked: boolean,
) {
  const classes = ["plotpin-map-marker"];

  if (unlocked) {
    classes.push(
      active
        ? "plotpin-map-marker--unlocked-active"
        : "plotpin-map-marker--unlocked",
    );
  } else {
    classes.push(
      active ? "plotpin-map-marker--active" : "plotpin-map-marker--available",
    );
  }

  if (active || hovered) {
    classes.push(
      unlocked
        ? "plotpin-map-marker--highlight-unlocked"
        : "plotpin-map-marker--highlight",
    );
  }

  return classes.join(" ");
}

function createMarkerPin(label: string, unlocked: boolean) {
  const pin = document.createElement("div");
  pin.className = markerVariantClasses(false, false, unlocked);

  const body = document.createElement("div");
  body.className = "plotpin-map-marker__body";
  body.textContent = label;

  const tail = document.createElement("div");
  tail.className = "plotpin-map-marker__tail";
  tail.setAttribute("aria-hidden", "true");

  pin.appendChild(body);
  pin.appendChild(tail);

  return { pin, body };
}

function createMapTooltip() {
  const tooltip = document.createElement("div");
  tooltip.className = "plotpin-map-tooltip plotpin-map-tooltip--rich";

  const titleButton = document.createElement("button");
  titleButton.type = "button";
  titleButton.className = "plotpin-map-tooltip__title";

  const summary = document.createElement("p");
  summary.className = "plotpin-map-tooltip__summary";

  tooltip.appendChild(titleButton);
  tooltip.appendChild(summary);

  return { tooltip, titleButton, summary };
}

function ClusteredMarkers({
  buildings,
  selectedId,
  hoveredId,
  hoverPreview,
  unlockedBuildingIds,
  unlockedLocations,
  onSelect,
  onHoverOpenDetail,
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
  onHoverOpenDetail?: (id: string) => void;
  onAccessOpen?: (id: string) => void;
  onHover?: (id: string | null) => void;
}) {
  const map = useMap();
  const clustererRef = useRef<MarkerClusterer | null>(null);
  const colocatedWindowRef = useRef<google.maps.InfoWindow | null>(null);
  const buildingsRef = useRef(buildings);
  const onHoverRef = useRef(onHover);
  const onSelectRef = useRef(onSelect);
  const onHoverOpenDetailRef = useRef(onHoverOpenDetail);
  const onAccessOpenRef = useRef(onAccessOpen);
  const unlockedIdsRef = useRef(unlockedBuildingIds);
  const unlockedLocationsRef = useRef(unlockedLocations);
  const markersRef = useRef<AdvancedMarkerWithMeta[]>([]);
  const markerUiRef = useRef<MarkerUiEntry[]>([]);
  const markerIdsRef = useRef(
    new globalThis.Map<google.maps.marker.AdvancedMarkerElement, string>(),
  );

  useEffect(() => {
    buildingsRef.current = buildings;
    onHoverRef.current = onHover;
    onSelectRef.current = onSelect;
    onHoverOpenDetailRef.current = onHoverOpenDetail;
    onAccessOpenRef.current = onAccessOpen;
    unlockedIdsRef.current = unlockedBuildingIds;
    unlockedLocationsRef.current = unlockedLocations;
  }, [
    buildings,
    onHover,
    onHoverOpenDetail,
    onSelect,
    onAccessOpen,
    unlockedBuildingIds,
    unlockedLocations,
  ]);

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
    markerUiRef.current = [];
    markerIdsRef.current.clear();

    clustererRef.current?.clearMarkers();
    clustererRef.current = new MarkerClusterer({
      map,
      renderer: new PlotPinClusterRenderer(),
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

    const nextMarkerUi: MarkerUiEntry[] = [];

    for (const pos of positions) {
      const wrap = document.createElement("div");
      wrap.className = "plotpin-map-marker-wrap";

      const { tooltip, titleButton, summary } = createMapTooltip();
      const { pin, body } = createMarkerPin(pos.label, pos.unlocked);

      pin.insertBefore(tooltip, pin.firstChild);

      titleButton.onclick = (event) => {
        event.stopPropagation();
        onHoverOpenDetailRef.current?.(pos.id);
      };

      wrap.appendChild(pin);

      wrap.onmouseenter = () => onHoverRef.current?.(pos.id);
      wrap.onmouseleave = () => onHoverRef.current?.(null);
      wrap.onclick = (e) => {
        e.stopPropagation();
        colocatedWindowRef.current?.close();
        onSelectRef.current?.(pos.id);
      };

      const marker = new google.maps.marker.AdvancedMarkerElement({
        map,
        position: { lat: pos.lat, lng: pos.lng },
        content: wrap,
      }) as AdvancedMarkerWithMeta;
      marker.plotpinPin = pin;
      marker.plotpinBody = body;
      marker.plotpinTooltip = tooltip;
      marker.plotpinLabel = titleButton;
      marker.plotpinSpinner = summary;
      marker.plotpinWrap = wrap;
      marker.plotpinUnlocked = pos.unlocked;
      markerIdsRef.current.set(marker, pos.id);
      markersRef.current.push(marker);
      nextMarkerUi.push({
        id: pos.id,
        pin,
        body,
        tooltip,
        titleButton,
        summary,
        unlocked: pos.unlocked,
        marker,
      });
      clustererRef.current.addMarker(marker);
    }

    markerUiRef.current = nextMarkerUi;

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
    const frame = window.requestAnimationFrame(() => {
      for (const entry of markerUiRef.current) {
        const { id, pin, tooltip, titleButton, summary, unlocked, marker } = entry;

        const active = selectedId === id;
        const hovered = hoveredId === id;
        pin.className = markerVariantClasses(active, hovered, unlocked);
        marker.zIndex = active || hovered ? 2 : 1;

        if (hovered) {
          const building = buildingsRef.current.find((b) => b.id === id);
          const preview =
            hoverPreview?.id === id ? hoverPreview : null;
          const name = preview?.name ?? building?.name ?? "Listing";
          const summaryLine =
            preview?.summaryLine ??
            (building && building.availableUnitCount > 0
              ? `${building.availableUnitCount} available`
              : "Click for details");

          if (titleButton.textContent !== name) titleButton.textContent = name;
          if (summary.textContent !== summaryLine) {
            summary.textContent = summaryLine;
          }
          tooltip.classList.add("is-visible");
        } else {
          tooltip.classList.remove("is-visible");
        }
      }
    });

    return () => window.cancelAnimationFrame(frame);
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
                onSelect?.(b.id);
              }}
              className={cn(
                "plotpin-map-marker",
                unlocked
                  ? "plotpin-map-marker--unlocked"
                  : "plotpin-map-marker--available",
              )}
            >
              <span className="plotpin-map-marker__body">{mapMarkerLabel(b)}</span>
              <span className="plotpin-map-marker__tail" aria-hidden />
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
