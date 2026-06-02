"use client";

import { cn } from "@/lib/utils/cn";

export const BUILDING_PHOTO_GRID_CLASS =
  "grid list-none grid-cols-2 gap-3 p-0 sm:grid-cols-4";

type BuildingPhotoTileProps = {
  src: string;
  isCover: boolean;
  readOnly?: boolean;
  busy?: boolean;
  coverLabel?: string;
  onSetCover?: () => void;
  onRemove?: () => void;
  /** Shown on draft tiles before upload. */
  pending?: boolean;
};

export function BuildingPhotoTile({
  src,
  isCover,
  readOnly = false,
  busy = false,
  coverLabel = "Cover",
  onSetCover,
  onRemove,
  pending = false,
}: BuildingPhotoTileProps) {
  return (
    <li
      className={cn(
        "min-w-0 overflow-hidden border bg-background",
        isCover ? "border-primary ring-1 ring-primary" : "border-border",
        pending && "border-dashed",
      )}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt="" className="aspect-[4/3] w-full object-cover" />
      {!readOnly ? (
        <div className="space-y-1 border-t border-border p-2">
          {pending ? (
            <span className="block text-xs text-muted">Pending upload</span>
          ) : isCover ? (
            <span className="block text-xs font-medium text-primary">
              {coverLabel}
            </span>
          ) : (
            <button
              type="button"
              className="text-xs text-primary hover:underline disabled:opacity-50"
              disabled={busy}
              onClick={onSetCover}
            >
              Set as cover
            </button>
          )}
          <button
            type="button"
            className="block text-xs text-muted hover:text-red-600 disabled:opacity-50"
            disabled={busy}
            onClick={onRemove}
          >
            Remove
          </button>
        </div>
      ) : null}
    </li>
  );
}
