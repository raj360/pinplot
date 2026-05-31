"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { PlotPinMap } from "@/components/maps/PlotPinMap";
import { BuildingPreviewModal } from "@/components/explore/BuildingPreviewModal";
import { UnlockedAccessModal } from "@/components/buildings/UnlockedAccessModal";
import { ExploreDetailPane } from "@/components/explore/ExploreDetailPane";
import { ExploreResultsList } from "@/components/explore/ExploreResultsList";
import {
  ExploreFilters,
  EMPTY_EXPLORE_FILTERS,
  type ExploreSearchFilters,
} from "@/components/explore/ExploreFilters";
import { AppHeader } from "@/components/layout/AppHeader";
import { ContentBand } from "@/components/layout/PageShell";
import { layoutMaxClass, LAYOUT, contentBandInnerClass } from "@/lib/layout/shell";
import { cn } from "@/lib/utils/cn";
import { AppLoadingOverlay } from "@/components/ui/app-loading-overlay";
import { Spinner } from "@/components/ui/spinner";
import {
  type BuildingDetail,
  type Bounds,
} from "@/lib/api/buildings";
import {
  getMapFocusForSearch,
} from "@/lib/filters/search-areas";
import {
  boundsForExploreSearch,
  canSearchMapViewport,
  mapBoundsEqual,
  mapViewportDiffersFromSearch,
  sanitizeMapBounds,
} from "@/lib/explore/map-bounds";
import {
  LIVE_SEARCH_DEBOUNCE_MS,
  LIVE_SEARCH_STORAGE_KEY,
  readLiveSearchPreference,
} from "@/lib/explore/live-search-preference";
import { loadExploreBuildings } from "@/lib/explore/load-buildings";
import { useExploreGeolocation } from "@/lib/hooks/use-explore-geolocation";
import { clearBuildingCache } from "@/lib/api/building-cache";
import { fetchMyUnlocks, type TenantUnlock } from "@/lib/api/unlocks";
import { useAuth } from "@/lib/auth/use-auth";
import type { BuildingSummary } from "@plotpin/shared-types";
import { useExplorePreview } from "./useExplorePreview";
import { useIsMobile } from "@/lib/hooks/use-media-query";
import {
  buildExploreHref,
  exploreFiltersEqual,
  parseExploreFiltersFromSearchParams,
} from "@/lib/explore/explore-url-filters";

type DetailMode = "full" | "summary" | null;

const EMPTY_UNLOCKS: TenantUnlock[] = [];

export function ExploreClient() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const urlFilters = useMemo(
    () => parseExploreFiltersFromSearchParams(searchParams),
    [searchParams],
  );
  const urlMapBounds = useMemo(
    () => sanitizeMapBounds(searchParams),
    [searchParams],
  );

  const [mapVisible, setMapVisible] = useState(true);
  const [detailMode, setDetailMode] = useState<DetailMode>(null);
  const [accessModalBuildingId, setAccessModalBuildingId] = useState<
    string | null
  >(null);
  const [allBuildings, setAllBuildings] = useState<BuildingSummary[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedDetail, setSelectedDetail] = useState<BuildingDetail | null>(null);
  const [selectedLoading, setSelectedLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<ExploreSearchFilters>(urlFilters);
  const [appliedFilters, setAppliedFilters] =
    useState<ExploreSearchFilters>(urlFilters);
  const [mapFitToken, setMapFitToken] = useState(0);
  const [mapFocusBounds, setMapFocusBounds] = useState<Bounds | null>(null);
  const [appliedMapBounds, setAppliedMapBounds] = useState<Bounds | null>(urlMapBounds);
  const [appliedSearchBounds, setAppliedSearchBounds] = useState<Bounds>(
    boundsForExploreSearch(urlFilters, urlMapBounds),
  );
  const [viewportBounds, setViewportBounds] = useState<Bounds | null>(null);
  const [mapZoom, setMapZoom] = useState<number | null>(null);
  const [userMovedMap, setUserMovedMap] = useState(false);
  const listRef = useRef<HTMLUListElement>(null);
  const { isAuthenticated } = useAuth();
  const [unlockedLocations, setUnlockedLocations] = useState<
    Map<string, { lat: number; lng: number }>
  >(new Map());
  const [myUnlocks, setMyUnlocks] = useState<TenantUnlock[]>([]);
  const { hoveredId, setHover, loadSelectedDetail } = useExplorePreview();
  const isMobile = useIsMobile();
  const geo = useExploreGeolocation();
  const deepLinkHandled = useRef(false);
  const initialLoadDone = useRef(false);
  const skipUrlSyncRef = useRef(false);
  const initialUrlFiltersRef = useRef(urlFilters);
  const initialUrlMapBoundsRef = useRef(urlMapBounds);
  const appliedFiltersRef = useRef(appliedFilters);
  const appliedMapBoundsRef = useRef(appliedMapBounds);
  const appliedSearchBoundsRef = useRef(appliedSearchBounds);
  const viewportBoundsRef = useRef<Bounds | null>(null);
  const mapZoomRef = useRef<number | null>(null);
  const suppressMapInteractionUntilRef = useRef(0);
  const executeSearchRef = useRef<
    (
      next: ExploreSearchFilters,
      options?: {
        syncUrl?: boolean;
        history?: "push" | "replace";
        mapBounds?: Bounds | null;
      },
    ) => Promise<void>
  >(() => Promise.resolve());
  const searchGenerationRef = useRef(0);
  const initialLoadGenerationRef = useRef(0);
  const liveSearchTimerRef = useRef<number | undefined>(undefined);
  const filtersRef = useRef(filters);
  const [liveSearchEnabled, setLiveSearchEnabled] = useState(
    readLiveSearchPreference,
  );
  const userLocationForSearch = geo.inUganda ? geo.location : null;

  useEffect(() => {
    filtersRef.current = filters;
  }, [filters]);

  useEffect(
    () => () => {
      window.clearTimeout(liveSearchTimerRef.current);
    },
    [],
  );

  useEffect(() => {
    appliedFiltersRef.current = appliedFilters;
  }, [appliedFilters]);

  useEffect(() => {
    appliedMapBoundsRef.current = appliedMapBounds;
  }, [appliedMapBounds]);

  useEffect(() => {
    appliedSearchBoundsRef.current = appliedSearchBounds;
  }, [appliedSearchBounds]);

  const emptyUnlockLocations = useMemo(
    () => new Map<string, { lat: number; lng: number }>(),
    [],
  );

  const visibleMyUnlocks = isAuthenticated ? myUnlocks : EMPTY_UNLOCKS;
  const visibleUnlockLocations = isAuthenticated
    ? unlockedLocations
    : emptyUnlockLocations;

  const unlocksByBuilding = useMemo(() => {
    const map = new Map<string, TenantUnlock[]>();
    for (const unlock of visibleMyUnlocks) {
      const existing = map.get(unlock.buildingId) ?? [];
      existing.push(unlock);
      map.set(unlock.buildingId, existing);
    }
    return map;
  }, [visibleMyUnlocks]);

  const unlockedBuildingIds = useMemo(
    () => new Set(visibleUnlockLocations.keys()),
    [visibleUnlockLocations],
  );

  const loadDetail = useCallback(
    async (id: string) => {
      setSelectedId(id);
      setHover(id);
      setSelectedLoading(true);
      setSelectedDetail(null);
      const detail = await loadSelectedDetail(id);
      setSelectedDetail(detail);
      setSelectedLoading(false);
    },
    [loadSelectedDetail, setHover],
  );

  const applySearchResults = useCallback(
    (data: BuildingSummary[]) => {
      setAllBuildings(data);
      setHover(null);
      setDetailMode(null);
      setMapVisible(true);

      if (data.length === 0) {
        setSelectedId(null);
        setSelectedDetail(null);
        setSelectedLoading(false);
        return;
      }

      void loadDetail(data[0].id);
    },
    [loadDetail, setHover],
  );

  const refreshUnlockState = useCallback(async () => {
    if (!isAuthenticated) return;

    try {
      const unlocks = await fetchMyUnlocks();
      setMyUnlocks(unlocks);
      const next = new Map<string, { lat: number; lng: number }>();
      for (const unlock of unlocks) {
        next.set(unlock.buildingId, unlock.location);
      }
      setUnlockedLocations(next);
    } catch {
      setUnlockedLocations(new Map());
      setMyUnlocks([]);
    }
  }, [isAuthenticated]);

  const refreshBuildings = useCallback(
    async (searchFilters: ExploreSearchFilters, mapBounds?: Bounds | null) => {
      const data = await loadExploreBuildings(searchFilters, mapBounds);
      setAllBuildings(data);
      setSelectedId((prev) => {
        if (prev && data.some((b) => b.id === prev)) return prev;
        return data[0]?.id ?? null;
      });
    },
    [],
  );

  const consumeDeepLink = useCallback(
    (buildings: BuildingSummary[]) => {
      if (deepLinkHandled.current) return;

      const buildingId = searchParams.get("building");
      if (!buildingId) return;
      if (!buildings.some((building) => building.id === buildingId)) return;

      deepLinkHandled.current = true;
      const hideMap = searchParams.get("map") === "0";
      setDetailMode("full");
      if (hideMap && !isMobile) setMapVisible(false);
      void loadDetail(buildingId);
    },
    [isMobile, loadDetail, searchParams],
  );

  const applySearchResultsRef = useRef(applySearchResults);
  const consumeDeepLinkRef = useRef(consumeDeepLink);

  useEffect(() => {
    applySearchResultsRef.current = applySearchResults;
  }, [applySearchResults]);

  useEffect(() => {
    consumeDeepLinkRef.current = consumeDeepLink;
  }, [consumeDeepLink]);

  const handleUnlockSuccess = useCallback(async () => {
    await refreshUnlockState();
    await refreshBuildings(appliedFilters, appliedMapBounds);
    if (selectedId) {
      clearBuildingCache(selectedId);
      setSelectedLoading(true);
      const detail = await loadSelectedDetail(selectedId);
      setSelectedDetail(detail);
      setSelectedLoading(false);
    }
  }, [
    appliedFilters,
    loadSelectedDetail,
    refreshBuildings,
    refreshUnlockState,
    selectedId,
  ]);

  useEffect(() => {
    if (!isAuthenticated) return;

    let cancelled = false;

    fetchMyUnlocks()
      .then((unlocks) => {
        if (cancelled) return;
        setMyUnlocks(unlocks);
        const next = new Map<string, { lat: number; lng: number }>();
        for (const unlock of unlocks) {
          next.set(unlock.buildingId, unlock.location);
        }
        setUnlockedLocations(next);

        if (unlocks.length === 0) return;

        const filtersSnapshot = appliedFiltersRef.current;
        const mapBoundsSnapshot = appliedMapBoundsRef.current;
        return loadExploreBuildings(filtersSnapshot, mapBoundsSnapshot).then((data) => {
          if (cancelled) return;
          if (
            !exploreFiltersEqual(filtersSnapshot, appliedFiltersRef.current) ||
            !mapBoundsEqual(mapBoundsSnapshot, appliedMapBoundsRef.current)
          ) {
            return;
          }
          setAllBuildings(data);
          setSelectedId((prev) => {
            if (prev && data.some((b) => b.id === prev)) return prev;
            return data[0]?.id ?? null;
          });
        });
      })
      .catch(() => {
        if (!cancelled) {
          setUnlockedLocations(new Map());
          setMyUnlocks([]);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [isAuthenticated]);

  useEffect(() => {
    const generation = ++initialLoadGenerationRef.current;
    let cancelled = false;

    const initialFilters = initialUrlFiltersRef.current;
    const initialMapBounds = initialUrlMapBoundsRef.current;
    const initialSearchBounds = boundsForExploreSearch(
      initialFilters,
      initialMapBounds,
    );

    loadExploreBuildings(initialFilters, initialMapBounds)
      .then((data) => {
        if (cancelled || generation !== initialLoadGenerationRef.current) return;

        applySearchResultsRef.current(data);
        setAppliedFilters(initialFilters);
        appliedFiltersRef.current = initialFilters;
        setAppliedSearchBounds(initialSearchBounds);
        appliedSearchBoundsRef.current = initialSearchBounds;
        setAppliedMapBounds(initialMapBounds);
        appliedMapBoundsRef.current = initialMapBounds;
        setMapFitToken((token) => token + 1);
        consumeDeepLinkRef.current(data);
      })
      .catch(() => {
        if (cancelled || generation !== initialLoadGenerationRef.current) return;
        setError("Could not load buildings. Is the API running?");
      })
      .finally(() => {
        if (cancelled || generation !== initialLoadGenerationRef.current) return;
        setLoading(false);
        initialLoadDone.current = true;
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const syncSearchToUrl = useCallback(
    (
      next: ExploreSearchFilters,
      mapBounds: Bounds | null,
      history: "push" | "replace",
    ) => {
      skipUrlSyncRef.current = true;
      const preserve = new URLSearchParams();
      const buildingId = searchParams.get("building");
      if (buildingId) preserve.set("building", buildingId);
      if (searchParams.get("map") === "0") preserve.set("map", "0");
      const href = buildExploreHref(pathname, next, preserve, mapBounds);
      if (history === "push") {
        router.push(href, { scroll: false });
      } else {
        router.replace(href, { scroll: false });
      }
    },
    [pathname, router, searchParams],
  );

  const executeSearch = useCallback(
    async (
      next: ExploreSearchFilters,
      options?: {
        syncUrl?: boolean;
        history?: "push" | "replace";
        mapBounds?: Bounds | null;
      },
    ) => {
      const syncUrl = options?.syncUrl ?? true;
      const history = options?.history ?? "push";
      const mapBounds =
        options?.mapBounds !== undefined
          ? options.mapBounds
          : appliedMapBoundsRef.current;
      const useMapBounds = mapBounds != null;

      if (syncUrl) {
        skipUrlSyncRef.current = true;
      }

      const generation = ++searchGenerationRef.current;
      const searchBounds = boundsForExploreSearch(next, mapBounds);

      setSearching(true);
      setError(null);
      try {
        const focus = useMapBounds
          ? mapBounds
          : getMapFocusForSearch(next.city, userLocationForSearch)?.bounds ?? null;
        setMapFocusBounds(focus);
        const data = await loadExploreBuildings(next, mapBounds);
        if (generation !== searchGenerationRef.current) return;
        applySearchResults(data);
        if (generation !== searchGenerationRef.current) return;

        setAppliedFilters(next);
        appliedFiltersRef.current = next;
        setAppliedMapBounds(useMapBounds ? mapBounds : null);
        appliedMapBoundsRef.current = useMapBounds ? mapBounds : null;
        setAppliedSearchBounds(searchBounds);
        appliedSearchBoundsRef.current = searchBounds;
        setUserMovedMap(false);
        consumeDeepLink(data);

        if (!useMapBounds) {
          setMapFitToken((token) => token + 1);
        }

        if (syncUrl) {
          syncSearchToUrl(next, useMapBounds ? mapBounds : null, history);
        }
      } catch {
        if (generation !== searchGenerationRef.current) return;
        if (syncUrl) {
          skipUrlSyncRef.current = false;
        }
        setError("Could not load buildings. Is the API running?");
      } finally {
        if (generation === searchGenerationRef.current) {
          setSearching(false);
        }
      }
    },
    [applySearchResults, consumeDeepLink, syncSearchToUrl, userLocationForSearch],
  );

  useEffect(() => {
    executeSearchRef.current = executeSearch;
  }, [executeSearch]);

  useEffect(() => {
    if (!initialLoadDone.current) return;

    if (skipUrlSyncRef.current) {
      skipUrlSyncRef.current = false;
      return;
    }

    if (
      exploreFiltersEqual(urlFilters, appliedFiltersRef.current) &&
      mapBoundsEqual(urlMapBounds, appliedMapBoundsRef.current)
    ) {
      setFilters(urlFilters);
      return;
    }

    setFilters(urlFilters);
    void executeSearchRef.current(urlFilters, {
      syncUrl: false,
      mapBounds: urlMapBounds,
    });
  }, [urlFilters, urlMapBounds]);

  const runSearch = useCallback(async () => {
    await executeSearch({ ...filters }, { mapBounds: null });
  }, [executeSearch, filters]);

  const runSearchMapArea = useCallback(async () => {
    const bounds = viewportBoundsRef.current;
    const zoom = mapZoomRef.current;
    if (!bounds || !canSearchMapViewport(zoom)) return;

    const next = { ...filtersRef.current, city: "" };
    setFilters(next);
    await executeSearch(next, { mapBounds: bounds });
  }, [executeSearch]);

  const removeMapBounds = useCallback(async () => {
    const next = { ...appliedFilters };
    setFilters(next);
    await executeSearch(next, { mapBounds: null });
  }, [appliedFilters, executeSearch]);

  const removeAppliedFilter = useCallback(
    async (key: keyof ExploreSearchFilters) => {
      const next = { ...appliedFilters, [key]: "" };
      setFilters(next);
      await executeSearch(next, { mapBounds: appliedMapBoundsRef.current });
    },
    [appliedFilters, executeSearch],
  );

  const runReset = useCallback(async () => {
    geo.clearLocation();
    setFilters(EMPTY_EXPLORE_FILTERS);
    setUserMovedMap(false);
    await executeSearch(EMPTY_EXPLORE_FILTERS, {
      history: "replace",
      mapBounds: null,
    });
  }, [executeSearch, geo]);

  const handleFiltersChange = useCallback(
    (next: ExploreSearchFilters) => {
      setFilters(next);
      if (!liveSearchEnabled) return;

      window.clearTimeout(liveSearchTimerRef.current);
      liveSearchTimerRef.current = window.setTimeout(() => {
        void executeSearchRef.current(next, {
          mapBounds: appliedMapBoundsRef.current,
        });
      }, LIVE_SEARCH_DEBOUNCE_MS);
    },
    [liveSearchEnabled],
  );

  const handleLiveSearchChange = useCallback(
    (enabled: boolean) => {
      setLiveSearchEnabled(enabled);
      try {
        window.localStorage.setItem(LIVE_SEARCH_STORAGE_KEY, enabled ? "1" : "0");
      } catch {
        // ignore storage failures
      }

      if (enabled) {
        window.clearTimeout(liveSearchTimerRef.current);
        void executeSearch(
          { ...filtersRef.current },
          { mapBounds: appliedMapBoundsRef.current },
        );
      }
    },
    [executeSearch],
  );

  const openAccessModal = useCallback((buildingId: string) => {
    setAccessModalBuildingId(buildingId);
  }, []);

  const closeAccessModal = useCallback(() => {
    setAccessModalBuildingId(null);
  }, []);

  const handleListSelect = useCallback(
    (id: string) => {
      if (isMobile) {
        setDetailMode("full");
        void loadDetail(id);
        return;
      }

      setDetailMode("full");
      setMapVisible(false);
      void loadDetail(id);
    },
    [isMobile, loadDetail],
  );

  const handleMapSelect = useCallback(
    (id: string) => {
      if (isMobile) {
        setDetailMode("summary");
        void loadDetail(id);
        return;
      }

      setDetailMode("summary");
      setMapVisible(true);
      closeAccessModal();
      void loadDetail(id);
    },
    [closeAccessModal, isMobile, loadDetail],
  );

  const handleExpandToFullDetails = useCallback(() => {
    closeAccessModal();

    if (isMobile) {
      setDetailMode("full");
      if (selectedId) void loadDetail(selectedId);
      return;
    }

    setDetailMode("full");
    setMapVisible(false);
    if (selectedId) void loadDetail(selectedId);
  }, [closeAccessModal, isMobile, loadDetail, selectedId]);

  const handleToggleMap = useCallback(() => {
    setMapVisible((visible) => {
      const next = !visible;
      if (next) {
        setDetailMode(null);
      } else if (selectedId) {
        setDetailMode("full");
      }
      return next;
    });
  }, [selectedId]);

  const closeMobileSheet = useCallback(() => {
    setDetailMode(null);
  }, []);

  const accessModalUnlocks = accessModalBuildingId
    ? (unlocksByBuilding.get(accessModalBuildingId) ?? [])
    : [];
  const accessModalBuilding = accessModalBuildingId
    ? allBuildings.find((building) => building.id === accessModalBuildingId)
    : null;

  const selectedBuilding = selectedId
    ? allBuildings.find((building) => building.id === selectedId)
    : null;

  const hoverPreview = useMemo(() => {
    if (!hoveredId) return null;
    const building = allBuildings.find((b) => b.id === hoveredId);
    if (!building) return null;
    return {
      id: hoveredId,
      name: building.name,
      loading: false,
    };
  }, [allBuildings, hoveredId]);

  const listLoading = loading || searching;

  const handleViewportChange = useCallback(
    (viewport: { bounds: Bounds; zoom: number }) => {
      viewportBoundsRef.current = viewport.bounds;
      mapZoomRef.current = viewport.zoom;
      setViewportBounds(viewport.bounds);
      setMapZoom(viewport.zoom);
    },
    [],
  );

  const handleUserMapInteraction = useCallback(() => {
    if (Date.now() < suppressMapInteractionUntilRef.current) return;
    setUserMovedMap(true);
  }, []);

  const handleProgrammaticMapMove = useCallback(() => {
    suppressMapInteractionUntilRef.current = Date.now() + 900;
    setUserMovedMap(false);
  }, []);

  const showMapAreaSearch = useMemo(
    () =>
      isMobile &&
      mapVisible &&
      !loading &&
      !searching &&
      userMovedMap &&
      canSearchMapViewport(mapZoom) &&
      mapViewportDiffersFromSearch(viewportBounds, appliedSearchBounds),
    [
      appliedSearchBounds,
      isMobile,
      loading,
      mapVisible,
      mapZoom,
      searching,
      userMovedMap,
      viewportBounds,
    ],
  );

  const showSearchAreaButton = useMemo(
    () =>
      !isMobile &&
      mapVisible &&
      !loading &&
      !searching &&
      userMovedMap &&
      canSearchMapViewport(mapZoom) &&
      mapViewportDiffersFromSearch(viewportBounds, appliedSearchBounds),
    [
      appliedSearchBounds,
      isMobile,
      loading,
      mapVisible,
      mapZoom,
      searching,
      userMovedMap,
      viewportBounds,
    ],
  );

  const mapProps = {
    buildings: allBuildings,
    selectedId,
    hoveredId,
    hoverPreview,
    unlockedBuildingIds,
    unlockedLocations: visibleUnlockLocations,
    onSelect: handleMapSelect,
    onHover: isMobile ? undefined : setHover,
    gestureHandling: "greedy" as const,
    fitBoundsToken: mapFitToken,
    focusBounds: mapFocusBounds,
    onViewportChange: handleViewportChange,
    onUserMapInteraction: handleUserMapInteraction,
    onProgrammaticMapMove: handleProgrammaticMapMove,
    showSearchAreaButton,
    mapAreaSearching: searching,
    onSearchMapArea: () => void runSearchMapArea(),
  };

  const showMobileSheet = Boolean(selectedId) && isMobile && detailMode !== null;
  const showMapSummary =
    !isMobile && mapVisible && detailMode === "summary" && Boolean(selectedId);
  const showFullDetailPane =
    !isMobile && !mapVisible && Boolean(selectedId);

  return (
    <div className="flex min-h-screen flex-col bg-background md:h-screen md:overflow-hidden">
      <div className="sticky top-0 z-30 shrink-0 bg-background shadow-sm">
        <AppHeader variant="wide" />

        <ContentBand width="wide" className="bg-panel" innerClassName="py-1 sm:py-1.5">
          <ExploreFilters
            filters={filters}
            appliedFilters={appliedFilters}
            appliedMapBounds={appliedMapBounds}
            onChange={handleFiltersChange}
            onSearch={() => void runSearch()}
            onReset={() => void runReset()}
            onRemoveAppliedFilter={(key) => void removeAppliedFilter(key)}
            onRemoveMapBounds={() => void removeMapBounds()}
            searching={searching}
            filterLoading={searching && !loading}
            liveSearch={liveSearchEnabled}
            onLiveSearchChange={handleLiveSearchChange}
            mapVisible={mapVisible}
            onToggleMap={handleToggleMap}
            showMapAreaSearch={showMapAreaSearch}
            onSearchMapArea={() => void runSearchMapArea()}
            mapAreaSearching={searching}
            resultCount={allBuildings.length}
            userLocation={geo.location}
            inUganda={geo.inUganda}
            onRequestLocation={geo.requestLocation}
            onClearLocation={geo.clearLocation}
            locationLoading={geo.loading}
          />
        </ContentBand>
      </div>

      {error && (
        <div className={cn(contentBandInnerClass("wide"), "shrink-0")}>
          <p className="bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
        </div>
      )}

      <AppLoadingOverlay show={loading} label="Loading buildings" />

      <div className="flex flex-col md:min-h-0 md:flex-1 md:overflow-hidden">
        <div
          className={cn(
            "mx-auto flex w-full flex-col",
            LAYOUT.padX,
            layoutMaxClass("wide"),
            "md:min-h-0 md:flex-1 md:flex-row md:overflow-hidden",
          )}
        >
          {mapVisible ? (
            <section className="explore-mobile-map relative h-[38vh] min-h-[12rem] max-h-[68vh] shrink-0 overflow-hidden border-b border-border md:hidden">
              <PlotPinMap {...mapProps} />
            </section>
          ) : null}

          <aside
            className={cn(
              "flex w-full flex-col bg-surface md:min-h-0 md:w-[26rem] md:max-w-lg md:shrink-0 md:overflow-hidden md:border-r md:border-border",
            )}
          >
            <div className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-b border-border bg-background px-3 py-2.5 text-sm sm:px-4">
              <span className="flex items-center gap-2">
                <strong className="text-foreground">All</strong>
                {listLoading ? (
                  <Spinner className="size-3" label="Loading results" />
                ) : (
                  <span className="text-muted">
                    {allBuildings.length} result{allBuildings.length === 1 ? "" : "s"}
                  </span>
                )}
              </span>
            </div>

            <ExploreResultsList
              listRef={listRef}
              loading={loading}
              listLoading={listLoading}
              buildings={allBuildings}
              selectedId={selectedId}
              selectedLoading={selectedLoading}
              hoveredId={hoveredId}
              appliedFilters={appliedFilters}
              appliedMapBounds={appliedMapBounds}
              onSelect={handleListSelect}
              onOpenAccess={openAccessModal}
              onRemoveFilter={(key) => void removeAppliedFilter(key)}
              onRemoveMapBounds={() => void removeMapBounds()}
              onReset={() => void runReset()}
            />

            {showMapSummary ? (
              <div className="explore-desktop-summary relative z-10 hidden h-[min(58vh,30rem)] shrink-0 flex-col overflow-hidden border-t-2 border-border bg-surface shadow-[0_-14px_36px_-14px_rgba(15,23,42,0.22)] ring-1 ring-black/5 md:flex">
                <div className="flex shrink-0 items-center justify-between gap-2 border-b border-border px-4 py-2.5">
                  <p className="truncate text-sm font-semibold text-primary">
                    {selectedBuilding?.name ?? "Building"}
                  </p>
                  <button
                    type="button"
                    onClick={() => setDetailMode(null)}
                    className="shrink-0 text-xs text-muted hover:text-foreground"
                  >
                    Close
                  </button>
                </div>
                <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-4">
                  <ExploreDetailPane
                    loading={selectedLoading}
                    detail={selectedDetail}
                    variant="compact"
                    onUnlockSuccess={() => void handleUnlockSuccess()}
                    onExpandToFull={handleExpandToFullDetails}
                  />
                </div>
              </div>
            ) : null}
          </aside>

          {mapVisible ? (
            <section className="relative hidden min-h-0 min-w-0 flex-1 md:block">
              <PlotPinMap {...mapProps} />
            </section>
          ) : (
            <section className="hidden min-h-0 flex-1 overflow-y-auto bg-background p-6 md:block">
              {showFullDetailPane ? (
                <ExploreDetailPane
                  loading={selectedLoading}
                  detail={selectedDetail}
                  variant="full"
                  onUnlockSuccess={() => void handleUnlockSuccess()}
                />
              ) : (
                <p className="text-muted">Select a building from the list.</p>
              )}
            </section>
          )}
        </div>
      </div>

      {showMobileSheet ? (
        <BuildingPreviewModal
          open
          buildingName={selectedBuilding?.name}
          loading={selectedLoading}
          detail={selectedDetail}
          onClose={closeMobileSheet}
          mode={detailMode === "summary" ? "summary" : "full"}
          onUnlockSuccess={() => void handleUnlockSuccess()}
          onExpandToFull={handleExpandToFullDetails}
        />
      ) : null}

      <UnlockedAccessModal
        open={accessModalBuildingId !== null && accessModalUnlocks.length > 0}
        unlocks={accessModalUnlocks}
        buildingName={accessModalBuilding?.name}
        onClose={closeAccessModal}
        onViewFullDetails={handleExpandToFullDetails}
      />
    </div>
  );
}
