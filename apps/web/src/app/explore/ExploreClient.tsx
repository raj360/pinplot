"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { PlotPinMap } from "@/components/maps/PlotPinMap";
import { BuildingDetailPanel } from "@/components/buildings/BuildingDetailPanel";
import { UnlockedAccessModal } from "@/components/buildings/UnlockedAccessModal";
import { AppHeader } from "@/components/layout/AppHeader";
import { ContentBand } from "@/components/layout/PageShell";
import { layoutMaxClass, LAYOUT, contentBandInnerClass } from "@/lib/layout/shell";
import { cn } from "@/lib/utils/cn";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LoadingState } from "@/components/ui/loading-state";
import { Spinner } from "@/components/ui/spinner";
import {
  fetchBuildingsInBounds,
  KAMPALA_BOUNDS,
  type BuildingDetail,
} from "@/lib/api/buildings";
import { formatRentPerMonth } from "@/lib/intl/format";
import { fetchMyUnlocks, type TenantUnlock } from "@/lib/api/unlocks";
import { hasAccessOnly } from "@/lib/unlocks/display";
import { useAuth } from "@/lib/auth/use-auth";
import type { BuildingSummary } from "@plotpin/shared-types";
import { useExplorePreview } from "./useExplorePreview";

type SearchFilters = {
  city: string;
  bedrooms: string;
  bathrooms: string;
};

const EMPTY_FILTERS: SearchFilters = {
  city: "",
  bedrooms: "",
  bathrooms: "",
};

function parseMinFilter(value: string) {
  if (!value) return undefined;
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? n : undefined;
}

async function loadBuildings(filters: SearchFilters) {
  return fetchBuildingsInBounds(KAMPALA_BOUNDS, {
    city: filters.city || undefined,
    bedrooms: parseMinFilter(filters.bedrooms),
    bathrooms: parseMinFilter(filters.bathrooms),
  });
}

function FilterSelect({
  label,
  value,
  onChange,
  options,
  className,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
  className?: string;
}) {
  const id = label.toLowerCase().replace(/\s+/g, "-");
  return (
    <label htmlFor={id} className={cn("block text-sm", className)}>
      <span className="text-foreground">{label}</span>
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full border border-border bg-surface px-3 py-2 text-sm text-foreground"
      >
        {options.map((opt) => (
          <option key={opt.value || "any"} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </label>
  );
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
  const [filters, setFilters] = useState<SearchFilters>(EMPTY_FILTERS);
  const [appliedFilters, setAppliedFilters] = useState<SearchFilters>(EMPTY_FILTERS);
  const listRef = useRef<HTMLUListElement>(null);
  const { isAuthenticated } = useAuth();
  const [unlockedLocations, setUnlockedLocations] = useState<
    Map<string, { lat: number; lng: number }>
  >(new Map());
  const [myUnlocks, setMyUnlocks] = useState<TenantUnlock[]>([]);
  const { hoveredId, preview, setHover, loadSelectedDetail } = useExplorePreview();

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

  const refreshBuildings = useCallback(async (searchFilters: SearchFilters) => {
    const data = await loadBuildings(searchFilters);
    setAllBuildings(data);
    setSelectedId((prev) => {
      if (prev && data.some((b) => b.id === prev)) return prev;
      return data[0]?.id ?? null;
    });
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

    loadBuildings(EMPTY_FILTERS)
      .then((data) => {
        if (!cancelled) applySearchResults(data);
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
    } catch {
      setError("Could not load buildings. Is the API running?");
    } finally {
      setSearching(false);
    }
  }, [applySearchResults, filters]);

  const handleSelect = useCallback(
    async (id: string) => {
      setSelectedId(id);
      setHover(id);

      if (preview.id === id && preview.detail) {
        setSelectedDetail(preview.detail);
        setSelectedLoading(false);
        return;
      }

      setSelectedLoading(true);
      const detail = await loadSelectedDetail(id);
      setSelectedDetail(detail);
      setSelectedLoading(false);
    },
    [loadSelectedDetail, preview.detail, preview.id, setHover],
  );

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

  useEffect(() => {
    if (!hoveredId || !listRef.current) return;
    const row = listRef.current.querySelector(`[data-building-id="${hoveredId}"]`);
    row?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [hoveredId]);

  const activePanelId = selectedId ?? preview.id;
  const panelDetail =
    selectedId && selectedDetail
      ? selectedDetail
      : preview.id && preview.detail
        ? preview.detail
        : null;
  const panelLoading = selectedId
    ? selectedLoading
    : Boolean(preview.id && preview.loading);

  const hoverPreview = useMemo(() => {
    if (!hoveredId) return null;
    const building = allBuildings.find((b) => b.id === hoveredId);
    if (!building) return null;
    return {
      id: hoveredId,
      name: building.name,
      loading: preview.id === hoveredId && preview.loading,
    };
  }, [allBuildings, hoveredId, preview.id, preview.loading]);

  const listLoading = loading || searching;

  const bedroomOptions = useMemo(
    () => [
      { value: "", label: "Any bedrooms" },
      { value: "1", label: "1+ bed" },
      { value: "2", label: "2+ beds" },
      { value: "3", label: "3+ beds" },
      { value: "4", label: "4+ beds" },
    ],
    [],
  );

  const bathroomOptions = useMemo(
    () => [
      { value: "", label: "Any bathrooms" },
      { value: "1", label: "1+ bath" },
      { value: "2", label: "2+ baths" },
      { value: "3", label: "3+ baths" },
    ],
    [],
  );

  const activeFilterHint = useMemo(() => {
    const parts: string[] = [];
    if (appliedFilters.city) parts.push(appliedFilters.city);
    if (appliedFilters.bedrooms) parts.push(`${appliedFilters.bedrooms}+ bed`);
    if (appliedFilters.bathrooms) parts.push(`${appliedFilters.bathrooms}+ bath`);
    return parts.length ? parts.join(" · ") : null;
  }, [appliedFilters]);

  return (
    <div className="flex min-h-screen flex-col">
      <AppHeader variant="wide" />

      <ContentBand width="wide" innerClassName="flex flex-wrap items-end gap-2 py-3">
        <Input
          label="Search area"
          type="text"
          value={filters.city}
          onChange={(e) => setFilters((f) => ({ ...f, city: e.target.value }))}
          placeholder="Kampala, Namuwongo..."
          className="min-w-[140px] flex-1 sm:flex-none sm:min-w-[160px]"
        />
        <FilterSelect
          label="Bedrooms"
          value={filters.bedrooms}
          onChange={(bedrooms) => setFilters((f) => ({ ...f, bedrooms }))}
          options={bedroomOptions}
          className="min-w-[120px]"
        />
        <FilterSelect
          label="Bathrooms"
          value={filters.bathrooms}
          onChange={(bathrooms) => setFilters((f) => ({ ...f, bathrooms }))}
          options={bathroomOptions}
          className="min-w-[120px]"
        />
        <Button
          type="button"
          onClick={runSearch}
          loading={searching}
          loadingLabel="Searching buildings"
        >
          Search
        </Button>
        <Button
          type="button"
          variant="ghost"
          onClick={async () => {
            setFilters(EMPTY_FILTERS);
            setSearching(true);
            setError(null);
            try {
              applySearchResults(await loadBuildings(EMPTY_FILTERS));
              setAppliedFilters(EMPTY_FILTERS);
            } catch {
              setError("Could not load buildings. Is the API running?");
            } finally {
              setSearching(false);
            }
          }}
        >
          Reset
        </Button>
        <Button
          type="button"
          variant="ghost"
          className="ml-auto"
          onClick={() => setMapVisible((v) => !v)}
        >
          {mapVisible ? "Hide map" : "Show map"}
        </Button>
      </ContentBand>

      {error && (
        <div className={contentBandInnerClass("wide")}>
          <p className="bg-red-50 py-2 text-sm text-red-700">{error}</p>
        </div>
      )}

      <div
        className={cn(
          "mx-auto flex w-full flex-1 overflow-hidden",
          LAYOUT.padX,
          layoutMaxClass("wide"),
        )}
      >
        <aside
          className={cn(
            "flex min-h-0 flex-col border-r border-border bg-surface",
            mapVisible ? "w-full max-w-md" : "w-full max-w-lg",
          )}
        >
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border px-4 py-3 text-sm">
            <span className="flex items-center gap-2">
              <strong>All</strong>
              {listLoading ? (
                <Spinner className="size-3" label="Loading results" />
              ) : (
                `${allBuildings.length} result${allBuildings.length === 1 ? "" : "s"}`
              )}
            </span>
            {activeFilterHint ? (
              <span className="text-xs text-muted">{activeFilterHint}</span>
            ) : null}
          </div>

          <ul ref={listRef} className="min-h-0 flex-1 overflow-y-auto">
            {allBuildings.map((building) => {
              const active = selectedId === building.id;
              const hovered = hoveredId === building.id;
              const rowLoading = preview.id === building.id && preview.loading;
              const unlocked = (building.myUnlockCount ?? 0) > 0;
              const accessOnly = hasAccessOnly(building);

              return (
                <li key={building.id}>
                  <div
                    data-building-id={building.id}
                    onMouseEnter={() => setHover(building.id)}
                    onMouseLeave={() => setHover(null)}
                    className={cn(
                      "flex items-stretch border-b border-border transition-colors",
                      active &&
                        (unlocked
                          ? "border-l-2 border-l-lime-600 bg-lime-50/60"
                          : "border-l-2 border-l-primary bg-primary/5"),
                      !active &&
                        hovered &&
                        (unlocked
                          ? "border-l-2 border-l-lime-600/50 bg-lime-50/40"
                          : "border-l-2 border-l-primary/40 bg-primary/5"),
                      !active && !hovered && "hover:bg-background/60",
                    )}
                  >
                    <button
                      type="button"
                      onClick={() => handleListSelect(building.id)}
                      className="min-w-0 flex-1 px-4 py-3 text-left"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <p
                          className={cn(
                            "font-medium",
                            unlocked ? "text-lime-800" : "text-primary",
                          )}
                        >
                          {building.name}
                        </p>
                        {rowLoading ? (
                          <Spinner
                            className="mt-0.5 size-3 shrink-0"
                            label="Loading preview"
                          />
                        ) : null}
                      </div>
                      <p className="text-sm text-muted">
                        {[building.district, building.city]
                          .filter(Boolean)
                          .join(", ")}
                      </p>
                      <p className="mt-1 text-xs text-muted">
                        {building.availableUnitCount > 0 ? (
                          <>
                            {building.availableUnitCount} available · from{" "}
                            {formatRentPerMonth(building.rentFrom)}
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
              <li className="px-4 py-8 text-sm text-muted">
                No available units match your search. Try fewer filters or another
                area.
              </li>
            )}
          </ul>

          {mapVisible && activePanelId ? (
            <div className="max-h-[42%] shrink-0 overflow-y-auto border-t border-border bg-background p-4">
              {panelLoading ? (
                <LoadingState label="Loading building" compact />
              ) : panelDetail ? (
                <BuildingDetailPanel building={panelDetail} compact />
              ) : (
                <p className="text-sm text-muted">Could not load building details.</p>
              )}
            </div>
          ) : null}
        </aside>

        {mapVisible ? (
          <section className="relative hidden min-h-[420px] flex-1 md:block">
            <PlotPinMap
              buildings={allBuildings}
              selectedId={selectedId}
              hoveredId={hoveredId}
              hoverPreview={hoverPreview}
              unlockedBuildingIds={unlockedBuildingIds}
              unlockedLocations={unlockedLocations}
              onSelect={handleMapSelect}
              onAccessOpen={handleMapAccessOpen}
              onHover={setHover}
            />
          </section>
        ) : (
          <section className="hidden flex-1 overflow-y-auto bg-background p-6 md:block">
            {!activePanelId ? (
              <p className="text-muted">
                Hover or select a building from the list.
              </p>
            ) : panelLoading ? (
              <LoadingState label="Loading building" />
            ) : panelDetail ? (
              <BuildingDetailPanel building={panelDetail} />
            ) : (
              <p className="text-muted">Could not load building details.</p>
            )}
          </section>
        )}
      </div>

      {mapVisible && activePanelId && panelLoading && (
        <div className="border-t border-border bg-surface p-4 md:hidden">
          <LoadingState label="Loading building" compact />
        </div>
      )}
      {mapVisible && panelDetail && !panelLoading && (
        <div className="border-t border-border bg-surface p-4 md:hidden">
          <BuildingDetailPanel building={panelDetail} compact />
        </div>
      )}

      <UnlockedAccessModal
        open={accessModalBuildingId !== null && accessModalUnlocks.length > 0}
        unlocks={accessModalUnlocks}
        buildingName={accessModalBuilding?.name}
        onClose={closeAccessModal}
      />
    </div>
  );
}
