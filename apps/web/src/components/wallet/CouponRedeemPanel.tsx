"use client";

import { useState } from "react";
import { WALLET_POLICY_NOTE } from "@plotpin/shared-types";
import { redeemCoupon } from "@/lib/api/wallet";
import { Button } from "@/components/ui/button";

export function CouponRedeemPanel({
  onRedeemed,
}: {
  onRedeemed?: () => void;
}) {
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);
    try {
      const result = await redeemCoupon(code.trim());
      const label = result.credit.label ?? "Coupon credit";
      setSuccess(`${label} added — ${result.wallet.unlockCredits} unlock credit(s) available.`);
      setCode("");
      onRedeemed?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not redeem coupon");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="border border-border bg-surface p-4">
      <h2 className="font-semibold">Redeem coupon</h2>
      <p className="mt-2 text-sm text-muted">
        Enter a campaign code to add unlock credits. {WALLET_POLICY_NOTE}
      </p>
      <form onSubmit={handleSubmit} className="mt-4 flex flex-col gap-3 sm:flex-row">
        <input
          type="text"
          value={code}
          onChange={(event) => setCode(event.target.value.toUpperCase())}
          placeholder="PROMO-CODE"
          className="min-w-0 flex-1 border border-border bg-background px-3 py-2 text-sm uppercase"
          autoComplete="off"
          spellCheck={false}
        />
        <Button type="submit" loading={loading} loadingLabel="Redeeming coupon">
          Redeem
        </Button>
      </form>
      {error ? <p className="mt-3 text-sm text-red-600">{error}</p> : null}
      {success ? <p className="mt-3 text-sm text-green-700">{success}</p> : null}
    </div>
  );
}
