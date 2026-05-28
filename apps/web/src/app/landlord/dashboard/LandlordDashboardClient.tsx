"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { fetchMyBuildings, type LandlordBuilding } from "@/lib/api/buildings";
import { getAccessToken } from "@/lib/api/client";
import { PRICING } from "@plotpin/shared-types";
import { formatCurrency } from "@/lib/intl/format";

export default function LandlordDashboardClient() {
  const router = useRouter();
  const params = useSearchParams();
  const [buildings, setBuildings] = useState<LandlordBuilding[]>([]);
  const [error, setError] = useState<string | null>(null);
  const created = params.get("created") === "1";

  useEffect(() => {
    getAccessToken().then(async (token) => {
      if (!token) {
        router.replace("/auth/login?next=/landlord/dashboard");
        return;
      }
      try {
        setBuildings(await fetchMyBuildings());
      } catch {
        setError("Could not load your buildings.");
      }
    });
  }, [router]);

  return (
    <>
      {created && (
        <p className="mb-4 border border-primary/30 bg-primary/5 px-4 py-3 text-sm">
          Building submitted — an admin will verify it before it appears on the
          map.
        </p>
      )}

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Your buildings</h1>
          <p className="mt-2 max-w-2xl text-sm text-muted">
            Mark units available — {formatCurrency(PRICING.landlordListingFeeUgx)}{" "}
            per change (payments in Sprint 3).
          </p>
        </div>
        <Link
          href="/landlord/new"
          className="shrink-0 bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
        >
          + Add building
        </Link>
      </div>

      {buildings.length > 0 && (
        <dl className="mt-6 grid gap-3 sm:grid-cols-3">
          <div className="border border-border bg-surface px-4 py-3">
            <dt className="text-xs font-medium uppercase tracking-wide text-muted">
              Total
            </dt>
            <dd className="mt-1 text-2xl font-semibold">{buildings.length}</dd>
          </div>
          <div className="border border-border bg-surface px-4 py-3">
            <dt className="text-xs font-medium uppercase tracking-wide text-muted">
              Live on map
            </dt>
            <dd className="mt-1 text-2xl font-semibold">
              {buildings.filter((b) => b.isVerified).length}
            </dd>
          </div>
          <div className="border border-border bg-surface px-4 py-3">
            <dt className="text-xs font-medium uppercase tracking-wide text-muted">
              Pending
            </dt>
            <dd className="mt-1 text-2xl font-semibold">
              {buildings.filter((b) => !b.isVerified).length}
            </dd>
          </div>
        </dl>
      )}

      {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

      <ul className="mt-8 space-y-3">
        {buildings.map((b) => (
          <li
            key={b.id}
            className="flex flex-wrap items-center justify-between gap-3 border border-border bg-surface p-4"
          >
            <div className="min-w-0">
              <p className="font-medium">{b.name}</p>
              <p className="text-sm text-muted">
                {[b.district, b.city].filter(Boolean).join(", ")}
              </p>
              <p className="mt-1 text-xs text-muted">
                {b.availableUnitCount} available · {b.totalUnits} units total
              </p>
            </div>
            <span
              className={`shrink-0 px-2 py-1 text-xs font-medium ${
                b.isVerified
                  ? "bg-green-100 text-green-800"
                  : "bg-amber-100 text-amber-800"
              }`}
            >
              {b.isVerified ? "Live on map" : "Pending verification"}
            </span>
          </li>
        ))}
        {buildings.length === 0 && !error && (
          <li className="border border-dashed border-border px-4 py-12 text-center text-sm text-muted">
            No buildings yet.{" "}
            <Link href="/landlord/new" className="font-medium text-primary">
              Add your first building
            </Link>
          </li>
        )}
      </ul>
    </>
  );
}
