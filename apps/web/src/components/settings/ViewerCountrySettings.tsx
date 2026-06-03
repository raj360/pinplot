"use client";

import { useMemo, useState } from "react";
import { useViewerContext } from "@/components/providers/ViewerContextProvider";
import { Button } from "@/components/ui/button";
import { readStoredViewerCountry } from "@/lib/intl/resolve-viewer-country";

const AUTO_VALUE = "";

export function ViewerCountrySettings() {
  const {
    ready,
    countries,
    viewer,
    setViewerCountryCode,
    resetViewerCountryOverride,
  } = useViewerContext();
  const storedOverride = readStoredViewerCountry();
  const [selected, setSelected] = useState<string>(
    storedOverride ?? AUTO_VALUE,
  );
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const sortedCountries = useMemo(
    () =>
      [...countries].sort((a, b) => {
        if (a.code === "UG") return -1;
        if (b.code === "UG") return 1;
        return a.name.localeCompare(b.name);
      }),
    [countries],
  );

  async function handleSave(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    setSaved(false);
    try {
      if (selected === AUTO_VALUE) {
        await resetViewerCountryOverride();
      } else {
        setViewerCountryCode(selected);
      }
      setSaved(true);
    } finally {
      setSaving(false);
    }
  }

  if (!ready) {
    return <p className="text-sm text-muted">Loading display preferences…</p>;
  }

  return (
    <form onSubmit={(event) => void handleSave(event)} className="space-y-4">
      <p className="text-sm text-muted">
        Controls how rent is shown on explore — canonical listing currency plus
        an approximate hint in your currency (e.g.{" "}
        <span className="text-foreground">USh … (~£308)</span>). Map defaults
        when GPS is denied also use this country.
      </p>

      <label className="block text-sm">
        <span className="text-muted">Display country</span>
        <select
          value={selected}
          onChange={(event) => {
            setSelected(event.target.value);
            setSaved(false);
          }}
          className="mt-1 w-full border border-border bg-background px-3 py-2 text-sm"
        >
          <option value={AUTO_VALUE}>
            Auto — browser timezone, then profile, then Uganda
          </option>
          {sortedCountries.map((country) => (
            <option key={country.code} value={country.code}>
              {country.name} ({country.currency})
            </option>
          ))}
        </select>
      </label>

      <p className="text-xs text-muted">
        Active viewer:{" "}
        <span className="font-medium text-foreground">
          {viewer.countryCode} · {viewer.displayCurrency}
        </span>
        {storedOverride ? (
          <span> — manual override saved in this browser</span>
        ) : (
          <span> — inferred automatically</span>
        )}
      </p>

      <Button
        type="submit"
        loading={saving}
        loadingLabel="Saving display country"
      >
        Save display country
      </Button>

      {saved ? (
        <p className="text-sm text-lime-700">
          Saved. Open explore to see updated currency hints.
        </p>
      ) : null}
    </form>
  );
}
