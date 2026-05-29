"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { fetchMyUnlocks, type TenantUnlock } from "@/lib/api/unlocks";
import { getAccessToken } from "@/lib/api/client";
import { UnlockedAccessCard } from "@/components/buildings/UnlockedAccessCard";
import { LoadingState } from "@/components/ui/loading-state";

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
    <>
      <h1 className="text-2xl font-bold tracking-tight">My unlocks</h1>
      <p className="mt-2 max-w-2xl text-sm text-muted">
        Buildings and units where you paid for exclusive landlord contact.
      </p>

      {loading ? (
        <LoadingState label="Loading unlocks" className="mt-8" />
      ) : error ? (
        <p className="mt-8 text-sm text-red-600">{error}</p>
      ) : unlocks.length === 0 ? (
        <div className="mt-8 border border-dashed border-border p-8 text-center text-sm text-muted">
          No active unlocks.{" "}
          <Link href="/explore" className="text-primary hover:underline">
            Browse the map
          </Link>{" "}
          to find a unit.
        </div>
      ) : (
        <div className="mt-8 space-y-6">
          {unlocks.map((unlock) => (
            <UnlockedAccessCard key={unlock.unlockId} unlock={unlock} />
          ))}
        </div>
      )}
    </>
  );
}
