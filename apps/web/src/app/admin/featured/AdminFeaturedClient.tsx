"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AdminFeaturedSkeleton } from "@/components/admin/AdminPageSkeletons";
import {
  DashboardSection,
  StatCard,
} from "@/components/layout/DashboardSection";
import { Button } from "@/components/ui/button";
import { getAccessToken } from "@/lib/api/client";
import {
  fetchLaunchFeaturedStats,
  runLaunchFeaturedGrant,
  type LaunchFeaturedGrantResponse,
  type LaunchFeaturedStats,
} from "@/lib/api/featured";

function formatFeaturedUntil(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, { dateStyle: "medium" });
}

export default function AdminFeaturedClient() {
  const router = useRouter();
  const [stats, setStats] = useState<LaunchFeaturedStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [granting, setGranting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastGrant, setLastGrant] = useState<LaunchFeaturedGrantResponse | null>(
    null,
  );

  const load = useCallback(async () => {
    try {
      setStats(await fetchLaunchFeaturedStats());
      setError(null);
    } catch {
      setError(
        "Could not load featured stats. Ensure your profile role is ADMIN in Supabase.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    getAccessToken().then(async (token) => {
      if (cancelled) return;
      if (!token) {
        router.replace("/auth/login?next=/admin/featured");
        return;
      }
      await load();
    });

    return () => {
      cancelled = true;
    };
  }, [load, router]);

  async function handleLaunchGrant() {
    setGranting(true);
    setError(null);
    try {
      const result = await runLaunchFeaturedGrant();
      setLastGrant(result);
      setStats(result);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not grant featured placement.",
      );
    } finally {
      setGranting(false);
    }
  }

  const slotsFull = stats != null && stats.remainingSlots <= 0;

  return (
    <DashboardSection
      title="Featured listings"
      description="Launch promo: grant verified buildings up to 90 days of featured placement on explore. Featured listings sort first and show a badge. Free during launch — max 20 active grants."
    >
      {error && !loading ? <p className="text-sm text-red-600">{error}</p> : null}

      {loading ? (
        <AdminFeaturedSkeleton />
      ) : stats ? (
        <div className="space-y-5">
          <dl className="grid gap-3 sm:grid-cols-3">
            <StatCard label="Launch cap" value={stats.maxSlots} />
            <StatCard label="Active featured" value={stats.activeLaunchGrants} />
            <StatCard
              label="Slots available"
              value={stats.remainingSlots}
              highlight={stats.remainingSlots > 0 && stats.remainingSlots <= 5}
            />
          </dl>

          {slotsFull ? (
            <p className="text-sm text-muted">
              All {stats.maxSlots} launch featured slots are in use. Revoke featured
              status on a building or wait for a grant to expire before adding more.
            </p>
          ) : (
            <p className="text-sm text-muted">
              Grants the next eligible verified buildings that are not already
              featured. Each grant lasts 90 days.
            </p>
          )}

          <Button
            type="button"
            onClick={() => void handleLaunchGrant()}
            disabled={slotsFull}
            loading={granting}
            loadingLabel="Granting featured placement"
          >
            {slotsFull
              ? "Launch cap reached"
              : `Grant featured placement (${stats.remainingSlots} slot${stats.remainingSlots === 1 ? "" : "s"} left)`}
          </Button>

          {lastGrant ? (
            <div className="card-elevated px-4 py-3 text-sm">
              <p className="font-medium text-foreground">Last grant run</p>
              {lastGrant.message ? (
                <p className="mt-1.5 text-muted">{lastGrant.message}</p>
              ) : null}
              {lastGrant.granted.length > 0 ? (
                <>
                  <p className="mt-2 text-muted">
                    Featured {lastGrant.granted.length} building
                    {lastGrant.granted.length === 1 ? "" : "s"}:
                  </p>
                  <ul className="mt-2 space-y-1 text-muted">
                    {lastGrant.granted.map((entry) => (
                      <li key={entry.id}>
                        <span className="font-medium text-foreground">
                          {entry.name}
                        </span>
                        {entry.featuredUntil
                          ? ` — featured until ${formatFeaturedUntil(entry.featuredUntil)}`
                          : null}
                      </li>
                    ))}
                  </ul>
                </>
              ) : !lastGrant.message ? (
                <p className="mt-1.5 text-muted">
                  No eligible verified buildings were waiting for featured
                  placement.
                </p>
              ) : null}
            </div>
          ) : null}
        </div>
      ) : null}
    </DashboardSection>
  );
}
