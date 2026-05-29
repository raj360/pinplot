"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { PRICING, UnitStatus } from "@plotpin/shared-types";
import { formatCurrency } from "@/lib/intl/format";
import { useAuth } from "@/lib/auth/use-auth";
import {
  fetchBuildingUnlocks,
  unlockUnit,
  type TenantUnlock,
} from "@/lib/api/unlocks";
import { UnlockedAccessCard } from "@/components/buildings/UnlockedAccessCard";
import { Button } from "@/components/ui/button";
import { LoadingState } from "@/components/ui/loading-state";

type Unit = {
  id: string;
  unitNumber: string;
  status: string;
};

export function UnlockPanel({
  buildingId,
  units,
}: {
  buildingId: string;
  units: Unit[];
}) {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const [myUnlocks, setMyUnlocks] = useState<TenantUnlock[]>([]);
  const [loadedBuildingId, setLoadedBuildingId] = useState<string | null>(null);
  const [unlockingId, setUnlockingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const activeUnlocks = isAuthenticated ? myUnlocks : [];
  const loadingUnlocks =
    isAuthenticated && !authLoading && loadedBuildingId !== buildingId;
  const unlockedUnitIds = new Set(activeUnlocks.map((u) => u.unitId));
  const availableUnits = units.filter(
    (u) =>
      u.status === UnitStatus.AVAILABLE && !unlockedUnitIds.has(u.id),
  );

  const loadUnlocks = useCallback(async () => {
    try {
      setMyUnlocks(await fetchBuildingUnlocks(buildingId));
    } catch {
      setMyUnlocks([]);
    } finally {
      setLoadedBuildingId(buildingId);
    }
  }, [buildingId]);

  useEffect(() => {
    if (!isAuthenticated) return;

    let cancelled = false;

    fetchBuildingUnlocks(buildingId)
      .then((data) => {
        if (cancelled) return;
        setMyUnlocks(data);
        setLoadedBuildingId(buildingId);
      })
      .catch(() => {
        if (cancelled) return;
        setMyUnlocks([]);
        setLoadedBuildingId(buildingId);
      });

    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, buildingId]);

  async function handleUnlock(unitId: string) {
    setError(null);
    setUnlockingId(unitId);
    try {
      await unlockUnit(unitId);
      await loadUnlocks();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unlock failed");
    } finally {
      setUnlockingId(null);
    }
  }

  const showUnlockSection =
    !authLoading &&
    !loadingUnlocks &&
    (availableUnits.length > 0 || myUnlocks.length === 0);

  if (authLoading || loadingUnlocks) {
    return (
      <section className="mt-8">
        <LoadingState label="Loading unlock status" compact />
      </section>
    );
  }

  return (
    <section className="mt-8 space-y-6">
      {activeUnlocks.length > 0 ? (
        <div className="space-y-4">
          <div>
            <h2 className="text-lg font-bold">Your exclusive access</h2>
            <p className="mt-1 text-sm text-muted">
              Contact, map, and directions for units you unlocked.
            </p>
          </div>
          {activeUnlocks.map((unlock) => (
            <UnlockedAccessCard
              key={unlock.unlockId}
              unlock={unlock}
              showBuildingLink={false}
            />
          ))}
        </div>
      ) : null}

      {showUnlockSection ? (
        <div className="border border-border bg-surface p-4">
          <h2 className="font-semibold">Unlock contact</h2>
          <p className="mt-2 text-sm text-muted">
            Pay {formatCurrency(PRICING.tenantUnlockFeeUgx)} to reveal exact address,
            landlord contact, and directions. First payment wins exclusive access
            for {PRICING.unlockExclusiveHours} hours.
          </p>

          {!isAuthenticated ? (
            <Link
              href={`/auth/login?next=/buildings/${buildingId}`}
              className="mt-4 inline-block bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
            >
              Sign in to unlock
            </Link>
          ) : availableUnits.length === 0 ? (
            <p className="mt-4 text-sm text-muted">
              No units are available to unlock right now.
            </p>
          ) : (
            <ul className="mt-4 space-y-3">
              {availableUnits.map((unit) => (
                <li
                  key={unit.id}
                  className="flex flex-wrap items-center justify-between gap-3 border border-border bg-background p-4"
                >
                  <div>
                    <p className="font-medium">Unit {unit.unitNumber}</p>
                    <p className="text-xs text-muted">Available now</p>
                  </div>
                  <Button
                    type="button"
                    loading={unlockingId === unit.id}
                    loadingLabel="Unlocking unit"
                    onClick={() => handleUnlock(unit.id)}
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
      ) : null}
    </section>
  );
}
