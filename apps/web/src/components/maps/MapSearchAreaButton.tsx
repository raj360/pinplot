"use client";

import { Search } from "lucide-react";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils/cn";

type MapSearchAreaButtonProps = {
  visible: boolean;
  searching?: boolean;
  disabled?: boolean;
  onSearch: () => void;
  className?: string;
};

/** Floating control, search listings in the current map viewport. */
export function MapSearchAreaButton({
  visible,
  searching = false,
  disabled = false,
  onSearch,
  className,
}: MapSearchAreaButtonProps) {
  if (!visible) return null;

  return (
    <div
      className={cn(
        "pointer-events-none absolute inset-x-0 top-3 z-20 flex justify-center px-3",
        className,
      )}
    >
      <button
        type="button"
        disabled={disabled || searching}
        onClick={onSearch}
        className={cn(
          "pointer-events-auto inline-flex min-h-10 items-center gap-2 rounded-full border border-border bg-surface px-4 py-2 text-sm font-medium text-foreground shadow-md transition-colors",
          "hover:border-primary/40 hover:bg-background focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20",
          "disabled:cursor-not-allowed disabled:opacity-60",
        )}
      >
        {searching ? (
          <>
            <Spinner className="size-4" label="Searching map area" />
            Searching area…
          </>
        ) : (
          <>
            <Search className="size-4 shrink-0 text-primary" aria-hidden />
            Search this map area
          </>
        )}
      </button>
    </div>
  );
}
