"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { DashboardSection } from "@/components/layout/DashboardSection";
import { fetchMyUnlocks, type TenantUnlock } from "@/lib/api/unlocks";
import { getAccessToken } from "@/lib/api/client";
import { UnlockedAccessCard } from "@/components/buildings/UnlockedAccessCard";
import { TenantUnlocksSkeleton } from "@/components/landlord/LandlordPageSkeletons";

export default function TenantUnlocksPage() {
  const router = useRouter();
  const [unlocks, setUnlocks] = useState<TenantUnlock[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getAccessToken().then(async (token) => {
      if (!token) {
        router.replace("/auth/login?next=/tenant/unlocks");
        return;
      }
      try {
        setUnlocks(await fetchMyUnlocks());
      } catch {
        setError("Could not load your unlocks.");
      } finally {
        setLoading(false);
      }
    });
  }, [router]);

  return (
    <DashboardSection
      title="My unlocks"
      description="Buildings and units where you paid for exclusive landlord contact."
    >
      {loading ? (
        <TenantUnlocksSkeleton />
      ) : error ? (
        <p className="text-sm text-red-600">{error}</p>
      ) : unlocks.length === 0 ? (
        <div className="border border-dashed border-border p-8 text-center text-sm text-muted">
          No active unlocks.{" "}
          <Link href="/explore" className="text-primary hover:underline">
            Browse the map
          </Link>{" "}
          to find a unit.
        </div>
      ) : (
        <div className="space-y-4">
          {unlocks.map((unlock) => (
            <UnlockedAccessCard key={unlock.unlockId} unlock={unlock} />
          ))}
        </div>
      )}
    </DashboardSection>
  );
}
