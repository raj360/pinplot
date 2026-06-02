import { PaymentPurpose } from "@plotpin/shared-types";
import { apiFetch } from "./client";

export const COUPON_PURPOSE_OPTIONS = [
  { value: PaymentPurpose.UNLOCK, label: "Unlock credit" },
  { value: PaymentPurpose.LISTING, label: "Listing credit" },
  { value: PaymentPurpose.FEATURED, label: "Featured credit" },
] as const;

export function couponPurposeLabel(purpose: PaymentPurpose): string {
  return (
    COUPON_PURPOSE_OPTIONS.find((option) => option.value === purpose)?.label ??
    "Credit"
  );
}

export type AdminCoupon = {
  id: string;
  code: string;
  purpose: PaymentPurpose;
  quantity: number;
  amountUgx: number;
  maxRedemptions: number | null;
  redemptionCount: number;
  maxPerUser: number;
  expiresAt: string | null;
  isActive: boolean;
  label: string | null;
  createdAt: string;
};

export async function fetchAdminCoupons() {
  return apiFetch<AdminCoupon[]>("/admin/coupons");
}

export async function createAdminCoupon(body: {
  code: string;
  purpose?: PaymentPurpose;
  quantity?: number;
  amountUgx?: number;
  maxRedemptions?: number;
  maxPerUser?: number;
  expiresAt?: string;
  label?: string;
}) {
  return apiFetch<AdminCoupon>("/admin/coupons", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export async function deactivateAdminCoupon(id: string) {
  return apiFetch<AdminCoupon>(`/admin/coupons/${id}/deactivate`, {
    method: "PATCH",
  });
}
