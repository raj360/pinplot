"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { DashboardSection } from "@/components/layout/DashboardSection";
import { AdminOverviewSkeleton } from "@/components/admin/AdminPageSkeletons";
import { fetchOpenReports } from "@/lib/api/reports";
import { fetchPendingBuildings } from "@/lib/api/buildings";
import { fetchAdminUsers } from "@/lib/api/admin-users";
import {
  fetchAdminAnalyticsOverview,
  type AdminAnalyticsOverview,
} from "@/lib/api/analytics";
import { getAccessToken } from "@/lib/api/client";

type OverviewStats = {
  pendingBuildings: number;
  openReports: number;
  recentUsers: number;
};

export default function AdminOverviewClient() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<OverviewStats | null>(null);
  const [analytics, setAnalytics] = useState<AdminAnalyticsOverview | null>(
    null,
  );

  useEffect(() => {
    let cancelled = false;

    getAccessToken().then(async (token) => {
      if (cancelled) return;
      if (!token) {
        router.replace("/auth/login?next=/admin");
        return;
      }

      try {
        const [pending, reports, users, analyticsOverview] = await Promise.all([
          fetchPendingBuildings(),
          fetchOpenReports(),
          fetchAdminUsers(),
          fetchAdminAnalyticsOverview(30).catch(() => null),
        ]);
        setStats({
          pendingBuildings: pending.length,
          openReports: reports.length,
          recentUsers: users.length,
        });
        setAnalytics(analyticsOverview);
      } catch {
        setError(
          "Could not load admin overview. Ensure your profile role is ADMIN.",
        );
      } finally {
        if (!cancelled) setLoading(false);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [router]);

  const featuredRow = analytics?.featuredComparison.find((r) => r.isFeatured);
  const nonFeaturedRow = analytics?.featuredComparison.find((r) => !r.isFeatured);

  return (
    <DashboardSection
      title="Admin overview"
      description="Verify supply, review reports, and manage access."
    >
      {error ? <p className="text-sm text-red-600">{error}</p> : null}

      {loading ? (
        <AdminOverviewSkeleton />
      ) : stats ? (
        <div className="grid gap-4 sm:grid-cols-3">
          <Link
            href="/admin/buildings"
            className="border border-border bg-surface p-4 shadow-xs transition-shadow hover:shadow-card"
          >
            <p className="text-3xl font-bold text-primary">
              {stats.pendingBuildings}
            </p>
            <p className="mt-1 text-sm font-medium">Pending buildings</p>
            <p className="mt-1 text-xs text-muted">
              Awaiting verification before map publish
            </p>
          </Link>

          <Link
            href="/admin/reports"
            className="border border-border bg-surface p-4 shadow-xs transition-shadow hover:shadow-card"
          >
            <p className="text-3xl font-bold text-primary">
              {stats.openReports}
            </p>
            <p className="mt-1 text-sm font-medium">Open reports</p>
            <p className="mt-1 text-xs text-muted">
              Tenant reports needing review
            </p>
          </Link>

          <Link
            href="/admin/users"
            className="border border-border bg-surface p-4 shadow-xs transition-shadow hover:shadow-card"
          >
            <p className="text-3xl font-bold text-primary">
              {stats.recentUsers}
            </p>
            <p className="mt-1 text-sm font-medium">Recent users</p>
            <p className="mt-1 text-xs text-muted">
              Latest profiles (search in Users)
            </p>
          </Link>
        </div>
      ) : null}

      {!loading && analytics ? (
        <section className="mt-8 border border-border bg-surface p-4">
          <h2 className="font-semibold">Listing performance (30d)</h2>
          <p className="mt-1 text-sm text-muted">
            Featured vs non-featured detail-view rates from tracked impressions.
          </p>
          <dl className="mt-4 grid gap-3 sm:grid-cols-2">
            <div className="border border-border bg-background p-3 text-sm">
              <dt className="text-xs text-muted">Featured detail-view rate</dt>
              <dd className="mt-1 text-lg font-semibold">
                {featuredRow?.detailViewRate ?? 0}%
              </dd>
              <dd className="text-xs text-muted">
                {featuredRow?.detailViews ?? 0} views /{" "}
                {featuredRow?.impressions ?? 0} impressions
              </dd>
            </div>
            <div className="border border-border bg-background p-3 text-sm">
              <dt className="text-xs text-muted">Non-featured detail-view rate</dt>
              <dd className="mt-1 text-lg font-semibold">
                {nonFeaturedRow?.detailViewRate ?? 0}%
              </dd>
              <dd className="text-xs text-muted">
                {nonFeaturedRow?.detailViews ?? 0} views /{" "}
                {nonFeaturedRow?.impressions ?? 0} impressions
              </dd>
            </div>
          </dl>
          {analytics.topBuildings.length > 0 ? (
            <ul className="mt-4 space-y-2 text-sm">
              {analytics.topBuildings.slice(0, 5).map((row) => (
                <li
                  key={row.buildingId}
                  className="flex flex-wrap items-center justify-between gap-2 border border-border bg-background px-3 py-2"
                >
                  <span>
                    {row.buildingName}
                    {row.isFeatured ? (
                      <span className="ml-2 text-xs text-amber-700">Featured</span>
                    ) : null}
                  </span>
                  <span className="text-muted">
                    {row.detailViews} views · {row.detailViewRate}% CTR
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-4 text-sm text-muted">
              No view data yet. Metrics appear as tenants browse Explore.
            </p>
          )}
        </section>
      ) : null}

      {!loading ? (
        <ul className="mt-8 space-y-2 text-sm text-muted">
          <li>
            <Link href="/admin/buildings" className="text-primary hover:underline">
              Verify pending buildings →
            </Link>
          </li>
          <li>
            <Link href="/admin/featured" className="text-primary hover:underline">
              Manage featured launch slots →
            </Link>
          </li>
          <li>
            <Link href="/admin/coupons" className="text-primary hover:underline">
              Create unlock coupons →
            </Link>
          </li>
        </ul>
      ) : null}
    </DashboardSection>
  );
}
