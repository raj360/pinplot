"use client";

import { useCallback, useEffect, useState } from "react";
import { UnitStatus } from "@plotpin/shared-types";
import { useAuth } from "@/lib/auth/use-auth";
import {
  fetchBuildingUnlocks,
  unlockUnit,
  type TenantUnlock,
} from "@/lib/api/unlocks";
import { clearBuildingCache } from "@/lib/api/building-cache";
import { fetchWallet } from "@/lib/api/wallet";
import type { UnitLike } from "@/lib/buildings/unit-summary";

export function useBuildingUnlocks(buildingId: string, units: UnitLike[]) {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const [myUnlocks, setMyUnlocks] = useState<TenantUnlock[]>([]);
  const [loadedBuildingId, setLoadedBuildingId] = useState<string | null>(null);
  const [unlockingId, setUnlockingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [unlockCredits, setUnlockCredits] = useState(0);

  const activeUnlocks = isAuthenticated ? myUnlocks : [];
  const loadingUnlocks =
    isAuthenticated && !authLoading && loadedBuildingId !== buildingId;
  const loading = authLoading || loadingUnlocks;

  const unlockedUnitIds = new Set(activeUnlocks.map((unlock) => unlock.unitId));
  const availableUnits = units.filter(
    (unit) =>
      unit.status === UnitStatus.AVAILABLE && !unlockedUnitIds.has(unit.id),
  );

  const reloadUnlocks = useCallback(async () => {
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

  useEffect(() => {
    if (!isAuthenticated) return;

    let cancelled = false;

    fetchWallet()
      .then((wallet) => {
        if (!cancelled) setUnlockCredits(wallet.unlockCredits);
      })
      .catch(() => {
        if (!cancelled) setUnlockCredits(0);
      });

    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, loadedBuildingId]);

  const handleUnlock = useCallback(
    async (unitId: string): Promise<boolean> => {
      setError(null);
      setUnlockingId(unitId);
      try {
        await unlockUnit(unitId);
        clearBuildingCache(buildingId);
        await reloadUnlocks();
        try {
          const wallet = await fetchWallet();
          setUnlockCredits(wallet.unlockCredits);
        } catch {
          /* wallet refresh is best-effort */
        }
        return true;
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unlock failed");
        return false;
      } finally {
        setUnlockingId(null);
      }
    },
    [buildingId, reloadUnlocks],
  );

  const showUnlockSection =
    !loading && (availableUnits.length > 0 || activeUnlocks.length === 0);

  /** Hide stale credits after sign-out without syncing state in an effect. */
  const visibleUnlockCredits = isAuthenticated ? unlockCredits : 0;

  return {
    activeUnlocks,
    availableUnits,
    authLoading,
    error,
    handleUnlock,
    isAuthenticated,
    loading,
    showUnlockSection,
    unlockingId,
    unlockCredits: visibleUnlockCredits,
  };
}
