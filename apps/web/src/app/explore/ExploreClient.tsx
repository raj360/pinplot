"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { PlotPinMap } from "@/components/maps/PlotPinMap";
import { BuildingDetailPanel } from "@/components/buildings/BuildingDetailPanel";
import { BuildingPreviewModal } from "@/components/explore/BuildingPreviewModal";
import { UnlockedAccessModal } from "@/components/buildings/UnlockedAccessModal";
import {
  ExploreFilters,
  EMPTY_EXPLORE_FILTERS,
  type ExploreSearchFilters,
} from "@/components/explore/ExploreFilters";
import { AppHeader } from "@/components/layout/AppHeader";
import { ContentBand } from "@/components/layout/PageShell";
import { layoutMaxClass, LAYOUT, contentBandInnerClass } from "@/lib/layout/shell";
import { cn } from "@/lib/utils/cn";
import { LoadingState } from "@/components/ui/loading-state";
import { Spinner } from "@/components/ui/spinner";
import {
  fetchBuildingsInBounds,
  KAMPALA_BOUNDS,
  type BuildingDetail,
} from "@/lib/api/buildings";
import { parseRentRange, rentRangeLabel } from "@/lib/filters/rent-ranges";
import { formatRentPerMonth } from "@/lib/intl/format";
import { fetchMyUnlocks, type TenantUnlock } from "@/lib/api/unlocks";
import { hasAccessOnly } from "@/lib/unlocks/display";
import { useAuth } from "@/lib/auth/use-auth";
import type { BuildingSummary } from "@plotpin/shared-types";
import { useExplorePreview } from "./useExplorePreview";
import { useIsMobile } from "@/lib/hooks/use-media-query";

function parseMinFilter(value: string) {
  if (!value) return undefined;
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? n : undefined;
}

async function loadBuildings(filters: ExploreSearchFilters) {
  const { minRent, maxRent } = parseRentRange(filters.priceRange);
  return fetchBuildingsInBounds(KAMPALA_BOUNDS, {
    city: filters.city || undefined,
    bedrooms: parseMinFilter(filters.bedrooms),
    bathrooms: parseMinFilter(filters.bathrooms),
    minRent,
    maxRent,
  });
}

function BuildingDetailSection({
  loading,
  detail,
  compact = false,
}: {
  loading: boolean;
  detail: BuildingDetail | null;
  compact?: boolean;
}) {
  if (loading) {
    return <LoadingState label="Loading building" compact={compact} />;
  }
  if (detail) {
    return <BuildingDetailPanel building={detail} compact={compact} />;
  }
  return <p className="text-sm text-muted">Could not load building details.</p>;
}

export function ExploreClient() {
  const [mapVisible, setMapVisible] = useState(true);
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
  const [filters, setFilters] = useState<ExploreSearchFilters>(EMPTY_EXPLORE_FILTERS);
  const [appliedFilters, setAppliedFilters] =
    useState<ExploreSearchFilters>(EMPTY_EXPLORE_FILTERS);
  const [mapFitToken, setMapFitToken] = useState(0);
  const listRef = useRef<HTMLUListElement>(null);
  const { isAuthenticated } = useAuth();
  const [unlockedLocations, setUnlockedLocations] = useState<
    Map<string, { lat: number; lng: number }>
  >(new Map());
  const [myUnlocks, setMyUnlocks] = useState<TenantUnlock[]>([]);
  const { hoveredId, setHover, loadSelectedDetail } = useExplorePreview();
  const isMobile = useIsMobile();

  const unlocksByBuilding = useMemo(() => {
    const map = new Map<string, TenantUnlock[]>();
    for (const unlock of myUnlocks) {
      const existing = map.get(unlock.buildingId) ?? [];
      existing.push(unlock);
      map.set(unlock.buildingId, existing);
    }
    return map;
  }, [myUnlocks]);

  const unlockedBuildingIds = useMemo(
    () => new Set(unlockedLocations.keys()),
    [unlockedLocations],
  );

  const applySearchResults = useCallback((data: BuildingSummary[]) => {
    setAllBuildings(data);
    setSelectedId(null);
    setSelectedDetail(null);
    setSelectedLoading(false);
    setHover(null);
  }, [setHover]);

  const refreshBuildings = useCallback(async (searchFilters: ExploreSearchFilters) => {
    const data = await loadBuildings(searchFilters);
    setAllBuildings(data);
    setSelectedId((prev) => (prev && data.some((b) => b.id === prev) ? prev : null));
  }, []);

  useEffect(() => {
    if (!isAuthenticated) {
      setUnlockedLocations(new Map());
      setMyUnlocks([]);
      return;
    }

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
    if (!isAuthenticated || unlockedLocations.size === 0) return;

    refreshBuildings(appliedFilters).catch(() => {
      /* keep current list if refresh fails */
    });
  }, [isAuthenticated, unlockedLocations, appliedFilters, refreshBuildings]);

  useEffect(() => {
    let cancelled = false;

    loadBuildings(EMPTY_EXPLORE_FILTERS)
      .then((data) => {
        if (!cancelled) {
          applySearchResults(data);
          setMapFitToken((token) => token + 1);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setError("Could not load buildings. Is the API running?");
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [applySearchResults]);

  const runSearch = useCallback(async () => {
    setSearching(true);
    setError(null);
    try {
      const next = { ...filters };
      applySearchResults(await loadBuildings(next));
      setAppliedFilters(next);
      setMapFitToken((token) => token + 1);
    } catch {
      setError("Could not load buildings. Is the API running?");
    } finally {
      setSearching(false);
    }
  }, [applySearchResults, filters]);

  const runReset = useCallback(async () => {
    setFilters(EMPTY_EXPLORE_FILTERS);
    setSearching(true);
    setError(null);
    try {
      applySearchResults(await loadBuildings(EMPTY_EXPLORE_FILTERS));
      setAppliedFilters(EMPTY_EXPLORE_FILTERS);
      setMapFitToken((token) => token + 1);
    } catch {
      setError("Could not load buildings. Is the API running?");
    } finally {
      setSearching(false);
    }
  }, [applySearchResults]);

  const handleSelect = useCallback(
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

  const closeDetailPreview = useCallback(() => {
    setSelectedId(null);
    setSelectedDetail(null);
    setSelectedLoading(false);
  }, []);

  const openAccessModal = useCallback((buildingId: string) => {
    setAccessModalBuildingId(buildingId);
  }, []);

  const closeAccessModal = useCallback(() => {
    setAccessModalBuildingId(null);
  }, []);

  const handleListSelect = useCallback(
    (id: string) => {
      const summary = allBuildings.find((building) => building.id === id);
      if (summary && hasAccessOnly(summary)) {
        openAccessModal(id);
        return;
      }
      void handleSelect(id);
    },
    [allBuildings, handleSelect, openAccessModal],
  );

  const handleMapSelect = useCallback(
    (id: string) => {
      void handleSelect(id);
    },
    [handleSelect],
  );

  const handleMapAccessOpen = useCallback(
    (id: string) => {
      if ((unlocksByBuilding.get(id)?.length ?? 0) > 0) {
        openAccessModal(id);
      }
    },
    [openAccessModal, unlocksByBuilding],
  );

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

  const activeFilterHint = useMemo(() => {
    const parts: string[] = [];
    if (appliedFilters.city) parts.push(appliedFilters.city);
    const priceLabel = rentRangeLabel(appliedFilters.priceRange);
    if (priceLabel) parts.push(priceLabel);
    if (appliedFilters.bedrooms) {
      parts.push(`${appliedFilters.bedrooms}+ bedroom`);
    }
    if (appliedFilters.bathrooms) {
      parts.push(`${appliedFilters.bathrooms}+ bathroom`);
    }
    return parts.length ? parts.join(" · ") : null;
  }, [appliedFilters]);

  const mapProps = {
    buildings: allBuildings,
    selectedId,
    hoveredId,
    hoverPreview,
    unlockedBuildingIds,
    unlockedLocations,
    onSelect: handleMapSelect,
    onAccessOpen: handleMapAccessOpen,
    onHover: setHover,
    gestureHandling: isMobile ? ("none" as const) : ("greedy" as const),
    fitBoundsToken: mapFitToken,
  };

  const showMobileSheet = Boolean(selectedId) && isMobile;
  const showDesktopListSummary =
    Boolean(selectedId) && !isMobile && mapVisible;
  const showDesktopMapPaneSummary =
    Boolean(selectedId) && !isMobile && !mapVisible;

  return (
    <div className="flex min-h-screen flex-col bg-background md:h-screen md:overflow-hidden">
      <AppHeader variant="wide" />

      <ContentBand width="wide" className="shrink-0 bg-[#eef2f6]" innerClassName="py-2">
        <ExploreFilters
          filters={filters}
          onChange={setFilters}
          onSearch={() => void runSearch()}
          onReset={() => void runReset()}
          searching={searching}
          mapVisible={mapVisible}
          onToggleMap={() => setMapVisible((v) => !v)}
        />
      </ContentBand>

      {error && (
        <div className={cn(contentBandInnerClass("wide"), "shrink-0")}>
          <p className="bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Mobile: natural page scroll. Desktop: fixed split pane with list scroll. */}
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
              "flex flex-col bg-surface md:min-h-0 md:shrink-0 md:overflow-hidden md:border-r md:border-border",
              mapVisible ? "w-full md:w-[22rem] md:max-w-md" : "w-full md:w-[26rem] md:max-w-lg",
            )}
          >
            <div className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-b border-border bg-background px-3 py-2 text-sm sm:px-4 sm:py-2.5">
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
              {activeFilterHint ? (
                <span className="max-w-[55%] truncate text-xs text-muted">
                  {activeFilterHint}
                </span>
              ) : null}
            </div>

            <ul
              ref={listRef}
              className={cn(
                "explore-results-list touch-pan-y",
                "md:min-h-0 md:flex-1 md:overflow-y-auto md:overscroll-contain",
                searching && "opacity-60",
              )}
            >
              {listLoading && allBuildings.length === 0 ? (
                <li className="px-4 py-8">
                  <LoadingState label="Loading buildings" compact />
                </li>
              ) : null}
              {listLoading && allBuildings.length > 0 ? (
                <li className="flex items-center gap-2 border-b border-border bg-background px-3 py-2 text-xs text-muted sm:px-4">
                  <Spinner className="size-3" label="Updating results" />
                  Updating results…
                </li>
              ) : null}
              {allBuildings.map((building) => {
                const active = selectedId === building.id;
                const hovered = hoveredId === building.id;
                const unlocked = (building.myUnlockCount ?? 0) > 0;
                const accessOnly = hasAccessOnly(building);

                return (
                  <li key={building.id}>
                    <div
                      data-building-id={building.id}
                      className={cn(
                        "flex items-stretch border-b border-border transition-colors",
                        active &&
                          (unlocked
                            ? "border-l-[3px] border-l-lime-600 bg-lime-50/70"
                            : "border-l-[3px] border-l-primary bg-primary/5"),
                        !active &&
                          hovered &&
                          (unlocked
                            ? "border-l-[3px] border-l-lime-600/50 bg-lime-50/40"
                            : "border-l-[3px] border-l-primary/40 bg-primary/5"),
                        !active && !hovered && "hover:bg-background/70",
                      )}
                    >
                      <button
                        type="button"
                        onClick={() => handleListSelect(building.id)}
                        className="min-w-0 flex-1 px-3 py-3 text-left sm:px-4 sm:py-3"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <p
                            className={cn(
                              "text-[15px] font-semibold leading-snug sm:text-base",
                              unlocked ? "text-lime-800" : "text-primary",
                            )}
                          >
                            {building.name}
                          </p>
                          {active && selectedLoading ? (
                            <Spinner
                              className="mt-1 size-3 shrink-0"
                              label="Loading building"
                            />
                          ) : null}
                        </div>
                        <p className="mt-0.5 text-sm text-foreground/80">
                          {[building.district, building.city]
                            .filter(Boolean)
                            .join(", ")}
                        </p>
                        <p className="mt-1 text-xs text-muted">
                          {building.availableUnitCount > 0 ? (
                            <>
                              {building.availableUnitCount} available · from{" "}
                              <span className="font-medium text-foreground/90">
                                {formatRentPerMonth(building.rentFrom)}
                              </span>
                            </>
                          ) : unlocked ? (
                            <span className="font-medium text-lime-700">
                              Your access · tap to open
                            </span>
                          ) : (
                            <>No units available</>
                          )}
                        </p>
                      </button>
                      {unlocked && !accessOnly ? (
                        <button
                          type="button"
                          onClick={() => openAccessModal(building.id)}
                          className="shrink-0 self-center border-l border-border/70 px-3 py-2 text-[11px] font-medium text-lime-700 underline decoration-lime-600/40 underline-offset-2 hover:bg-lime-50/80 hover:text-lime-800"
                        >
                          Your access
                        </button>
                      ) : null}
                    </div>
                  </li>
                );
              })}
              {!listLoading && allBuildings.length === 0 && (
                <li className="px-4 py-10 text-center text-sm text-muted">
                  No available units match your search. Try fewer filters or another
                  area.
                </li>
              )}
            </ul>

            {showDesktopListSummary ? (
              <div className="explore-desktop-summary relative z-10 hidden max-h-[min(42vh,360px)] shrink-0 overflow-y-auto border-t-2 border-border bg-surface p-4 shadow-[0_-14px_36px_-14px_rgba(15,23,42,0.22)] ring-1 ring-black/5 md:block">
                <div className="mb-2 flex items-center justify-between gap-2">
                  <p className="text-sm font-semibold text-primary">
                    {selectedBuilding?.name ?? "Building"}
                  </p>
                  <button
                    type="button"
                    onClick={closeDetailPreview}
                    className="text-xs text-muted hover:text-foreground"
                  >
                    Close
                  </button>
                </div>
                <BuildingDetailSection
                  loading={selectedLoading}
                  detail={selectedDetail}
                  compact
                />
              </div>
            ) : null}
          </aside>

          {mapVisible ? (
            <section className="relative hidden min-h-0 min-w-0 flex-1 md:block">
              <PlotPinMap {...mapProps} />
            </section>
          ) : (
            <section className="hidden min-h-0 flex-1 overflow-y-auto bg-background p-6 md:block">
              {!showDesktopMapPaneSummary ? (
                <p className="text-muted">
                  Select a building from the list.
                </p>
              ) : (
                <BuildingDetailSection
                  loading={selectedLoading}
                  detail={selectedDetail}
                />
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
          onClose={closeDetailPreview}
          variant="mobile"
        />
      ) : null}

      <UnlockedAccessModal
        open={accessModalBuildingId !== null && accessModalUnlocks.length > 0}
        unlocks={accessModalUnlocks}
        buildingName={accessModalBuilding?.name}
        onClose={closeAccessModal}
      />
    </div>
  );
}
