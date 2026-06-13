"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { PaymentPurpose } from "@plotpin/shared-types";
import { formatCurrency } from "@/lib/intl/format";
import {
  COUPON_PURPOSE_OPTIONS,
  couponPurposeLabel,
  createAdminCoupon,
  deactivateAdminCoupon,
  fetchAdminCoupons,
  type AdminCoupon,
} from "@/lib/api/admin-coupons";
import { getAccessToken } from "@/lib/api/client";
import { Button } from "@/components/ui/button";
import { LoadingState } from "@/components/ui/loading-state";

export default function AdminCouponsClient() {
  const router = useRouter();
  const [coupons, setCoupons] = useState<AdminCoupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [purpose, setPurpose] = useState<PaymentPurpose>(PaymentPurpose.UNLOCK);
  const [amountUgx, setAmountUgx] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [label, setLabel] = useState("");
  const [maxRedemptions, setMaxRedemptions] = useState("");
  const [maxPerUser, setMaxPerUser] = useState("1");
  const [creating, setCreating] = useState(false);
  const [actionId, setActionId] = useState<string | null>(null);

  const requiresAmount = purpose === PaymentPurpose.FEATURED;

  const loadCoupons = useCallback(async () => {
    setCoupons(await fetchAdminCoupons());
  }, []);

  useEffect(() => {
    getAccessToken().then(async (token) => {
      if (!token) {
        router.replace("/auth/login?next=/admin/coupons");
        return;
      }
      try {
        await loadCoupons();
      } catch {
        setError("Could not load coupons.");
      } finally {
        setLoading(false);
      }
    });
  }, [loadCoupons, router]);

  async function handleCreate(event: React.FormEvent) {
    event.preventDefault();
    setCreating(true);
    setError(null);
    try {
      await createAdminCoupon({
        code: code.trim(),
        purpose,
        quantity: quantity ? Number(quantity) : undefined,
        amountUgx: amountUgx ? Number(amountUgx) : undefined,
        maxPerUser: maxPerUser ? Number(maxPerUser) : undefined,
        label: label.trim() || undefined,
        maxRedemptions: maxRedemptions ? Number(maxRedemptions) : undefined,
      });
      setCode("");
      setPurpose(PaymentPurpose.UNLOCK);
      setAmountUgx("");
      setQuantity("1");
      setMaxPerUser("1");
      setLabel("");
      setMaxRedemptions("");
      await loadCoupons();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create coupon");
    } finally {
      setCreating(false);
    }
  }

  async function handleDeactivate(id: string) {
    setActionId(id);
    setError(null);
    try {
      await deactivateAdminCoupon(id);
      await loadCoupons();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not deactivate coupon");
    } finally {
      setActionId(null);
    }
  }

  if (loading) {
    return <LoadingState label="Loading coupons" />;
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Coupons</h1>
        <p className="mt-2 text-sm text-muted">
          Create campaign codes that grant promotional unlock credits when tenants redeem them.
        </p>
      </div>

      <form onSubmit={handleCreate} className="border border-border bg-surface p-4 space-y-4 max-w-xl">
        <h2 className="font-semibold">New coupon</h2>
        <label className="block text-sm">
          <span className="text-muted">Code</span>
          <input
            required
            value={code}
            onChange={(event) => setCode(event.target.value.toUpperCase())}
            className="mt-1 w-full border border-border bg-background px-3 py-2 uppercase"
            placeholder="LAUNCH2026"
          />
        </label>

        <label className="block text-sm">
          <span className="text-muted">Applies to</span>
          <select
            value={purpose}
            onChange={(event) => setPurpose(event.target.value as PaymentPurpose)}
            className="mt-1 w-full border border-border bg-background px-3 py-2"
          >
            {COUPON_PURPOSE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <span className="mt-1 block text-xs text-muted">
            Determines which checkout the credit can be applied to.
          </span>
        </label>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <label className="block text-sm">
            <span className="text-muted">
              Nominal amount (UGX){requiresAmount ? "" : ", optional"}
            </span>
            <input
              type="number"
              min={1}
              required={requiresAmount}
              value={amountUgx}
              onChange={(event) => setAmountUgx(event.target.value)}
              className="mt-1 w-full border border-border bg-background px-3 py-2"
              placeholder={requiresAmount ? "e.g. 50000" : "Standard fee"}
            />
            <span className="mt-1 block text-xs text-muted">
              {requiresAmount
                ? "Featured has no default fee. Set it explicitly."
                : "Leave blank to use the standard fee for this purpose."}
            </span>
          </label>

          <label className="block text-sm">
            <span className="text-muted">Credits per redemption</span>
            <input
              type="number"
              min={1}
              value={quantity}
              onChange={(event) => setQuantity(event.target.value)}
              className="mt-1 w-full border border-border bg-background px-3 py-2"
              placeholder="1"
            />
          </label>
        </div>

        <label className="block text-sm">
          <span className="text-muted">Label / reason (optional)</span>
          <input
            value={label}
            onChange={(event) => setLabel(event.target.value)}
            className="mt-1 w-full border border-border bg-background px-3 py-2"
            placeholder="Launch campaign credit"
          />
        </label>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <label className="block text-sm">
            <span className="text-muted">Max redemptions (optional)</span>
            <input
              type="number"
              min={1}
              value={maxRedemptions}
              onChange={(event) => setMaxRedemptions(event.target.value)}
              className="mt-1 w-full border border-border bg-background px-3 py-2"
              placeholder="Unlimited"
            />
          </label>
          <label className="block text-sm">
            <span className="text-muted">Max per user</span>
            <input
              type="number"
              min={1}
              value={maxPerUser}
              onChange={(event) => setMaxPerUser(event.target.value)}
              className="mt-1 w-full border border-border bg-background px-3 py-2"
              placeholder="1"
            />
          </label>
        </div>

        <Button type="submit" loading={creating} loadingLabel="Creating coupon">
          Create coupon
        </Button>
      </form>

      {error ? <p className="text-sm text-red-600">{error}</p> : null}

      <div>
        <h2 className="font-semibold">Active & past coupons</h2>
        {coupons.length === 0 ? (
          <p className="mt-3 text-sm text-muted">No coupons yet.</p>
        ) : (
          <ul className="mt-4 divide-y divide-border border border-border bg-surface">
            {coupons.map((coupon) => (
              <li
                key={coupon.id}
                className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <p className="font-medium">{coupon.code}</p>
                  <p className="mt-1 text-sm text-muted">
                    {coupon.quantity}× {couponPurposeLabel(coupon.purpose).toLowerCase()} ·{" "}
                    {formatCurrency(coupon.amountUgx)} nominal
                    {coupon.label ? ` · ${coupon.label}` : ""}
                  </p>
                  <p className="mt-1 text-xs text-muted">
                    {coupon.redemptionCount}
                    {coupon.maxRedemptions != null
                      ? ` / ${coupon.maxRedemptions}`
                      : ""}{" "}
                    redemptions
                    {!coupon.isActive ? " · deactivated" : ""}
                  </p>
                </div>
                {coupon.isActive ? (
                  <Button
                    type="button"
                    variant="outline"
                    loading={actionId === coupon.id}
                    loadingLabel="Deactivating coupon"
                    onClick={() => handleDeactivate(coupon.id)}
                  >
                    Deactivate
                  </Button>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
