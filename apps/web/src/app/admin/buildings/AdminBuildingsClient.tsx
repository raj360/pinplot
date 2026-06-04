"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  fetchPendingBuildings,
  getLandlordDisplayName,
  type PendingBuilding,
} from "@/lib/api/buildings";
import { getAccessToken } from "@/lib/api/client";
import { useRouter } from "next/navigation";
import { AdminPendingBuildingsSkeleton } from "@/components/admin/AdminPageSkeletons";
import { DashboardSection } from "@/components/layout/DashboardSection";
import { LocationPinPicker } from "@/components/maps/LocationPinPicker";

function mapsLink(lat: number, lng: number) {
  return `https://www.google.com/maps?q=${lat},${lng}`;
}

export default function AdminBuildingsClient() {
  const router = useRouter();
  const [pending, setPending] = useState<PendingBuilding[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    try {
      setPending(await fetchPendingBuildings());
      setError(null);
    } catch {
      setError(
        "Could not load pending buildings. Ensure your profile role is ADMIN in Supabase.",
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    let cancelled = false;

    getAccessToken().then(async (token) => {
      if (cancelled) return;
      if (!token) {
        router.replace("/auth/login?next=/admin/buildings");
        return;
      }
      await load();
    });

    return () => {
      cancelled = true;
    };
  }, [router]);

  return (
    <DashboardSection
      title="Pending buildings"
      description="Quick check: pin is in the right area, cover photo looks real, optional video link works. Edit to fix mistakes, then approve."
    >
      {error && !loading ? <p className="text-sm text-red-600">{error}</p> : null}

      {loading ? (
        <AdminPendingBuildingsSkeleton />
      ) : (
        <ul className="space-y-4">
          {pending.map((b) => (
            <li
              key={b.id}
              className="border border-border bg-surface p-4"
            >
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="font-medium">{b.name}</p>
                  <p className="text-sm text-muted">
                    {[b.district, b.city].filter(Boolean).join(", ")}
                  </p>
                  <p className="mt-1 text-xs text-muted">
                    Landlord: {getLandlordDisplayName(b)}
                    {b.phone ? ` · ${b.phone}` : " · no phone on profile"}
                  </p>
                  <p className="mt-1 text-xs text-muted">
                    {b.unit_count}{" "}
                    {b.unit_count === 1 ? "unit" : "units"} listed
                    {b.unit_count !== b.total_units
                      ? ` (${b.total_units} declared)`
                      : ""}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Link
                    href={`/admin/buildings/${b.id}`}
                    className="inline-flex items-center justify-center border border-border bg-surface px-3 py-1.5 text-xs font-medium text-foreground hover:bg-background"
                  >
                    Edit
                  </Link>
                  <Link
                    href={`/admin/buildings/${b.id}`}
                    className="inline-flex items-center justify-center bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:opacity-90"
                  >
                    Review & approve
                  </Link>
                </div>
              </div>

              <div className="mt-4 grid gap-4 lg:grid-cols-2">
                <div>
                  <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted">
                    Landlord pin (exact)
                  </p>
                  <LocationPinPicker
                    value={{
                      lat: b.pin_lat,
                      lng: b.pin_lng,
                    }}
                    onChange={() => {}}
                    readOnly
                    showCoordinates={false}
                    className="h-44"
                  />
                  <p className="mt-2 font-mono text-xs text-muted">
                    {b.pin_lat.toFixed(5)}, {b.pin_lng.toFixed(5)}
                  </p>
                  <a
                    href={mapsLink(b.pin_lat, b.pin_lng)}
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
      )}
    </DashboardSection>
  );
}
