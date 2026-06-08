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
  resubmitBuildingForReview,
  updateUnitStatus,
  type LandlordBuildingDetail,
} from "@/lib/api/buildings";
import { getAccessToken } from "@/lib/api/client";
import { useViewerContext } from "@/components/providers/ViewerContextProvider";

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
  const { formatListingRentPerMonth } = useViewerContext();
  const [building, setBuilding] = useState<LandlordBuildingDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pendingAction, setPendingAction] = useState<PendingUnitAction | null>(
    null,
  );
  const [bulkBusy, setBulkBusy] = useState(false);
  const [resubmitting, setResubmitting] = useState(false);
  const [resubmitMessage, setResubmitMessage] = useState<string | null>(null);

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
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Could not update unit status.";
      setError(message);
    } finally {
      setPendingAction(null);
    }
  }

  async function markAllAvailable() {
    if (!building) return;
    const targets = building.units.filter((u) => u.status === "UNAVAILABLE");
    if (targets.length === 0) return;
    setBulkBusy(true);
    setError(null);
    try {
      const results = await Promise.all(
        targets.map((u) => updateUnitStatus(buildingId, u.id, "AVAILABLE")),
      );
      const updatedById = new Map(results.map((r) => [r.unit.id, r.unit]));
      setBuilding((prev) => {
        if (!prev) return prev;
        const units = prev.units.map((u) => updatedById.get(u.id) ?? u);
        return {
          ...prev,
          units,
          availableUnitCount: units.filter((u) => u.status === "AVAILABLE")
            .length,
        };
      });
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not update all units.",
      );
      // Resync in case some succeeded before the failure.
      await load();
    } finally {
      setBulkBusy(false);
    }
  }

  async function resubmitForReview() {
    setResubmitting(true);
    setError(null);
    setResubmitMessage(null);
    try {
      await resubmitBuildingForReview(buildingId);
      await load();
      setResubmitMessage(
        "Listing resubmitted — an admin will review it again soon.",
      );
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not resubmit for review.",
      );
    } finally {
      setResubmitting(false);
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

  const unavailableCount = building.units.filter(
    (u) => u.status === "UNAVAILABLE",
  ).length;
  const canBulkAvailable = building.isVerified && unavailableCount >= 2;

  return (
    <div className="space-y-4">
      <Link
        href="/landlord/dashboard"
        className="inline-block text-sm text-primary"
      >
        ← Back to dashboard
      </Link>

      {building.rejectedAt ? (
        <div className="border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-950">
          <p className="font-medium">Listing rejected by admin</p>
          {building.rejectionReason ? (
            <p className="mt-2 whitespace-pre-wrap text-red-900/95">
              {building.rejectionReason}
            </p>
          ) : null}
          <p className="mt-2 text-red-900/90">
            Update photos or details below, then resubmit when you are ready.
          </p>
          <Button
            type="button"
            className="mt-3 bg-red-700 text-white hover:bg-red-800"
            loading={resubmitting}
            loadingLabel="Resubmitting listing"
            onClick={() => void resubmitForReview()}
          >
            Resubmit for review
          </Button>
        </div>
      ) : null}

      {resubmitMessage ? (
        <p className="border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-900">
          {resubmitMessage}
        </p>
      ) : null}

      {!building.isVerified && !building.rejectedAt && (
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
          {unavailableCount > 0 ? (
            <Button
              type="button"
              className="mt-3"
              loading={bulkBusy}
              loadingLabel="Marking units available"
              onClick={() => void markAllAvailable()}
            >
              {unavailableCount === 1
                ? "Mark the unit available"
                : `Mark all ${unavailableCount} units available`}
            </Button>
          ) : null}
        </div>
      ) : null}

      {building.isVerified && building.availableUnitCount > 0 ? (
        <p className="border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-900">
          <strong>Listing is free.</strong> Your units are visible on explore.
          Tenants pay PlotPin only to unlock your contact — you are not charged
          a listing fee.
        </p>
      ) : null}

      {!building.isVerified ? (
        <DashboardSection
          title="Photos"
          description={
            building.rejectedAt
              ? "Fix cover and gallery photos before resubmitting for review."
              : "Update cover and gallery photos while this listing is pending verification."
          }
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
        action={
          canBulkAvailable && building.availableUnitCount > 0 ? (
            <Button
              type="button"
              size="sm"
              variant="outline"
              loading={bulkBusy}
              loadingLabel="Marking units available"
              onClick={() => void markAllAvailable()}
            >
              Mark remaining {unavailableCount} available
            </Button>
          ) : undefined
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
                    {formatListingRentPerMonth(
                      unit.rentAmount,
                      unit.currency,
                      building.countryCode,
                    )}
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
