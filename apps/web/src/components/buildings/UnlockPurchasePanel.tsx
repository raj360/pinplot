"use client";

import Link from "next/link";
import type { PriceQuote } from "@plotpin/shared-types";
import { PRICING } from "@plotpin/shared-types";
import { exploreBuildingUrl } from "@/lib/explore/urls";
import { formatUnitDetail, type UnitLike } from "@/lib/buildings/unit-summary";
import {
  formatUnlockQuoteLine,
  unlockButtonLabel,
  unlockPanelDescription,
} from "@/lib/unlocks/unlock-pricing";
import { Button } from "@/components/ui/button";
import { TermsAcceptanceField } from "@/components/legal/TermsAcceptanceField";
import { cn } from "@/lib/utils/cn";

export function UnlockPurchasePanel({
  buildingId,
  availableUnits,
  error,
  isAuthenticated,
  onUnlock,
  unlockingId,
  unlockCredits = 0,
  primaryCreditUgx = null,
  unitQuotes = {},
  representativeQuote = null,
  title = "Unlock contact",
  description,
  showHeading = true,
  layout = "grid",
  needsUnlockTerms = false,
  acceptUnlockTerms = false,
  onAcceptUnlockTermsChange,
}: {
  buildingId: string;
  availableUnits: UnitLike[];
  error: string | null;
  isAuthenticated: boolean;
  onUnlock: (unitId: string) => void;
  unlockingId: string | null;
  unlockCredits?: number;
  primaryCreditUgx?: number | null;
  unitQuotes?: Record<string, PriceQuote>;
  representativeQuote?: PriceQuote | null;
  title?: string;
  description?: string;
  showHeading?: boolean;
  layout?: "grid" | "sidebar";
  needsUnlockTerms?: boolean;
  acceptUnlockTerms?: boolean;
  onAcceptUnlockTermsChange?: (value: boolean) => void;
}) {
  const defaultDescription = unlockPanelDescription({
    unlockCredits,
    primaryCreditUgx,
    quote: representativeQuote,
  });

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
        <>
        {needsUnlockTerms && onAcceptUnlockTermsChange ? (
          <TermsAcceptanceField
            className="mt-4"
            checked={acceptUnlockTerms}
            onCheckedChange={onAcceptUnlockTermsChange}
          />
        ) : null}
        <ul className={listClass}>
          {availableUnits.map((unit) => {
            const quote = unitQuotes[unit.id] ?? representativeQuote;
            const feeUgx = quote?.amountUgx ?? PRICING.tenantUnlockFeeUgx;

            return (
              <li
                key={unit.id}
                className="flex min-w-0 flex-col gap-3 border border-border bg-background p-3"
              >
                <div>
                  <p className="font-medium">Unit {unit.unitNumber}</p>
                  <p className="mt-0.5 text-sm text-foreground">
                    {formatUnitDetail(unit)}
                  </p>
                  {quote ? (
                    <p className="mt-1 text-xs text-muted">
                      {formatUnlockQuoteLine(quote)}
                    </p>
                  ) : (
                    <p className="mt-1 text-xs text-muted">Available now</p>
                  )}
                </div>
                <Button
                  type="button"
                  className="w-full"
                  loading={unlockingId === unit.id}
                  loadingLabel="Unlocking unit"
                  onClick={() => onUnlock(unit.id)}
                >
                  {unlockButtonLabel({
                    unlockCredits,
                    primaryCreditUgx,
                    feeUgx,
                  })}
                </Button>
              </li>
            );
          })}
        </ul>
        </>
      )}

      {error ? <p className="mt-3 text-sm text-red-600">{error}</p> : null}

      {isAuthenticated && availableUnits.length > 0 ? (
        <p className="mt-3 text-xs text-muted">
          {unlockCredits > 0
            ? "Your credit covers this unlock in dev when it matches the quoted fee — no card charge until payments go live."
            : "Dev mode: payment simulated until Flutterwave / Lemon Squeezy is connected (Sprint 5B)."}
        </p>
      ) : null}
    </div>
  );
}
