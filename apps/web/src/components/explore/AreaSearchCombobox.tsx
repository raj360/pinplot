"use client";

import { ChevronDown, MapPin, Search, X } from "lucide-react";
import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import {
  filterAreaOptions,
  formatDistanceKm,
  rankAreaOptions,
  resolveSearchArea,
  searchAreaLabel,
  type AreaSearchOption,
} from "@/lib/filters/search-areas";
import { useAnchoredPanelPosition } from "@/lib/hooks/use-anchored-panel-position";
import type { GeoPoint } from "@/lib/geo/uganda";
import { cn } from "@/lib/utils/cn";

type AreaSearchComboboxProps = {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  userLocation?: GeoPoint | null;
  inUganda?: boolean;
  onRequestLocation?: () => void;
  onClearLocation?: () => void;
  locationLoading?: boolean;
  className?: string;
  compact?: boolean;
  placeholder?: string;
  allowClear?: boolean;
  /** Highlight trigger when a non-default area is selected. */
  active?: boolean;
  /** Dim controls while a search request is in flight. */
  loading?: boolean;
  /** Override trigger label (e.g. “Map area” while browsing viewport). */
  displayOverride?: string;
  /** Embedded in composed search bar — no outer border. */
  variant?: "default" | "segment";
};

type OptionGroup = {
  header: string | null;
  options: AreaSearchOption[];
};

/** LPMS-style searchable picker — closed trigger + in-panel search (CaseLinkedSearchCombobox). */
export function AreaSearchCombobox({
  label,
  value,
  onChange,
  userLocation = null,
  inUganda = false,
  onRequestLocation,
  onClearLocation,
  locationLoading = false,
  className,
  compact = true,
  placeholder = "Jump to place",
  allowClear = true,
  active = false,
  loading = false,
  displayOverride,
  variant = "default",
}: AreaSearchComboboxProps) {
  const triggerId = useId();
  const listboxId = `${triggerId}-listbox`;
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [searchDraft, setSearchDraft] = useState("");
  const panelStyle = useAnchoredPanelPosition(open, triggerRef, { minWidth: 320 });

  const allOptions = useMemo(
    () => rankAreaOptions(userLocation, inUganda),
    [inUganda, userLocation],
  );

  const filteredOptions = useMemo(
    () => filterAreaOptions(allOptions, searchDraft),
    [allOptions, searchDraft],
  );

  const groups = useMemo((): OptionGroup[] => {
    if (!inUganda || !userLocation || searchDraft.trim()) {
      const cities = filteredOptions.filter((o) => o.section === "cities");
      const kampala = filteredOptions.filter(
        (o) => o.section === "kampala" || o.section === "nearby" || o.section === "all",
      );
      const result: OptionGroup[] = [];
      const browse = filteredOptions.filter((o) => !o.value);
      if (browse.length) result.push({ header: null, options: browse });
      if (cities.length) result.push({ header: "Cities & towns", options: cities });
      if (kampala.length) {
        result.push({
          header: cities.length ? "Kampala areas" : null,
          options: kampala.filter((o) => o.value),
        });
      }
      return result.length ? result : [{ header: null, options: filteredOptions }];
    }

    const nearby = filteredOptions.filter(
      (option) => option.section === "nearby" && option.value,
    );
    const cities = filteredOptions.filter((option) => option.section === "cities");
    const kampala = filteredOptions.filter(
      (option) =>
        option.section === "kampala" ||
        (option.section === "all" && option.value),
    );

    const result: OptionGroup[] = [];
    const browse = filteredOptions.filter((o) => !o.value);
    if (browse.length) result.push({ header: null, options: browse });
    if (nearby.length > 0) {
      result.push({ header: "Near you", options: nearby });
    }
    if (cities.length) result.push({ header: "Cities & towns", options: cities });
    result.push({
      header: nearby.length > 0 || cities.length ? "Kampala areas" : null,
      options: kampala,
    });
    return result;
  }, [filteredOptions, inUganda, searchDraft, userLocation]);

  const flatOptions = useMemo(
    () => groups.flatMap((group) => group.options),
    [groups],
  );

  const displayLabel = displayOverride
    ? displayOverride
    : value
      ? (searchAreaLabel(value) ?? value)
      : placeholder;

  const close = useCallback(() => {
    setOpen(false);
    setSearchDraft("");
  }, []);

  const openPanel = useCallback(() => {
    setSearchDraft(searchAreaLabel(value) ?? value);
    setOpen(true);
  }, [value]);

  useEffect(() => {
    if (!open) return;

    function onPointerDown(event: MouseEvent) {
      const target = event.target as Node;
      if (rootRef.current?.contains(target)) return;
      if (panelRef.current?.contains(target)) return;
      close();
    }

    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, [close, open]);

  useEffect(() => {
    if (open) {
      searchInputRef.current?.focus();
    }
  }, [open]);

  function selectOption(nextValue: string) {
    onChange(nextValue);
    close();
  }

  function commitDraft() {
    const trimmed = searchDraft.trim();
    if (!trimmed) {
      selectOption("");
      return;
    }

    const preset = resolveSearchArea(trimmed);
    selectOption(preset?.value ?? trimmed);
  }

  function resetDraft() {
    setSearchDraft("");
  }

  const toggle = useCallback(() => {
    if (open) {
      close();
    } else {
      openPanel();
    }
  }, [close, open, openPanel]);

  const isSegment = variant === "segment";

  return (
    <div ref={rootRef} className={cn("relative w-full min-w-0", className)}>
      {label && !isSegment ? (
        <label
          htmlFor={triggerId}
          className={cn(
            "mb-0.5 block text-foreground",
            compact ? "text-xs font-medium" : "text-sm",
            loading && "opacity-60",
          )}
        >
          {label}
        </label>
      ) : null}

      <button
        ref={triggerRef}
        id={triggerId}
        type="button"
        onClick={toggle}
        disabled={loading}
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-controls={listboxId}
        aria-label={!label ? placeholder : undefined}
        className={cn(
          "flex w-full text-left text-foreground transition-colors",
          isSegment
            ? cn(
                "min-h-11 flex-col justify-center px-3 py-2",
                "hover:bg-background/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:ring-inset",
                active && value && "bg-primary/[0.03]",
              )
            : cn(
                "items-center justify-between gap-2 border bg-surface",
                active && value
                  ? "border-primary/45 bg-primary/5"
                  : "border-border",
                "hover:border-primary/40 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/25",
                compact ? "min-h-9 px-2.5 py-1.5 text-sm" : "min-h-10 px-3 py-2 text-sm",
              ),
          loading && "pointer-events-none opacity-60",
        )}
      >
        {isSegment ? (
          <>
            <span className="text-[10px] font-semibold uppercase tracking-wide text-muted">
              Where
            </span>
            <span className="mt-0.5 flex min-w-0 items-center justify-between gap-2">
              <span
                className={cn(
                  "min-w-0 flex-1 truncate text-sm",
                  !value && !displayOverride && "text-muted",
                  (value || displayOverride) && "font-medium text-foreground",
                )}
              >
                {displayLabel}
              </span>
              <ChevronDown
                aria-hidden
                className={cn(
                  "size-3.5 shrink-0 text-muted transition-transform",
                  open && "rotate-180",
                )}
              />
            </span>
          </>
        ) : (
          <>
        <span
          className={cn(
            "min-w-0 flex-1 truncate",
            !value && "text-muted",
          )}
        >
          {displayLabel}
        </span>
        <span className="flex shrink-0 items-center gap-1">
          {allowClear && value ? (
            <span
              role="button"
              tabIndex={0}
              aria-label="Clear area"
              className="rounded p-0.5 text-muted hover:bg-background hover:text-foreground"
              onClick={(event) => {
                event.stopPropagation();
                onChange("");
                close();
              }}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  event.stopPropagation();
                  onChange("");
                  close();
                }
              }}
            >
              <X className="size-3.5" aria-hidden />
            </span>
          ) : null}
          <ChevronDown
            aria-hidden
            className={cn(
              "size-3.5 text-muted transition-transform",
              open && "rotate-180",
            )}
          />
        </span>
          </>
        )}
      </button>

      {!isSegment && userLocation ? (
        <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] text-muted">
          <span className="inline-flex items-center gap-1">
            <MapPin className="size-3 shrink-0" aria-hidden />
            {inUganda
              ? "Areas near you in Uganda"
              : "Location saved for area sorting"}
          </span>
          {onClearLocation ? (
            <button
              type="button"
              onClick={onClearLocation}
              className="font-medium text-primary hover:underline"
            >
              Clear location
            </button>
          ) : null}
        </p>
      ) : !isSegment && onRequestLocation ? (
        <button
          type="button"
          onClick={onRequestLocation}
          disabled={locationLoading}
          className="mt-1 flex items-center gap-1 text-[11px] text-primary hover:underline disabled:opacity-60"
        >
          <MapPin className="size-3 shrink-0" aria-hidden />
          {locationLoading ? "Finding your location…" : "Use my location for nearby areas"}
        </button>
      ) : null}

      {open && typeof document !== "undefined"
        ? createPortal(
            <div
              ref={panelRef}
              style={panelStyle}
              className="flex max-h-[min(70vh,28rem)] flex-col overflow-hidden rounded-lg border border-border bg-surface shadow-overlay"
              role="listbox"
              id={listboxId}
              aria-labelledby={triggerId}
            >
              <div className="border-b border-border p-2">
                <div className="relative">
                  <Search
                    aria-hidden
                    className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted"
                  />
                  <input
                    ref={searchInputRef}
                    type="search"
                    value={searchDraft}
                    onChange={(event) => setSearchDraft(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") {
                        event.preventDefault();
                        commitDraft();
                      } else if (event.key === "Escape") {
                        event.preventDefault();
                        resetDraft();
                        close();
                      }
                    }}
                    placeholder="Search areas…"
                    aria-label="Search areas"
                    className={cn(
                      "w-full border border-border bg-surface pl-8 pr-2.5 text-foreground",
                      "focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/25",
                      "py-1.5 text-sm",
                    )}
                  />
                </div>
                <p className="mt-1.5 px-0.5 text-[11px] leading-snug text-muted">
                  Pick a city or neighbourhood, or press Enter to geocode a custom
                  place in Uganda.
                </p>
              </div>

              <ul className="min-h-0 flex-1 overflow-y-auto p-1">
                {flatOptions.length === 0 ? (
                  <li className="px-3 py-4 text-center text-sm text-muted">
                    No areas match. Press Enter to search &ldquo;
                    {searchDraft.trim()}&rdquo;.
                  </li>
                ) : (
                  groups.map((group, groupIndex) => (
                    <li
                      key={group.header ?? `ungrouped-${groupIndex}`}
                      role="presentation"
                    >
                      {group.header ? (
                        <p className="px-2.5 pb-1 pt-1.5 text-[10px] font-semibold uppercase tracking-wide text-muted">
                          {group.header}
                        </p>
                      ) : null}
                      <ul role="presentation">
                        {group.options.map((option) => (
                          <li key={option.value || "all"} role="none">
                            <button
                              type="button"
                              role="option"
                              aria-selected={option.value === value}
                              onClick={() => selectOption(option.value)}
                              className={cn(
                                "flex w-full items-center justify-between gap-2 rounded-sm px-2.5 py-2 text-left text-sm transition-colors",
                                "hover:bg-background focus:bg-background focus:outline-none",
                                option.value === value &&
                                  "bg-primary/5 font-medium text-primary",
                              )}
                            >
                              <span className="min-w-0 truncate">{option.label}</span>
                              {option.distanceKm != null && inUganda ? (
                                <span className="shrink-0 text-[11px] text-muted">
                                  {formatDistanceKm(option.distanceKm)}
                                </span>
                              ) : null}
                            </button>
                          </li>
                        ))}
                      </ul>
                    </li>
                  ))
                )}
              </ul>
            </div>,
            document.body,
          )
        : null}
    </div>
  );
}
