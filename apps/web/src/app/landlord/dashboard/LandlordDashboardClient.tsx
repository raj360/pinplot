"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  DashboardSection,
  StatCard,
} from "@/components/layout/DashboardSection";
import { LandlordDashboardSkeleton } from "@/components/landlord/LandlordPageSkeletons";
import { fetchMyBuildings, type LandlordBuilding } from "@/lib/api/buildings";
import { getAccessToken } from "@/lib/api/client";
import {
  buildingNeedsUnitSetup,
  buildingWasRejected,
  countBuildingsNeedingSetup,
  countBuildingsPendingReview,
  countBuildingsRejected,
  countBuildingsVisibleOnExplore,
  getLandlordBuildingStatus,
} from "@/lib/landlord/building-status";

export default function LandlordDashboardClient() {
  const router = useRouter();
  const params = useSearchParams();
  const [buildings, setBuildings] = useState<LandlordBuilding[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const created = params.get("created") === "1";
  const needsSetupCount = countBuildingsNeedingSetup(buildings);
  const visibleCount = countBuildingsVisibleOnExplore(buildings);
  const pendingCount = countBuildingsPendingReview(buildings);
  const rejectedCount = countBuildingsRejected(buildings);
  const firstNeedsSetup = buildings.find(buildingNeedsUnitSetup);
  const featuredCount = buildings.filter((b) => b.isFeatured).length;
  const totalUnlocks = buildings.reduce((sum, b) => sum + (b.unlockCount ?? 0), 0);

  useEffect(() => {
    let cancelled = false;

    getAccessToken().then(async (token) => {
      if (cancelled) return;

      if (!token) {
        router.replace("/auth/login?next=/landlord/dashboard");
        return;
      }

      try {
        setBuildings(await fetchMyBuildings());
        setError(null);
      } catch {
        if (!cancelled) setError("Could not load your buildings.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [router]);

  return (
    <div className="space-y-4">
      {created && !loading && (
        <p className="border border-primary/30 bg-primary/5 px-4 py-3 text-sm">
          Building submitted — an admin will review it first. After approval,
          open the building and mark units <strong>available</strong> so tenants
          can find it on the map.
        </p>
      )}

      {!loading && rejectedCount > 0 ? (
        <div className="border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-950">
          <p className="font-medium">
            {rejectedCount === 1
              ? "1 listing was rejected"
              : `${rejectedCount} listings were rejected`}
          </p>
          <p className="mt-1 text-red-900/90">
            Open the building to read the admin reason, fix photos or details,
            then resubmit for review.
          </p>
        </div>
      ) : null}

      {!loading && needsSetupCount > 0 ? (
        <div className="border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-950">
          <p className="font-medium">
            {needsSetupCount === 1
              ? "1 approved building needs your attention"
              : `${needsSetupCount} approved buildings need your attention`}
          </p>
          <p className="mt-1 text-sky-900/90">
            Admin approved your listing, but tenants cannot see it until you
            mark at least one unit as available.
          </p>
          {firstNeedsSetup ? (
            <Link
              href={`/landlord/buildings/${firstNeedsSetup.id}`}
              className="mt-3 inline-flex bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            >
              Mark units available
            </Link>
          ) : null}
        </div>
      ) : null}

      <DashboardSection
        title="Your buildings"
        description="After admin approval, open each building and mark units available when you are ready to receive tenant unlocks."
        action={
          <Link
            href="/landlord/new"
            className="inline-flex bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
          >
            + Add building
          </Link>
        }
      >
        {loading ? (
          <LandlordDashboardSkeleton />
        ) : (
          <>
            {buildings.length > 0 && (
              <dl className="grid gap-3 sm:grid-cols-3">
                <StatCard label="Total" value={buildings.length} variant="primary" />
                <StatCard
                  label="Visible on map"
                  value={visibleCount}
                  variant="primary"
                />
                <StatCard
                  label="Needs setup"
                  value={needsSetupCount}
                  highlight={needsSetupCount > 0}
                />
                <StatCard label="Tenant unlocks" value={totalUnlocks} variant="primary" />
                <StatCard label="Featured now" value={featuredCount} variant="primary" />
                {pendingCount > 0 ? (
                  <StatCard
                    label="Pending review"
                    value={pendingCount}
                    className="sm:col-span-3"
                  />
                ) : null}
                {rejectedCount > 0 ? (
                  <StatCard
                    label="Rejected"
                    value={rejectedCount}
                    highlight
                    className="sm:col-span-3"
                  />
                ) : null}
              </dl>
            )}

            {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

            <ul className={buildings.length > 0 ? "mt-6 space-y-3" : "space-y-3"}>
              {buildings.map((b) => {
                const status = getLandlordBuildingStatus(b);

                return (
                <li
                  key={b.id}
                  className={`flex flex-wrap items-center justify-between gap-3 border bg-surface p-4 ${
                    status.actionRequired
                      ? "border-sky-300 ring-1 ring-sky-200"
                      : "border-border"
                  }`}
                >
                  <div className="min-w-0">
                    <p className="font-semibold text-foreground">{b.name}</p>
                    <p className="mt-0.5 text-sm text-muted">
                      {[b.district, b.city].filter(Boolean).join(", ")}
                    </p>
                    <p className="mt-1 text-xs text-muted">
                      {b.availableUnitCount} available · {b.totalUnits} units total
                      {b.unlockCount > 0
                        ? ` · ${b.unlockCount} unlock${b.unlockCount === 1 ? "" : "s"}`
                        : ""}
                    </p>
                    {b.isFeatured ? (
                      <p className="mt-1 text-xs font-medium text-amber-700">
                        Featured
                        {b.featuredUntil
                          ? ` until ${new Date(b.featuredUntil).toLocaleDateString()}`
                          : ""}
                      </p>
                    ) : null}
                    {status.hint ? (
                      <p
                        className={`mt-1.5 text-xs ${
                          status.actionRequired
                            ? "font-medium text-sky-800"
                            : "text-muted"
                        }`}
                      >
                        {status.hint}
                      </p>
                    ) : null}
                  </div>
                  <span
                    className={`shrink-0 px-2 py-1 text-xs font-medium ${status.className}`}
                  >
                    {status.label}
                  </span>
                  <Link
                    href={`/landlord/buildings/${b.id}`}
                    className={`inline-flex shrink-0 px-3 py-1.5 text-xs font-medium ${
                      status.actionRequired
                        ? "bg-primary text-primary-foreground hover:bg-primary/90"
                        : "border border-border bg-surface text-foreground hover:bg-background"
                    }`}
                  >
                    {status.actionRequired && buildingWasRejected(b)
                      ? "Review & resubmit"
                      : status.actionRequired
                        ? "Mark units available"
                        : "Manage units"}
                  </Link>
                </li>
              );
              })}
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
        )}
      </DashboardSection>
    </div>
  );
}
