"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { DashboardSection } from "@/components/layout/DashboardSection";
import { fetchOpenReports } from "@/lib/api/reports";
import { fetchPendingBuildings } from "@/lib/api/buildings";
import { fetchAdminUsers } from "@/lib/api/admin-users";
import { getAccessToken } from "@/lib/api/client";
import { Spinner } from "@/components/ui/spinner";

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

  useEffect(() => {
    let cancelled = false;

    getAccessToken().then(async (token) => {
      if (cancelled) return;
      if (!token) {
        router.replace("/auth/login?next=/admin");
        return;
      }

      try {
        const [pending, reports, users] = await Promise.all([
          fetchPendingBuildings(),
          fetchOpenReports(),
          fetchAdminUsers(),
        ]);
        setStats({
          pendingBuildings: pending.length,
          openReports: reports.length,
          recentUsers: users.length,
        });
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

  return (
    <DashboardSection
      title="Admin overview"
      description="Verify supply, review reports, and manage access."
    >
      {error ? <p className="text-sm text-red-600">{error}</p> : null}

      {loading ? (
        <div className="flex items-center gap-2 text-sm text-muted">
          <Spinner className="size-4" label="Loading overview" />
          Loading…
        </div>
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
    </DashboardSection>
  );
}
