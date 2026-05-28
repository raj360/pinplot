"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  createBuilding,
  fetchMyBuildings,
  setProfileRole,
  type LandlordBuilding,
} from "@/lib/api/buildings";
import { getAccessToken } from "@/lib/api/client";
import { uploadBuildingImage } from "@/lib/supabase/storage";
import { registerBuildingImage } from "@/lib/api/buildings";
import { PRICING } from "@plotpin/shared-types";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/intl/format";

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
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    getAccessToken().then((token) => {
      if (!token) router.replace("/auth/login?next=/landlord/new");
    });
  }, [router]);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const form = new FormData(e.currentTarget);

    try {
      await setProfileRole("LANDLORD");

      const building = await createBuilding({
        name: String(form.get("name")),
        description: String(form.get("description") || ""),
        city: String(form.get("city") || "Kampala"),
        district: String(form.get("district") || ""),
        approximateLat: Number(form.get("approximateLat")),
        approximateLng: Number(form.get("approximateLng")),
        exactAddress: String(form.get("exactAddress") || ""),
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

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-primary text-primary-foreground">
        <div className="mx-auto flex h-14 max-w-3xl items-center justify-between px-4">
          <Link href="/landlord/dashboard" className="text-sm hover:underline">
            ← Dashboard
          </Link>
          <span className="font-semibold">Add building</span>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-8">
        <p className="text-sm text-muted">
          Listings are reviewed by admin before appearing on the map. Unit status
          changes cost {PRICING.landlordListingFeeUgx.toLocaleString()} UGX
          (Sprint 3 payments).
        </p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-6">
          <section className="space-y-3 border border-border bg-surface p-4">
            <h2 className="font-semibold">Building details</h2>
            <Field label="Name" name="name" required />
            <Field label="Description" name="description" />
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="City" name="city" defaultValue="Kampala" />
              <Field label="District / area" name="district" placeholder="Namuwongo" />
            </div>
            <Field label="Exact address (hidden until tenant unlocks)" name="exactAddress" />
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Map latitude" name="approximateLat" defaultValue="0.3085" />
              <Field label="Map longitude" name="approximateLng" defaultValue="32.5892" />
            </div>
            <label className="block text-sm">
              Cover photo (HD recommended)
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setCoverFile(e.target.files?.[0] ?? null)}
                className="mt-1 block w-full border border-border px-2 py-2 text-sm"
              />
            </label>
          </section>

          <section className="space-y-3 border border-border bg-surface p-4">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold">Units</h2>
              <button type="button" onClick={addUnit} className="text-sm text-primary">
                + Add unit
              </button>
            </div>
            {units.map((unit, i) => (
              <div key={i} className="grid gap-2 border border-border p-3 sm:grid-cols-4">
                <input
                  value={unit.unitNumber}
                  onChange={(e) => {
                    const next = [...units];
                    next[i].unitNumber = e.target.value;
                    setUnits(next);
                  }}
                  placeholder="Unit #"
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
                  placeholder="Beds"
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
                  placeholder="Baths"
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
                  placeholder="Rent UGX"
                  className="border border-border px-2 py-2 text-sm"
                />
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
      </main>
    </div>
  );
}

function Field({
  label,
  name,
  required,
  defaultValue,
  placeholder,
}: {
  label: string;
  name: string;
  required?: boolean;
  defaultValue?: string;
  placeholder?: string;
}) {
  return (
    <label className="block text-sm">
      {label}
      <input
        name={name}
        required={required}
        defaultValue={defaultValue}
        placeholder={placeholder}
        className="mt-1 w-full border border-border px-3 py-2"
      />
    </label>
  );
}
