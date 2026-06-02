import type { PriceQuote } from "@plotpin/shared-types";
import { PRICING } from "@plotpin/shared-types";
import { buildingTypeLabel } from "@/lib/filters/building-types";
import { formatCurrency } from "@/lib/intl/format";

export function formatUnlockQuoteLine(quote: PriceQuote) {
  const type = buildingTypeLabel(quote.buildingType ?? "") ?? "listing";
  const bedLabel = quote.bedrooms === 1 ? "1 bed" : `${quote.bedrooms} beds`;
  const fee = formatCurrency(quote.amountUgx);
  if (quote.label) {
    return `${quote.label} · ${fee}`;
  }
  return `${bedLabel} · ${type} · ${fee}`;
}

export function unlockPanelDescription(options: {
  unlockCredits: number;
  primaryCreditUgx: number | null;
  quote: PriceQuote | null;
}) {
  const { unlockCredits, primaryCreditUgx, quote } = options;
  const feeUgx = quote?.amountUgx ?? null;
  const quoteLine = quote ? formatUnlockQuoteLine(quote) : null;

  if (unlockCredits > 0) {
    if (feeUgx != null && primaryCreditUgx != null && primaryCreditUgx < feeUgx) {
      const remainder = feeUgx - primaryCreditUgx;
      return `Quoted ${quoteLine ?? formatCurrency(feeUgx)}. Use 1 credit (${formatCurrency(primaryCreditUgx)} value), then pay ${formatCurrency(remainder)} when checkout is live. Credits are promotional only.`;
    }
    return `You have ${unlockCredits} unlock credit${unlockCredits === 1 ? "" : "s"} — use one to reveal exact address, landlord contact, building tour, and directions. Credits are promotional only, not withdrawable.`;
  }

  if (quoteLine) {
    return `Pay ${quoteLine} to reveal exact address, landlord contact, building tour, and directions. First payment wins exclusive access for ${PRICING.unlockExclusiveHours} hours.`;
  }

  return `Pay to reveal exact address, landlord contact, building tour, and directions. First payment wins exclusive access for ${PRICING.unlockExclusiveHours} hours.`;
}

export function unlockButtonLabel(options: {
  unlockCredits: number;
  primaryCreditUgx: number | null;
  feeUgx: number;
}) {
  const { unlockCredits, primaryCreditUgx, feeUgx } = options;
  if (unlockCredits > 0) {
    if (primaryCreditUgx != null && primaryCreditUgx < feeUgx) {
      return `Unlock — ${formatCurrency(feeUgx - primaryCreditUgx)} after credit`;
    }
    return "Unlock with credit";
  }
  return `Unlock — ${formatCurrency(feeUgx)}`;
}
