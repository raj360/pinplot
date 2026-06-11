"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { MapPin } from "lucide-react";
import { FeaturedListingBadge } from "@/components/explore/FeaturedListingBadge";
import { TenantUnlocksSkeleton } from "@/components/landlord/LandlordPageSkeletons";
import { SaveBuildingButton } from "@/components/saved/SaveBuildingButton";
import { useSavedBuildings } from "@/components/saved/SavedBuildingsProvider";
import { fetchSavedBuildings, type SavedBuilding } from "@/lib/api/saved-buildings";
import { exploreBuildingUrl } from "@/lib/explore/urls";
import { getAccessToken } from "@/lib/api/client";
import { useViewerContext } from "@/components/providers/ViewerContextProvider";

export default function TenantSavedClient() {
  const router = useRouter();
  const { formatListingRent } = useViewerContext();
  const { refresh: refreshSavedIds } = useSavedBuildings();
  const [listings, setListings] = useState<SavedBuilding[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getAccessToken().then(async (token) => {
      if (!token) {
        router.replace("/auth/login?next=/tenant/saved");
        return;
      }
      try {
        setListings(await fetchSavedBuildings());
        await refreshSavedIds();
      } catch {
        setError("Could not load saved listings.");
      } finally {
        setLoading(false);
      }
    });
  }, [router, refreshSavedIds]);

  if (loading) {
    return <TenantUnlocksSkeleton />;
  }

  if (error) {
    return <p className="text-sm text-red-600">{error}</p>;
  }

  if (listings.length === 0) {
    return (
      <div className="border border-dashed border-border p-8 text-center text-sm text-muted">
        No saved listings yet. Tap the heart on Explore to bookmark buildings
        you want to revisit.{" "}
        <Link href="/explore" className="text-primary hover:underline">
          Browse the map
        </Link>
      </div>
    );
  }

  return (
    <ul className="space-y-3">
      {listings.map((building) => {
        const rentPeriod =
          building.rentPeriod === "day" || building.rentPeriod === "month"
            ? building.rentPeriod
            : building.buildingType === "airbnb"
              ? "day"
              : "month";

        return (
          <li
            key={building.id}
            className="flex gap-3 border border-border bg-surface p-3"
          >
            {building.coverThumbUrl ? (
              <div className="relative h-20 w-20 shrink-0">
                {building.isFeatured ? (
                  <FeaturedListingBadge variant="overlay" />
                ) : null}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={building.coverThumbUrl}
                  alt=""
                  className="h-full w-full object-cover"
                />
              </div>
            ) : null}
            <div className="min-w-0 flex-1">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <Link
                    href={exploreBuildingUrl(building.id, { hideMap: true })}
                    className="font-semibold text-primary hover:underline"
                  >
                    {building.name}
                  </Link>
                  <p className="mt-0.5 flex items-center gap-1 text-sm text-muted">
                    <MapPin className="size-3.5 shrink-0" aria-hidden />
                    {[building.district, building.city].filter(Boolean).join(", ")}
                  </p>
                </div>
                <SaveBuildingButton buildingId={building.id} />
              </div>
              <p className="mt-2 text-sm text-foreground">
                {building.availableUnitCount > 0 ? (
                  <>
                    {building.availableUnitCount} available
                    {building.rentFrom != null ? (
                      <>
                        {" "}
                        · from{" "}
                        {formatListingRent(
                          building.rentFrom,
                          building.currency,
                          building.countryCode,
                          rentPeriod,
                        )}
                      </>
                    ) : null}
                  </>
                ) : (
                  <span className="text-muted">No units available right now</span>
                )}
              </p>
              <Link
                href={exploreBuildingUrl(building.id, { hideMap: true })}
                className="mt-2 inline-block text-sm font-medium text-primary hover:underline"
              >
                View on Explore →
              </Link>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
