"use client";

import Link from "next/link";
import type { PriceQuote } from "@plotpin/shared-types";
import { PRICING, resolveUnlockPolicy, formatPhoneDisplay, isValidStoredPhone } from "@plotpin/shared-types";
import { exploreBuildingUrl } from "@/lib/explore/urls";
import { formatUnitDetail, type UnitLike } from "@/lib/buildings/unit-summary";
import { useViewerContext } from "@/components/providers/ViewerContextProvider";
import {
  formatUnlockQuoteLine,
  unlockButtonLabel,
  unlockPanelDescription,
} from "@/lib/unlocks/unlock-pricing";
import type { UnlockCheckoutMethod } from "@/lib/unlocks/use-building-unlocks";
import { Button } from "@/components/ui/button";
import { TermsAcceptanceField } from "@/components/legal/TermsAcceptanceField";
import { ApproximateLocationNotice } from "@/components/explore/ApproximateLocationNotice";
import { cn } from "@/lib/utils/cn";
import { trackUnlockClick } from "@/lib/analytics/track-listing-events";

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
  showUnlockTerms = false,
  needsUnlockTerms = false,
  acceptUnlockTerms = false,
  onAcceptUnlockTermsChange,
  checkoutMethod = "card",
  onCheckoutMethodChange,
  showMobileMoneyCheckout = false,
  profilePhone = null,
  listingCurrency = "UGX",
  listingCountryCode,
  buildingType,
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
  showUnlockTerms?: boolean;
  /** @deprecated Use showUnlockTerms */
  needsUnlockTerms?: boolean;
  acceptUnlockTerms?: boolean;
  onAcceptUnlockTermsChange?: (value: boolean) => void;
  checkoutMethod?: UnlockCheckoutMethod;
  onCheckoutMethodChange?: (method: UnlockCheckoutMethod) => void;
  showMobileMoneyCheckout?: boolean;
  profilePhone?: string | null;
  /** Building's listing currency (e.g. NGN, UGX) for per-unit rent display. */
  listingCurrency?: string;
  /** Building's country for currency + locale resolution. */
  listingCountryCode?: string;
  /** Drives unlock window copy (72h exclusive vs 24h contact for short-stay). */
  buildingType?: string;
}) {
  const { formatListingRent, formatUnlockFee } = useViewerContext();
  const unlockPolicy = resolveUnlockPolicy({ buildingType });
  const formatUnitRent = (amount: number, period?: "month" | "day") =>
    formatListingRent(
      amount,
      listingCurrency,
      listingCountryCode,
      period ?? unlockPolicy.rentPeriod,
    );
  const defaultDescription = unlockPanelDescription({
    unlockCredits,
    primaryCreditUgx,
    quote: representativeQuote,
    formatFee: formatUnlockFee,
    exclusiveHours: unlockPolicy.exclusiveHours,
    locksUnit: unlockPolicy.locksUnit,
  });

  const listClass = cn(
    "mt-4 grid gap-3",
    layout === "sidebar"
      ? "grid-cols-1"
      : "grid-cols-1 sm:grid-cols-[repeat(auto-fill,minmax(15rem,1fr))]",
  );

  const showPaymentMethodPicker =
    isAuthenticated &&
    availableUnits.length > 0 &&
    onCheckoutMethodChange != null;

  const resolvedShowUnlockTerms = showUnlockTerms || needsUnlockTerms;

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
        <ApproximateLocationNotice className="mt-4" />
        {resolvedShowUnlockTerms && onAcceptUnlockTermsChange ? (
          <TermsAcceptanceField
            className="mt-4"
            checked={acceptUnlockTerms}
            onCheckedChange={onAcceptUnlockTermsChange}
          />
        ) : null}
        {showPaymentMethodPicker ? (
          <fieldset className="mt-4 space-y-2">
            <legend className="text-sm font-medium text-foreground">
              Payment method
            </legend>
            <label className="flex cursor-pointer items-start gap-2 border border-border bg-background p-3 text-sm has-[:checked]:border-primary has-[:checked]:ring-1 has-[:checked]:ring-primary/30">
              <input
                type="radio"
                name="unlock-checkout-method"
                className="mt-0.5"
                checked={checkoutMethod === "card"}
                onChange={() => onCheckoutMethodChange("card")}
              />
              <span>
                <span className="font-medium">Card</span>
                <span className="mt-0.5 block text-xs text-muted">
                  Visa · Mastercard · Apple Pay (international checkout)
                </span>
              </span>
            </label>
            {showMobileMoneyCheckout ? (
              <label className="flex cursor-pointer items-start gap-2 border border-border bg-background p-3 text-sm has-[:checked]:border-primary has-[:checked]:ring-1 has-[:checked]:ring-primary/30">
                <input
                  type="radio"
                  name="unlock-checkout-method"
                  className="mt-0.5"
                  checked={checkoutMethod === "mobile_money"}
                  onChange={() => onCheckoutMethodChange("mobile_money")}
                />
                <span>
                  <span className="font-medium">Mobile money</span>
                  <span className="mt-0.5 block text-xs text-muted">
                    MTN · Airtel · M-Pesa (UGX via Flutterwave)
                  </span>
                  {checkoutMethod === "mobile_money" ? (
                    isValidStoredPhone(profilePhone) ? (
                      <span className="mt-1 block text-xs text-muted">
                        Push notification goes to{" "}
                        {formatPhoneDisplay(profilePhone!)}
                      </span>
                    ) : (
                      <span className="mt-1 block text-xs text-amber-800">
                        Add your MoMo number in{" "}
                        <Link href="/settings" className="text-primary underline">
                          Settings
                        </Link>{" "}
                        before paying — Flutterwave sends the PIN prompt to that
                        number.
                      </span>
                    )
                  ) : null}
                </span>
              </label>
            ) : null}
          </fieldset>
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
                    {formatUnitDetail(unit, (amount) =>
                      formatUnitRent(amount, unit.rentPeriod),
                    )}
                  </p>
                  {quote ? (
                    <p className="mt-1 text-xs text-muted">
                      {formatUnlockQuoteLine(quote, formatUnlockFee)}
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
                  onClick={() => {
                    trackUnlockClick(buildingId, unit.id);
                    onUnlock(unit.id);
                  }}
                >
                  {unlockButtonLabel({
                    unlockCredits,
                    primaryCreditUgx,
                    feeUgx,
                    formatFee: formatUnlockFee,
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
            ? "Credits apply when they cover the full quoted fee. Otherwise you pay via your selected checkout."
            : "You will be redirected to a secure checkout to complete payment."}
        </p>
      ) : null}
    </div>
  );
}
