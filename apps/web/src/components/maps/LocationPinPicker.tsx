"use client";

import {
  APIProvider,
  AdvancedMarker,
  Map,
  useMap,
  useMapsLibrary,
} from "@vis.gl/react-google-maps";
import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  parseGeocoderResult,
  type AddressHints,
} from "@/lib/maps/address-hints";
import { requestBrowserLocation } from "@/lib/geo/browser-geolocation";

const MAPS_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? "";
const MAP_ID = process.env.NEXT_PUBLIC_GOOGLE_MAP_ID ?? "";
export const KAMPALA_CENTER = { lat: 0.3476, lng: 32.5825 };

export type LatLng = { lat: number; lng: number };

type LocationPinPickerProps = {
  value: LatLng;
  onChange: (value: LatLng) => void;
  onAddressHints?: (hints: AddressHints) => void;
  readOnly?: boolean;
  showCoordinates?: boolean;
  className?: string;
};

export function LocationPinPicker({
  value,
  onChange,
  onAddressHints,
  readOnly = false,
  showCoordinates = true,
  className = "h-56",
}: LocationPinPickerProps) {
  const [geoLoading, setGeoLoading] = useState(false);
  const [geoError, setGeoError] = useState<string | null>(null);

  const handleUseMyLocation = useCallback(async () => {
    setGeoError(null);
    setGeoLoading(true);
    try {
      const location = await requestBrowserLocation();
      onChange(location);
    } catch (err) {
      setGeoError(
        err instanceof Error ? err.message : "Could not get your location.",
      );
    } finally {
      setGeoLoading(false);
    }
  }, [onChange]);

  if (!MAPS_KEY || MAPS_KEY.startsWith("your-")) {
    return (
      <FallbackPicker value={value} onChange={onChange} readOnly={readOnly} />
    );
  }

  return (
    <APIProvider apiKey={MAPS_KEY} libraries={["marker", "geocoding"]}>
      <div className="space-y-2">
        <div className={`overflow-hidden border border-border ${className}`}>
          <Map
            defaultCenter={value.lat && value.lng ? value : KAMPALA_CENTER}
            defaultZoom={15}
            mapId={MAP_ID}
            gestureHandling={readOnly ? "none" : "greedy"}
            disableDefaultUI={readOnly}
            clickableIcons={false}
            onClick={
              readOnly
                ? undefined
                : (e) => {
                    const latLng = e.detail.latLng;
                    if (latLng) {
                      onChange({ lat: latLng.lat, lng: latLng.lng });
                    }
                  }
            }
            className="h-full w-full"
          >
            <MapRecenter value={value} />
            <ReverseGeocodeHints value={value} onAddressHints={onAddressHints} />
            <AdvancedMarker
              position={value}
              draggable={!readOnly}
              onDragEnd={(e) => {
                const latLng = e.latLng;
                if (latLng) {
                  onChange({ lat: latLng.lat(), lng: latLng.lng() });
                }
              }}
            />
          </Map>
        </div>

        {!readOnly ? (
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-3">
              <Button
                type="button"
                variant="outline"
                size="sm"
                loading={geoLoading}
                loadingLabel="Finding your location"
                onClick={() => void handleUseMyLocation()}
              >
                Use my location
              </Button>
              <p className="text-xs text-muted">
                Tap or drag the pin to set the map marker.
              </p>
            </div>
            {geoError ? (
              <p className="text-xs text-red-600" role="alert">
                {geoError}
              </p>
            ) : null}
          </div>
        ) : null}

        {showCoordinates ? (
          <p className="font-mono text-xs text-muted">
            {value.lat.toFixed(5)}, {value.lng.toFixed(5)}
          </p>
        ) : null}
      </div>
    </APIProvider>
  );
}

function ReverseGeocodeHints({
  value,
  onAddressHints,
}: {
  value: LatLng;
  onAddressHints?: (hints: AddressHints) => void;
}) {
  const geocoding = useMapsLibrary("geocoding");
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!geocoding || !onAddressHints) return;

    if (timerRef.current) clearTimeout(timerRef.current);

    timerRef.current = setTimeout(() => {
      const geocoder = new geocoding.Geocoder();
      geocoder.geocode({ location: value }, (results, status) => {
        if (status === "OK" && results?.[0]) {
          onAddressHints(parseGeocoderResult(results[0]));
        }
      });
    }, 400);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [geocoding, onAddressHints, value.lat, value.lng]);

  return null;
}

function MapRecenter({ value }: { value: LatLng }) {
  const map = useMap();

  useEffect(() => {
    if (!map) return;
    map.panTo(value);
  }, [map, value.lat, value.lng]);

  return null;
}

function FallbackPicker({
  value,
  onChange,
  readOnly,
}: {
  value: LatLng;
  onChange: (value: LatLng) => void;
  readOnly?: boolean;
}) {
  const setField = useCallback(
    (field: "lat" | "lng", raw: string) => {
      const num = Number(raw);
      if (Number.isFinite(num)) {
        onChange({ ...value, [field]: num });
      }
    },
    [onChange, value],
  );

  return (
    <div className="space-y-2">
      <div className="border border-dashed border-border bg-surface px-4 py-6 text-sm text-muted">
        Add <code className="text-xs">NEXT_PUBLIC_GOOGLE_MAPS_API_KEY</code> for
        the map picker. Enter coordinates manually below.
      </div>
      {!readOnly ? (
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block text-sm">
            Latitude
            <input
              type="number"
              step="any"
              value={value.lat}
              onChange={(e) => setField("lat", e.target.value)}
              className="mt-1 w-full border border-border px-3 py-2"
            />
          </label>
          <label className="block text-sm">
            Longitude
            <input
              type="number"
              step="any"
              value={value.lng}
              onChange={(e) => setField("lng", e.target.value)}
              className="mt-1 w-full border border-border px-3 py-2"
            />
          </label>
        </div>
      ) : (
        <p className="font-mono text-xs text-muted">
          {value.lat.toFixed(5)}, {value.lng.toFixed(5)}
        </p>
      )}
    </div>
  );
}
