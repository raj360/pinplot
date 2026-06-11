"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { PlotPinMap } from "@/components/maps/PlotPinMap";
import { BuildingPreviewModal } from "@/components/explore/BuildingPreviewModal";
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
import { Spinner } from "@/components/ui/spinner";
import {
  type BuildingDetail,
  type Bounds,
  KAMPALA_BOUNDS,
} from "@/lib/api/buildings";
import {
  boundsAround,
  isSupplyMarket,
  resolveSearchArea,
  supplyMarketsLabel,
} from "@/lib/filters/search-areas";
import { formatBuildingSummaryLine } from "@/lib/explore/building-summary-line";
import { EXPLORE_BUILDING_FOCUS_RADIUS_DEG, EXPLORE_NEAR_ME_RADIUS_DEG } from "@/lib/maps/config";
import {
  boundsForExploreSearch,
  canSearchMapViewport,
  mapBoundsEqual,
  mapViewportDiffersFromSearch,
  sanitizeMapBounds,
} from "@/lib/explore/map-bounds";
import {
  MAP_LIVE_SEARCH_DEBOUNCE_MS,
} from "@/lib/explore/live-search-preference";
import { geocodePlace } from "@/lib/maps/geocode-place";
import { useGeoPlaces } from "@/lib/hooks/use-geo-places";
import {
  loadRecentAreas,
  recordRecentArea,
  type RecentArea,
} from "@/lib/filters/recent-areas";
import { loadExploreBuildings } from "@/lib/explore/load-buildings";
import { useExploreGeolocation } from "@/lib/hooks/use-explore-geolocation";
import {
  clearBuildingCache,
  getCachedBuilding,
} from "@/lib/api/building-cache";
import { fetchMyUnlocks, type TenantUnlock } from "@/lib/api/unlocks";
import { useAuth } from "@/lib/auth/use-auth";
import type { BuildingSummary } from "@plotpin/shared-types";
import { useExplorePreview } from "./useExplorePreview";
import { useViewerContext } from "@/components/providers/ViewerContextProvider";
import { useIsMobile } from "@/lib/hooks/use-media-query";
import { ExploreSearchAlert } from "@/components/explore/ExploreSearchAlert";
import {
  classifyExploreLoadError,
  type ExploreLoadErrorKind,
} from "@/lib/api/http-errors";
import {
  buildExploreHref,
  buildExploreSelectionHref,
  exploreFiltersEqual,
  parseExploreFiltersFromSearchParams,
} from "@/lib/explore/explore-url-filters";

type DetailMode = "full" | "summary" | null;

type SearchAlert = {
  kind: ExploreLoadErrorKind;
  message: string;
} | null;

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

  const [mapVisible, setMapVisible] = useState(
    () => searchParams.get("map") !== "0",
  );
  const [detailMode, setDetailMode] = useState<DetailMode>(null);
  const [allBuildings, setAllBuildings] = useState<BuildingSummary[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(
    () => searchParams.get("building"),
  );
  const selectedIdRef = useRef<string | null>(selectedId);
  const [selectedDetail, setSelectedDetail] = useState<BuildingDetail | null>(null);
  const selectedDetailRef = useRef<BuildingDetail | null>(null);
  const [selectedLoading, setSelectedLoading] = useState(
    () =>
      Boolean(searchParams.get("building")) &&
      searchParams.get("map") === "0",
  );
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [searchAlert, setSearchAlert] = useState<SearchAlert>(null);
  const [filters, setFilters] = useState<ExploreSearchFilters>(urlFilters);
  const [appliedFilters, setAppliedFilters] =
    useState<ExploreSearchFilters>(urlFilters);
  const [mapFitToken, setMapFitToken] = useState(0);
  const [mapFocusBounds, setMapFocusBounds] = useState<Bounds | null>(null);
  const [whereSegmentLabel, setWhereSegmentLabel] = useState<string | null>(null);
  const [recentAreas, setRecentAreas] = useState<RecentArea[]>(loadRecentAreas);
  const [appliedMapBounds, setAppliedMapBounds] = useState<Bounds | null>(urlMapBounds);
  const [appliedSearchBounds, setAppliedSearchBounds] = useState<Bounds>(
    boundsForExploreSearch(urlFilters, urlMapBounds),
  );
  const listRef = useRef<HTMLUListElement>(null);
  const { isAuthenticated } = useAuth();
  const shouldAutoGeo = !urlMapBounds && !urlFilters.city;
  const geo = useExploreGeolocation({ autoRequest: shouldAutoGeo });
  const { getDefaultMapBounds, getDefaultMapCenter, countriesByCode, viewer, formatListingRentPerMonth } =
    useViewerContext();
  const { presets: geoPresets, loading: geoPlacesLoading } = useGeoPlaces(viewer.countryCode);
  const [unlockedLocations, setUnlockedLocations] = useState<
    Map<string, { lat: number; lng: number }>
  >(new Map());
  const [myUnlocks, setMyUnlocks] = useState<TenantUnlock[]>([]);
  const { hoveredId, setHover, loadSelectedDetail } = useExplorePreview();
  const isMobile = useIsMobile();
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
  // Live "search this area on pan" only applies once the user actually moves the
  // map. Until then every viewport change is the echo of one of our programmatic
  // fits (bootstrap / place jump / reset / select) and must never spawn a search.
  const userHasInteractedRef = useRef(false);

  const suppressMapInteraction = useCallback(() => {
    suppressMapInteractionUntilRef.current = Date.now() + 900;
    // A programmatic move takes over the view; require a fresh user gesture
    // before live "search this area" resumes. Makes the bootstrap/fit echo
    // impossible to misread as a pan, independent of timing.
    userHasInteractedRef.current = false;
  }, []);

  // dragstart / zoom_changed fire for BOTH user gestures and our programmatic
  // moves. Only count it as a real interaction when we're not inside a
  // suppression window (which we open around every programmatic fit/zoom).
  const handleUserMapInteraction = useCallback(() => {
    if (Date.now() >= suppressMapInteractionUntilRef.current) {
      userHasInteractedRef.current = true;
    }
  }, []);

  const syncSelectionToUrl = useCallback(
    (
      options: {
        buildingId?: string | null;
        hideMap?: boolean;
        history?: "push" | "replace";
      },
    ) => {
      skipUrlSyncRef.current = true;
      const href = buildExploreSelectionHref(pathname, appliedFiltersRef.current, {
        buildingId: options.buildingId,
        hideMap: options.hideMap,
        mapBounds: appliedMapBoundsRef.current,
        preserve: searchParams,
      });
      if (options.history === "replace") {
        router.replace(href, { scroll: false });
      } else {
        router.push(href, { scroll: false });
      }
    },
    [pathname, router, searchParams],
  );

  const executeSearchRef = useRef<
    (
      next: ExploreSearchFilters,
      options?: {
        syncUrl?: boolean;
        history?: "push" | "replace";
        mapBounds?: Bounds | null;
      },
    ) => Promise<BuildingSummary[] | null>
  >(() => Promise.resolve(null));
  const searchGenerationRef = useRef(0);
  const initialLoadGenerationRef = useRef(0);
  const mapSearchTimerRef = useRef<number | undefined>(undefined);
  const bootstrapTimerRef = useRef<number | undefined>(undefined);
  const bootstrapPendingRef = useRef(
    !urlMapBounds && !urlFilters.city,
  );
  const geoLocationRef = useRef(geo.location);
  const geoInUgandaRef = useRef(geo.inUganda);
  const geoLoadingRef = useRef(geo.loading);
  const geoPlacesLoadingRef = useRef(geoPlacesLoading);
  const getDefaultMapBoundsRef = useRef(getDefaultMapBounds);
  const getDefaultMapCenterRef = useRef(getDefaultMapCenter);
  const viewerCountryCodeRef = useRef(viewer.countryCode);
  const filtersRef = useRef(filters);

  useEffect(() => {
    geoPlacesLoadingRef.current = geoPlacesLoading;
  }, [geoPlacesLoading]);

  useEffect(() => {
    getDefaultMapBoundsRef.current = getDefaultMapBounds;
    getDefaultMapCenterRef.current = getDefaultMapCenter;
    viewerCountryCodeRef.current = viewer.countryCode;
  }, [getDefaultMapBounds, getDefaultMapCenter, viewer.countryCode]);

  const rememberArea = useCallback((value: string, label: string) => {
    setRecentAreas(recordRecentArea({ value, label }));
  }, []);

  useEffect(() => {
    selectedIdRef.current = selectedId;
  }, [selectedId]);

  useEffect(() => {
    geoLocationRef.current = geo.location;
    geoInUgandaRef.current = geo.inUganda;
    geoLoadingRef.current = geo.loading;
  }, [geo.inUganda, geo.loading, geo.location]);

  useEffect(() => {
    filtersRef.current = filters;
  }, [filters]);

  useEffect(
    () => () => {
      window.clearTimeout(mapSearchTimerRef.current);
      window.clearTimeout(bootstrapTimerRef.current);
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

  const unlockedBuildingIds = useMemo(
    () => new Set(visibleUnlockLocations.keys()),
    [visibleUnlockLocations],
  );

  const loadDetail = useCallback(
    async (id: string) => {
      setSelectedId(id);
      setHover(id);

      if (selectedDetailRef.current?.id === id) {
        setSelectedLoading(false);
        return;
      }

      const cached = getCachedBuilding(id, isAuthenticated);
      if (cached) {
        selectedDetailRef.current = cached;
        setSelectedDetail(cached);
        setSelectedLoading(false);
      } else {
        setSelectedLoading(true);
        setSelectedDetail(null);
        selectedDetailRef.current = null;
      }

      const detail = await loadSelectedDetail(id);
      if (detail) {
        selectedDetailRef.current = detail;
        setSelectedDetail(detail);
      }
      setSelectedLoading(false);
    },
    [isAuthenticated, loadSelectedDetail, setHover],
  );

  const scrollListToBuilding = useCallback((buildingId: string) => {
    if (isMobile) return;
    window.requestAnimationFrame(() => {
      const row = listRef.current?.querySelector(
        `[data-building-id="${buildingId}"]`,
      );
      row?.scrollIntoView({ block: "nearest", behavior: "smooth" });
    });
  }, [isMobile]);

  const focusBuildingOnMap = useCallback(
    (building: BuildingSummary) => {
      const exact = visibleUnlockLocations.get(building.id);
      const lat = exact?.lat ?? building.approximateLat;
      const lng = exact?.lng ?? building.approximateLng;
      suppressMapInteraction();
      setMapFocusBounds(boundsAround(lat, lng, EXPLORE_BUILDING_FOCUS_RADIUS_DEG));
      setMapFitToken((token) => token + 1);
    },
    [suppressMapInteraction, visibleUnlockLocations],
  );

  const selectBuildingOnMap = useCallback(
    (id: string) => {
      if (isMobile) return;

      selectedIdRef.current = id;
      setSelectedId(id);
      setHover(id);
      setDetailMode(null);
      scrollListToBuilding(id);
      syncSelectionToUrl({
        buildingId: id,
        hideMap: false,
        history: "replace",
      });
    },
    [isMobile, scrollListToBuilding, setHover, syncSelectionToUrl],
  );

  const applySearchResults = useCallback(
    (data: BuildingSummary[]) => {
      setAllBuildings(data);
      setHover(null);

      const pendingDeepLink = searchParams.get("building");

      if (data.length === 0) {
        setSelectedId(null);
        setSelectedDetail(null);
        selectedDetailRef.current = null;
        setSelectedLoading(false);
        setDetailMode(null);
        setMapVisible(true);
        return;
      }

      if (pendingDeepLink && !deepLinkHandled.current) {
        setDetailMode(null);
        if (searchParams.get("map") !== "0") {
          setMapVisible(true);
        }
        return;
      }

      setDetailMode(null);
      setMapVisible(true);

      // Selection is mirrored to the URL `building` param, so prefer it (then the
      // last in-memory selection) when still in results — this keeps the map
      // highlight deterministic and in sync with the address bar after pan/zoom.
      const prevSelected = selectedIdRef.current;
      const inData = (id: string | null | undefined): id is string =>
        Boolean(id) && data.some((b) => b.id === id);
      const resolvedId = inData(pendingDeepLink)
        ? pendingDeepLink
        : inData(prevSelected)
          ? prevSelected
          : data[0].id;
      selectedIdRef.current = resolvedId;
      setSelectedId(resolvedId);
      if (isMobile) {
        setDetailMode(null);
        setSelectedDetail(null);
        selectedDetailRef.current = null;
        setSelectedLoading(false);
      }
    },
    [isMobile, searchParams, setHover],
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
    async (buildings: BuildingSummary[]) => {
      if (deepLinkHandled.current) return;

      const buildingId = searchParams.get("building");
      if (!buildingId) return;

      let building = buildings.find((item) => item.id === buildingId);
      if (!building) {
        const detail = await loadSelectedDetail(buildingId);
        if (!detail) {
          // Detail fetch failed (transient network / cache miss / removed
          // listing). Clear the pending spinner so the panel never hangs.
          setSelectedLoading(false);
          setSelectedDetail(null);
          selectedDetailRef.current = null;
          return;
        }
        building = detail;
        setAllBuildings((prev) =>
          prev.some((item) => item.id === buildingId)
            ? prev
            : [detail, ...prev],
        );
      }

      deepLinkHandled.current = true;
      const hideMap = searchParams.get("map") === "0";

      focusBuildingOnMap(building);
      selectedIdRef.current = buildingId;
      setSelectedId(buildingId);
      setHover(buildingId);
      scrollListToBuilding(buildingId);

      if (isMobile) {
        setMapVisible(true);
        if (hideMap) {
          setDetailMode("full");
          void loadDetail(buildingId);
        } else {
          setDetailMode(null);
          setSelectedDetail(null);
          selectedDetailRef.current = null;
          setSelectedLoading(false);
        }
        return;
      }

      if (hideMap) {
        setDetailMode("full");
        setMapVisible(false);
        void loadDetail(buildingId);
        return;
      }

      setDetailMode(null);
      setMapVisible(true);
      setSelectedDetail(null);
      selectedDetailRef.current = null;
      setSelectedLoading(false);
    },
    [
      focusBuildingOnMap,
      isMobile,
      loadDetail,
      loadSelectedDetail,
      scrollListToBuilding,
      searchParams,
      setHover,
    ],
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
    let initialMapBounds = initialUrlMapBoundsRef.current;

    if (!initialMapBounds && initialFilters.city) {
      const preset = resolveSearchArea(initialFilters.city);
      if (preset) {
        initialMapBounds = preset.bounds;
      }
    }

    if (bootstrapPendingRef.current) {
      return () => {
        cancelled = true;
      };
    }

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
        if (initialMapBounds) {
          setMapFocusBounds(initialMapBounds);
        }
        setMapFitToken((token) => token + 1);
        consumeDeepLinkRef.current(data);
      })
      .catch((err) => {
        if (cancelled || generation !== initialLoadGenerationRef.current) return;
        setSearchAlert(classifyExploreLoadError(err));
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
    ): Promise<BuildingSummary[] | null> => {
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
      setSearchAlert(null);
      try {
        const data = await loadExploreBuildings(next, mapBounds);
        if (generation !== searchGenerationRef.current) return null;
        applySearchResults(data);
        if (generation !== searchGenerationRef.current) return null;

        setAppliedFilters(next);
        appliedFiltersRef.current = next;
        setAppliedMapBounds(useMapBounds ? mapBounds : null);
        appliedMapBoundsRef.current = useMapBounds ? mapBounds : null;
        setAppliedSearchBounds(searchBounds);
        appliedSearchBoundsRef.current = searchBounds;
        consumeDeepLink(data);

        if (!useMapBounds) {
          setMapFocusBounds(null);
          setMapFitToken((token) => token + 1);
        }

        if (syncUrl) {
          syncSearchToUrl(next, useMapBounds ? mapBounds : null, history);
        }
        return data;
      } catch (err) {
        if (generation !== searchGenerationRef.current) return null;
        if (syncUrl) {
          skipUrlSyncRef.current = false;
        }
        setSearchAlert(classifyExploreLoadError(err));
        return null;
      } finally {
        if (generation === searchGenerationRef.current) {
          setSearching(false);
        }
      }
    },
    [applySearchResults, consumeDeepLink, syncSearchToUrl],
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

  const runSearchMapArea = useCallback(
    async (bounds: Bounds, options?: { history?: "push" | "replace" }) => {
      const zoom = mapZoomRef.current;
      if (!canSearchMapViewport(zoom)) return;

      const next = { ...filtersRef.current, city: "" };
      setFilters(next);
      setWhereSegmentLabel("Map area");
      await executeSearch(next, {
        mapBounds: bounds,
        history: options?.history ?? "push",
      });
    },
    [executeSearch],
  );

  const runBootstrapSearch = useCallback(
    async (viewportBounds: Bounds) => {
      bootstrapPendingRef.current = false;
      window.clearTimeout(bootstrapTimerRef.current);

      const geoPoint = geoLocationRef.current;
      const countryBounds = getDefaultMapBoundsRef.current();
      const bounds = geoPoint
        ? boundsAround(geoPoint.lat, geoPoint.lng, EXPLORE_NEAR_ME_RADIUS_DEG)
        : (countryBounds ?? viewportBounds);

      suppressMapInteraction();
      setMapFocusBounds(bounds);
      setMapFitToken((token) => token + 1);

      const next = { ...EMPTY_EXPLORE_FILTERS, city: "" };
      setFilters(next);

      let segmentLabel = "Map area";
      if (geoPoint) {
        segmentLabel = "Near you";
      } else if (countryBounds) {
        const country = countriesByCode.get(viewerCountryCodeRef.current);
        segmentLabel = country ? `${country.name} area` : "Map area";
      }
      setWhereSegmentLabel(segmentLabel);

      // Default landing view: load + fit the map but keep the URL clean
      // (/explore). Writing the synthetic/aspect bounds here caused the
      // double history entry + SEO-hostile param churn on first load.
      await executeSearch(next, {
        mapBounds: bounds,
        history: "replace",
        syncUrl: false,
      });
      setLoading(false);
      initialLoadDone.current = true;
    },
    [countriesByCode, executeSearch, suppressMapInteraction],
  );

  // Safety net: the landing search is normally kicked off by the map's `idle`
  // event (handleViewportChange). When the map is hidden on load (deep link with
  // map=0), absent, or simply never emits idle, that event never fires and the
  // list, "All" counter, and any deep-linked detail spin forever. Run the same
  // bootstrap directly so loading always resolves regardless of the map.
  useEffect(() => {
    if (!bootstrapPendingRef.current) return;

    const fire = () => {
      if (!bootstrapPendingRef.current) return;
      const bounds =
        viewportBoundsRef.current ??
        getDefaultMapBoundsRef.current() ??
        appliedSearchBoundsRef.current;
      void runBootstrapSearch(bounds);
    };

    const waitMs =
      geoLoadingRef.current || geoPlacesLoadingRef.current ? 1800 : 700;
    const timer = window.setTimeout(fire, waitMs);
    return () => window.clearTimeout(timer);
  }, [runBootstrapSearch]);

  const handlePlaceJump = useCallback(
    async (query: string) => {
      const trimmed = query.trim();
      if (!trimmed) return;

      const preset = resolveSearchArea(trimmed);
      if (preset) {
        suppressMapInteraction();
        setMapFocusBounds(preset.bounds);
        setMapFitToken((token) => token + 1);
        setWhereSegmentLabel(preset.label);
        const next = { ...filtersRef.current, city: preset.value };
        setFilters(next);
        rememberArea(preset.value, preset.label);
        await executeSearch(next, { mapBounds: preset.bounds });
        return;
      }

      setSearching(true);
      setSearchAlert(null);
      try {
        const viewerCode = viewerCountryCodeRef.current;
        const region = isSupplyMarket(viewerCode)
          ? { countryCode: "UG", countryName: "Uganda" }
          : {
              countryCode: viewerCode,
              countryName: countriesByCode.get(viewerCode)?.name,
            };
        const regionLabel = region.countryName ?? supplyMarketsLabel();
        const result = await geocodePlace(trimmed, region);
        if (!result) {
          setSearchAlert({
            kind: "generic",
            message: `Could not find “${trimmed}” in ${regionLabel}. Try a nearby city.`,
          });
          return;
        }

        suppressMapInteraction();
        setMapFocusBounds(result.bounds);
        setMapFitToken((token) => token + 1);
        setWhereSegmentLabel(result.label);
        const next = { ...filtersRef.current, city: result.label };
        setFilters(next);
        rememberArea(result.label, result.label);
        await executeSearch(next, { mapBounds: result.bounds });
      } catch {
        setSearchAlert({
          kind: "generic",
          message: "Place search failed. Check your connection and try again.",
        });
      } finally {
        setSearching(false);
      }
    },
    [countriesByCode, executeSearch, rememberArea, suppressMapInteraction],
  );

  const handleNearMe = useCallback(async () => {
    setSearchAlert(null);
    const { location: point, error: geoError } = await geo.requestLocation({
      highAccuracy: true,
    });

    if (!point) {
      setSearchAlert({
        kind: "generic",
        message: geoError ?? "Could not get your location.",
      });
      return;
    }

    const bounds = boundsAround(point.lat, point.lng, EXPLORE_NEAR_ME_RADIUS_DEG);
    suppressMapInteraction();
    setMapFocusBounds(bounds);
    setMapFitToken((token) => token + 1);
    setWhereSegmentLabel("Near you");

    const next = { ...filtersRef.current, city: "Near you" };
    setFilters(next);
    const data = await executeSearch(next, { mapBounds: bounds });
    if (data && data.length === 0) {
      setSearchAlert({
        kind: "generic",
        message:
          "No listings near you yet. Pan the map or try another area — filters still apply.",
      });
    }
  }, [executeSearch, geo, suppressMapInteraction]);

  const focusViewerBrowseArea = useCallback(
    async (
      next: ExploreSearchFilters,
      options?: { history?: "push" | "replace"; segmentLabel?: string | null },
    ) => {
      const code = viewerCountryCodeRef.current;
      if (!isSupplyMarket(code)) {
        const bounds = getDefaultMapBoundsRef.current();
        if (bounds) {
          suppressMapInteraction();
          setMapFocusBounds(bounds);
          setMapFitToken((token) => token + 1);
          if (options?.segmentLabel !== undefined) {
            setWhereSegmentLabel(options.segmentLabel);
          } else {
            const country = countriesByCode.get(code);
            setWhereSegmentLabel(country ? `${country.name} area` : "Map area");
          }
          return executeSearch(next, {
            mapBounds: bounds,
            history: options?.history ?? "replace",
          });
        }
      }

      setMapFocusBounds(null);
      setMapFitToken((token) => token + 1);
      if (options?.segmentLabel !== undefined) {
        setWhereSegmentLabel(options.segmentLabel);
      }
      return executeSearch(next, {
        mapBounds: null,
        history: options?.history ?? "replace",
      });
    },
    [countriesByCode, executeSearch, suppressMapInteraction],
  );

  const removeMapBounds = useCallback(async () => {
    const next = { ...appliedFilters, city: "" };
    setFilters(next);
    await focusViewerBrowseArea(next, {
      history: "replace",
      segmentLabel: null,
    });
  }, [appliedFilters, focusViewerBrowseArea]);

  const removeAppliedFilter = useCallback(
    async (key: keyof ExploreSearchFilters) => {
      const next = { ...appliedFilters, [key]: "" };
      setFilters(next);
      await executeSearch(next, { mapBounds: appliedMapBoundsRef.current });
    },
    [appliedFilters, executeSearch],
  );

  const retryLastSearch = useCallback(() => {
    void executeSearch(appliedFilters, {
      mapBounds: appliedMapBounds,
      syncUrl: false,
      history: "replace",
    });
  }, [appliedFilters, appliedMapBounds, executeSearch]);

  const runReset = useCallback(async () => {
    geo.clearLocation();
    setFilters(EMPTY_EXPLORE_FILTERS);
    await focusViewerBrowseArea(EMPTY_EXPLORE_FILTERS, {
      history: "replace",
      segmentLabel: null,
    });
  }, [focusViewerBrowseArea, geo]);

  const handleBrowseSupply = useCallback(async () => {
    const ugBounds = countriesByCode.get("UG")?.mapBounds;
    const bounds: Bounds = ugBounds
      ? {
          north: ugBounds.north,
          south: ugBounds.south,
          east: ugBounds.east,
          west: ugBounds.west,
        }
      : KAMPALA_BOUNDS;
    suppressMapInteraction();
    setMapFocusBounds(bounds);
    setMapFitToken((token) => token + 1);
    setWhereSegmentLabel("Uganda area");

    const next = { ...EMPTY_EXPLORE_FILTERS, city: "" };
    setFilters(next);
    await executeSearch(next, {
      mapBounds: bounds,
      history: "replace",
    });
  }, [countriesByCode, executeSearch, suppressMapInteraction]);

  const handleFiltersApply = useCallback((next: ExploreSearchFilters) => {
    setFilters(next);
    void executeSearchRef.current(next, {
      mapBounds: appliedMapBoundsRef.current,
    });
  }, []);

  const handleListSelect = useCallback(
    (id: string) => {
      if (isMobile) {
        setDetailMode("full");
        syncSelectionToUrl({ buildingId: id, hideMap: false, history: "push" });
        void loadDetail(id);
        return;
      }

      // Drop map hover so a remounted map does not reopen a tooltip that was
      // clamped before markers finished projecting onto the canvas.
      setHover(null);
      setDetailMode("full");
      setMapVisible(false);
      syncSelectionToUrl({ buildingId: id, hideMap: true, history: "push" });
      void loadDetail(id);
    },
    [isMobile, loadDetail, setHover, syncSelectionToUrl],
  );

  const handleMapSelect = useCallback(
    (id: string) => {
      if (isMobile) {
        selectedIdRef.current = id;
        setSelectedId(id);
        setHover(id);
        setDetailMode(null);
        syncSelectionToUrl({
          buildingId: id,
          hideMap: false,
          history: "replace",
        });
        return;
      }
      selectBuildingOnMap(id);
    },
    [isMobile, selectBuildingOnMap, setHover, syncSelectionToUrl],
  );

  const handleExpandToFullDetails = useCallback(() => {
    if (isMobile) {
      setDetailMode("full");
      if (selectedId) {
        syncSelectionToUrl({
          buildingId: selectedId,
          hideMap: false,
          history: "replace",
        });
        void loadDetail(selectedId);
      }
      return;
    }

    setDetailMode("full");
    setMapVisible(false);
    if (selectedId) {
      syncSelectionToUrl({
        buildingId: selectedId,
        hideMap: true,
        history: "push",
      });
      void loadDetail(selectedId);
    }
  }, [isMobile, loadDetail, selectedId, syncSelectionToUrl]);

  useEffect(() => {
    if (!mapVisible) {
      setHover(null);
    }
  }, [mapVisible, setHover]);

  const handleToggleMap = useCallback(() => {
    const willShowMap = !mapVisible;
    setMapVisible(willShowMap);

    if (willShowMap) {
      setDetailMode(null);
      if (selectedId) {
        syncSelectionToUrl({
          buildingId: selectedId,
          hideMap: false,
          history: "replace",
        });
      }
      return;
    }

    if (selectedId) {
      setDetailMode("full");
      setSelectedLoading(true);
      syncSelectionToUrl({
        buildingId: selectedId,
        hideMap: true,
        history: "push",
      });
      void loadDetail(selectedId);
    }
  }, [loadDetail, mapVisible, selectedId, syncSelectionToUrl]);

  const closeMobileSheet = useCallback(() => {
    setDetailMode(null);
    syncSelectionToUrl({ buildingId: null, hideMap: false, history: "replace" });
  }, [syncSelectionToUrl]);

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
      summaryLine: formatBuildingSummaryLine(
        building,
        formatListingRentPerMonth,
      ),
    };
  }, [allBuildings, formatListingRentPerMonth, hoveredId]);

  const listLoading = loading || searching;

  const handleViewportChange = useCallback(
    (viewport: { bounds: Bounds; zoom: number }) => {
      viewportBoundsRef.current = viewport.bounds;
      mapZoomRef.current = viewport.zoom;

      window.clearTimeout(mapSearchTimerRef.current);
      window.clearTimeout(bootstrapTimerRef.current);

      if (bootstrapPendingRef.current) {
        const waitForGeo =
          geoLoadingRef.current || geoPlacesLoadingRef.current ? 1500 : 300;
        bootstrapTimerRef.current = window.setTimeout(() => {
          void runBootstrapSearch(viewport.bounds);
        }, waitForGeo);
        return;
      }

      // Programmatic fits (and their aspect-corrected echoes) must not trigger a
      // search or URL change. Adopt the resulting viewport as the search baseline
      // instead, so a later genuine pan is measured against what's on screen.
      if (
        !userHasInteractedRef.current ||
        Date.now() < suppressMapInteractionUntilRef.current
      ) {
        appliedSearchBoundsRef.current = viewport.bounds;
        setAppliedSearchBounds(viewport.bounds);
        return;
      }

      if (!canSearchMapViewport(viewport.zoom)) return;
      if (
        !mapViewportDiffersFromSearch(
          viewport.bounds,
          appliedSearchBoundsRef.current,
        )
      ) {
        return;
      }

      mapSearchTimerRef.current = window.setTimeout(() => {
        const bounds = viewportBoundsRef.current;
        const zoom = mapZoomRef.current;
        if (!bounds || !canSearchMapViewport(zoom)) return;
        if (
          !mapViewportDiffersFromSearch(
            bounds,
            appliedSearchBoundsRef.current,
          )
        ) {
          return;
        }
        void runSearchMapArea(bounds);
      }, MAP_LIVE_SEARCH_DEBOUNCE_MS);
    },
    [runBootstrapSearch, runSearchMapArea],
  );

  const mapProps = {
    buildings: allBuildings,
    selectedId,
    hoverPreview,
    unlockedBuildingIds,
    unlockedLocations: visibleUnlockLocations,
    onSelect: handleMapSelect,
    onHoverOpenDetail: handleListSelect,
    // Map hover tooltip is handled directly in the DOM (see PlotPinMap) to keep
    // it instant; we intentionally do not round-trip hover through React state.
    onHover: undefined,
    persistSelectedTooltip: isMobile,
    gestureHandling: "greedy" as const,
    fitBoundsToken: mapFitToken,
    focusBounds: mapFocusBounds,
    defaultCenter: getDefaultMapCenter(),
    emptyMapCenter: getDefaultMapCenter(),
    onViewportChange: handleViewportChange,
    onUserMapInteraction: handleUserMapInteraction,
    onProgrammaticMapMove: suppressMapInteraction,
    interactionBlocked: loading || searching,
  };

  const showMobileSheet = Boolean(selectedId) && isMobile && detailMode !== null;
  const showFullDetailPane =
    !isMobile && !mapVisible && Boolean(selectedId);

  return (
    <div className="flex min-h-screen flex-col bg-background md:h-screen md:overflow-hidden">
      <div className="site-chrome sticky top-0 z-40 shrink-0 rounded-none bg-background shadow-card">
        <AppHeader variant="wide" />

        <ContentBand width="wide" className="bg-panel" innerClassName="py-0.5 sm:py-1">
          <ExploreFilters
            filters={filters}
            appliedFilters={appliedFilters}
            appliedMapBounds={appliedMapBounds}
            whereDisplayOverride={
              whereSegmentLabel ??
              (appliedMapBounds && !filters.city ? "Map area" : undefined)
            }
            onApplyFilters={handleFiltersApply}
            onPlaceJump={(place) => void handlePlaceJump(place)}
            onNearMe={() => void handleNearMe()}
            onReset={() => void runReset()}
            onRemoveAppliedFilter={(key) => void removeAppliedFilter(key)}
            onRemoveMapBounds={() => void removeMapBounds()}
            searching={searching}
            filterLoading={searching && !loading}
            mapVisible={mapVisible}
            mapToggleBusy={
              isMobile && selectedLoading && detailMode === "full" && !mapVisible
            }
            onToggleMap={handleToggleMap}
            resultCount={allBuildings.length}
            userLocation={geo.location}
            inUganda={geo.inUganda}
            locationLoading={geo.loading}
            recentAreas={recentAreas}
            geoPresets={geoPresets}
          />
        </ContentBand>
      </div>

      {searchAlert && (
        <div className={cn(contentBandInnerClass("wide"), "shrink-0")}>
          <ExploreSearchAlert
            kind={searchAlert.kind}
            message={searchAlert.message}
            onRetry={
              searchAlert.kind === "rate_limit" || searchAlert.kind === "server"
                ? retryLastSearch
                : undefined
            }
            retrying={searching}
          />
        </div>
      )}

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
            <section className="explore-mobile-map relative h-[38vh] min-h-48 max-h-[68vh] shrink-0 overflow-visible border-b border-border md:hidden">
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
              onRemoveFilter={(key) => void removeAppliedFilter(key)}
              onRemoveMapBounds={() => void removeMapBounds()}
              onReset={() => void runReset()}
              onBrowseSupply={() => void handleBrowseSupply()}
            />

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
    </div>
  );
}
