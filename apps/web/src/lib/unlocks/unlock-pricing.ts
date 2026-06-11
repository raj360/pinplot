import type { PriceQuote } from "@plotpin/shared-types";
import { PRICING } from "@plotpin/shared-types";
import { buildingTypeLabel } from "@/lib/filters/building-types";
import { formatCurrency } from "@/lib/intl/format";

/** Formats a canonical-UGX fee. Override to present in the viewer's currency. */
export type FeeFormatter = (amountUgx: number) => string;

const defaultFeeFormatter: FeeFormatter = (amountUgx) =>
  formatCurrency(amountUgx);

export function formatUnlockQuoteLine(
  quote: PriceQuote,
  formatFee: FeeFormatter = defaultFeeFormatter,
) {
  const type = buildingTypeLabel(quote.buildingType ?? "") ?? "listing";
  const bedLabel = quote.bedrooms === 1 ? "1 bed" : `${quote.bedrooms} beds`;
  const fee = formatFee(quote.amountUgx);
  if (quote.label) {
    return `${quote.label} · ${fee}`;
  }
  return `${bedLabel} · ${type} · ${fee}`;
}

export function unlockPanelDescription(options: {
  unlockCredits: number;
  primaryCreditUgx: number | null;
  quote: PriceQuote | null;
  formatFee?: FeeFormatter;
  exclusiveHours?: number;
  locksUnit?: boolean;
}) {
  const { unlockCredits, primaryCreditUgx, quote } = options;
  const formatFee = options.formatFee ?? defaultFeeFormatter;
  const feeUgx = quote?.amountUgx ?? null;
  const quoteLine = quote ? formatUnlockQuoteLine(quote, formatFee) : null;
  const hours = options.exclusiveHours ?? PRICING.unlockExclusiveHours;
  const locksUnit = options.locksUnit ?? true;
  const accessLine = locksUnit
    ? `First payment wins exclusive access for ${hours} hours.`
    : `Verified contact access for ${hours} hours.`;

  if (unlockCredits > 0) {
    if (feeUgx != null && primaryCreditUgx != null && primaryCreditUgx < feeUgx) {
      const remainder = feeUgx - primaryCreditUgx;
      return `Quoted ${quoteLine ?? formatFee(feeUgx)}. Use 1 credit (${formatFee(primaryCreditUgx)} value), then pay ${formatFee(remainder)} when checkout is live. Credits are promotional only.`;
    }
    return `You have ${unlockCredits} unlock credit${unlockCredits === 1 ? "" : "s"} — use one to reveal exact address, landlord contact, building tour, and directions. Credits are promotional only, not withdrawable.`;
  }

  if (quoteLine) {
    return `Pay ${quoteLine} to reveal exact address, landlord contact, building tour, and directions. ${accessLine}`;
  }

  return `Pay to reveal exact address, landlord contact, building tour, and directions. ${accessLine}`;
}

export function unlockButtonLabel(options: {
  unlockCredits: number;
  primaryCreditUgx: number | null;
  feeUgx: number;
  formatFee?: FeeFormatter;
}) {
  const { unlockCredits, primaryCreditUgx, feeUgx } = options;
  const formatFee = options.formatFee ?? defaultFeeFormatter;
  if (unlockCredits > 0) {
    if (primaryCreditUgx != null && primaryCreditUgx < feeUgx) {
      return `Unlock — ${formatFee(feeUgx - primaryCreditUgx)} after credit`;
    }
    return "Unlock with credit";
  }
  return `Unlock — ${formatFee(feeUgx)}`;
}
