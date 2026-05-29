"use client";

import { useEffect } from "react";
import { BuildingDetailPanel } from "@/components/buildings/BuildingDetailPanel";
import { LoadingState } from "@/components/ui/loading-state";
import type { BuildingDetail } from "@/lib/api/buildings";
import { cn } from "@/lib/utils/cn";

type BuildingPreviewModalProps = {
  open: boolean;
  buildingName?: string;
  loading: boolean;
  detail: BuildingDetail | null;
  onClose: () => void;
  variant: "mobile";
};

/** Mobile-only bottom sheet for building detail after list/map click. */
export function BuildingPreviewModal({
  open,
  buildingName,
  loading,
  detail,
  onClose,
  variant: _variant,
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

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="building-preview-title"
    >
      <button
        type="button"
        className="absolute inset-0 bg-black/45"
        onClick={onClose}
        aria-label="Close building preview"
      />

      <div className="relative z-10 flex max-h-[92vh] w-full max-w-lg flex-col overflow-hidden bg-surface shadow-2xl sm:max-h-[85vh] sm:rounded-lg">
        <div className="flex shrink-0 items-start justify-between gap-3 border-b border-border bg-background px-4 py-3">
          <h2
            id="building-preview-title"
            className="text-base font-bold leading-tight text-primary sm:text-lg"
          >
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 px-2 py-1 text-sm text-muted hover:text-foreground"
          >
            Close
          </button>
        </div>

        <div className={cn("min-h-0 flex-1 overflow-y-auto overscroll-contain p-4")}>
          {loading ? (
            <LoadingState label="Loading building" compact />
          ) : detail ? (
            <BuildingDetailPanel building={detail} compact />
          ) : (
            <p className="text-sm text-muted">Could not load building details.</p>
          )}
        </div>
      </div>
    </div>
  );
}
