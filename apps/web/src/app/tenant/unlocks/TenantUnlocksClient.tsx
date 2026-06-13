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

const TABS: Array<{ id: UnlockListStatus; label: string }> = [
  { id: "active", label: "Active" },
  { id: "expired", label: "Past unlocks" },
];

export default function TenantUnlocksClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [tab, setTab] = useState<UnlockListStatus>("active");
  const [unlocks, setUnlocks] = useState<TenantUnlock[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const activeUnlocks = useMemo(
    () =>
      tab === "active"
        ? sortUnlocksByExpiry(
            unlocks.filter((unlock) => unlock.unlockState !== "expired"),
          )
        : [],
    [tab, unlocks],
  );

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
        const list = await fetchMyUnlocks(tab);
        if (!cancelled) {
          setUnlocks(
            tab === "active" ? sortUnlocksByExpiry(list) : list,
          );
        }
      } catch {
        if (!cancelled) setError("Could not load your unlocks.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [router, tab]);

  useEffect(() => {
    if (tab !== "active" || activeUnlocks.length === 0) {
      setSelectedId(null);
      return;
    }

    const fromUrl = searchParams.get("unlock");
    if (fromUrl && activeUnlocks.some((unlock) => unlock.unlockId === fromUrl)) {
      setSelectedId(fromUrl);
      return;
    }

    setSelectedId((current) => {
      if (current && activeUnlocks.some((unlock) => unlock.unlockId === current)) {
        return current;
      }
      return activeUnlocks[0]?.unlockId ?? null;
    });
  }, [activeUnlocks, searchParams, tab]);

  function handleSelectUnlock(unlockId: string) {
    setSelectedId(unlockId);
    const params = new URLSearchParams(searchParams.toString());
    params.set("unlock", unlockId);
    router.replace(`/tenant/unlocks?${params.toString()}`, { scroll: false });
  }

  const selectedUnlock =
    activeUnlocks.find((unlock) => unlock.unlockId === selectedId) ??
    activeUnlocks[0] ??
    null;

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
