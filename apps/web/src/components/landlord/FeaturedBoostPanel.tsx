"use client";

import { useState } from "react";
import { Sparkles } from "lucide-react";
import { FEATURED_PRICING_TIERS } from "@plotpin/shared-types";
import { Button } from "@/components/ui/button";
import { startFeaturedCheckout } from "@/lib/api/payments";
import { useViewerContext } from "@/components/providers/ViewerContextProvider";

type FeaturedBoostPanelProps = {
  buildingId: string;
  isVerified: boolean;
  isFeatured: boolean;
  featuredUntil: string | null;
  featuredSource: string | null;
  /** All-time paid unlocks — shown as ROI context for the boost. */
  unlockCount: number;
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function FeaturedBoostPanel({
  buildingId,
  isVerified,
  isFeatured,
  featuredUntil,
  featuredSource,
  unlockCount,
}: FeaturedBoostPanelProps) {
  const { viewer, formatUnlockFeeLabel } = useViewerContext();
  const [startingDays, setStartingDays] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!isVerified) return null;

  const isUganda = viewer.countryCode === "UG";

  const handleBuy = async (days: number) => {
    setError(null);
    setStartingDays(days);
    try {
      const checkout = await startFeaturedCheckout({
        buildingId,
        durationDays: days,
        payerCountryCode: viewer.countryCode,
      });
      window.location.assign(checkout.checkoutUrl);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not start checkout.",
      );
      setStartingDays(null);
    }
  };

  return (
    <section className="border border-border bg-surface p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="flex items-center gap-2 font-semibold">
            <Sparkles className="size-4 text-accent-orange" aria-hidden />
            Featured boost
          </h2>
          <p className="mt-1 text-sm text-muted">
            Featured listings appear on the PlotPin homepage and rank first on
            the map — more views, more unlocks.
          </p>
        </div>
        {isFeatured && featuredUntil ? (
          <span className="shrink-0 bg-amber-100 px-2 py-1 text-xs font-medium text-amber-900">
            Featured until {formatDate(featuredUntil)}
          </span>
        ) : null}
      </div>

      <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
        <div className="border border-border bg-background p-3">
          <dt className="text-xs text-muted">Tenant unlocks (all time)</dt>
          <dd className="mt-0.5 text-lg font-semibold">{unlockCount}</dd>
        </div>
        <div className="border border-border bg-background p-3">
          <dt className="text-xs text-muted">Featured status</dt>
          <dd className="mt-0.5 text-lg font-semibold">
            {isFeatured
              ? featuredSource === "PAID"
                ? "Active · paid"
                : "Active"
              : "Not featured"}
          </dd>
        </div>
      </dl>

      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        {FEATURED_PRICING_TIERS.map((tier) => {
          const price = formatUnlockFeeLabel(tier.amountUgx);
          const priceLabel =
            isUganda && price.footnote
              ? `${price.primary} (${price.footnote})`
              : price.primary;
          return (
            <div
              key={tier.days}
              className="flex flex-col gap-2 border border-border bg-background p-3"
            >
              <p className="font-medium">{tier.days} days</p>
              <p className="text-sm text-foreground">{priceLabel}</p>
              <Button
                type="button"
                className="mt-auto w-full"
                loading={startingDays === tier.days}
                loadingLabel="Starting checkout"
                disabled={startingDays !== null}
                onClick={() => void handleBuy(tier.days)}
              >
                {isFeatured ? "Extend" : "Feature"} · {tier.days}d
              </Button>
            </div>
          );
        })}
      </div>

      {error ? <p className="mt-3 text-sm text-red-600">{error}</p> : null}

      <p className="mt-3 text-xs text-muted">
        Extending adds days on top of any active featured window. You will be
        redirected to a secure checkout.
      </p>
    </section>
  );
}
