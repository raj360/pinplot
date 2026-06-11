"use client";

import { Heart } from "lucide-react";
import { useSavedBuildings } from "@/components/saved/SavedBuildingsProvider";
import { cn } from "@/lib/utils/cn";

export function SaveBuildingButton({
  buildingId,
  className,
  size = "sm",
}: {
  buildingId: string;
  className?: string;
  size?: "sm" | "md";
}) {
  const { isSaved, toggleSave, loading } = useSavedBuildings();
  const saved = isSaved(buildingId);
  const iconClass = size === "md" ? "size-5" : "size-4";

  return (
    <button
      type="button"
      aria-pressed={saved}
      aria-label={saved ? "Remove from saved listings" : "Save listing"}
      disabled={loading}
      onClick={(event) => {
        event.preventDefault();
        event.stopPropagation();
        void toggleSave(buildingId);
      }}
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-full border border-border bg-surface p-1.5 text-muted transition-colors hover:border-primary/40 hover:text-primary disabled:opacity-50",
        saved && "border-primary/30 bg-primary/10 text-primary",
        className,
      )}
    >
      <Heart
        className={cn(iconClass, saved && "fill-current")}
        aria-hidden
      />
    </button>
  );
}
