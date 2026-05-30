"use client";

import { FormEvent, useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  createBuilding,
  registerBuildingImage,
  setProfileRole,
} from "@/lib/api/buildings";
import { getAccessToken } from "@/lib/api/client";
import { uploadBuildingImage } from "@/lib/supabase/storage";
import { Button } from "@/components/ui/button";
import { ImageUpload } from "@/components/ui/image-upload";
import {
  KAMPALA_CENTER,
  LocationPinPicker,
  type LatLng,
} from "@/components/maps/LocationPinPicker";
import { BUILDING_TYPE_OPTIONS } from "@/lib/filters/building-types";
import {
  normalizeYouTubeUrl,
  type AddressHints,
} from "@/lib/maps/address-hints";

type UnitRow = {
  unitNumber: string;
  bedrooms: number;
  bathrooms: number;
  rentAmount: number;
};

const DEFAULT_UNITS: UnitRow[] = [
  { unitNumber: "1", bedrooms: 1, bathrooms: 1, rentAmount: 500000 },
];

export default function NewBuildingPage() {
  const router = useRouter();
  const [units, setUnits] = useState<UnitRow[]>(DEFAULT_UNITS);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [location, setLocation] = useState<LatLng>(KAMPALA_CENTER);
  const [city, setCity] = useState("Kampala");
  const [district, setDistrict] = useState("");
  const [exactAddress, setExactAddress] = useState("");
  const [addressHint, setAddressHint] = useState("");
  const [areaLabel, setAreaLabel] = useState("");
  const [zones, setZones] = useState<string[]>([]);
  const [streetHint, setStreetHint] = useState("");
  const [landmarkHint, setLandmarkHint] = useState("");
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [buildingType, setBuildingType] = useState("apartment");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const cityTouched = useRef(false);
  const districtTouched = useRef(false);

  useEffect(() => {
    getAccessToken().then((token) => {
      if (!token) router.replace("/auth/login?next=/landlord/new");
    });
  }, [router]);

  const applyAddressHints = useCallback((hints: AddressHints) => {
    setAreaLabel(hints.areaLabel);
    setAddressHint(hints.addressHint);
    setZones(hints.zones);
    setStreetHint(hints.street ?? "");
    setLandmarkHint(hints.landmark ?? "");

    if (!cityTouched.current && hints.city) {
      setCity(hints.city);
    }
    if (!districtTouched.current && hints.district) {
      setDistrict(hints.district);
    }
  }, []);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const form = new FormData(e.currentTarget);

    try {
      const videoUrl = normalizeYouTubeUrl(youtubeUrl);

      await setProfileRole("LANDLORD");

      const building = await createBuilding({
        name: String(form.get("name")),
        description: String(form.get("description") || ""),
        city: city.trim() || "Kampala",
        district: district.trim(),
        approximateLat: location.lat,
        approximateLng: location.lng,
        exactAddress: exactAddress.trim(),
        videoUrl,
        buildingType,
        totalUnits: units.length,
        units,
      });

      if (coverFile && building.id) {
        const publicUrl = await uploadBuildingImage(building.id, coverFile);
        await registerBuildingImage(building.id, publicUrl, true);
      }

      router.push("/landlord/dashboard?created=1");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create building");
    } finally {
      setLoading(false);
    }
  }

  function addUnit() {
    setUnits((u) => [
      ...u,
      {
        unitNumber: String(u.length + 1),
        bedrooms: 1,
        bathrooms: 1,
        rentAmount: 500000,
      },
    ]);
  }

  function removeUnit(index: number) {
    setUnits((u) => (u.length <= 1 ? u : u.filter((_, i) => i !== index)));
  }

  return (
    <>
      <h1 className="text-2xl font-bold tracking-tight">Add building</h1>
      <p className="mt-2 max-w-2xl text-sm text-muted">
        Pin the location, add a cover photo, and submit for review.
      </p>

      <form onSubmit={handleSubmit} className="mt-6 max-w-3xl space-y-6">
        <section className="space-y-4 border border-border bg-surface p-4">
          <h2 className="font-semibold">Location</h2>
          <LocationPinPicker
            value={location}
            onChange={setLocation}
            onAddressHints={applyAddressHints}
          />
          {areaLabel ? (
            <div className="space-y-2">
              <p className="text-sm text-muted">
                Near:{" "}
                <span className="text-foreground">{areaLabel}</span>
              </p>
              {zones.length > 0 ? (
                <div className="flex flex-wrap gap-1.5">
                  {zones.map((zone) => (
                    <span
                      key={zone}
                      className="border border-border bg-background px-2 py-0.5 text-xs text-foreground"
                    >
                      {zone}
                    </span>
                  ))}
                  {city ? (
                    <span className="border border-primary/30 bg-primary/5 px-2 py-0.5 text-xs text-primary">
                      {city}
                    </span>
                  ) : null}
                </div>
              ) : null}
              {streetHint || landmarkHint ? (
                <p className="text-xs text-muted">
                  {[streetHint, landmarkHint].filter(Boolean).join(" · ")}
                </p>
              ) : null}
            </div>
          ) : null}
        </section>

        <section className="space-y-3 border border-border bg-surface p-4">
          <h2 className="font-semibold">Building details</h2>
          <Field label="Name" name="name" required />
          <Field label="Description" name="description" />
          <label className="block text-sm">
            Property type
            <select
              name="buildingType"
              value={buildingType}
              onChange={(event) => setBuildingType(event.target.value)}
              className="mt-1 w-full border border-border bg-surface px-3 py-2"
            >
              {BUILDING_TYPE_OPTIONS.filter((option) => option.value).map(
                (option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ),
              )}
            </select>
          </label>
          <div className="grid gap-3 sm:grid-cols-2">
            <ControlledField
              label="City"
              name="city"
              value={city}
              onChange={(v) => {
                cityTouched.current = true;
                setCity(v);
              }}
            />
            <ControlledField
              label="District / area"
              name="district"
              value={district}
              placeholder="Namuwongo"
              onChange={(v) => {
                districtTouched.current = true;
                setDistrict(v);
              }}
            />
          </div>
          <ControlledField
            label="Exact address"
            name="exactAddress"
            value={exactAddress}
            placeholder={
              addressHint || streetHint || landmarkHint
                ? `e.g. ${[addressHint, landmarkHint].filter(Boolean).join(", ") || streetHint}, ${areaLabel || "your pin"}`
                : "Plot, street, or landmark"
            }
            onChange={setExactAddress}
          />
        </section>

        <section className="space-y-3 border border-border bg-surface p-4">
          <h2 className="font-semibold">Cover photo</h2>
          <ImageUpload value={coverFile} onChange={setCoverFile} />
          <ControlledField
            label="YouTube link"
            name="videoUrl"
            value={youtubeUrl}
            placeholder="https://youtube.com/watch?v=..."
            onChange={setYoutubeUrl}
          />
        </section>

        <section className="space-y-3 border border-border bg-surface p-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold">Units</h2>
            <button type="button" onClick={addUnit} className="text-sm text-primary">
              + Add unit
            </button>
          </div>

          <div className="grid grid-cols-[repeat(4,minmax(0,1fr))_2rem] gap-2 px-3 text-xs font-medium text-muted">
            <span>Unit #</span>
            <span>Bed Rooms</span>
            <span>Bath Rooms</span>
            <span>Rent (UGX)</span>
            <span className="sr-only">Remove</span>
          </div>

          {units.map((unit, i) => (
            <div
              key={i}
              className="grid grid-cols-[repeat(4,minmax(0,1fr))_2rem] items-center gap-2 border border-border p-3"
            >
              <input
                value={unit.unitNumber}
                onChange={(e) => {
                  const next = [...units];
                  next[i].unitNumber = e.target.value;
                  setUnits(next);
                }}
                aria-label={`Unit ${i + 1} number`}
                className="border border-border px-2 py-2 text-sm"
              />
              <input
                type="number"
                min={0}
                value={unit.bedrooms}
                onChange={(e) => {
                  const next = [...units];
                  next[i].bedrooms = Number(e.target.value);
                  setUnits(next);
                }}
                aria-label={`Unit ${i + 1} bedrooms`}
                className="border border-border px-2 py-2 text-sm"
              />
              <input
                type="number"
                min={0}
                value={unit.bathrooms}
                onChange={(e) => {
                  const next = [...units];
                  next[i].bathrooms = Number(e.target.value);
                  setUnits(next);
                }}
                aria-label={`Unit ${i + 1} bathrooms`}
                className="border border-border px-2 py-2 text-sm"
              />
              <input
                type="number"
                min={0}
                value={unit.rentAmount}
                onChange={(e) => {
                  const next = [...units];
                  next[i].rentAmount = Number(e.target.value);
                  setUnits(next);
                }}
                aria-label={`Unit ${i + 1} rent in UGX`}
                className="border border-border px-2 py-2 text-sm"
              />
              <button
                type="button"
                onClick={() => removeUnit(i)}
                disabled={units.length <= 1}
                aria-label={`Remove unit ${unit.unitNumber}`}
                className="text-lg leading-none text-muted hover:text-red-600 disabled:invisible"
              >
                ×
              </button>
            </div>
          ))}
        </section>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <Button
          type="submit"
          loading={loading}
          loadingLabel="Submitting building"
        >
          Submit for verification
        </Button>
      </form>
    </>
  );
}

function Field({
  label,
  name,
  required,
}: {
  label: string;
  name: string;
  required?: boolean;
}) {
  return (
    <label className="block text-sm">
      {label}
      <input
        name={name}
        required={required}
        className="mt-1 w-full border border-border px-3 py-2"
      />
    </label>
  );
}

function ControlledField({
  label,
  name,
  value,
  onChange,
  placeholder,
  hint,
}: {
  label: string;
  name: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  hint?: string;
}) {
  return (
    <label className="block text-sm">
      {label}
      <input
        name={name}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="mt-1 w-full border border-border px-3 py-2"
      />
      {hint ? <span className="mt-1 block text-xs text-muted">{hint}</span> : null}
    </label>
  );
}
