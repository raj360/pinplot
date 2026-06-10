"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { DashboardSection } from "@/components/layout/DashboardSection";
import {
  fetchMyUnlocks,
  type TenantUnlock,
  type UnlockListStatus,
} from "@/lib/api/unlocks";
import { getAccessToken } from "@/lib/api/client";
import { UnlockedAccessCard } from "@/components/buildings/UnlockedAccessCard";
import { ExpiredUnlockCard } from "@/components/unlocks/ExpiredUnlockCard";
import { TenantUnlocksSkeleton } from "@/components/landlord/LandlordPageSkeletons";
import { cn } from "@/lib/utils/cn";

const TABS: Array<{ id: UnlockListStatus; label: string }> = [
  { id: "active", label: "Active" },
  { id: "expired", label: "Past unlocks" },
];

export default function TenantUnlocksPage() {
  const router = useRouter();
  const [tab, setTab] = useState<UnlockListStatus>("active");
  const [unlocks, setUnlocks] = useState<TenantUnlock[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    getAccessToken().then(async (token) => {
      if (cancelled) return;
      if (!token) {
        router.replace("/auth/login?next=/tenant/unlocks");
        return;
      }

      setLoading(true);
      setError(null);
      try {
        setUnlocks(await fetchMyUnlocks(tab));
      } catch {
        setError("Could not load your unlocks.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [router, tab]);

  return (
    <DashboardSection
      title="My unlocks"
      description="Paid contact access and unlock history. To bookmark listings before unlocking, use Saved listings."
    >
      <div className="mb-6 flex gap-1 border-b border-border">
        {TABS.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setTab(item.id)}
            className={cn(
              "border-b-2 px-4 py-2 text-sm font-medium transition-colors",
              tab === item.id
                ? "border-primary text-primary"
                : "border-transparent text-muted hover:text-foreground",
            )}
          >
            {item.label}
          </button>
        ))}
      </div>

      {loading ? (
        <TenantUnlocksSkeleton />
      ) : error ? (
        <p className="text-sm text-red-600">{error}</p>
      ) : unlocks.length === 0 ? (
        <div className="border border-dashed border-border p-8 text-center text-sm text-muted">
          {tab === "active" ? (
            <>
              No active unlocks.{" "}
              <Link href="/explore" className="text-primary hover:underline">
                Browse the map
              </Link>{" "}
              to find a unit.
            </>
          ) : (
            <>No past unlocks yet.</>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {unlocks.map((unlock) =>
            unlock.unlockState === "expired" ? (
              <ExpiredUnlockCard key={unlock.unlockId} unlock={unlock} />
            ) : (
              <UnlockedAccessCard key={unlock.unlockId} unlock={unlock} />
            ),
          )}
        </div>
      )}
    </DashboardSection>
  );
}
