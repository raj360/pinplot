"use client";

import { useEffect } from "react";
import { BuildingDetailExperience } from "@/components/buildings/BuildingDetailExperience";
import { BuildingPreviewSkeleton } from "@/components/explore/BuildingPreviewSkeleton";
import { Skeleton } from "@/components/ui/skeleton";
import type { BuildingDetail } from "@/lib/api/buildings";
import { cn } from "@/lib/utils/cn";

type BuildingPreviewModalProps = {
  open: boolean;
  buildingName?: string;
  loading: boolean;
  detail: BuildingDetail | null;
  onClose: () => void;
  mode: "full" | "summary";
  onUnlockSuccess?: () => void;
  onExpandToFull?: () => void;
};

/** Mobile bottom sheet, full detail after list tap or tooltip title. */
export function BuildingPreviewModal({
  open,
  buildingName,
  loading,
  detail,
  onClose,
  mode,
  onUnlockSuccess,
  onExpandToFull,
}: BuildingPreviewModalProps) {
  useEffect(() => {
    if (!open) return;

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }

    document.addEventListener("keydown", onKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [onClose, open]);

  if (!open) return null;

  const title = detail?.name ?? buildingName ?? "Building";
  const isSummary = mode === "summary";
  const showTitleSkeleton = loading && !detail && !buildingName;
  const sheetHeight = isSummary
    ? "h-[min(58vh,30rem)]"
    : "h-[min(92vh,100dvh)]";

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="building-preview-title"
      aria-busy={loading}
    >
      <button
        type="button"
        className="absolute inset-0 bg-black/45"
        onClick={onClose}
        aria-label="Close building preview"
      />

      <div
        className={cn(
          "relative z-10 flex w-full flex-col overflow-hidden bg-surface shadow-2xl",
          sheetHeight,
        )}
      >
        <div className="flex shrink-0 items-start justify-between gap-3 border-b border-border bg-background px-4 py-3">
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-muted">
              {isSummary ? "Quick preview" : "Building details"}
            </p>
            <h2
              id="building-preview-title"
              className="truncate text-base font-bold leading-tight text-primary sm:text-lg"
            >
              {showTitleSkeleton ? (
                <>
                  <span className="sr-only">Loading building details</span>
                  <Skeleton className="h-6 w-56 max-w-full rounded-sm" />
                </>
              ) : (
                title
              )}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 px-2 py-1 text-sm text-muted hover:text-foreground"
          >
            Close
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-4">
          {loading || !detail ? (
            <BuildingPreviewSkeleton mode={mode} />
          ) : (
            <BuildingDetailExperience
              building={detail}
              variant={isSummary ? "compact" : "full"}
              layout="stack"
              hideHeader
              onUnlockSuccess={onUnlockSuccess}
              onExpandToFull={isSummary ? onExpandToFull : undefined}
            />
          )}
        </div>
      </div>
    </div>
  );
}
