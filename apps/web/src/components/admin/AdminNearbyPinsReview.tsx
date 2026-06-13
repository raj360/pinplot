"use client";

import {
  APIProvider,
  AdvancedMarker,
  Map,
  useMap,
} from "@vis.gl/react-google-maps";
import Link from "next/link";
import { useEffect } from "react";
import {
  DUPLICATE_PIN_RADIUS_METERS,
  DUPLICATE_PIN_REJECT_REASON,
} from "@plotpin/shared-types";
import type { LatLng } from "@/components/maps/LocationPinPicker";
import { KAMPALA_CENTER } from "@/components/maps/LocationPinPicker";
import type { NearbyPinReview } from "@/lib/api/buildings";

const MAPS_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? "";
const MAP_ID = process.env.NEXT_PUBLIC_GOOGLE_MAP_ID ?? "";

type AdminNearbyPinsReviewProps = {
  center: LatLng;
  nearbyPins: NearbyPinReview[];
  duplicatePinWarningsCount: number;
  acknowledgeDuplicatePin: boolean;
  onAcknowledgeChange: (value: boolean) => void;
  onRejectDuplicate: () => void;
  pinDirty?: boolean;
  loading?: boolean;
};

function pinStatusLabel(pin: NearbyPinReview): string {
  if (pin.isRejected) return "Rejected";
  if (pin.isVerified) return "Live on map";
  return "Pending review";
}

function pinStatusTone(pin: NearbyPinReview): string {
  if (pin.duplicateRisk) return "text-red-800 bg-red-100 border-red-200";
  if (pin.isSameLandlord) return "text-blue-900 bg-blue-50 border-blue-200";
  if (pin.isRejected) return "text-muted bg-surface border-border";
  return "text-amber-900 bg-amber-50 border-amber-200";
}

export function AdminNearbyPinsReview({
  center,
  nearbyPins,
  duplicatePinWarningsCount,
  acknowledgeDuplicatePin,
  onAcknowledgeChange,
  onRejectDuplicate,
  pinDirty = false,
  loading = false,
}: AdminNearbyPinsReviewProps) {
  const hasDuplicateRisk = duplicatePinWarningsCount > 0;

  return (
    <section className="mb-6 border border-border bg-surface p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-medium">Nearby pins ({DUPLICATE_PIN_RADIUS_METERS}m)</h2>
          <p className="mt-1 text-sm text-muted">
            Compare this listing against buildings already pinned within{" "}
            {DUPLICATE_PIN_RADIUS_METERS}&nbsp;m (using each landlord&apos;s{" "}
            <strong className="font-medium text-foreground">exact pin</strong>,
            not the blurred public map pin).
          </p>
        </div>
        {loading ? (
          <span className="text-xs text-muted">Refreshing map…</span>
        ) : null}
      </div>

      {pinDirty ? (
        <p className="mt-2 text-xs text-amber-800">
          Pin moved — preview uses the new location. Save building details before
          approving so the live pin matches your review.
        </p>
      ) : null}

      <div className="mt-3 overflow-hidden border border-border">
        <AdminNearbyPinsMap center={center} nearbyPins={nearbyPins} />
      </div>

      <div className="mt-4 grid gap-3 lg:grid-cols-2">
        <div className="border border-border bg-surface p-3 text-sm">
          <h3 className="font-medium">Decision guide</h3>
          <ul className="mt-2 space-y-2 text-muted">
            <li>
              <strong className="text-foreground">Reject</strong> — verified
              listing for another landlord within {DUPLICATE_PIN_RADIUS_METERS}
              &nbsp;m (duplicate scam risk).
            </li>
            <li>
              <strong className="text-foreground">Approve with care</strong> —
              same landlord with multiple pins (e.g. block of flats) or only
              pending/rejected neighbors — confirm photos and ownership.
            </li>
            <li>
              <strong className="text-foreground">Approve</strong> — no pins
              within {DUPLICATE_PIN_RADIUS_METERS}&nbsp;m, or pin adjusted to a
              distinct building.
            </li>
          </ul>
        </div>

        <div className="border border-border bg-surface p-3 text-sm">
          <h3 className="font-medium">
            {nearbyPins.length === 0
              ? "No nearby pins"
              : `${nearbyPins.length} pin${nearbyPins.length === 1 ? "" : "s"} nearby`}
          </h3>
          {nearbyPins.length === 0 ? (
            <p className="mt-2 text-muted">
              Nothing else is pinned within {DUPLICATE_PIN_RADIUS_METERS}&nbsp;m.
            </p>
          ) : (
            <ul className="mt-2 space-y-2">
              {nearbyPins.map((pin) => (
                <li
                  key={pin.id}
                  className={`border px-2 py-2 ${pinStatusTone(pin)}`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="font-medium">{pin.name}</span>
                    <span className="text-xs">~{pin.distanceM}m</span>
                  </div>
                  <p className="mt-1 text-xs">
                    {pinStatusLabel(pin)}
                    {pin.isSameLandlord ? " · same landlord" : " · other landlord"}
                    {pin.duplicateRisk ? " · blocks approval unless acknowledged" : ""}
                  </p>
                  <Link
                    href={`/admin/buildings/${pin.id}`}
                    className="mt-1 inline-block text-xs underline"
                  >
                    Open listing
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {hasDuplicateRisk ? (
        <div className="mt-4 border border-amber-300 bg-amber-50 p-4">
          <h3 className="text-sm font-medium text-amber-950">
            Duplicate pin risk
          </h3>
          <p className="mt-1 text-sm text-amber-900">
            {duplicatePinWarningsCount} verified listing
            {duplicatePinWarningsCount === 1 ? "" : "s"} for another landlord
            within {DUPLICATE_PIN_RADIUS_METERS}&nbsp;m. Reject if this is the
            same property, or acknowledge after confirming it is a distinct
            building.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              className="border border-red-200 bg-white px-3 py-1.5 text-xs text-red-900 hover:bg-red-50"
              onClick={onRejectDuplicate}
            >
              Reject as duplicate
            </button>
          </div>
          <label className="mt-3 flex items-start gap-2 text-sm text-amber-950">
            <input
              type="checkbox"
              checked={acknowledgeDuplicatePin}
              onChange={(event) => onAcknowledgeChange(event.target.checked)}
            />
            I reviewed nearby pins on the map and confirm this is a separate
            building — approve anyway.
          </label>
        </div>
      ) : null}
    </section>
  );
}

export { DUPLICATE_PIN_REJECT_REASON };

function AdminNearbyPinsMap({
  center,
  nearbyPins,
}: {
  center: LatLng;
  nearbyPins: NearbyPinReview[];
}) {
  if (!MAPS_KEY || MAPS_KEY.startsWith("your-")) {
    return (
      <div className="flex h-56 items-center justify-center bg-surface px-4 text-sm text-muted">
        Add Google Maps API key to preview the {DUPLICATE_PIN_RADIUS_METERS}m
        radius map.
      </div>
    );
  }

  return (
    <APIProvider apiKey={MAPS_KEY} libraries={["marker"]}>
      <div className="h-56">
        <Map
          defaultCenter={center.lat && center.lng ? center : KAMPALA_CENTER}
          defaultZoom={18}
          mapId={MAP_ID}
          gestureHandling="greedy"
          clickableIcons={false}
          className="h-full w-full"
        >
          <MapFitNearby center={center} nearbyPins={nearbyPins} />
          <RadiusCircle center={center} radiusM={DUPLICATE_PIN_RADIUS_METERS} />
          <AdvancedMarker position={center}>
            <div className="flex size-8 items-center justify-center rounded-full border-2 border-white bg-primary text-xs font-semibold text-white shadow-md">
              New
            </div>
          </AdvancedMarker>
          {nearbyPins.map((pin) => (
            <AdvancedMarker
              key={pin.id}
              position={{ lat: pin.pinLat, lng: pin.pinLng }}
            >
              <div
                className={`size-6 rounded-full border-2 border-white shadow-md ${
                  pin.duplicateRisk
                    ? "bg-red-600"
                    : pin.isSameLandlord
                      ? "bg-blue-600"
                      : pin.isVerified
                        ? "bg-green-600"
                        : "bg-amber-500"
                }`}
                title={pin.name}
              />
            </AdvancedMarker>
          ))}
        </Map>
      </div>
    </APIProvider>
  );
}

function RadiusCircle({
  center,
  radiusM,
}: {
  center: LatLng;
  radiusM: number;
}) {
  const map = useMap();

  useEffect(() => {
    if (!map) return;

    const circle = new google.maps.Circle({
      map,
      center,
      radius: radiusM,
      fillColor: "#f59e0b",
      fillOpacity: 0.12,
      strokeColor: "#d97706",
      strokeOpacity: 0.85,
      strokeWeight: 2,
      clickable: false,
    });

    return () => {
      circle.setMap(null);
    };
  }, [map, center.lat, center.lng, radiusM]);

  return null;
}

function MapFitNearby({
  center,
  nearbyPins,
}: {
  center: LatLng;
  nearbyPins: NearbyPinReview[];
}) {
  const map = useMap();

  useEffect(() => {
    if (!map) return;

    const bounds = new google.maps.LatLngBounds();
    bounds.extend(center);
    for (const pin of nearbyPins) {
      bounds.extend({ lat: pin.pinLat, lng: pin.pinLng });
    }

    if (nearbyPins.length === 0) {
      map.setCenter(center);
      map.setZoom(18);
      return;
    }

    map.fitBounds(bounds, 48);
  }, [map, center.lat, center.lng, nearbyPins]);

  return null;
}
