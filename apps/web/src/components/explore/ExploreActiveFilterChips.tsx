"use client";

import { X } from "lucide-react";
import type { ExploreFilterChip } from "@/lib/filters/explore-filter-chips";
import { cn } from "@/lib/utils/cn";

type ExploreActiveFilterChipsProps = {
  chips: ExploreFilterChip[];
  onRemove: (key: ExploreFilterChip["key"]) => void;
  disabled?: boolean;
  className?: string;
};

export function ExploreActiveFilterChips({
  chips,
  onRemove,
  disabled = false,
  className,
}: ExploreActiveFilterChipsProps) {
  if (chips.length === 0) return null;

  return (
    <div
      className={cn("flex flex-wrap items-center gap-1.5", className)}
      aria-label="Active filters"
    >
      {chips.map((chip) => (
        <span
          key={chip.key}
          className="inline-flex max-w-full items-center gap-1 border border-primary/25 bg-primary/5 py-0.5 pl-2 pr-1 text-xs text-primary"
        >
          <span className="truncate">{chip.label}</span>
          <button
            type="button"
            disabled={disabled}
            aria-label={`Remove ${chip.label} filter`}
            onClick={() => onRemove(chip.key)}
            className="shrink-0 rounded-sm p-0.5 text-primary/80 hover:bg-primary/10 hover:text-primary disabled:opacity-50"
          >
            <X className="size-3" aria-hidden />
          </button>
        </span>
      ))}
    </div>
  );
}
