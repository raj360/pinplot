"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { MAX_BUILDING_PHOTOS } from "@plotpin/shared-types";
import { AdminEditBuildingSkeleton } from "@/components/admin/AdminPageSkeletons";
import { BuildingPhotoManager } from "@/components/buildings/BuildingPhotoManager";
import { DashboardSection } from "@/components/layout/DashboardSection";
import { LocationPinPicker } from "@/components/maps/LocationPinPicker";
import { Button } from "@/components/ui/button";
import { BUILDING_TYPE_OPTIONS } from "@/lib/filters/building-types";
import {
  adminAddPendingUnit,
  adminDeletePendingUnit,
  adminUpdatePendingUnit,
  fetchAdminPendingBuilding,
  getAdminLandlordDisplayName,
  updateAdminPendingBuilding,
  verifyBuilding,
  type AdminPendingBuildingDetail,
  type AdminPendingUnit,
} from "@/lib/api/buildings";
import { getAccessToken } from "@/lib/api/client";
import { formatCurrency } from "@/lib/intl/format";

type UnitDraft = {
  unitNumber: string;
  bedrooms: string;
  bathrooms: string;
  rentAmount: string;
};

function toUnitDraft(unit: AdminPendingUnit): UnitDraft {
  return {
    unitNumber: unit.unitNumber,
    bedrooms: String(unit.bedrooms),
    bathrooms: String(unit.bathrooms),
    rentAmount: String(unit.rentAmount),
  };
}

function mapsLink(lat: number, lng: number) {
  return `https://www.google.com/maps?q=${lat},${lng}`;
}

export default function AdminEditBuildingClient({
  buildingId,
}: {
  buildingId: string;
}) {
  const router = useRouter();

  const [building, setBuilding] = useState<AdminPendingBuildingDetail | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [savingBuilding, setSavingBuilding] = useState(false);
  const [approving, setApproving] = useState(false);

  const [name, setName] = useState("");
  const [city, setCity] = useState("");
  const [district, setDistrict] = useState("");
  const [buildingType, setBuildingType] = useState("apartment");
  const [exactAddress, setExactAddress] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [pin, setPin] = useState({ lat: 0, lng: 0 });

  const [unitDrafts, setUnitDrafts] = useState<Record<string, UnitDraft>>({});
  const [pendingUnitId, setPendingUnitId] = useState<string | null>(null);
  const [newUnit, setNewUnit] = useState<UnitDraft>({
    unitNumber: "",
    bedrooms: "1",
    bathrooms: "1",
    rentAmount: "500000",
  });
  const [addingUnit, setAddingUnit] = useState(false);

  const applyBuilding = useCallback((data: AdminPendingBuildingDetail) => {
    setBuilding(data);
    setName(data.name);
    setCity(data.city);
    setDistrict(data.district ?? "");
    setBuildingType(data.buildingType);
    setExactAddress(data.exactAddress ?? "");
    setVideoUrl(data.videoUrl ?? "");
    setPin({ lat: data.pinLat, lng: data.pinLng });
    setUnitDrafts(
      Object.fromEntries(data.units.map((unit) => [unit.id, toUnitDraft(unit)])),
    );
  }, []);

  const load = useCallback(async () => {
    try {
      const data = await fetchAdminPendingBuilding(buildingId);
      applyBuilding(data);
      setError(null);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Could not load this pending building.",
      );
    } finally {
      setLoading(false);
    }
  }, [applyBuilding, buildingId]);

  useEffect(() => {
    let cancelled = false;

    getAccessToken().then(async (token) => {
      if (cancelled) return;
      if (!token) {
        router.replace(`/auth/login?next=/admin/buildings/${buildingId}`);
        return;
      }
      await load();
    });

    return () => {
      cancelled = true;
    };
  }, [buildingId, load, router]);

  async function saveBuilding() {
    setSavingBuilding(true);
    setSaveMessage(null);
    setError(null);
    try {
      const updated = await updateAdminPendingBuilding(buildingId, {
        name: name.trim(),
        city: city.trim(),
        district: district.trim() || undefined,
        buildingType,
        exactAddress: exactAddress.trim() || undefined,
        videoUrl: videoUrl.trim(),
        exactLat: pin.lat,
        exactLng: pin.lng,
      });
      applyBuilding(updated);
      setSaveMessage("Building details saved. Still pending approval.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save building.");
    } finally {
      setSavingBuilding(false);
    }
  }

  async function saveUnit(unitId: string) {
    const draft = unitDrafts[unitId];
    if (!draft) return;

    setPendingUnitId(unitId);
    setError(null);
    try {
      const updated = await adminUpdatePendingUnit(buildingId, unitId, {
        unitNumber: draft.unitNumber.trim(),
        bedrooms: Number(draft.bedrooms),
        bathrooms: Number(draft.bathrooms),
        rentAmount: Number(draft.rentAmount),
      });
      setBuilding((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          units: prev.units.map((unit) =>
            unit.id === unitId ? updated : unit,
          ),
        };
      });
      setUnitDrafts((prev) => ({ ...prev, [unitId]: toUnitDraft(updated) }));
      setSaveMessage("Unit updated.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not update unit.");
    } finally {
      setPendingUnitId(null);
    }
  }

  async function removeUnit(unitId: string) {
    setPendingUnitId(unitId);
    setError(null);
    try {
      await adminDeletePendingUnit(buildingId, unitId);
      await load();
      setSaveMessage("Unit removed.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not remove unit.");
    } finally {
      setPendingUnitId(null);
    }
  }

  async function addUnit() {
    setAddingUnit(true);
    setError(null);
    try {
      const created = await adminAddPendingUnit(buildingId, {
        unitNumber: newUnit.unitNumber.trim(),
        bedrooms: Number(newUnit.bedrooms),
        bathrooms: Number(newUnit.bathrooms),
        rentAmount: Number(newUnit.rentAmount),
      });
      setBuilding((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          units: [...prev.units, created],
          totalUnits: Math.max(prev.totalUnits, prev.units.length + 1),
        };
      });
      setUnitDrafts((prev) => ({
        ...prev,
        [created.id]: toUnitDraft(created),
      }));
      setNewUnit({
        unitNumber: String(Object.keys(unitDrafts).length + 2),
        bedrooms: "1",
        bathrooms: "1",
        rentAmount: "500000",
      });
      setSaveMessage("Unit added.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not add unit.");
    } finally {
      setAddingUnit(false);
    }
  }

  async function approve() {
    setApproving(true);
    setError(null);
    try {
      await verifyBuilding(buildingId, true);
      router.push("/admin/buildings");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Approve failed");
    } finally {
      setApproving(false);
    }
  }

  if (loading) {
    return (
      <DashboardSection title="Edit pending building">
        <AdminEditBuildingSkeleton />
      </DashboardSection>
    );
  }

  if (!building) {
    return (
      <DashboardSection title="Edit pending building">
        <p className="text-sm text-red-600">{error ?? "Building not found."}</p>
        <Link href="/admin/buildings" className="mt-4 inline-block text-sm text-primary">
          ← Back to pending list
        </Link>
      </DashboardSection>
    );
  }

  return (
    <DashboardSection
      title={`Edit · ${building.name}`}
      description="Fix landlord mistakes before approval. Upload a new cover photo, adjust units, then save. Nothing goes public until you approve."
    >
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <Link href="/admin/buildings" className="text-sm text-primary hover:underline">
          ← Pending buildings
        </Link>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            loading={savingBuilding}
            loadingLabel="Saving building"
            onClick={() => void saveBuilding()}
          >
            Save changes
          </Button>
          <Button
            type="button"
            loading={approving}
            loadingLabel="Approving building"
            onClick={() => void approve()}
          >
            Approve & go live
          </Button>
        </div>
      </div>

      {error ? <p className="mb-4 text-sm text-red-600">{error}</p> : null}
      {saveMessage ? (
        <p className="mb-4 text-sm text-green-700">{saveMessage}</p>
      ) : null}

      <p className="mb-6 text-sm text-muted">
        Landlord: {getAdminLandlordDisplayName(building)}
        {building.landlord.phone ? ` · ${building.landlord.phone}` : ""}
        {" · "}
        {building.units.length}{" "}
        {building.units.length === 1 ? "unit" : "units"}
      </p>

      <div className="space-y-6">
        <section className="border border-border bg-surface p-4">
          <h2 className="text-sm font-medium">Details</h2>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <Field label="Name" value={name} onChange={setName} />
            <label className="block text-sm">
              Property type
              <select
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
            <Field label="City" value={city} onChange={setCity} />
            <Field
              label="District / area"
              value={district}
              onChange={setDistrict}
            />
            <div className="sm:col-span-2">
              <Field
                label="Exact address"
                value={exactAddress}
                onChange={setExactAddress}
              />
            </div>
          </div>
        </section>

        <section className="border border-border bg-surface p-4">
          <h2 className="text-sm font-medium">Photos</h2>
          <p className="mt-1 text-sm text-muted">
            Cover and gallery photos sync to the listing gallery tenants see after unlock.
            Maximum {MAX_BUILDING_PHOTOS} photos (cover included).
          </p>
          <div className="mt-3">
            <BuildingPhotoManager buildingId={buildingId} variant="admin" />
          </div>
        </section>

        <section className="border border-border bg-surface p-4">
          <h2 className="text-sm font-medium">Video</h2>
          <div className="mt-3">
            <Field
              label="YouTube tour"
              value={videoUrl}
              onChange={setVideoUrl}
              placeholder="https://youtube.com/watch?v=…"
            />
          </div>
        </section>

        <section className="border border-border bg-surface p-4">
          <h2 className="text-sm font-medium">Landlord pin (exact)</h2>
          <p className="mt-1 text-xs text-muted">
            Drag the pin if the landlord picked the wrong spot. Tenants still see
            a blurred pin nearby until they unlock.
          </p>
          <div className="mt-3">
            <LocationPinPicker value={pin} onChange={setPin} className="h-56" />
            <a
              href={mapsLink(pin.lat, pin.lng)}
              target="_blank"
              rel="noreferrer"
              className="mt-2 inline-block text-sm text-primary hover:underline"
            >
              Open in Google Maps
            </a>
          </div>
        </section>

        <section className="border border-border bg-surface p-4">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-sm font-medium">Units</h2>
            <p className="text-xs text-muted">Pending only — not on explore map yet</p>
          </div>

          <div className="mt-3 space-y-3">
            {building.units.map((unit) => {
              const draft = unitDrafts[unit.id] ?? toUnitDraft(unit);
              const busy = pendingUnitId === unit.id;

              return (
                <div key={unit.id} className="space-y-2 border border-border p-3">
                  <div className="grid grid-cols-[repeat(4,minmax(0,1fr))_auto_auto] gap-2 text-xs font-medium text-muted">
                    <span>Unit #</span>
                    <span>Bedrooms</span>
                    <span>Bathrooms</span>
                    <span>Rent (UGX)</span>
                    <span className="sr-only">Save unit</span>
                    <span className="sr-only">Remove unit</span>
                  </div>
                  <div className="grid grid-cols-[repeat(4,minmax(0,1fr))_auto_auto] items-center gap-2">
                    <UnitInput
                      value={draft.unitNumber}
                      onChange={(value) =>
                        setUnitDrafts((prev) => ({
                          ...prev,
                          [unit.id]: { ...draft, unitNumber: value },
                        }))
                      }
                      ariaLabel={`Unit ${draft.unitNumber} number`}
                    />
                    <UnitInput
                      value={draft.bedrooms}
                      onChange={(value) =>
                        setUnitDrafts((prev) => ({
                          ...prev,
                          [unit.id]: { ...draft, bedrooms: value },
                        }))
                      }
                      ariaLabel={`Unit ${draft.unitNumber} bedrooms`}
                    />
                    <UnitInput
                      value={draft.bathrooms}
                      onChange={(value) =>
                        setUnitDrafts((prev) => ({
                          ...prev,
                          [unit.id]: { ...draft, bathrooms: value },
                        }))
                      }
                      ariaLabel={`Unit ${draft.unitNumber} bathrooms`}
                    />
                    <UnitInput
                      value={draft.rentAmount}
                      onChange={(value) =>
                        setUnitDrafts((prev) => ({
                          ...prev,
                          [unit.id]: { ...draft, rentAmount: value },
                        }))
                      }
                      ariaLabel={`Unit ${draft.unitNumber} rent in UGX`}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-9 shrink-0"
                      loading={busy}
                      loadingLabel="Saving unit"
                      onClick={() => void saveUnit(unit.id)}
                    >
                      Save
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-9 shrink-0 px-2"
                      disabled={building.units.length <= 1 || busy}
                      onClick={() => void removeUnit(unit.id)}
                    >
                      Remove
                    </Button>
                  </div>
                  <p className="text-xs text-muted">
                    Current rent preview: {formatCurrency(Number(draft.rentAmount) || 0)}
                  </p>
                </div>
              );
            })}
          </div>

          <div className="mt-4 border-t border-border pt-4">
            <p className="mb-3 text-sm font-medium">Add unit</p>
            <div className="space-y-2">
              <div className="grid grid-cols-[repeat(4,minmax(0,1fr))_auto] gap-2 text-xs font-medium text-muted">
                <span>Unit #</span>
                <span>Bedrooms</span>
                <span>Bathrooms</span>
                <span>Rent (UGX)</span>
                <span className="sr-only">Add unit</span>
              </div>
              <div className="grid grid-cols-[repeat(4,minmax(0,1fr))_auto] items-center gap-2">
                <UnitInput
                  value={newUnit.unitNumber}
                  onChange={(value) =>
                    setNewUnit((prev) => ({ ...prev, unitNumber: value }))
                  }
                  ariaLabel="New unit number"
                />
                <UnitInput
                  value={newUnit.bedrooms}
                  onChange={(value) =>
                    setNewUnit((prev) => ({ ...prev, bedrooms: value }))
                  }
                  ariaLabel="New unit bedrooms"
                />
                <UnitInput
                  value={newUnit.bathrooms}
                  onChange={(value) =>
                    setNewUnit((prev) => ({ ...prev, bathrooms: value }))
                  }
                  ariaLabel="New unit bathrooms"
                />
                <UnitInput
                  value={newUnit.rentAmount}
                  onChange={(value) =>
                    setNewUnit((prev) => ({ ...prev, rentAmount: value }))
                  }
                  ariaLabel="New unit rent in UGX"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-9 shrink-0"
                  loading={addingUnit}
                  loadingLabel="Adding unit"
                  onClick={() => void addUnit()}
                >
                  Add unit
                </Button>
              </div>
            </div>
          </div>
        </section>
      </div>
    </DashboardSection>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <label className="block text-sm">
      {label}
      <input
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
        className="mt-1 w-full border border-border bg-surface px-3 py-2"
      />
    </label>
  );
}

function UnitInput({
  value,
  onChange,
  ariaLabel,
}: {
  value: string;
  onChange: (value: string) => void;
  ariaLabel: string;
}) {
  return (
    <input
      value={value}
      aria-label={ariaLabel}
      onChange={(event) => onChange(event.target.value)}
      className="h-9 w-full border border-border bg-surface px-2 text-sm"
    />
  );
}
