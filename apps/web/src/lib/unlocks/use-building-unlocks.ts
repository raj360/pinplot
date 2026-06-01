"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { PaymentPurpose, UnitStatus, type PriceQuote } from "@plotpin/shared-types";
import { useAuth } from "@/lib/auth/use-auth";
import {
  fetchBuildingUnlocks,
  unlockUnit,
  type TenantUnlock,
} from "@/lib/api/unlocks";
import { clearBuildingCache } from "@/lib/api/building-cache";
import { fetchPriceQuote } from "@/lib/api/pricing";
import { fetchWallet } from "@/lib/api/wallet";
import type { UnitLike } from "@/lib/buildings/unit-summary";

type PricingContext = {
  buildingType: string;
  countryCode: string;
};

function applyWalletSummary(
  wallet: Awaited<ReturnType<typeof fetchWallet>>,
  setUnlockCredits: (value: number) => void,
  setPrimaryCreditUgx: (value: number | null) => void,
) {
  setUnlockCredits(wallet.unlockCredits);
  const nextCredit = wallet.credits.find(
    (credit) =>
      credit.purpose === PaymentPurpose.UNLOCK && credit.remainingQuantity > 0,
  );
  setPrimaryCreditUgx(nextCredit?.amountUgx ?? null);
}

export function useBuildingUnlocks(
  buildingId: string,
  units: UnitLike[],
  pricingContext?: PricingContext,
) {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const [myUnlocks, setMyUnlocks] = useState<TenantUnlock[]>([]);
  const [loadedBuildingId, setLoadedBuildingId] = useState<string | null>(null);
  const [unlockingId, setUnlockingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [unlockCredits, setUnlockCredits] = useState(0);
  const [primaryCreditUgx, setPrimaryCreditUgx] = useState<number | null>(null);
  const [unitQuotes, setUnitQuotes] = useState<Record<string, PriceQuote>>({});

  const activeUnlocks = isAuthenticated ? myUnlocks : [];
  const loadingUnlocks =
    isAuthenticated && !authLoading && loadedBuildingId !== buildingId;
  const loading = authLoading || loadingUnlocks;

  const unlockedUnitIds = new Set(activeUnlocks.map((unlock) => unlock.unitId));
  const availableUnits = units.filter(
    (unit) =>
      unit.status === UnitStatus.AVAILABLE && !unlockedUnitIds.has(unit.id),
  );
  const availableUnitKey = availableUnits.map((unit) => unit.id).join(",");
  const shouldFetchQuotes = Boolean(pricingContext && availableUnits.length > 0);

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
        if (cancelled) return;
        applyWalletSummary(wallet, setUnlockCredits, setPrimaryCreditUgx);
      })
      .catch(() => {
        if (cancelled) return;
        setUnlockCredits(0);
        setPrimaryCreditUgx(null);
      });

    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, loadedBuildingId]);

  useEffect(() => {
    if (!shouldFetchQuotes || !pricingContext) return;

    let cancelled = false;

    Promise.all(
      availableUnits.map(async (unit) => {
        const quote = await fetchPriceQuote({
          bedrooms: unit.bedrooms,
          purpose: "UNLOCK",
          buildingType: pricingContext.buildingType,
          countryCode: pricingContext.countryCode,
        });
        return [unit.id, quote] as const;
      }),
    )
      .then((entries) => {
        if (cancelled) return;
        setUnitQuotes(Object.fromEntries(entries));
      })
      .catch(() => {
        if (!cancelled) setUnitQuotes({});
      });

    return () => {
      cancelled = true;
    };
  }, [
    availableUnitKey,
    availableUnits,
    pricingContext,
    shouldFetchQuotes,
  ]);

  const visibleUnitQuotes = useMemo(
    () => (shouldFetchQuotes ? unitQuotes : {}),
    [shouldFetchQuotes, unitQuotes],
  );

  const representativeQuote = useMemo(() => {
    const quotes = Object.values(visibleUnitQuotes);
    if (quotes.length === 0) return null;
    return quotes.reduce((lowest, quote) =>
      quote.amountUgx < lowest.amountUgx ? quote : lowest,
    );
  }, [visibleUnitQuotes]);

  const handleUnlock = useCallback(
    async (unitId: string): Promise<boolean> => {
      setError(null);
      setUnlockingId(unitId);
      try {
        await unlockUnit(unitId);
        clearBuildingCache(buildingId);
        await reloadUnlocks();
        try {
          applyWalletSummary(
            await fetchWallet(),
            setUnlockCredits,
            setPrimaryCreditUgx,
          );
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

  const visibleUnlockCredits = isAuthenticated ? unlockCredits : 0;
  const visiblePrimaryCreditUgx = isAuthenticated ? primaryCreditUgx : null;

  return {
    activeUnlocks,
    availableUnits,
    authLoading,
    error,
    handleUnlock,
    isAuthenticated,
    loading,
    primaryCreditUgx: visiblePrimaryCreditUgx,
    representativeQuote,
    showUnlockSection,
    unitQuotes: visibleUnitQuotes,
    unlockingId,
    unlockCredits: visibleUnlockCredits,
  };
}
