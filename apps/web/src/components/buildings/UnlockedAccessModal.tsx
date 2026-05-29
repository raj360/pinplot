"use client";

import { useEffect } from "react";
import { BuildingUnlockedHero } from "@/components/buildings/BuildingUnlockedHero";
import { UnlockedAccessCompact } from "@/components/buildings/UnlockedAccessCompact";
import { mergeBuildingMedia } from "@/lib/buildings/media";
import type { TenantUnlock } from "@/lib/api/unlocks";

export function UnlockedAccessModal({
  unlocks,
  buildingName,
  open,
  onClose,
  onViewFullDetails,
}: {
  unlocks: TenantUnlock[];
  buildingName?: string;
  open: boolean;
  onClose: () => void;
  onViewFullDetails?: () => void;
}) {
  useEffect(() => {
    if (!open) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };

    document.addEventListener("keydown", onKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [open, onClose]);

  if (!open || unlocks.length === 0) return null;

  const title = buildingName ?? unlocks[0]?.buildingName ?? "Building access";
  const media = mergeBuildingMedia(undefined, unlocks[0]);
  const hasMedia = Boolean(
    media.coverImageUrl || media.imageUrls?.length || media.videoUrl,
  );

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center p-0 sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="unlocked-access-modal-title"
    >
      <button
        type="button"
        className="absolute inset-0 bg-black/45"
        onClick={onClose}
        aria-label="Close access details"
      />

      <div className="relative z-10 flex max-h-[92vh] w-full max-w-md flex-col overflow-hidden bg-surface shadow-2xl sm:max-h-[85vh] sm:rounded-lg">
        <div className="flex shrink-0 items-start justify-between gap-3 border-b border-border px-4 py-3">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wide text-lime-700">
              Your access
            </p>
            <h2
              id="unlocked-access-modal-title"
              className="text-lg font-bold leading-tight"
            >
              {title}
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

        <div className="min-h-0 flex-1 space-y-3 overflow-y-auto p-4">
          {hasMedia ? (
            <BuildingUnlockedHero
              compact
              name={title}
              imageUrls={media.imageUrls}
              coverImageUrl={media.coverImageUrl}
              videoUrl={media.videoUrl}
            />
          ) : null}
          {unlocks.map((unlock) => (
            <UnlockedAccessCompact
              key={unlock.unlockId}
              unlock={unlock}
              showBuildingName={false}
              showFullLink={Boolean(onViewFullDetails)}
              onViewFullDetails={onViewFullDetails}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
