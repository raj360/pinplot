"use client";

import { useEffect, useState } from "react";
import {
  fetchPendingBuildings,
  verifyBuilding,
  type PendingBuilding,
} from "@/lib/api/buildings";
import { getAccessToken } from "@/lib/api/client";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export default function AdminBuildingsPage() {
  const router = useRouter();
  const [pending, setPending] = useState<PendingBuilding[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loadingId, setLoadingId] = useState<string | null>(null);

  async function load() {
    try {
      setPending(await fetchPendingBuildings());
    } catch {
      setError(
        "Could not load pending buildings. Ensure your profile role is ADMIN in Supabase.",
      );
    }
  }

  useEffect(() => {
    getAccessToken().then(async (token) => {
      if (!token) {
        router.replace("/auth/login?next=/admin/buildings");
        return;
      }
      await load();
    });
  }, [router]);

  async function approve(id: string) {
    setLoadingId(id);
    try {
      await verifyBuilding(id, true);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Verify failed");
    } finally {
      setLoadingId(null);
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-bold">Pending buildings</h1>
      <p className="mt-2 text-sm text-muted">
        Verify listings before they appear on the public map.
      </p>

      {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

      <ul className="mt-6 space-y-3">
        {pending.map((b) => (
          <li
            key={b.id}
            className="flex flex-wrap items-center justify-between gap-3 border border-border bg-surface p-4"
          >
            <div>
              <p className="font-medium">{b.name}</p>
              <p className="text-sm text-muted">
                {[b.district, b.city].filter(Boolean).join(", ")}
              </p>
              <p className="mt-1 text-xs text-muted">
                Landlord: {[b.first_name, b.last_name].filter(Boolean).join(" ") || "—"}{" "}
                {b.phone ? `· ${b.phone}` : ""}
              </p>
            </div>
            <Button
              type="button"
              loading={loadingId === b.id}
              loadingLabel="Approving building"
              onClick={() => approve(b.id)}
            >
              Approve
            </Button>
          </li>
        ))}
        {pending.length === 0 && !error && (
          <li className="text-sm text-muted">No pending buildings.</li>
        )}
      </ul>
    </div>
  );
}
