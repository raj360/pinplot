export const APP_NAME = "PlotPin";
export const APP_VERSION = "0.1.0";

export const DEFAULT_COUNTRY = {
  code: "UG",
  name: "Uganda",
  currency: "UGX",
} as const;

export const PRICING = {
  tenantUnlockFeeUgx: 20_000,
  landlordListingFeeUgx: 30_000,
  /** Long-term rentals — first payer locks the unit on the map. */
  unlockExclusiveHours: 72,
  /** Short-stay (nightly) — verified contact window; unit stays available. */
  shortStayUnlockHours: 24,
} as const;

export const RENT_PERIODS = ["month", "day"] as const;
export type RentPeriod = (typeof RENT_PERIODS)[number];

export function defaultRentPeriodForBuildingType(
  buildingType?: string | null,
): RentPeriod {
  return buildingType === "airbnb" ? "day" : "month";
}

/** User-facing rent suffix — short-stay uses /night (stored as `day` in DB). */
export function rentPeriodSuffix(period: RentPeriod): "/mo" | "/night" {
  return period === "day" ? "/night" : "/mo";
}

export function rentPeriodColumnLabel(
  period: RentPeriod,
  currency: string,
): string {
  return period === "day"
    ? `Rent per night (${currency})`
    : `Rent per month (${currency})`;
}

/** Unlock duration and whether the unit leaves the AVAILABLE map pool. */
export function resolveUnlockPolicy(params: {
  buildingType?: string | null;
  rentPeriod?: RentPeriod | string | null;
}) {
  const rentPeriod: RentPeriod =
    params.rentPeriod === "day" || params.rentPeriod === "month"
      ? params.rentPeriod
      : defaultRentPeriodForBuildingType(params.buildingType);

  const isShortStay = rentPeriod === "day";

  return {
    rentPeriod,
    exclusiveHours: isShortStay
      ? PRICING.shortStayUnlockHours
      : PRICING.unlockExclusiveHours,
    /** When false the unit stays AVAILABLE on explore during an active unlock. */
    locksUnit: !isShortStay,
  };
}

/**
 * Paid featured boost tiers (S5-08) — canonical UGX; presented in the payer's
 * currency at checkout via UGX-hub FX. Duration stacks on top of any active
 * featured window.
 */
export const FEATURED_PRICING_TIERS = [
  { days: 7, amountUgx: 30_000 },
  { days: 14, amountUgx: 50_000 },
  { days: 30, amountUgx: 90_000 },
] as const;

export type FeaturedPricingTier = (typeof FEATURED_PRICING_TIERS)[number];

export function findFeaturedTier(days: number): FeaturedPricingTier | null {
  return FEATURED_PRICING_TIERS.find((tier) => tier.days === days) ?? null;
}

/** Max pending/unverified buildings per landlord account (Sprint 5A). */
export const MAX_UNVERIFIED_BUILDINGS_PER_LANDLORD = 3;

/** Admin duplicate-pin warning radius (meters). */
export const DUPLICATE_PIN_RADIUS_METERS = 50;

export type AdminVerificationChecklist = {
  phoneMatchesListing: boolean;
  photosAuthentic: boolean;
  pinPlausible: boolean;
  rentConsistent: boolean;
  duplicatePinReviewed: boolean;
  landlordNotSuspended: boolean;
  ownershipAttestationRecorded: boolean;
};

export const REJECT_REASON_PRESETS = [
  "Cannot verify ownership or authority to list this property.",
  "Duplicate or conflicting listing at this location.",
  "Photos are misleading, stock images, or missing the actual building.",
  "Map pin does not match the stated district or city.",
  "Rent information is inconsistent across units.",
  "Suspected broker or third-party listing without authorization.",
] as const;

/** Preset for duplicate-pin rejections (index 1 in REJECT_REASON_PRESETS). */
export const DUPLICATE_PIN_REJECT_REASON = REJECT_REASON_PRESETS[1];

export const LISTING_REPORT_REASONS = [
  "Suspected scam or unauthorized blockage/viewing fees",
  "Wrong location or misleading map pin",
  "Misleading photos or not the actual property",
  "Already rented / not available",
  "Other",
] as const;

/** Max building photos per listing (cover + gallery). */
export const MAX_BUILDING_PHOTOS = 4;

/** Client-side compression targets before Supabase upload. */
export const BUILDING_IMAGE = {
  FULL_MAX_PX: 1600,
  FULL_JPEG_QUALITY: 0.85,
  /** Max stored full JPEG (~300–500 KB typical at quality 0.85). */
  FULL_MAX_BYTES: 3 * 1024 * 1024,
  THUMB_MAX_PX: 640,
  THUMB_JPEG_QUALITY: 0.82,
  /** Max stored thumb JPEG (~100–150 KB typical). */
  THUMB_MAX_BYTES: 200 * 1024,
  /** Accept large phone originals; compression runs before upload. */
  SOURCE_MAX_BYTES: 25 * 1024 * 1024,
} as const;

export type PriceQuote = {
  purpose: PaymentPurpose;
  amountUgx: number;
  unlockFeeUgx: number;
  listingFeeUgx: number;
  currency: string;
  countryCode: string;
  buildingType: BuildingType | null;
  bedrooms: number;
  label?: string;
  note?: string;
};

export enum UserRole {
  SUPERADMIN = "SUPERADMIN",
  ADMIN = "ADMIN",
  LANDLORD = "LANDLORD",
  TENANT = "TENANT",
}

export enum UnitStatus {
  UNAVAILABLE = "UNAVAILABLE",
  AVAILABLE = "AVAILABLE",
  LOCKED = "LOCKED",
  RENTED = "RENTED",
}

/**
 * Countries where Flutterwave exposes mobile-money checkout (MTN, Airtel, M-Pesa, …).
 * Source: Flutterwave help — "Pay with Mobile Money" (UG, KE, TZ, RW, GH, ZM, MW, BF, CI, CM, SN).
 * Nigeria, South Africa, etc. use Flutterwave for cards/bank rails but not this MoMo product.
 */
export const FLUTTERWAVE_MOMO_COUNTRIES = new Set([
  "UG",
  "KE",
  "TZ",
  "RW",
  "GH",
  "ZM",
  "MW",
  "BF",
  "CI",
  "CM",
  "SN",
]);

/** @deprecated Prefer FLUTTERWAVE_MOMO_COUNTRIES */
export const FLUTTERWAVE_CHECKOUT_COUNTRIES = FLUTTERWAVE_MOMO_COUNTRIES;

export function isFlutterwaveMoMoCountry(countryCode: string | null | undefined) {
  const code = (countryCode ?? "").toUpperCase();
  return code.length === 2 && FLUTTERWAVE_MOMO_COUNTRIES.has(code);
}

export enum PaymentProvider {
  /** Deferred until US LLC exists — see docs/PAYMENTS-STRATEGY.md */
  STRIPE = "STRIPE",
  FLUTTERWAVE = "FLUTTERWAVE",
  LEMON_SQUEEZY = "LEMON_SQUEEZY",
}

export enum PaymentPurpose {
  LISTING = "LISTING",
  UNLOCK = "UNLOCK",
  FEATURED = "FEATURED",
}

export enum WalletCreditType {
  WELCOME_BONUS = "WELCOME_BONUS",
  COUPON = "COUPON",
  ADMIN_GRANT = "ADMIN_GRANT",
  FEATURED_GRANT = "FEATURED_GRANT",
}

/** Promotional credit bucket — not withdrawable cash (PRD §5). */
export type WalletCredit = {
  id: string;
  creditType: WalletCreditType;
  purpose: PaymentPurpose;
  quantity: number;
  remainingQuantity: number;
  amountUgx: number;
  remainingUgx: number;
  expiresAt: string | null;
  label?: string;
};

export type WalletSummary = {
  credits: WalletCredit[];
  unlockCredits: number;
  listingCredits: number;
  featuredCredits: number;
  /** Shown in UI — credits are not e-money. */
  policyNote: string;
};

export const WALLET_POLICY_NOTE =
  "Promotional platform credits only — not withdrawable or transferable.";

export const WELCOME_BONUS_EXPIRY_DAYS = 90;

export enum PaymentStatus {
  PENDING = "PENDING",
  COMPLETED = "COMPLETED",
  FAILED = "FAILED",
  REFUNDED = "REFUNDED",
}

/** Listing property type — used in explore filters and landlord create flow. */
export const BUILDING_TYPES = [
  "apartment",
  "studio",
  "bungalow",
  "house",
  "airbnb",
] as const;

export type BuildingType = (typeof BUILDING_TYPES)[number];

export type CountryCatalog = {
  code: string;
  name: string;
  currency: string;
  displayLocale: string;
  mapCenter: { lat: number; lng: number } | null;
  mapBounds: {
    north: number;
    south: number;
    east: number;
    west: number;
  } | null;
  defaultMapZoom: number;
};

export type BuildingSummary = {
  id: string;
  name: string;
  city: string;
  district: string;
  countryCode: string;
  buildingType: BuildingType;
  approximateLat: number;
  approximateLng: number;
  availableUnitCount: number;
  rentFrom: number | null;
  currency: string;
  /** Rent suffix for `rentFrom` — from cheapest available unit. */
  rentPeriod?: RentPeriod;
  /** Public cover thumbnail for explore cards (compressed, not full gallery). */
  coverThumbUrl?: string;
  /** Full-resolution cover — only returned when viewer has unlock access. */
  coverImageUrl?: string;
  /** Promoted listing — sorted first in explore; show badge on cards. */
  isFeatured?: boolean;
  /** Active unlocks held by the signed-in tenant on this building. */
  myUnlockCount?: number;
};

export type UnitSummary = {
  id: string;
  buildingId: string;
  unitNumber: string;
  bedrooms: number;
  bathrooms: number;
  rentAmount: number;
  currency: string;
  rentPeriod?: RentPeriod;
  status: UnitStatus;
};

export const PERMISSIONS = {
  BUILDINGS_READ: "buildings:read",
  BUILDINGS_MANAGE_OWN: "buildings:manage_own",
  BUILDINGS_MANAGE_ON_BEHALF: "buildings:manage_on_behalf",
  UNITS_CHANGE_STATUS: "units:change_status",
  UNITS_UNLOCK: "units:unlock",
  ADMIN_USERS: "admin:users",
  ADMIN_PRICING: "admin:pricing",
  ADMIN_MODERATE: "admin:moderate",
} as const;

export type Permission = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

export * from "./phone";

export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  [UserRole.SUPERADMIN]: Object.values(PERMISSIONS),
  [UserRole.ADMIN]: [
    PERMISSIONS.BUILDINGS_READ,
    PERMISSIONS.BUILDINGS_MANAGE_ON_BEHALF,
    PERMISSIONS.ADMIN_MODERATE,
  ],
  [UserRole.LANDLORD]: [
    PERMISSIONS.BUILDINGS_READ,
    PERMISSIONS.BUILDINGS_MANAGE_OWN,
    PERMISSIONS.UNITS_CHANGE_STATUS,
  ],
  [UserRole.TENANT]: [PERMISSIONS.BUILDINGS_READ, PERMISSIONS.UNITS_UNLOCK],
};
