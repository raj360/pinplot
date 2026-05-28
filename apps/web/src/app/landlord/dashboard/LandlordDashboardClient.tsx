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
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-primary text-primary-foreground">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
          <Link href="/" className="font-semibold">
            PlotPin
          </Link>
          <span className="text-sm">Landlord dashboard</span>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-8">
        {created && (
          <p className="mb-4 border border-primary/30 bg-primary/5 px-4 py-3 text-sm">
            Building submitted — an admin will verify it before it appears on
            the map.
          </p>
        )}

        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Your buildings</h1>
            <p className="mt-2 text-sm text-muted">
              Mark units available — {formatCurrency(PRICING.landlordListingFeeUgx)}{" "}
              per change (payments in Sprint 3).
            </p>
          </div>
          <Link
            href="/landlord/new"
            className="bg-primary px-4 py-2 text-sm text-primary-foreground"
          >
            + Add building
          </Link>
        </div>

        {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

        <ul className="mt-8 space-y-3">
          {buildings.map((b) => (
            <li
              key={b.id}
              className="flex flex-wrap items-center justify-between gap-2 border border-border bg-surface p-4"
            >
              <div>
                <p className="font-medium">{b.name}</p>
                <p className="text-sm text-muted">
                  {[b.district, b.city].filter(Boolean).join(", ")}
                </p>
                <p className="mt-1 text-xs text-muted">
                  {b.availableUnitCount} available · {b.totalUnits} units total
                </p>
              </div>
              <span
                className={`px-2 py-1 text-xs font-medium ${
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
            <li className="border border-dashed border-border p-8 text-center text-sm text-muted">
              No buildings yet.{" "}
              <Link href="/landlord/new" className="text-primary">
                Add your first building
              </Link>
            </li>
          )}
        </ul>

        <Link href="/explore" className="mt-8 inline-block text-sm text-primary">
          ← Browse map
        </Link>
      </main>
    </div>
  );
}
