"use client";

import { useEffect, useState } from "react";
import {
  fetchPendingBuildings,
  verifyBuilding,
  getLandlordDisplayName,
  type PendingBuilding,
} from "@/lib/api/buildings";
import { getAccessToken } from "@/lib/api/client";
import { useRouter } from "next/navigation";
import { DashboardSection } from "@/components/layout/DashboardSection";
import { Button } from "@/components/ui/button";
import { LocationPinPicker } from "@/components/maps/LocationPinPicker";

function mapsLink(lat: number, lng: number) {
  return `https://www.google.com/maps?q=${lat},${lng}`;
}

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
    <DashboardSection
      title="Pending buildings"
      description="Quick check: pin is in the right area, cover photo looks real, optional video link works. One tap to approve."
    >
      {error && <p className="text-sm text-red-600">{error}</p>}

      <ul className="space-y-4">
        {pending.map((b) => (
          <li
            key={b.id}
            className="border border-border bg-background p-4"
          >
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="font-medium">{b.name}</p>
                <p className="text-sm text-muted">
                  {[b.district, b.city].filter(Boolean).join(", ")}
                </p>
                <p className="mt-1 text-xs text-muted">
                  Landlord: {getLandlordDisplayName(b)}
                  {b.phone ? ` · ${b.phone}` : ""}
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
            </div>

            <div className="mt-4 grid gap-4 lg:grid-cols-2">
              <div>
                <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted">
                  Map pin
                </p>
                <LocationPinPicker
                  value={{
                    lat: b.approximate_lat,
                    lng: b.approximate_lng,
                  }}
                  onChange={() => {}}
                  readOnly
                  className="h-44"
                />
                <a
                  href={mapsLink(b.approximate_lat, b.approximate_lng)}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-2 inline-block text-sm text-primary hover:underline"
                >
                  Open in Google Maps
                </a>
              </div>

              <div className="space-y-3">
                {b.cover_image_path ? (
                  <div>
                    <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted">
                      Cover photo
                    </p>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={b.cover_image_path}
                      alt={`${b.name} cover`}
                      className="max-h-44 w-full border border-border object-cover"
                    />
                  </div>
                ) : (
                  <p className="text-sm text-amber-700">No cover photo uploaded.</p>
                )}

                {b.video_url ? (
                  <div>
                    <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted">
                      YouTube tour
                    </p>
                    <a
                      href={b.video_url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-sm text-primary hover:underline"
                    >
                      {b.video_url}
                    </a>
                  </div>
                ) : null}
              </div>
            </div>
          </li>
        ))}
        {pending.length === 0 && !error && (
          <li className="text-sm text-muted">No pending buildings.</li>
        )}
      </ul>
    </DashboardSection>
  );
}
