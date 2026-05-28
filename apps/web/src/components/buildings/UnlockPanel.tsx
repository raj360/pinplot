"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { PRICING, UnitStatus } from "@plotpin/shared-types";
import { formatCurrency } from "@/lib/intl/format";
import { useAuth } from "@/lib/auth/use-auth";
import {
  fetchUnlockStatus,
  unlockUnit,
  type UnlockStatus,
} from "@/lib/api/unlocks";
import { Button } from "@/components/ui/button";

type Unit = {
  id: string;
  unitNumber: string;
  status: string;
};

export function UnlockPanel({
  buildingId,
  units,
}: {
  buildingId: string;
  units: Unit[];
}) {
  const router = useRouter();
  const { isAuthenticated, loading: authLoading } = useAuth();
  const availableUnits = units.filter((u) => u.status === UnitStatus.AVAILABLE);

  if (availableUnits.length === 0) {
    return (
      <section className="mt-8 border border-border bg-surface p-4">
        <h2 className="font-semibold">Unlock contact</h2>
        <p className="mt-2 text-sm text-muted">
          No units are available to unlock right now.
        </p>
      </section>
    );
  }

  return (
    <section className="mt-8 space-y-4 border border-border bg-surface p-4">
      <div>
        <h2 className="font-semibold">Unlock contact</h2>
        <p className="mt-2 text-sm text-muted">
          Pay {formatCurrency(PRICING.tenantUnlockFeeUgx)} to reveal exact address
          and landlord contact. First payment wins exclusive access for{" "}
          {PRICING.unlockExclusiveHours} hours.
        </p>
      </div>

      {authLoading ? (
        <p className="text-sm text-muted">Loading…</p>
      ) : !isAuthenticated ? (
        <Link
          href={`/auth/login?next=/buildings/${buildingId}`}
          className="inline-block bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
        >
          Sign in to unlock
        </Link>
      ) : (
        availableUnits.map((unit) => (
          <UnitUnlockRow key={unit.id} unit={unit} />
        ))
      )}
    </section>
  );
}

function UnitUnlockRow({ unit }: { unit: Unit }) {
  const router = useRouter();
  const [status, setStatus] = useState<UnlockStatus | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchUnlockStatus(unit.id)
      .then(setStatus)
      .catch(() => setStatus(null));
  }, [unit.id]);

  async function handleUnlock() {
    setError(null);
    setLoading(true);
    try {
      const result = await unlockUnit(unit.id);
      setStatus(result);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unlock failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="border border-border bg-background p-4">
      <p className="font-medium">Unit {unit.unitNumber}</p>

      {status?.unlockState === "winner" ? (
        <div className="mt-3 space-y-2 text-sm">
          <p className="font-medium text-primary">You unlocked this unit.</p>
          {status.contact.exactAddress ? (
            <p>
              <span className="text-muted">Address: </span>
              {status.contact.exactAddress}
            </p>
          ) : null}
          {status.contact.phone ? (
            <p>
              <span className="text-muted">Contact: </span>
              {status.contact.phone}
            </p>
          ) : null}
          {!status.contact.exactAddress && !status.contact.phone ? (
            <p className="text-muted">Contact details not on file for this listing.</p>
          ) : null}
        </div>
      ) : status?.unlockState === "locked_by_other" ? (
        <p className="mt-2 text-sm text-muted">
          Another tenant already unlocked this unit.
        </p>
      ) : (
        <>
          <Button
            type="button"
            className="mt-3"
            loading={loading}
            loadingLabel="Unlocking unit"
            onClick={handleUnlock}
          >
            Unlock — {formatCurrency(PRICING.tenantUnlockFeeUgx)}
          </Button>
          <p className="mt-2 text-xs text-muted">
            Dev mode: payment simulated until Stripe / Flutterwave is connected.
          </p>
        </>
      )}

      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
    </div>
  );
}
