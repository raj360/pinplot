/** In-app inbox notification types (N-09). */
export const IN_APP_NOTIFICATION_TYPES = {
  UNLOCK_RECEIVED: "UNLOCK_RECEIVED",
  UNLOCK_RECEIPT: "UNLOCK_RECEIPT",
  LISTING_APPROVED: "LISTING_APPROVED",
  LISTING_REJECTED: "LISTING_REJECTED",
  UNLOCK_EXPIRING_LANDLORD: "UNLOCK_EXPIRING_LANDLORD",
  UNLOCK_EXPIRING_TENANT: "UNLOCK_EXPIRING_TENANT",
  UNLOCK_EXPIRED_LANDLORD: "UNLOCK_EXPIRED_LANDLORD",
  UNLOCK_EXPIRED_TENANT: "UNLOCK_EXPIRED_TENANT",
  UNIT_LOCK_ENDED: "UNIT_LOCK_ENDED",
  FEATURED_EXPIRING: "FEATURED_EXPIRING",
  STALE_AVAILABLE: "STALE_AVAILABLE",
} as const;

export type InAppNotificationType =
  (typeof IN_APP_NOTIFICATION_TYPES)[keyof typeof IN_APP_NOTIFICATION_TYPES];

export type CreateInAppNotificationInput = {
  userId: string;
  type: InAppNotificationType;
  title: string;
  body: string;
  ctaUrl?: string | null;
  payload?: Record<string, unknown>;
  dedupeKey: string;
};

export type InAppNotificationRecord = {
  id: string;
  type: InAppNotificationType;
  title: string;
  body: string;
  ctaUrl: string | null;
  payload: Record<string, unknown>;
  readAt: string | null;
  dismissedAt: string | null;
  createdAt: string;
};
