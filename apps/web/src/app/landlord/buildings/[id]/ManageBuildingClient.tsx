"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { DashboardSection } from "@/components/layout/DashboardSection";
import { BuildingPhotoManager } from "@/components/buildings/BuildingPhotoManager";
import { ManageBuildingSkeleton } from "@/components/landlord/LandlordPageSkeletons";
import { Button } from "@/components/ui/button";
import {
  fetchMyBuilding,
  updateUnitStatus,
  type LandlordBuildingDetail,
} from "@/lib/api/buildings";
import { getAccessToken } from "@/lib/api/client";
import { formatCurrency } from "@/lib/intl/format";
import type { PriceQuote } from "@plotpin/shared-types";

type UnitAction = "AVAILABLE" | "UNAVAILABLE" | "RENTED";

type PendingUnitAction = {
  unitId: string;
  status: UnitAction;
};

type UnitStatus = UnitAction | "LOCKED";

const STATUS_LABELS: Record<UnitStatus, string> = {
  AVAILABLE: "Visible on map",
  UNAVAILABLE: "Hidden",
  RENTED: "Rented",
  LOCKED: "Tenant hold",
};

const STATUS_STYLES: Record<UnitStatus, string> = {
  AVAILABLE: "bg-green-100 text-green-800",
  UNAVAILABLE: "bg-muted/20 text-muted",
  RENTED: "bg-blue-100 text-blue-800",
  LOCKED: "bg-amber-100 text-amber-800",
};

export default function ManageBuildingClient({
  buildingId,
}: {
  buildingId: string;
}) {
  const router = useRouter();
  const [building, setBuilding] = useState<LandlordBuildingDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pendingAction, setPendingAction] = useState<PendingUnitAction | null>(
    null,
  );
  const [listingQuote, setListingQuote] = useState<PriceQuote | null>(null);

  const load = useCallback(async () => {
    try {
      setBuilding(await fetchMyBuilding(buildingId));
      setError(null);
    } catch {
      setError("Could not load this building.");
    } finally {
      setLoading(false);
    }
  }, [buildingId]);

  useEffect(() => {
    let cancelled = false;

    getAccessToken().then(async (token) => {
      if (cancelled) return;

      if (!token) {
        router.replace(`/auth/login?next=/landlord/buildings/${buildingId}`);
        return;
      }

      await load();
    });

    return () => {
      cancelled = true;
    };
  }, [buildingId, load, router]);

  async function setStatus(unitId: string, status: UnitAction) {
    setPendingAction({ unitId, status });
    setError(null);
    try {
      const result = await updateUnitStatus(buildingId, unitId, status);
      setBuilding((prev) => {
        if (!prev) return prev;
        const units = prev.units.map((u) =>
          u.id === unitId ? result.unit : u,
        );
        return {
          ...prev,
          units,
          availableUnitCount: units.filter((u) => u.status === "AVAILABLE")
            .length,
        };
      });
      if (result.listingQuote) {
        setListingQuote(result.listingQuote);
      }
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Could not update unit status.";
      setError(message);
    } finally {
      setPendingAction(null);
    }
  }

  if (loading) {
    return <ManageBuildingSkeleton />;
  }

  if (!building) {
    return (
      <DashboardSection title="Building not found">
        <p className="text-sm text-red-600">{error}</p>
        <Link href="/landlord/dashboard" className="mt-4 inline-block text-sm text-primary">
          ← Back to dashboard
        </Link>
      </DashboardSection>
    );
  }

  return (
    <div className="space-y-4">
      <Link
        href="/landlord/dashboard"
        className="inline-block text-sm text-primary"
      >
        ← Back to dashboard
      </Link>

      {!building.isVerified && (
        <p className="border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          Pending admin review — you can edit photos while waiting. Units cannot
          go on the map until approved.
        </p>
      )}

      {building.isVerified && building.availableUnitCount === 0 ? (
        <div className="border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-950">
          <p className="font-medium">Your building is approved</p>
          <p className="mt-1">
            Mark at least one unit <strong>available</strong> below so tenants
            can discover it on explore. Until then, it will not appear in search
            results.
          </p>
        </div>
      ) : null}

      {listingQuote && (
        <p className="border border-primary/30 bg-primary/5 px-4 py-3 text-sm">
          Unit is live. Listing fee:{" "}
          <strong>{formatCurrency(listingQuote.amountUgx)}</strong>
          {listingQuote.label ? ` (${listingQuote.label})` : ""}.{" "}
          {listingQuote.note}
        </p>
      )}

      {!building.isVerified ? (
        <DashboardSection
          title="Photos"
          description="Update cover and gallery photos while this listing is pending verification."
        >
          <BuildingPhotoManager buildingId={buildingId} variant="landlord" />
        </DashboardSection>
      ) : null}

      <DashboardSection
        title={building.name}
        description={
          building.availableUnitCount > 0
            ? `${building.availableUnitCount} of ${building.units.length} units visible to tenants on explore.`
            : building.isVerified
              ? "No units visible yet — mark units available when you are ready."
              : `${building.units.length} units — available after admin approval.`
        }
      >
        {error && <p className="mb-4 text-sm text-red-600">{error}</p>}

        <ul className="space-y-3">
          {building.units.map((unit) => {
            const status = unit.status as UnitStatus;
            const locked = status === "LOCKED";
            const unitBusy = pendingAction?.unitId === unit.id;
            const isLoading = (action: UnitAction) =>
              unitBusy && pendingAction?.status === action;

            return (
              <li
                key={unit.id}
                className="flex flex-wrap items-center justify-between gap-3 border border-border bg-surface p-4"
              >
                <div className="min-w-0">
                  <p className="font-semibold text-foreground">
                    Unit {unit.unitNumber}
                  </p>
                  <p className="mt-0.5 text-sm text-muted">
                    {unit.bedrooms} bed · {unit.bathrooms} bath ·{" "}
                    {formatCurrency(unit.rentAmount)}/mo
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={`shrink-0 px-2 py-1 text-xs font-medium ${STATUS_STYLES[status] ?? STATUS_STYLES.UNAVAILABLE}`}
                  >
                    {STATUS_LABELS[status] ?? status}
                  </span>

                  {!locked && status !== "AVAILABLE" && (
                    <Button
                      size="sm"
                      loading={isLoading("AVAILABLE")}
                      loadingLabel="Marking unit available"
                      disabled={unitBusy || !building.isVerified}
                      onClick={() => setStatus(unit.id, "AVAILABLE")}
                    >
                      Mark available
                    </Button>
                  )}
                  {!locked && status === "AVAILABLE" && (
                    <Button
                      size="sm"
                      variant="outline"
                      loading={isLoading("UNAVAILABLE")}
                      loadingLabel="Hiding unit from map"
                      disabled={unitBusy}
                      onClick={() => setStatus(unit.id, "UNAVAILABLE")}
                    >
                      Hide from map
                    </Button>
                  )}
                  {!locked && status !== "RENTED" && status !== "UNAVAILABLE" && (
                    <Button
                      size="sm"
                      variant="outline"
                      loading={isLoading("RENTED")}
                      loadingLabel="Marking unit as rented"
                      disabled={unitBusy}
                      onClick={() => setStatus(unit.id, "RENTED")}
                    >
                      Mark rented
                    </Button>
                  )}
                  {!locked && status === "RENTED" && (
                    <Button
                      size="sm"
                      variant="outline"
                      loading={isLoading("UNAVAILABLE")}
                      loadingLabel="Taking unit off market"
                      disabled={unitBusy}
                      onClick={() => setStatus(unit.id, "UNAVAILABLE")}
                    >
                      Off market
                    </Button>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      </DashboardSection>
    </div>
  );
}
