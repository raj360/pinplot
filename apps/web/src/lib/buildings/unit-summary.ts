import { UnitStatus } from "@plotpin/shared-types";
import { formatRentPerMonth } from "@/lib/intl/format";

export type UnitLike = {
  id: string;
  unitNumber: string;
  bedrooms: number;
  bathrooms: number;
  rentAmount: number;
  rentPeriod?: "month" | "day";
  status: string;
};

export type UnitGroup = {
  count: number;
  bedrooms: number;
  bathrooms: number;
  rentAmount: number;
};

export type RentFormatter = (amount: number) => string;

const defaultFormatRent: RentFormatter = (amount) => formatRentPerMonth(amount);

const DETAIL_LIST_THRESHOLD = 4;

export function groupAvailableUnits(units: UnitLike[]): UnitGroup[] {
  const available = units.filter((u) => u.status === UnitStatus.AVAILABLE);
  if (available.length === 0) return [];

  const groups = new Map<string, UnitGroup>();

  for (const unit of available) {
    const key = `${unit.bedrooms}-${unit.bathrooms}-${unit.rentAmount}`;
    const existing = groups.get(key);
    if (existing) {
      existing.count += 1;
    } else {
      groups.set(key, {
        bedrooms: unit.bedrooms,
        bathrooms: unit.bathrooms,
        rentAmount: unit.rentAmount,
        count: 1,
      });
    }
  }

  return Array.from(groups.values()).sort((a, b) => a.rentAmount - b.rentAmount);
}

/** One-line summary for compact panels and list subtitles. */
export function summarizeAvailableUnits(
  units: UnitLike[],
  formatRent: RentFormatter = defaultFormatRent,
) {
  const groups = groupAvailableUnits(units);
  if (groups.length === 0) return null;

  return groups
    .map((group) => {
      const label = `${group.bedrooms} bed / ${group.bathrooms} bath`;
      const rent = formatRent(group.rentAmount);
      return group.count > 1
        ? `${group.count}× ${label} · ${rent}`
        : `1× ${label} · ${rent}`;
    })
    .join(" · ");
}

export function listAvailableUnits(units: UnitLike[]) {
  return units.filter((u) => u.status === UnitStatus.AVAILABLE);
}

/** Full per-unit rows only when the count stays scannable. */
export function shouldShowUnitDetailList(units: UnitLike[]) {
  return listAvailableUnits(units).length <= DETAIL_LIST_THRESHOLD;
}

export function formatUnitGroup(
  group: UnitGroup,
  formatRent: RentFormatter = defaultFormatRent,
) {
  const label = `${group.bedrooms} bed / ${group.bathrooms} bath`;
  const rent = formatRent(group.rentAmount);
  return group.count > 1
    ? `${group.count} units · ${label} · ${rent}`
    : `1 unit · ${label} · ${rent}`;
}

/** Single unit — bed/bath and monthly rent for unlock cards and tooltips. */
export function formatUnitDetail(
  unit: UnitLike,
  formatRent: RentFormatter = defaultFormatRent,
) {
  return `${unit.bedrooms} bed / ${unit.bathrooms} bath · ${formatRent(unit.rentAmount)}`;
}
