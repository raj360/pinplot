"use client";

import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { SlidersHorizontal } from "lucide-react";
import type { ExploreSearchFilters } from "@/components/explore/ExploreFilters";
import { BUILDING_TYPE_OPTIONS } from "@/lib/filters/building-types";
import {
  countActivePropertyFilters,
  propertyFiltersSummary,
} from "@/lib/filters/explore-filter-summary";
import { RENT_RANGE_OPTIONS } from "@/lib/filters/rent-ranges";
import { useAnchoredPanelPosition } from "@/lib/hooks/use-anchored-panel-position";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils/cn";

const BEDROOM_OPTIONS = [
  { value: "", label: "Any" },
  { value: "1", label: "1+" },
  { value: "2", label: "2+" },
  { value: "3", label: "3+" },
  { value: "4", label: "4+" },
];

const BATHROOM_OPTIONS = [
  { value: "", label: "Any" },
  { value: "1", label: "1+" },
  { value: "2", label: "2+" },
  { value: "3", label: "3+" },
];

type ExploreFiltersPopoverProps = {
  filters: ExploreSearchFilters;
  onApply: (filters: ExploreSearchFilters) => void;
  disabled?: boolean;
  className?: string;
};

function FilterPills({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: Array<{ value: string; label: string }>;
  onChange: (value: string) => void;
}) {
  return (
    <fieldset>
      <legend className="mb-2 text-xs font-medium text-foreground">{label}</legend>
      <div className="flex flex-wrap gap-1.5">
        {options.map((option) => {
          const selected = value === option.value;
          return (
            <button
              key={option.value || "any"}
              type="button"
              aria-pressed={selected}
              onClick={() => onChange(option.value)}
              className={cn(
                "min-h-8 rounded-md border px-2.5 text-xs font-medium transition-colors",
                selected
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border bg-background text-muted hover:border-primary/35 hover:text-foreground",
              )}
            >
              {option.label}
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}

export function ExploreFiltersPopover({
  filters,
  onApply,
  disabled = false,
  className,
}: ExploreFiltersPopoverProps) {
  const triggerId = useId();
  const panelId = `${triggerId}-panel`;
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(filters);
  const panelStyle = useAnchoredPanelPosition(open, triggerRef, {
    minWidth: 352,
    align: "right",
  });

  const activeCount = countActivePropertyFilters(filters);
  const summary = propertyFiltersSummary(filters);

  useEffect(() => {
    if (!open) setDraft(filters);
  }, [filters, open]);

  useEffect(() => {
    if (!open) return;

    function onPointerDown(event: MouseEvent) {
      const target = event.target as Node;
      if (rootRef.current?.contains(target)) return;
      if (panelRef.current?.contains(target)) return;
      setOpen(false);
    }

    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, [open]);

  function patch(partial: Partial<ExploreSearchFilters>) {
    setDraft((prev) => ({ ...prev, ...partial }));
  }

  function handleApply() {
    onApply(draft);
    setOpen(false);
  }

  function handleClear() {
    const cleared = {
      ...draft,
      priceRange: "",
      bedrooms: "",
      bathrooms: "",
      buildingType: "",
    };
    setDraft(cleared);
  }

  return (
    <div ref={rootRef} className={cn("relative min-w-0 flex-1", className)}>
      <button
        ref={triggerRef}
        id={triggerId}
        type="button"
        disabled={disabled}
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((value) => !value)}
        className={cn(
          "flex h-full min-h-9 w-full flex-col justify-center px-3 py-1.5 text-left transition-colors",
          "hover:bg-background/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:ring-inset",
          open && "bg-background/80",
          activeCount > 0 && "bg-primary/3",
          disabled && "pointer-events-none opacity-60",
        )}
      >
        <span className="text-[10px] font-semibold uppercase tracking-wide text-muted">
          Filters
        </span>
        <span className="mt-0.5 flex min-w-0 items-center gap-2">
          <SlidersHorizontal className="size-3.5 shrink-0 text-muted" aria-hidden />
          <span
            className={cn(
              "truncate text-sm",
              activeCount > 0 ? "font-medium text-foreground" : "text-muted",
            )}
          >
            {summary}
          </span>
          {activeCount > 0 ? (
            <span className="shrink-0 rounded-full bg-primary px-1.5 py-0.5 text-[10px] font-semibold text-primary-foreground">
              {activeCount}
            </span>
          ) : null}
        </span>
      </button>

      {open && typeof document !== "undefined"
        ? createPortal(
            <div
              ref={panelRef}
              id={panelId}
              role="dialog"
              aria-labelledby={triggerId}
              style={panelStyle}
              className="overflow-hidden rounded-lg border border-border bg-surface shadow-overlay"
            >
              <div className="border-b border-border px-4 py-3">
                <p className="text-sm font-semibold text-foreground">Property filters</p>
                <p className="mt-0.5 text-xs text-muted">
                  Adjust options, then apply — map area stays the same.
                </p>
              </div>

              <div className="max-h-[min(60vh,24rem)] space-y-4 overflow-y-auto px-4 py-4">
                <FilterPills
                  label="Monthly rent"
                  value={draft.priceRange}
                  options={RENT_RANGE_OPTIONS.map(({ value, label }) => ({
                    value,
                    label: label.replace(/\s*\/mo$/, ""),
                  }))}
                  onChange={(priceRange) => patch({ priceRange })}
                />
                <FilterPills
                  label="Bedrooms"
                  value={draft.bedrooms}
                  options={BEDROOM_OPTIONS}
                  onChange={(bedrooms) => patch({ bedrooms })}
                />
                <FilterPills
                  label="Bathrooms"
                  value={draft.bathrooms}
                  options={BATHROOM_OPTIONS}
                  onChange={(bathrooms) => patch({ bathrooms })}
                />
                <FilterPills
                  label="Property type"
                  value={draft.buildingType}
                  options={BUILDING_TYPE_OPTIONS.map(({ value, label }) => ({
                    value,
                    label,
                  }))}
                  onChange={(buildingType) => patch({ buildingType })}
                />
              </div>

              <div className="flex items-center justify-between gap-2 border-t border-border bg-panel/40 px-4 py-3">
                <button
                  type="button"
                  onClick={handleClear}
                  className="text-sm font-medium text-muted hover:text-foreground"
                >
                  Clear
                </button>
                <Button type="button" size="sm" onClick={handleApply}>
                  Apply filters
                </Button>
              </div>
            </div>,
            document.body,
          )
        : null}
    </div>
  );
}
