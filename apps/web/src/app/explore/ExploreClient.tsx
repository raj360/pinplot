"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { PlotPinMap } from "@/components/maps/PlotPinMap";
import { BuildingDetailPanel } from "@/components/buildings/BuildingDetailPanel";
import {
  fetchBuildingsInBounds,
  fetchBuilding,
  KAMPALA_BOUNDS,
  type BuildingDetail,
} from "@/lib/api/buildings";
import type { BuildingSummary } from "@plotpin/shared-types";

export function ExploreClient() {
  const [mapVisible, setMapVisible] = useState(true);
  const [buildings, setBuildings] = useState<BuildingSummary[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<BuildingDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cityFilter, setCityFilter] = useState("");

  const loadBuildings = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchBuildingsInBounds(KAMPALA_BOUNDS, {
        city: cityFilter || undefined,
      });
      setBuildings(data);
      setSelectedId((prev) => prev ?? data[0]?.id ?? null);
    } catch {
      setError("Could not load buildings. Is the API running?");
    } finally {
      setLoading(false);
    }
  }, [cityFilter]);

  useEffect(() => {
    loadBuildings();
  }, [loadBuildings]);

  useEffect(() => {
    if (!selectedId) {
      setDetail(null);
      return;
    }
    fetchBuilding(selectedId)
      .then(setDetail)
      .catch(() => setDetail(null));
  }, [selectedId]);

  const selectedSummary = buildings.find((b) => b.id === selectedId);

  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b border-border bg-primary text-primary-foreground">
        <div className="mx-auto flex h-14 max-w-[1600px] items-center justify-between px-4">
          <Link href="/" className="font-semibold">
            PlotPin
          </Link>
          <nav className="flex gap-4 text-sm">
            <Link href="/explore" className="opacity-90">
              Explore
            </Link>
            <Link href="/auth/login" className="hover:underline">
              Sign in
            </Link>
          </nav>
        </div>
      </header>

      <div className="border-b border-border bg-surface px-4 py-3">
        <div className="mx-auto flex max-w-[1600px] flex-wrap items-end gap-2">
          <label className="flex flex-col gap-1 text-xs text-muted">
            Search area
            <input
              type="text"
              value={cityFilter}
              onChange={(e) => setCityFilter(e.target.value)}
              placeholder="Kampala, Namuwongo..."
              className="min-w-[160px] border border-border bg-surface px-2 py-2 text-sm"
            />
          </label>
          <button
            type="button"
            onClick={loadBuildings}
            className="bg-primary px-4 py-2 text-sm text-primary-foreground"
          >
            Search
          </button>
          <button
            type="button"
            onClick={() => {
              setCityFilter("");
              loadBuildings();
            }}
            className="px-2 py-2 text-sm text-primary"
          >
            Reset
          </button>
          <button
            type="button"
            onClick={() => setMapVisible((v) => !v)}
            className="ml-auto px-2 py-2 text-sm text-primary"
          >
            {mapVisible ? "Hide map" : "Show map"}
          </button>
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
            <span>
              <strong>All</strong>{" "}
              {loading ? "…" : `${buildings.length} results`}
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
                    {building.availableUnitCount} available · from UGX{" "}
                    {building.rentFrom?.toLocaleString() ?? "—"}/mo
                  </p>
                </button>
              </li>
            ))}
            {!loading && buildings.length === 0 && (
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
            {detail ? (
              <BuildingDetailPanel building={detail} />
            ) : selectedSummary ? (
              <p className="text-muted">Loading building…</p>
            ) : (
              <p className="text-muted">Select a building from the list.</p>
            )}
          </section>
        )}
      </div>

      {mapVisible && detail && (
        <div className="border-t border-border bg-surface p-4 md:hidden">
          <BuildingDetailPanel building={detail} compact />
        </div>
      )}
    </div>
  );
}
