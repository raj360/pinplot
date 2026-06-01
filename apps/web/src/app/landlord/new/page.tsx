"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type KeyboardEvent } from "react";
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
import { cn } from "@/lib/utils/cn";
import { NewBuildingPreview } from "@/components/landlord/NewBuildingPreview";

type UnitRow = {
  unitNumber: string;
  bedrooms: number;
  bathrooms: number;
  rentAmount: number;
};

const DEFAULT_UNITS: UnitRow[] = [
  { unitNumber: "1", bedrooms: 1, bathrooms: 1, rentAmount: 500000 },
];

const FORM_STEPS = [
  {
    label: "Location",
    title: "Pin your building",
    description:
      "Drag the pin onto your building. We store this exact spot; tenants see a nearby pin on the map until they unlock.",
  },
  {
    label: "Details",
    title: "Building details",
    description:
      "Name and address — exact address is shown only after a tenant unlocks.",
  },
  {
    label: "Photos",
    title: "Cover photo",
    description:
      "Required — a clear cover photo helps admins verify your listing faster.",
  },
  {
    label: "Units",
    title: "Units & rent",
    description:
      "Add each unit you want to list. Mark them available after verification.",
  },
] as const;

const STEP_COUNT = FORM_STEPS.length;

export default function NewBuildingPage() {
  const router = useRouter();
  const topRef = useRef<HTMLDivElement>(null);
  const stepRef = useRef(1);
  const [step, setStep] = useState(1);
  const [buildingName, setBuildingName] = useState("");
  const [units, setUnits] = useState<UnitRow[]>(DEFAULT_UNITS);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverError, setCoverError] = useState<string | null>(null);
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

  const coverPreviewUrl = useMemo(() => {
    if (!coverFile) return null;
    return URL.createObjectURL(coverFile);
  }, [coverFile]);

  useEffect(() => {
    return () => {
      if (coverPreviewUrl) URL.revokeObjectURL(coverPreviewUrl);
    };
  }, [coverPreviewUrl]);

  const cityTouched = useRef(false);
  const districtTouched = useRef(false);

  const currentStep = FORM_STEPS[step - 1];

  useEffect(() => {
    stepRef.current = step;
  }, [step]);

  useEffect(() => {
    getAccessToken().then((token) => {
      if (!token) router.replace("/auth/login?next=/landlord/new");
    });
  }, [router]);

  useEffect(() => {
    topRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [step]);

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

  function validateCurrentStep(current: number): boolean {
    setError(null);

    if (current === 2) {
      if (!buildingName.trim()) {
        setError("Enter a building name to continue.");
        return false;
      }
    }

    if (current === 3) {
      if (!coverFile) {
        setError("Add a cover photo to continue.");
        return false;
      }
    }

    if (current === STEP_COUNT) {
      if (!buildingName.trim()) {
        setError("Enter a building name.");
        setStep(2);
        stepRef.current = 2;
        return false;
      }
      if (!coverFile) {
        setError("Add a cover photo.");
        setStep(3);
        stepRef.current = 3;
        return false;
      }
      if (units.some((unit) => !unit.unitNumber.trim())) {
        setError("Each unit needs a unit number.");
        return false;
      }
      if (units.some((unit) => unit.rentAmount <= 0)) {
        setError("Enter a rent amount for each unit.");
        return false;
      }
    }

    return true;
  }

  function goNext() {
    const current = stepRef.current;
    if (!validateCurrentStep(current)) return;
    setStep((prev) => {
      const next = Math.min(prev + 1, STEP_COUNT);
      stepRef.current = next;
      return next;
    });
  }

  function goToStep(target: number) {
    if (target >= stepRef.current) return;
    setError(null);
    setStep(target);
    stepRef.current = target;
  }

  function goBack() {
    setError(null);
    setStep((prev) => {
      const next = Math.max(prev - 1, 1);
      stepRef.current = next;
      return next;
    });
  }

  function handleFormKeyDown(e: KeyboardEvent<HTMLFormElement>) {
    if (e.key !== "Enter") return;
    if (e.target instanceof HTMLTextAreaElement) return;
    if (stepRef.current >= STEP_COUNT) return;
    e.preventDefault();
    goNext();
  }

  async function submitBuilding() {
    if (stepRef.current !== STEP_COUNT) return;
    if (!validateCurrentStep(STEP_COUNT)) return;

    setError(null);
    setLoading(true);

    try {
      const videoUrl = normalizeYouTubeUrl(youtubeUrl);

      await setProfileRole("LANDLORD");

      const building = await createBuilding({
        name: buildingName.trim(),
        city: city.trim() || "Kampala",
        district: district.trim(),
        approximateLat: location.lat,
        approximateLng: location.lng,
        exactLat: location.lat,
        exactLng: location.lng,
        exactAddress: exactAddress.trim(),
        videoUrl,
        buildingType,
        totalUnits: units.length,
        units,
      });

      if (!coverFile) {
        throw new Error("Cover photo is required.");
      }

      const publicUrl = await uploadBuildingImage(building.id, coverFile);
      await registerBuildingImage(building.id, publicUrl, true);

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
      <div ref={topRef} />
      <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_20rem] lg:items-start lg:gap-8 xl:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold tracking-tight">Add building</h1>
          <p className="mt-2 max-w-2xl text-sm text-muted">
            {step} of {STEP_COUNT} — {currentStep.description}
          </p>

          <FormStepper
            steps={FORM_STEPS}
            currentStep={step}
            onStepClick={goToStep}
            className="mt-6"
          />

          <form
            noValidate
            className="mt-6"
            onSubmit={(e) => e.preventDefault()}
            onKeyDown={handleFormKeyDown}
          >
        <section className="space-y-4 border border-border bg-surface p-4 sm:p-5">
          <FormStepHeader
            step={step}
            label={currentStep.label}
            title={currentStep.title}
          />

          {step === 1 ? (
            <>
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
            </>
          ) : null}

          {step === 2 ? (
            <div className="space-y-3">
              <ControlledField
                label="Name"
                name="name"
                value={buildingName}
                onChange={setBuildingName}
                required
              />
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
            </div>
          ) : null}

          {step === 3 ? (
            <div className="space-y-3">
              <ImageUpload
                value={coverFile}
                onChange={setCoverFile}
                required
                error={coverError}
                onValidationError={setCoverError}
              />
              <ControlledField
                label="YouTube link"
                name="videoUrl"
                value={youtubeUrl}
                placeholder="https://youtube.com/watch?v=..."
                onChange={setYoutubeUrl}
              />
            </div>
          ) : null}

          {step === 4 ? (
            <div className="space-y-3">
              <div className="flex items-center justify-end">
                <button
                  type="button"
                  onClick={addUnit}
                  className="text-sm text-primary"
                >
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
            </div>
          ) : null}
        </section>

        {error ? (
          <p className="mt-4 text-sm text-red-600" role="alert">
            {error}
          </p>
        ) : null}

        <div className="mt-6 flex flex-wrap items-center gap-3">
          {step > 1 ? (
            <Button type="button" variant="outline" onClick={goBack}>
              Back
            </Button>
          ) : null}
          {step < STEP_COUNT ? (
            <Button type="button" onClick={goNext}>
              Continue
            </Button>
          ) : (
            <Button
              type="button"
              loading={loading}
              loadingLabel="Submitting building"
              onClick={() => void submitBuilding()}
            >
              Submit for verification
            </Button>
          )}
        </div>
      </form>
        </div>

        <aside className="hidden lg:block">
          <div className="sticky top-6">
            <NewBuildingPreview
              buildingName={buildingName}
              buildingType={buildingType}
              city={city}
              district={district}
              areaLabel={areaLabel}
              coverPreviewUrl={coverPreviewUrl}
              units={units}
              step={step}
            />
          </div>
        </aside>
      </div>
    </>
  );
}

function FormStepper({
  steps,
  currentStep,
  onStepClick,
  className,
}: {
  steps: readonly { label: string }[];
  currentStep: number;
  onStepClick?: (step: number) => void;
  className?: string;
}) {
  return (
    <nav aria-label="Form progress" className={className}>
      <ol className="flex flex-wrap gap-2">
        {steps.map((item, index) => {
          const stepNumber = index + 1;
          const active = stepNumber === currentStep;
          const complete = stepNumber < currentStep;
          const canNavigate = complete && onStepClick;

          const chipClass = cn(
            "inline-flex items-center gap-1.5 border px-2.5 py-1 text-xs font-medium transition-colors",
            active && "border-primary bg-primary/5 text-primary",
            complete && "border-border bg-surface text-foreground",
            !active && !complete && "border-border bg-background text-muted",
            canNavigate && "cursor-pointer hover:border-primary/40 hover:bg-primary/5",
          );

          const numberClass = cn(
            "flex size-5 items-center justify-center text-[10px]",
            active && "bg-primary text-primary-foreground",
            complete && "bg-foreground text-background",
            !active && !complete && "bg-border text-muted",
          );

          const content = (
            <>
              <span className={numberClass}>{stepNumber}</span>
              {item.label}
            </>
          );

          return (
            <li key={item.label}>
              {canNavigate ? (
                <button
                  type="button"
                  className={chipClass}
                  onClick={() => onStepClick(stepNumber)}
                >
                  {content}
                </button>
              ) : (
                <span
                  className={chipClass}
                  aria-current={active ? "step" : undefined}
                >
                  {content}
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

function FormStepHeader({
  step,
  label,
  title,
  optional = false,
}: {
  step: number;
  label: string;
  title: string;
  optional?: boolean;
}) {
  return (
    <div className="border-b border-border pb-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-primary">
        Step {step} · {label}
        {optional ? " · Optional" : ""}
      </p>
      <h2 className="mt-1 text-xl font-bold">{title}</h2>
    </div>
  );
}

function ControlledField({
  label,
  name,
  value,
  onChange,
  placeholder,
  required,
}: {
  label: string;
  name: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
}) {
  return (
    <label className="block text-sm">
      {label}
      <input
        name={name}
        value={value}
        required={required}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="mt-1 w-full border border-border px-3 py-2"
      />
    </label>
  );
}
