import Link from "next/link";
import { PRICING, UnitStatus } from "@plotpin/shared-types";
import type { BuildingDetail } from "@/lib/api/buildings";
import {
  formatUnitDetail,
  formatUnitGroup,
  groupAvailableUnits,
  listAvailableUnits,
  summarizeAvailableUnits,
} from "@/lib/buildings/unit-summary";
import { formatCurrency, formatRentPerMonth } from "@/lib/intl/format";

function unitGridColumns(count: number) {
  if (count <= 4) return "grid-cols-2 sm:grid-cols-4";
  if (count <= 6) return "grid-cols-3 sm:grid-cols-6";
  if (count <= 9) return "grid-cols-3 sm:grid-cols-5 md:grid-cols-9";
  if (count <= 12) return "grid-cols-4 sm:grid-cols-6 md:grid-cols-12";
  return "grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-12";
}

function UnitGridLegend() {
  return (
    <ul className="flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-muted">
      <li className="flex items-center gap-1.5">
        <span className="inline-block h-3 w-3 border border-primary bg-primary/10" />
        Available
      </li>
      <li className="flex items-center gap-1.5">
        <span className="inline-block h-3 w-3 border border-accent-orange bg-accent-orange/10" />
        Locked
      </li>
      <li className="flex items-center gap-1.5">
        <span className="inline-block h-3 w-3 border border-border bg-surface" />
        Unavailable
      </li>
    </ul>
  );
}

function UnitGrid({ building }: { building: BuildingDetail }) {
  const gridClass = unitGridColumns(building.units.length);

  return (
    <div className="space-y-2">
      <div className={`grid gap-1.5 ${gridClass}`}>
        {building.units.map((unit) => (
          <div
            key={unit.id}
            title={`Unit ${unit.unitNumber} · ${formatUnitDetail(unit)} · ${unit.status}`}
            className={`flex aspect-square items-center justify-center border text-xs font-semibold ${
              unit.status === UnitStatus.AVAILABLE
                ? "border-primary bg-primary/10 text-primary"
                : unit.status === UnitStatus.LOCKED
                  ? "border-accent-orange bg-accent-orange/10 text-accent-orange"
                  : "border-border bg-surface text-muted"
            }`}
          >
            {unit.unitNumber}
          </div>
        ))}
      </div>
      <UnitGridLegend />
    </div>
  );
}

export function BuildingDetailPanel({
  building,
  compact = false,
  showUnlockLink = true,
}: {
  building: BuildingDetail;
  compact?: boolean;
  /** Hide on the building detail page where UnlockPanel is shown below. */
  showUnlockLink?: boolean;
}) {
  const unitGroups = groupAvailableUnits(building.units);
  const unitSummary = summarizeAvailableUnits(building.units);

  const unlockNotice = (
    <p className="text-sm text-muted">
      Exact address and landlord contact hidden until unlock (
      {formatCurrency(PRICING.tenantUnlockFeeUgx)}).
    </p>
  );

  const unlockCta = showUnlockLink ? (
    <Link
      href={`/buildings/${building.id}`}
      className="inline-block w-full bg-primary py-2.5 text-center text-sm font-medium text-primary-foreground"
    >
      View details — unlock contact
    </Link>
  ) : null;

  const summaryBox = (
    <div className="border border-border bg-surface px-3 py-2.5 text-sm">
      <p className="font-medium">
        {building.availableUnitCount} available · from{" "}
        {formatRentPerMonth(building.rentFrom)}
      </p>
      {unitGroups.length > 0 ? (
        <ul className="mt-2 space-y-1 text-xs text-muted">
          {unitGroups.map((group) => (
            <li key={`${group.bedrooms}-${group.bathrooms}-${group.rentAmount}`}>
              {formatUnitGroup(group)}
            </li>
          ))}
        </ul>
      ) : unitSummary ? (
        <p className="mt-1 text-xs leading-relaxed text-muted">{unitSummary}</p>
      ) : null}
    </div>
  );

  if (compact) {
    return (
      <article className="space-y-3">
        <header>
          <h2 className="text-lg font-bold">{building.name}</h2>
          <p className="text-sm text-muted">
            {[building.district, building.city].filter(Boolean).join(", ")}
          </p>
        </header>

        {summaryBox}

        {showUnlockLink ? (
          <>
            {unlockNotice}
            {unlockCta}
          </>
        ) : null}

        {building.units.length > 0 ? (
          <details className="group text-xs text-muted">
            <summary className="cursor-pointer list-none marker:content-none [&::-webkit-details-marker]:hidden">
              <span className="underline decoration-border underline-offset-2 group-open:no-underline">
                {building.units.length} units in this building
              </span>
            </summary>
            <div className="mt-2">
              <UnitGrid building={building} />
            </div>
          </details>
        ) : null}
      </article>
    );
  }

  return (
    <article className="space-y-4">
      <header>
        <h1 className="text-2xl font-bold">{building.name}</h1>
        <p className="text-sm text-muted">
          {[building.district, building.city].filter(Boolean).join(", ")}
        </p>
      </header>

      {summaryBox}

      {building.units.length > 0 ? <UnitGrid building={building} /> : null}

      {listAvailableUnits(building.units).length > 0 ? (
        <ul className="space-y-1.5 text-sm">
          {listAvailableUnits(building.units).map((unit) => (
            <li key={unit.id} className="text-muted">
              <span className="font-medium text-foreground">
                Unit {unit.unitNumber}
              </span>
              {" · "}
              {formatUnitDetail(unit)}
            </li>
          ))}
        </ul>
      ) : null}

      {showUnlockLink ? (
        <>
          {unlockNotice}
          {unlockCta}
        </>
      ) : null}
    </article>
  );
}
