"use client";

import Link from "next/link";
import { useState } from "react";

const MOCK_BUILDINGS = [
  {
    id: "1",
    name: "Sunset Apartments",
    area: "Namuwongo, Kampala",
    availableUnits: 2,
    rentFrom: 600_000,
  },
  {
    id: "2",
    name: "Green View Flats",
    area: "Ntinda, Kampala",
    availableUnits: 1,
    rentFrom: 850_000,
  },
  {
    id: "3",
    name: "City Gate Residences",
    area: "Nakasero, Kampala",
    availableUnits: 3,
    rentFrom: 1_200_000,
  },
];

export default function ExplorePage() {
  const [mapVisible, setMapVisible] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>("1");

  const selected = MOCK_BUILDINGS.find((b) => b.id === selectedId);

  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b border-border bg-primary text-primary-foreground">
        <div className="mx-auto flex h-14 max-w-[1600px] items-center justify-between px-4">
          <Link href="/" className="font-semibold">
            PlotPin
          </Link>
          <span className="text-sm opacity-90">Explore · Kampala</span>
        </div>
      </header>

      <div className="border-b border-border bg-surface px-4 py-3">
        <div className="mx-auto flex max-w-[1600px] flex-wrap items-end gap-2">
          <FilterInput label="Search area" placeholder="Namuwongo, Ntinda..." />
          <FilterInput label="Max rent (UGX)" placeholder="1,500,000" />
          <FilterSelect label="Bedrooms" options={["Any", "1", "2", "3+"]} />
          <FilterSelect
            label="Type"
            options={["All", "Apartment", "House", "Studio"]}
          />
          <button
            type="button"
            className="bg-primary px-4 py-2 text-sm text-primary-foreground"
          >
            Search
          </button>
          <button type="button" className="px-2 py-2 text-sm text-primary">
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

      <div className="mx-auto flex w-full max-w-[1600px] flex-1 overflow-hidden">
        <aside
          className={`flex flex-col border-r border-border bg-surface ${
            mapVisible ? "w-full max-w-md" : "w-full max-w-lg"
          }`}
        >
          <div className="flex items-center justify-between border-b border-border px-4 py-3 text-sm">
            <span>
              <strong>All</strong> {MOCK_BUILDINGS.length} results
            </span>
            <button type="button" className="text-primary">
              Sort by newest ↓
            </button>
          </div>
          <ul className="flex-1 overflow-y-auto">
            {MOCK_BUILDINGS.map((building) => (
              <li key={building.id}>
                <button
                  type="button"
                  onClick={() => setSelectedId(building.id)}
                  className={`w-full border-b border-border px-4 py-3 text-left hover:bg-background ${
                    selectedId === building.id ? "bg-background" : ""
                  }`}
                >
                  <p className="font-medium text-primary">{building.name}</p>
                  <p className="text-sm text-muted">{building.area}</p>
                  <p className="mt-1 text-xs text-muted">
                    {building.availableUnits} available · from UGX{" "}
                    {building.rentFrom.toLocaleString()}/mo
                  </p>
                </button>
              </li>
            ))}
          </ul>
        </aside>

        {mapVisible ? (
          <section className="relative hidden flex-1 bg-slate-200 md:block">
            <MapPlaceholder count={MOCK_BUILDINGS.length} />
          </section>
        ) : (
          <section className="hidden flex-1 overflow-y-auto bg-background p-6 md:block">
            {selected ? (
              <BuildingDetail building={selected} />
            ) : (
              <p className="text-muted">Select a building from the list.</p>
            )}
          </section>
        )}
      </div>

      {mapVisible && selected && (
        <div className="border-t border-border bg-surface p-4 md:hidden">
          <BuildingDetail building={selected} compact />
        </div>
      )}
    </div>
  );
}

function FilterInput({
  label,
  placeholder,
}: {
  label: string;
  placeholder: string;
}) {
  return (
    <label className="flex flex-col gap-1 text-xs text-muted">
      {label}
      <input
        type="text"
        placeholder={placeholder}
        className="min-w-[140px] border border-border bg-surface px-2 py-2 text-sm text-foreground"
      />
    </label>
  );
}

function FilterSelect({
  label,
  options,
}: {
  label: string;
  options: string[];
}) {
  return (
    <label className="flex flex-col gap-1 text-xs text-muted">
      {label}
      <select className="min-w-[100px] border border-border bg-surface px-2 py-2 text-sm text-foreground">
        {options.map((opt) => (
          <option key={opt}>{opt}</option>
        ))}
      </select>
    </label>
  );
}

function MapPlaceholder({ count }: { count: number }) {
  return (
    <div className="flex h-full min-h-[420px] flex-col items-center justify-center gap-4 p-8 text-center">
      <div className="flex flex-wrap justify-center gap-3">
        {[count + 5, count + 2, count, 2].map((n) => (
          <span
            key={n}
            className="flex h-10 w-10 items-center justify-center bg-accent-orange text-sm font-semibold text-white shadow"
          >
            {n}
          </span>
        ))}
      </div>
      <div>
        <p className="font-medium">Google Maps integration — Sprint 2</p>
        <p className="mt-1 max-w-md text-sm text-muted">
          Set <code className="text-xs">NEXT_PUBLIC_GOOGLE_MAPS_API_KEY</code>{" "}
          to enable MarkerClusterer and cluster popups.
        </p>
      </div>
    </div>
  );
}

function BuildingDetail({
  building,
  compact = false,
}: {
  building: (typeof MOCK_BUILDINGS)[0];
  compact?: boolean;
}) {
  const units = Array.from({ length: 12 }, (_, i) => ({
    number: i + 1,
    status: i === 2 || i === 6 ? "available" : "occupied",
  }));

  return (
    <article className={compact ? "space-y-3" : "max-w-xl space-y-4"}>
      <div>
        <h1 className="text-xl font-bold">{building.name}</h1>
        <p className="text-sm text-muted">{building.area}</p>
      </div>

      <div className="grid grid-cols-6 gap-1 sm:grid-cols-6">
        {units.map((unit) => (
          <div
            key={unit.number}
            className={`flex aspect-square items-center justify-center border text-xs font-medium ${
              unit.status === "available"
                ? "border-primary bg-primary/10 text-primary"
                : "border-border bg-surface text-muted"
            }`}
            title={unit.status}
          >
            {unit.number}
          </div>
        ))}
      </div>

      <p className="text-sm text-muted">
        Exact address and landlord contact hidden until unlock (20,000 UGX).
      </p>

      <button
        type="button"
        className="w-full bg-primary py-2.5 text-sm font-medium text-primary-foreground sm:w-auto sm:px-6"
      >
        Unlock contact — 20,000 UGX
      </button>
    </article>
  );
}
