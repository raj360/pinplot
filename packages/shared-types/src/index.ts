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
  unlockExclusiveHours: 72,
} as const;

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

export enum PaymentProvider {
  STRIPE = "STRIPE",
  FLUTTERWAVE = "FLUTTERWAVE",
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
