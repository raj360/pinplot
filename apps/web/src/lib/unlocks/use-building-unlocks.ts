"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  PaymentPurpose,
  PRICING,
  UnitStatus,
  isFlutterwaveMoMoCountry,
  isValidStoredPhone,
  type PriceQuote,
} from "@plotpin/shared-types";
import { startUnlockCheckout } from "@/lib/api/payments";
import { useAuth } from "@/lib/auth/use-auth";
import { fetchBuildingUnlocks, unlockUnit, type TenantUnlock } from "@/lib/api/unlocks";
import { fetchBuildingUnlocksFresh } from "@/lib/api/unlocks-cache";
import { clearBuildingCache } from "@/lib/api/building-cache";
import { fetchPriceQuote } from "@/lib/api/pricing";
import {
  clearWalletCache,
  fetchWalletCached,
  getCachedWallet,
} from "@/lib/api/wallet-cache";
import type { UnitLike } from "@/lib/buildings/unit-summary";

type PricingContext = {
  buildingType: string;
  countryCode: string;
  tenantCountryCode?: string;
};

type UnitQuoteState = {
  buildingId: string;
  quotes: Record<string, PriceQuote>;
};

type UnlockFetchState = {
  buildingId: string;
  forAuthenticated: boolean;
  unlocks: TenantUnlock[];
};

type WalletFetchState = {
  forAuthenticated: boolean;
  unlockCredits: number;
  primaryCreditUgx: number | null;
};

export type UnlockCheckoutMethod = "card" | "mobile_money";

function walletFromSummary(
  wallet: Awaited<ReturnType<typeof fetchWalletCached>>,
): Pick<WalletFetchState, "unlockCredits" | "primaryCreditUgx"> {
  const primaryCredit = wallet.credits.find(
    (credit) =>
      credit.purpose === PaymentPurpose.UNLOCK && credit.remainingQuantity > 0,
  );
  return {
    unlockCredits: wallet.unlockCredits,
    primaryCreditUgx: primaryCredit?.amountUgx ?? null,
  };
}

function initialWalletState(): WalletFetchState | null {
  const cached = getCachedWallet();
  if (!cached) return null;
  return { forAuthenticated: true, ...walletFromSummary(cached) };
}

export function useBuildingUnlocks(
  buildingId: string,
  units: UnitLike[],
  pricingContext?: PricingContext,
) {
  const { isAuthenticated, loading: authLoading, profile, refreshProfile } =
    useAuth();
  const termsAcceptedOnProfile = Boolean(profile?.tenant_unlock_terms_accepted_at);
  const [acceptUnlockTermsOverride, setAcceptUnlockTermsOverride] = useState<
    boolean | null
  >(null);
  const acceptUnlockTerms = acceptUnlockTermsOverride ?? termsAcceptedOnProfile;
  const setAcceptUnlockTerms = useCallback((value: boolean) => {
    setAcceptUnlockTermsOverride(value);
  }, []);
  const showUnlockTerms = isAuthenticated;

  const [unlockState, setUnlockState] = useState<UnlockFetchState | null>(null);
  const [walletState, setWalletState] = useState<WalletFetchState | null>(
    initialWalletState,
  );
  const [unlockingId, setUnlockingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  // Default to mobile money only for payers in Flutterwave MoMo markets (e.g.
  // Uganda); diaspora / card markets default to Lemon Squeezy card checkout.
  const payerCountryCode = pricingContext?.tenantCountryCode;
  const prefersMobileMoney = isFlutterwaveMoMoCountry(payerCountryCode);
  const [checkoutMethod, setCheckoutMethod] = useState<UnlockCheckoutMethod>(
    prefersMobileMoney ? "mobile_money" : "card",
  );
  const [unitQuoteState, setUnitQuoteState] = useState<UnitQuoteState>({
    buildingId: "",
    quotes: {},
  });

  const unlocksMatch =
    isAuthenticated &&
    unlockState?.buildingId === buildingId &&
    unlockState.forAuthenticated;

  const resolvedUnlocks = unlocksMatch ? unlockState.unlocks : [];
  const activeUnlocks = isAuthenticated ? resolvedUnlocks : [];
  const loadingUnlocks =
    isAuthenticated && !authLoading && !unlocksMatch;
  const loading = authLoading || loadingUnlocks;

  const walletMatch =
    isAuthenticated && walletState?.forAuthenticated === true;
  const unlockCredits = walletMatch ? walletState.unlockCredits : 0;
  const primaryCreditUgx = walletMatch ? walletState.primaryCreditUgx : null;

  const unlockedUnitIds = new Set(activeUnlocks.map((unlock) => unlock.unitId));
  const availableUnits = units.filter(
    (unit) =>
      unit.status === UnitStatus.AVAILABLE && !unlockedUnitIds.has(unit.id),
  );
  const availableUnitKey = availableUnits.map((unit) => unit.id).join(",");
  const pricingContextKey = pricingContext
    ? `${pricingContext.buildingType}:${pricingContext.countryCode}`
    : "";
  const shouldFetchQuotes = Boolean(pricingContextKey && availableUnits.length > 0);

  const showMobileMoneyCheckout = prefersMobileMoney;

  const resolvedCheckoutMethod: UnlockCheckoutMethod =
    showMobileMoneyCheckout && checkoutMethod === "mobile_money"
      ? "mobile_money"
      : "card";

  useEffect(() => {
    setCheckoutMethod(
      isFlutterwaveMoMoCountry(payerCountryCode) ? "mobile_money" : "card",
    );
  }, [payerCountryCode]);

  useEffect(() => {
    if (!isAuthenticated || authLoading) return;

    let cancelled = false;

    fetchBuildingUnlocksFresh(buildingId)
      .then((data) => {
        if (cancelled) return;
        setUnlockState({
          buildingId,
          forAuthenticated: true,
          unlocks: data,
        });
      })
      .catch(() => {
        if (cancelled) return;
        setUnlockState({
          buildingId,
          forAuthenticated: true,
          unlocks: [],
        });
      });

    return () => {
      cancelled = true;
    };
  }, [authLoading, buildingId, isAuthenticated]);

  useEffect(() => {
    if (!isAuthenticated || authLoading) return;

    let cancelled = false;

    fetchWalletCached()
      .then((wallet) => {
        if (cancelled) return;
        setWalletState({
          forAuthenticated: true,
          ...walletFromSummary(wallet),
        });
      })
      .catch(() => {
        if (cancelled) return;
        setWalletState({
          forAuthenticated: true,
          unlockCredits: 0,
          primaryCreditUgx: null,
        });
      });

    return () => {
      cancelled = true;
    };
  }, [authLoading, isAuthenticated]);

  useEffect(() => {
    if (!shouldFetchQuotes || !pricingContext) return;

    let cancelled = false;
    const context = pricingContext;
    const requestBuildingId = buildingId;

    const bedroomCounts = [
      ...new Set(availableUnits.map((unit) => unit.bedrooms)),
    ];

    Promise.all(
      bedroomCounts.map(async (bedrooms) => {
        const quote = await fetchPriceQuote({
          bedrooms,
          purpose: "UNLOCK",
          buildingType: context.buildingType,
          countryCode: context.countryCode,
        });
        return [bedrooms, quote] as const;
      }),
    )
      .then((entries) => {
        if (cancelled) return;
        const byBedrooms = Object.fromEntries(entries);
        const next: Record<string, PriceQuote> = {};
        for (const unit of availableUnits) {
          const quote = byBedrooms[unit.bedrooms];
          if (quote) next[unit.id] = quote;
        }
        setUnitQuoteState({ buildingId: requestBuildingId, quotes: next });
      })
      .catch(() => {
        if (!cancelled) {
          setUnitQuoteState({ buildingId: requestBuildingId, quotes: {} });
        }
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- stable keys only; pricingContext object is recreated each render
  }, [availableUnitKey, pricingContextKey, shouldFetchQuotes]);

  const visibleUnitQuotes = useMemo(() => {
    if (!shouldFetchQuotes) return {};
    if (unitQuoteState.buildingId !== buildingId) return {};
    return unitQuoteState.quotes;
  }, [buildingId, shouldFetchQuotes, unitQuoteState]);

  const representativeQuote = useMemo(() => {
    const quotes = Object.values(visibleUnitQuotes);
    if (quotes.length === 0) return null;
    return quotes.reduce((lowest, quote) =>
      quote.amountUgx < lowest.amountUgx ? quote : lowest,
    );
  }, [visibleUnitQuotes]);

  const reloadUnlocks = useCallback(async () => {
    try {
      const unlocks = await fetchBuildingUnlocks(buildingId);
      setUnlockState({
        buildingId,
        forAuthenticated: true,
        unlocks,
      });
    } catch {
      setUnlockState({
        buildingId,
        forAuthenticated: true,
        unlocks: [],
      });
    }
  }, [buildingId]);

  const handleUnlock = useCallback(
    async (unitId: string): Promise<boolean> => {
      if (isAuthenticated && !acceptUnlockTerms) {
        setError("Accept the Terms of Service and Privacy Policy to unlock.");
        return false;
      }
      setError(null);
      setUnlockingId(unitId);
      try {
        const quote = visibleUnitQuotes[unitId] ?? representativeQuote;
        const feeUgx = quote?.amountUgx ?? PRICING.tenantUnlockFeeUgx;
        const canRedeemCredit =
          unlockCredits > 0 &&
          (primaryCreditUgx == null || primaryCreditUgx >= feeUgx);

        if (!canRedeemCredit) {
          if (
            resolvedCheckoutMethod === "mobile_money" &&
            !isValidStoredPhone(profile?.phone)
          ) {
            setError(
              "Add a mobile money phone number to your profile before paying with MoMo.",
            );
            return false;
          }

          const checkout = await startUnlockCheckout(unitId, {
            acceptTerms: acceptUnlockTerms,
            tenantCountryCode: pricingContext?.tenantCountryCode,
            providerPreference:
              resolvedCheckoutMethod === "mobile_money"
                ? "flutterwave"
                : "lemon_squeezy",
          });

          if (checkout.mode === "checkout") {
            if (!termsAcceptedOnProfile) {
              await refreshProfile();
            }
            window.location.assign(checkout.checkoutUrl);
            return true;
          }
        }

        await unlockUnit(unitId, {
          acceptTerms: acceptUnlockTerms,
        });
        if (!termsAcceptedOnProfile) {
          await refreshProfile();
        }
        clearBuildingCache(buildingId);
        clearWalletCache();
        await reloadUnlocks();
        try {
          const wallet = await fetchWalletCached();
          setWalletState({
            forAuthenticated: true,
            ...walletFromSummary(wallet),
          });
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
    [
      acceptUnlockTerms,
      buildingId,
      isAuthenticated,
      primaryCreditUgx,
      pricingContext,
      profile,
      refreshProfile,
      reloadUnlocks,
      resolvedCheckoutMethod,
      representativeQuote,
      termsAcceptedOnProfile,
      unlockCredits,
      visibleUnitQuotes,
    ],
  );

  const showUnlockSection =
    !loadingUnlocks && (availableUnits.length > 0 || activeUnlocks.length === 0);

  return {
    activeUnlocks,
    availableUnits,
    authLoading,
    error,
    handleUnlock,
    isAuthenticated,
    loading,
    loadingUnlocks,
    primaryCreditUgx,
    representativeQuote,
    showUnlockSection,
    unitQuotes: visibleUnitQuotes,
    unlockingId,
    unlockCredits,
    needsUnlockTerms: showUnlockTerms,
    showUnlockTerms,
    acceptUnlockTerms,
    setAcceptUnlockTerms,
    checkoutMethod,
    setCheckoutMethod,
    showMobileMoneyCheckout,
    profilePhone: profile?.phone ?? null,
  };
}
