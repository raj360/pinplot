"use client";

import type { TenantUnlock } from "@/lib/api/unlocks";
import { trackUnlockEngagement } from "@/lib/analytics/track-unlock-engagement";
import {
  unlockCalendarUrl,
  unlockDirectionsHref,
  unlockHubUrl,
  unlockTelHref,
  unlockWhatsAppHref,
} from "@/lib/unlocks/unlock-access-links";
import { CopyTextButton } from "@/components/ui/copy-text-button";

export function UnlockAccessTools({
  unlock,
}: {
  unlock: TenantUnlock;
}) {
  const calendarUrl = unlockCalendarUrl(unlock);
  const hubUrl = unlockHubUrl(unlock.unlockId);

  async function handleShare() {
    const title = `PlotPin unlock: ${unlock.buildingName ?? "Listing"} Unit ${unlock.unitNumber}`;
    try {
      if (typeof navigator !== "undefined" && navigator.share) {
        await navigator.share({ title, url: hubUrl });
        return;
      }
    } catch {
      /* user cancelled or unsupported */
    }
    try {
      await navigator.clipboard.writeText(hubUrl);
    } catch {
      /* ignore */
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      {calendarUrl ? (
        <a
          href={calendarUrl}
          target="_blank"
          rel="noreferrer"
          className="border border-border bg-background px-2.5 py-1 text-xs font-medium text-foreground hover:bg-surface"
        >
          Add reminder
        </a>
      ) : null}
      <button
        type="button"
        onClick={() => void handleShare()}
        className="border border-border bg-background px-2.5 py-1 text-xs font-medium text-foreground hover:bg-surface"
      >
        Share access
      </button>
      <CopyTextButton text={hubUrl} label="Copy link" copiedLabel="Link copied" />
    </div>
  );
}

export function UnlockAccessMobileBar({
  unlock,
}: {
  unlock: TenantUnlock;
}) {
  const tel = unlockTelHref(unlock);
  const wa = unlockWhatsAppHref(unlock);
  const directions = unlockDirectionsHref(unlock);

  if (!tel && !wa && !directions) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 border-t border-border bg-surface/95 p-3 backdrop-blur-sm lg:hidden">
      <div className="mx-auto flex max-w-lg gap-2">
        {tel ? (
          <a
            href={tel}
            onClick={() => trackUnlockEngagement("CONTACT_CALL", unlock)}
            className="flex min-h-11 flex-1 items-center justify-center bg-primary px-3 text-sm font-medium text-primary-foreground"
          >
            Call
          </a>
        ) : null}
        {wa ? (
          <a
            href={wa}
            target="_blank"
            rel="noreferrer"
            onClick={() => trackUnlockEngagement("CONTACT_WHATSAPP", unlock)}
            className="flex min-h-11 flex-1 items-center justify-center border border-[#25D366] bg-[#25D366]/10 px-3 text-sm font-medium text-[#128C7E]"
          >
            WhatsApp
          </a>
        ) : null}
        <a
          href={directions}
          target="_blank"
          rel="noreferrer"
          onClick={() => trackUnlockEngagement("DIRECTIONS", unlock)}
          className="flex min-h-11 flex-1 items-center justify-center border border-border bg-background px-3 text-sm font-medium"
        >
          Directions
        </a>
      </div>
    </div>
  );
}
