"use client";

import { useCallback, useEffect, useState } from "react";
import { PlotPinMap } from "@/components/maps/PlotPinMap";
import { BuildingDetailPanel } from "@/components/buildings/BuildingDetailPanel";
import { AppHeader } from "@/components/layout/AppHeader";
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
  const [buildings, setBuildings] = useState<BuildingSummary[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<BuildingDetail | null>(null);
  const [detailRequestId, setDetailRequestId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cityFilter, setCityFilter] = useState("");

  const applySearchResults = useCallback((data: BuildingSummary[]) => {
    setBuildings(data);
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

  const selectedSummary = buildings.find((b) => b.id === selectedId);
  const detailLoading = Boolean(selectedId && detailRequestId !== selectedId);
  const showDetail =
    selectedId && detailRequestId === selectedId ? detail : null;
  const listLoading = loading || searching;

  return (
    <div className="flex min-h-screen flex-col">
      <AppHeader wide />

      <div className="border-b border-border bg-surface px-4 py-3">
        <div className="mx-auto flex max-w-[1600px] flex-wrap items-end gap-2">
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
        </div>
      </div>

      {error && (
        <p className="bg-red-50 px-4 py-2 text-sm text-red-700">{error}</p>
      )}

      <div className="mx-auto flex w-full max-w-[1600px] flex-1 overflow-hidden">
        <aside
          className={`flex flex-col border-r border-border bg-surface ${
            mapVisible ? "w-full max-w-md" : "w-full max-w-lg"
          }`}
        >
          <div className="flex items-center justify-between border-b border-border px-4 py-3 text-sm">
            <span className="flex items-center gap-2">
              <strong>All</strong>
              {listLoading ? (
                <Spinner className="size-3" label="Loading results" />
              ) : (
                `${buildings.length} results`
              )}
            </span>
          </div>
          <ul className="flex-1 overflow-y-auto">
            {buildings.map((building) => (
              <li key={building.id}>
                <button
                  type="button"
                  onClick={() => setSelectedId(building.id)}
                  className={`w-full border-b border-border px-4 py-3 text-left hover:bg-background ${
                    selectedId === building.id ? "bg-background" : ""
                  }`}
                >
                  <p className="font-medium text-primary">{building.name}</p>
                  <p className="text-sm text-muted">
                    {[building.district, building.city].filter(Boolean).join(", ")}
                  </p>
                  <p className="mt-1 text-xs text-muted">
                    {building.availableUnitCount} available · from{" "}
                    {formatRentPerMonth(building.rentFrom)}
                  </p>
                </button>
              </li>
            ))}
            {!listLoading && buildings.length === 0 && (
              <li className="px-4 py-8 text-sm text-muted">
                No available units in this area.
              </li>
            )}
          </ul>
        </aside>

        {mapVisible ? (
          <section className="relative hidden min-h-[420px] flex-1 md:block">
            <PlotPinMap
              buildings={buildings}
              selectedId={selectedId}
              onSelect={setSelectedId}
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
