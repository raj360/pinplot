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
import {
  filterAreaOptions,
  formatDistanceKm,
  rankAreaOptions,
  resolveSearchArea,
  searchAreaLabel,
  type AreaSearchOption,
} from "@/lib/filters/search-areas";
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
};

type OptionGroup = {
  header: string | null;
  options: AreaSearchOption[];
};

/** LPMS-style searchable picker — closed trigger + in-panel search (CaseLinkedSearchCombobox). */
export function AreaSearchCombobox({
  label = "Search area",
  value,
  onChange,
  userLocation = null,
  inUganda = false,
  onRequestLocation,
  onClearLocation,
  locationLoading = false,
  className,
  compact = true,
  placeholder = "All Kampala",
  allowClear = true,
  active = false,
  loading = false,
}: AreaSearchComboboxProps) {
  const triggerId = useId();
  const listboxId = `${triggerId}-listbox`;
  const rootRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [searchDraft, setSearchDraft] = useState("");

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
      return [{ header: null, options: filteredOptions }];
    }

    const nearby = filteredOptions.filter(
      (option) => option.section === "nearby" && option.value,
    );
    const rest = filteredOptions.filter(
      (option) => !(option.section === "nearby" && option.value),
    );

    const result: OptionGroup[] = [];
    if (nearby.length > 0) {
      result.push({ header: "Near you", options: nearby });
    }
    result.push({ header: nearby.length > 0 ? "All areas" : null, options: rest });
    return result;
  }, [filteredOptions, inUganda, searchDraft, userLocation]);

  const flatOptions = useMemo(
    () => groups.flatMap((group) => group.options),
    [groups],
  );

  const displayLabel = value
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
      if (!rootRef.current?.contains(event.target as Node)) {
        close();
      }
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

  return (
    <div ref={rootRef} className={cn("relative w-full min-w-0", className)}>
      {label ? (
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
        id={triggerId}
        type="button"
        onClick={toggle}
        disabled={loading}
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-controls={listboxId}
        className={cn(
          "flex w-full items-center justify-between gap-2 border bg-surface text-left text-foreground transition-colors",
          active && value
            ? "border-primary/45 bg-primary/5"
            : "border-border",
          "hover:border-primary/40 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/25",
          compact ? "min-h-9 px-2.5 py-1.5 text-sm" : "min-h-10 px-3 py-2 text-sm",
          loading && "pointer-events-none opacity-60",
        )}
      >
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
      </button>

      {userLocation ? (
        <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] text-muted">
          <span className="inline-flex items-center gap-1">
            <MapPin className="size-3 shrink-0" aria-hidden />
            {inUganda
              ? "Areas near you in Kampala"
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
      ) : onRequestLocation ? (
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

      {open ? (
        <div
          className="absolute left-0 top-full z-[60] mt-0.5 flex w-full min-w-[min(100%,20rem)] flex-col overflow-hidden border border-border bg-surface shadow-md"
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
              Type to filter the list. Press Enter to apply a custom area, or
              Esc to cancel.
            </p>
          </div>

          <ul className="max-h-60 overflow-y-auto p-1">
            {flatOptions.length === 0 ? (
              <li className="px-3 py-4 text-center text-sm text-muted">
                No areas match. Press Enter to search &ldquo;
                {searchDraft.trim()}&rdquo;.
              </li>
            ) : (
              groups.map((group) => (
                <li key={group.header ?? "default"} role="presentation">
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
        </div>
      ) : null}
    </div>
  );
}
