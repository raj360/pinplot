import Link from "next/link";
import { PRICING, UnitStatus } from "@plotpin/shared-types";
import type { BuildingDetail } from "@/lib/api/buildings";
import { formatCurrency, formatRentPerMonth } from "@/lib/intl/format";

export function BuildingDetailPanel({
  building,
  compact = false,
}: {
  building: BuildingDetail;
  compact?: boolean;
}) {
  return (
    <article className={compact ? "space-y-3" : "max-w-xl space-y-4"}>
      <div>
        <h1 className="text-xl font-bold">{building.name}</h1>
        <p className="text-sm text-muted">
          {[building.district, building.city].filter(Boolean).join(", ")}
        </p>
        {building.description && (
          <p className="mt-2 text-sm text-muted">{building.description}</p>
        )}
      </div>

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

      <p className="text-sm text-muted">
        {building.availableUnitCount} available · from{" "}
        {formatRentPerMonth(building.rentFrom)}
      </p>

      <p className="text-sm text-muted">
        Exact address and landlord contact hidden until unlock (
        {formatCurrency(PRICING.tenantUnlockFeeUgx)}).
      </p>

      <Link
        href={`/buildings/${building.id}`}
        className="inline-block w-full bg-primary py-2.5 text-center text-sm font-medium text-primary-foreground sm:w-auto sm:px-6"
      >
        View details — unlock contact
      </Link>
    </article>
  );
}
