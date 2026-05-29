"use client";

import Link from "next/link";
import { exploreBuildingUrl } from "@/lib/explore/urls";
import { PRICING } from "@plotpin/shared-types";
import { formatUnitDetail, type UnitLike } from "@/lib/buildings/unit-summary";
import { formatCurrency } from "@/lib/intl/format";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils/cn";

export function UnlockPurchasePanel({
  buildingId,
  availableUnits,
  error,
  isAuthenticated,
  onUnlock,
  unlockingId,
  title = "Unlock contact",
  description,
  showHeading = true,
  layout = "grid",
}: {
  buildingId: string;
  availableUnits: UnitLike[];
  error: string | null;
  isAuthenticated: boolean;
  onUnlock: (unitId: string) => void;
  unlockingId: string | null;
  title?: string;
  description?: string;
  showHeading?: boolean;
  /** sidebar = single column in narrow aside; grid = responsive columns when space allows */
  layout?: "grid" | "sidebar";
}) {
  const defaultDescription = `Pay ${formatCurrency(PRICING.tenantUnlockFeeUgx)} to reveal exact address, landlord contact, building tour, and directions. First payment wins exclusive access for ${PRICING.unlockExclusiveHours} hours.`;

  const listClass = cn(
    "mt-4 grid gap-3",
    layout === "sidebar"
      ? "grid-cols-1"
      : "grid-cols-1 sm:grid-cols-[repeat(auto-fill,minmax(15rem,1fr))]",
  );

  return (
    <div className="border border-border bg-surface p-4">
      {showHeading ? (
        <>
          <h2 className="font-semibold">{title}</h2>
          <p className="mt-2 text-sm text-muted">
            {description ?? defaultDescription}
          </p>
        </>
      ) : description ? (
        <p className="text-sm text-muted">{description}</p>
      ) : null}

      {!isAuthenticated ? (
        <Link
          href={`/auth/login?next=${encodeURIComponent(exploreBuildingUrl(buildingId, { hideMap: true }))}`}
          className="mt-4 inline-block w-full bg-primary px-4 py-2.5 text-center text-sm font-medium text-primary-foreground"
        >
          Sign in to unlock
        </Link>
      ) : availableUnits.length === 0 ? (
        <p className="mt-4 text-sm text-muted">
          No units are available to unlock right now.
        </p>
      ) : (
        <ul className={listClass}>
          {availableUnits.map((unit) => (
            <li
              key={unit.id}
              className="flex min-w-0 flex-col gap-3 border border-border bg-background p-3"
            >
              <div>
                <p className="font-medium">Unit {unit.unitNumber}</p>
                <p className="mt-0.5 text-sm text-foreground">
                  {formatUnitDetail(unit)}
                </p>
                <p className="mt-1 text-xs text-muted">Available now</p>
              </div>
              <Button
                type="button"
                className="w-full"
                loading={unlockingId === unit.id}
                loadingLabel="Unlocking unit"
                onClick={() => onUnlock(unit.id)}
              >
                Unlock — {formatCurrency(PRICING.tenantUnlockFeeUgx)}
              </Button>
            </li>
          ))}
        </ul>
      )}

      {error ? <p className="mt-3 text-sm text-red-600">{error}</p> : null}

      {isAuthenticated && availableUnits.length > 0 ? (
        <p className="mt-3 text-xs text-muted">
          Dev mode: payment simulated until Stripe / Flutterwave is connected.
        </p>
      ) : null}
    </div>
  );
}
