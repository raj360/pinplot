"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { PlotPinMap } from "@/components/maps/PlotPinMap";
import { BuildingDetailPanel } from "@/components/buildings/BuildingDetailPanel";
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
  fetchBuilding,
  KAMPALA_BOUNDS,
  type BuildingDetail,
} from "@/lib/api/buildings";
import { formatRentPerMonth } from "@/lib/intl/format";
import type { BuildingSummary } from "@plotpin/shared-types";

async function loadBuildingsForCity(cityFilter: string) {
  return fetchBuildingsInBounds(KAMPALA_BOUNDS, {
    city: cityFilter || undefined,
  });
}

export function ExploreClient() {
  const [mapVisible, setMapVisible] = useState(true);
  const [allBuildings, setAllBuildings] = useState<BuildingSummary[]>([]);
  const [mapFilterIds, setMapFilterIds] = useState<string[] | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [detail, setDetail] = useState<BuildingDetail | null>(null);
  const [detailRequestId, setDetailRequestId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cityFilter, setCityFilter] = useState("");
  const listRef = useRef<HTMLUListElement>(null);

  const displayedBuildings = useMemo(() => {
    if (!mapFilterIds?.length) return allBuildings;
    const allowed = new Set(mapFilterIds);
    return allBuildings.filter((b) => allowed.has(b.id));
  }, [allBuildings, mapFilterIds]);

  const applySearchResults = useCallback((data: BuildingSummary[]) => {
    setAllBuildings(data);
    setMapFilterIds(null);
    setSelectedId((prev) => {
      if (prev && data.some((b) => b.id === prev)) return prev;
      return data[0]?.id ?? null;
    });
  }, []);

  useEffect(() => {
    let cancelled = false;

    loadBuildingsForCity("")
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
      applySearchResults(await loadBuildingsForCity(cityFilter));
    } catch {
      setError("Could not load buildings. Is the API running?");
    } finally {
      setSearching(false);
    }
  }, [applySearchResults, cityFilter]);

  useEffect(() => {
    if (!selectedId) return;

    let cancelled = false;

    fetchBuilding(selectedId)
      .then((data) => {
        if (!cancelled) {
          setDetail(data);
          setDetailRequestId(selectedId);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setDetail(null);
          setDetailRequestId(selectedId);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [selectedId]);

  useEffect(() => {
    if (!selectedId || !listRef.current) return;
    const row = listRef.current.querySelector(`[data-building-id="${selectedId}"]`);
    row?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [selectedId, mapFilterIds]);

  const handleClusterSelect = useCallback((ids: string[]) => {
    setMapFilterIds(ids);
    setSelectedId(ids[0] ?? null);
  }, []);

  const clearMapFilter = useCallback(() => {
    setMapFilterIds(null);
  }, []);

  const selectedSummary = displayedBuildings.find((b) => b.id === selectedId);
  const detailLoading = Boolean(selectedId && detailRequestId !== selectedId);
  const showDetail =
    selectedId && detailRequestId === selectedId ? detail : null;
  const listLoading = loading || searching;
  const isMapFiltered = Boolean(mapFilterIds?.length);

  return (
    <div className="flex min-h-screen flex-col">
      <AppHeader variant="wide" />

      <ContentBand width="wide" innerClassName="flex flex-wrap items-end gap-2 py-3">
        <Input
          label="Search area"
          type="text"
          value={cityFilter}
          onChange={(e) => setCityFilter(e.target.value)}
          placeholder="Kampala, Namuwongo..."
          className="min-w-[160px]"
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
            setCityFilter("");
            setSearching(true);
            setError(null);
            try {
              applySearchResults(await loadBuildingsForCity(""));
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
              <strong>{isMapFiltered ? "Map area" : "All"}</strong>
              {listLoading ? (
                <Spinner className="size-3" label="Loading results" />
              ) : (
                `${displayedBuildings.length} result${displayedBuildings.length === 1 ? "" : "s"}`
              )}
            </span>
            {isMapFiltered ? (
              <button
                type="button"
                onClick={clearMapFilter}
                className="text-xs text-primary hover:underline"
              >
                Show all {allBuildings.length}
              </button>
            ) : null}
          </div>

          <ul ref={listRef} className="min-h-0 flex-1 overflow-y-auto">
            {displayedBuildings.map((building) => {
              const active = selectedId === building.id;
              const hovered = hoveredId === building.id;

              return (
                <li key={building.id}>
                  <button
                    type="button"
                    data-building-id={building.id}
                    onClick={() => setSelectedId(building.id)}
                    onMouseEnter={() => setHoveredId(building.id)}
                    onMouseLeave={() => setHoveredId(null)}
                    className={cn(
                      "w-full border-b border-border px-4 py-3 text-left transition-colors",
                      active && "border-l-2 border-l-primary bg-primary/5",
                      !active && hovered && "bg-background",
                      !active && !hovered && "hover:bg-background/60",
                    )}
                  >
                    <p className="font-medium text-primary">{building.name}</p>
                    <p className="text-sm text-muted">
                      {[building.district, building.city]
                        .filter(Boolean)
                        .join(", ")}
                    </p>
                    <p className="mt-1 text-xs text-muted">
                      {building.availableUnitCount} available · from{" "}
                      {formatRentPerMonth(building.rentFrom)}
                    </p>
                  </button>
                </li>
              );
            })}
            {!listLoading && displayedBuildings.length === 0 && (
              <li className="px-4 py-8 text-sm text-muted">
                {isMapFiltered
                  ? "No listings at this map pin. Try another cluster or show all results."
                  : "No available units in this area."}
              </li>
            )}
          </ul>

          {mapVisible && selectedId ? (
            <div className="max-h-[42%] shrink-0 overflow-y-auto border-t border-border bg-background p-4">
              {detailLoading ? (
                <LoadingState label="Loading building" compact />
              ) : showDetail ? (
                <BuildingDetailPanel building={showDetail} compact />
              ) : selectedSummary ? (
                <p className="text-sm text-muted">Could not load building details.</p>
              ) : null}
            </div>
          ) : null}
        </aside>

        {mapVisible ? (
          <section className="relative hidden min-h-[420px] flex-1 md:block">
            <PlotPinMap
              buildings={allBuildings}
              selectedId={selectedId}
              hoveredId={hoveredId}
              onSelect={setSelectedId}
              onClusterSelect={handleClusterSelect}
              onHover={setHoveredId}
            />
          </section>
        ) : (
          <section className="hidden flex-1 overflow-y-auto bg-background p-6 md:block">
            {!selectedId ? (
              <p className="text-muted">Select a building from the list.</p>
            ) : detailLoading ? (
              <LoadingState label="Loading building" />
            ) : showDetail ? (
              <BuildingDetailPanel building={showDetail} />
            ) : selectedSummary ? (
              <p className="text-muted">Could not load building details.</p>
            ) : null}
          </section>
        )}
      </div>

      {mapVisible && selectedId && detailLoading && (
        <div className="border-t border-border bg-surface p-4 md:hidden">
          <LoadingState label="Loading building" compact />
        </div>
      )}
      {mapVisible && showDetail && !detailLoading && (
        <div className="border-t border-border bg-surface p-4 md:hidden">
          <BuildingDetailPanel building={showDetail} compact />
        </div>
      )}
    </div>
  );
}
