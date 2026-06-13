"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { DashboardSection } from "@/components/layout/DashboardSection";
import {
  fetchMyUnlocks,
  type TenantUnlock,
  type UnlockListStatus,
} from "@/lib/api/unlocks";
import { getAccessToken } from "@/lib/api/client";
import { UnlockedAccessCard } from "@/components/buildings/UnlockedAccessCard";
import { ExpiredUnlockCard } from "@/components/unlocks/ExpiredUnlockCard";
import { UnlockPickerList } from "@/components/unlocks/UnlockPickerList";
import { TenantUnlocksSkeleton } from "@/components/landlord/LandlordPageSkeletons";
import { cn } from "@/lib/utils/cn";

function sortUnlocksByExpiry(unlocks: TenantUnlock[]) {
  return [...unlocks].sort((a, b) => {
    if (!a.expiresAt && !b.expiresAt) return 0;
    if (!a.expiresAt) return 1;
    if (!b.expiresAt) return -1;
    return new Date(a.expiresAt).getTime() - new Date(b.expiresAt).getTime();
  });
}

function activeOnly(unlocks: TenantUnlock[]) {
  return sortUnlocksByExpiry(
    unlocks.filter((unlock) => unlock.unlockState !== "expired"),
  );
}

function expiredOnly(unlocks: TenantUnlock[]) {
  return unlocks.filter((unlock) => unlock.unlockState === "expired");
}

function tabFromUnlock(unlock: TenantUnlock): UnlockListStatus {
  return unlock.unlockState === "expired" ? "expired" : "active";
}

const TABS: Array<{ id: UnlockListStatus; label: string }> = [
  { id: "active", label: "Active" },
  { id: "expired", label: "Past unlocks" },
];

export default function TenantUnlocksClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const unlockParam = searchParams.get("unlock");
  const tab: UnlockListStatus =
    searchParams.get("tab") === "expired" ? "expired" : "active";

  const [unlocks, setUnlocks] = useState<TenantUnlock[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const activeUnlocks = useMemo(
    () => (tab === "active" ? activeOnly(unlocks) : []),
    [tab, unlocks],
  );

  const selectedUnlockId = useMemo(() => {
    if (tab !== "active" || activeUnlocks.length === 0) return null;
    if (
      unlockParam &&
      activeUnlocks.some((unlock) => unlock.unlockId === unlockParam)
    ) {
      return unlockParam;
    }
    return activeUnlocks[0]?.unlockId ?? null;
  }, [activeUnlocks, tab, unlockParam]);

  const selectedUnlock =
    activeUnlocks.find((unlock) => unlock.unlockId === selectedUnlockId) ??
    activeUnlocks[0] ??
    null;

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
        const explicitTab = searchParams.get("tab");
        const deepLinkUnlock = searchParams.get("unlock");

        if (deepLinkUnlock && !explicitTab) {
          const all = await fetchMyUnlocks("all");
          if (cancelled) return;

          const target = all.find((unlock) => unlock.unlockId === deepLinkUnlock);
          const resolvedTab = target ? tabFromUnlock(target) : "active";
          const params = new URLSearchParams();
          params.set("tab", resolvedTab);
          params.set("unlock", deepLinkUnlock);
          router.replace(`/tenant/unlocks?${params.toString()}`, {
            scroll: false,
          });
          return;
        }

        const list = await fetchMyUnlocks(tab);
        if (cancelled) return;
        setUnlocks(tab === "active" ? activeOnly(list) : expiredOnly(list));
      } catch {
        if (!cancelled) setError("Could not load your unlocks.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [router, searchParams, tab]);

  function handleTabChange(nextTab: UnlockListStatus) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", nextTab);
    if (nextTab === "expired") {
      params.delete("unlock");
    }
    router.replace(`/tenant/unlocks?${params.toString()}`, { scroll: false });
  }

  function handleSelectUnlock(unlockId: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", "active");
    params.set("unlock", unlockId);
    router.replace(`/tenant/unlocks?${params.toString()}`, { scroll: false });
  }

  const highlightedExpiredId =
    tab === "expired" && unlockParam ? unlockParam : null;

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
            onClick={() => handleTabChange(item.id)}
            className={cn(
              "border-b-2 px-4 py-2 text-sm font-medium transition-colors",
              tab === item.id
                ? "border-primary text-primary"
                : "border-transparent text-muted hover:text-foreground",
            )}
          >
            {item.label}
            {item.id === "active" && !loading && tab === "active" && unlocks.length > 0 ? (
              <span className="ml-1.5 text-muted">({unlocks.length})</span>
            ) : null}
          </button>
        ))}
      </div>

      {loading ? (
        <TenantUnlocksSkeleton variant={tab === "expired" ? "expired" : "active"} />
      ) : error ? (
        <p className="text-sm text-red-600">{error}</p>
      ) : unlocks.length === 0 ? (
        <div className="card-elevated border-dashed px-4 py-8 text-center text-sm text-muted">
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
      ) : tab === "active" && activeUnlocks.length > 1 && selectedUnlock ? (
        <div className="space-y-4">
          <UnlockPickerList
            unlocks={activeUnlocks}
            selectedId={selectedUnlock.unlockId}
            onSelect={handleSelectUnlock}
            layout="strip"
          />
          <div className="grid gap-4 lg:grid-cols-[14rem_minmax(0,1fr)] lg:items-start">
            <UnlockPickerList
              unlocks={activeUnlocks}
              selectedId={selectedUnlock.unlockId}
              onSelect={handleSelectUnlock}
              layout="sidebar"
            />
            <UnlockedAccessCard key={selectedUnlock.unlockId} unlock={selectedUnlock} />
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {unlocks.map((unlock) =>
            unlock.unlockState === "expired" ? (
              <ExpiredUnlockCard
                key={unlock.unlockId}
                unlock={unlock}
                highlighted={unlock.unlockId === highlightedExpiredId}
              />
            ) : (
              <UnlockedAccessCard key={unlock.unlockId} unlock={unlock} />
            ),
          )}
        </div>
      )}
    </DashboardSection>
  );
}
