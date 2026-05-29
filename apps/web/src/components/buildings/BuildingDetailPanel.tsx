import Link from "next/link";
import { PRICING, UnitStatus } from "@plotpin/shared-types";
import type { BuildingDetail } from "@/lib/api/buildings";
import {
  formatUnitGroup,
  groupAvailableUnits,
  listAvailableUnits,
  shouldShowUnitDetailList,
  summarizeAvailableUnits,
} from "@/lib/buildings/unit-summary";
import { formatCurrency, formatRentPerMonth } from "@/lib/intl/format";

function UnitGrid({ building }: { building: BuildingDetail }) {
  return (
    <div className="grid grid-cols-6 gap-1">
      {building.units.map((unit) => (
        <div
          key={unit.id}
          title={`${unit.unitNumber} — ${unit.status}`}
          className={`flex aspect-square items-center justify-center border text-xs font-medium ${
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
  const availableUnits = listAvailableUnits(building.units);
  const unitGroups = groupAvailableUnits(building.units);
  const unitSummary = summarizeAvailableUnits(building.units);
  const showUnitList = shouldShowUnitDetailList(building.units);

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

  if (compact) {
    return (
      <article className="space-y-3">
        <header>
          <h2 className="text-lg font-bold">{building.name}</h2>
          <p className="text-sm text-muted">
            {[building.district, building.city].filter(Boolean).join(", ")}
          </p>
        </header>

        <div className="border border-border bg-surface px-3 py-2.5 text-sm">
          <p className="font-medium">
            {building.availableUnitCount} available · from{" "}
            {formatRentPerMonth(building.rentFrom)}
          </p>
          {unitSummary ? (
            <p className="mt-1 text-xs leading-relaxed text-muted">
              {unitSummary}
            </p>
          ) : null}
        </div>

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
    <article className="max-w-xl space-y-4">
      <header>
        <h1 className="text-xl font-bold">{building.name}</h1>
        <p className="text-sm text-muted">
          {[building.district, building.city].filter(Boolean).join(", ")}
        </p>
      </header>

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
        ) : null}
      </div>

      {showUnlockLink ? (
        <>
          {unlockNotice}
          {unlockCta}
        </>
      ) : null}

      <UnitGrid building={building} />

      {showUnitList && availableUnits.length > 0 ? (
        <ul className="space-y-1 text-sm text-muted">
          {availableUnits.map((unit) => (
            <li key={unit.id}>
              Unit {unit.unitNumber} · {unit.bedrooms} bed / {unit.bathrooms}{" "}
              bath · {formatRentPerMonth(unit.rentAmount)}
            </li>
          ))}
        </ul>
      ) : null}
    </article>
  );
}
