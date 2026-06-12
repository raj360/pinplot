"use client";

import { MapPin } from "lucide-react";
import { APPROXIMATE_LOCATION_RADIUS_M } from "@/lib/maps/config";
import { cn } from "@/lib/utils/cn";

type ApproximateLocationNoticeProps = {
  className?: string;
  /** Map overlay, compact pill. Unlock panel, full sentence. */
  variant?: "inline" | "map";
};

export function ApproximateLocationNotice({
  className,
  variant = "inline",
}: ApproximateLocationNoticeProps) {
  const radiusM = APPROXIMATE_LOCATION_RADIUS_M;

  if (variant === "map") {
    return (
      <div
        className={cn(
          "pointer-events-none absolute inset-x-0 bottom-3 z-20 flex justify-center px-3",
          className,
        )}
      >
        <p
          className="pointer-events-auto max-w-md rounded-lg border border-border/80 bg-surface/95 px-3 py-2 text-center text-xs leading-snug text-muted shadow-sm backdrop-blur-sm"
          role="note"
        >
          <MapPin
            className="mb-0.5 inline size-3.5 align-text-bottom text-primary"
            aria-hidden
          />{" "}
          Pins are approximate (within ~{radiusM}&nbsp;m). Nearby buildings may
          look farther apart than they are. Exact address unlocks after payment.
        </p>
      </div>
    );
  }

  return (
    <p
      className={cn(
        "flex items-start gap-2 text-xs leading-snug text-muted",
        className,
      )}
      role="note"
    >
      <MapPin className="mt-0.5 size-3.5 shrink-0 text-primary" aria-hidden />
      <span>
        Map pins show approximate locations only (within ~{radiusM}&nbsp;m).
        Buildings close together may appear separated on the map. Exact address,
        contact, and directions unlock after payment.
      </span>
    </p>
  );
}
