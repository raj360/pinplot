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
}

export enum PaymentStatus {
  PENDING = "PENDING",
  COMPLETED = "COMPLETED",
  FAILED = "FAILED",
  REFUNDED = "REFUNDED",
}

export type BuildingSummary = {
  id: string;
  name: string;
  city: string;
  district: string;
  countryCode: string;
  approximateLat: number;
  approximateLng: number;
  availableUnitCount: number;
  rentFrom: number | null;
  currency: string;
  coverImageUrl?: string;
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
