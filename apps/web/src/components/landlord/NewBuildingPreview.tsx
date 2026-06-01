"use client";

import { MapPin } from "lucide-react";
import { buildingTypeLabel } from "@/lib/filters/building-types";
import { formatRentPerMonth } from "@/lib/intl/format";
import { cn } from "@/lib/utils/cn";

type UnitPreview = {
  unitNumber: string;
  bedrooms: number;
  bathrooms: number;
  rentAmount: number;
};

type NewBuildingPreviewProps = {
  buildingName: string;
  buildingType: string;
  city: string;
  district: string;
  areaLabel: string;
  coverPreviewUrl: string | null;
  units: UnitPreview[];
  step: number;
  className?: string;
};

export function NewBuildingPreview({
  buildingName,
  buildingType,
  city,
  district,
  areaLabel,
  coverPreviewUrl,
  units,
  step,
  className,
}: NewBuildingPreviewProps) {
  const displayName = buildingName.trim() || "Your building name";
  const locationLine =
    [district, city].filter(Boolean).join(", ") || areaLabel || "Kampala";
  const rents = units.map((unit) => unit.rentAmount).filter((rent) => rent > 0);
  const rentFrom = rents.length > 0 ? Math.min(...rents) : null;
  const typeLabel = buildingTypeLabel(buildingType);
  const progress = Math.round((step / 4) * 100);

  return (
    <div className={cn("border border-border bg-surface", className)}>
      <div className="border-b border-border bg-background px-4 py-3">
        <div className="flex items-center justify-between gap-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted">
            Listing preview
          </p>
          <span className="text-xs font-medium text-primary">{progress}%</span>
        </div>
        <div className="mt-2 h-1.5 overflow-hidden bg-border">
          <div
            className="h-full bg-primary transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
        <p className="mt-2 text-sm text-muted">
          How your building may appear on Explore after verification.
        </p>
      </div>

      <div className="p-4">
        {coverPreviewUrl ? (
          // eslint-disable-next-line @next/next/no-img-element -- blob URL from local file pick
          <img
            src={coverPreviewUrl}
            alt=""
            className="mb-4 aspect-video w-full border border-border object-cover"
          />
        ) : (
          <div className="mb-4 flex aspect-video items-center justify-center border border-dashed border-border bg-background text-xs text-muted">
            Cover photo preview
          </div>
        )}

        <h3
          className={cn(
            "text-lg font-bold leading-snug",
            buildingName.trim() ? "text-foreground" : "text-muted",
          )}
        >
          {displayName}
        </h3>

        <p className="mt-1.5 flex items-start gap-1.5 text-sm text-muted">
          <MapPin className="mt-0.5 size-3.5 shrink-0" aria-hidden />
          <span>{locationLine}</span>
        </p>

        {typeLabel ? (
          <p className="mt-2 text-xs font-medium uppercase tracking-wide text-muted">
            {typeLabel}
          </p>
        ) : null}

        <div className="mt-4 border border-border bg-background px-3 py-2.5 text-sm">
          <p className="font-medium text-foreground">
            {units.length} unit{units.length === 1 ? "" : "s"}
            {rentFrom != null ? (
              <>
                {" "}
                · from {formatRentPerMonth(rentFrom)}
              </>
            ) : null}
          </p>
          <ul className="mt-2 space-y-1 text-xs text-muted">
            {units.slice(0, 4).map((unit, index) => (
              <li key={`${unit.unitNumber}-${index}`}>
                Unit {unit.unitNumber} · {unit.bedrooms} bed ·{" "}
                {formatRentPerMonth(unit.rentAmount)}
              </li>
            ))}
            {units.length > 4 ? (
              <li>+{units.length - 4} more units</li>
            ) : null}
          </ul>
        </div>

        <span className="mt-4 inline-block bg-amber-100 px-2 py-1 text-xs font-medium text-amber-800">
          Pending verification
        </span>
      </div>
    </div>
  );
}
