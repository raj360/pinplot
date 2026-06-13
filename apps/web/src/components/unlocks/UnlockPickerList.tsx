"use client";

import { UnlockCountdown } from "@/components/unlocks/UnlockCountdown";
import type { TenantUnlock } from "@/lib/api/unlocks";
import { cn } from "@/lib/utils/cn";

type UnlockPickerListProps = {
  unlocks: TenantUnlock[];
  selectedId: string;
  onSelect: (unlockId: string) => void;
  /** Sidebar on desktop; horizontal strip on mobile. */
  layout?: "sidebar" | "strip";
};

export function UnlockPickerList({
  unlocks,
  selectedId,
  onSelect,
  layout = "sidebar",
}: UnlockPickerListProps) {
  if (layout === "strip") {
    return (
      <div
        className="flex gap-2 overflow-x-auto pb-1 lg:hidden"
        role="tablist"
        aria-label="Active unlocks"
      >
        {unlocks.map((unlock) => (
          <UnlockPickerButton
            key={unlock.unlockId}
            unlock={unlock}
            selected={unlock.unlockId === selectedId}
            onSelect={() => onSelect(unlock.unlockId)}
            compact
          />
        ))}
      </div>
    );
  }

  return (
    <aside
      className="hidden space-y-2 lg:block"
      role="tablist"
      aria-label="Active unlocks"
    >
      {unlocks.map((unlock) => (
        <UnlockPickerButton
          key={unlock.unlockId}
          unlock={unlock}
          selected={unlock.unlockId === selectedId}
          onSelect={() => onSelect(unlock.unlockId)}
        />
      ))}
    </aside>
  );
}

function UnlockPickerButton({
  unlock,
  selected,
  onSelect,
  compact = false,
}: {
  unlock: TenantUnlock;
  selected: boolean;
  onSelect: () => void;
  compact?: boolean;
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={selected}
      onClick={onSelect}
      className={cn(
        "shrink-0 border border-border bg-surface text-left transition-colors hover:bg-background",
        compact ? "min-w-[9.5rem] px-3 py-2.5" : "w-full px-3 py-3",
        selected && "border-primary bg-primary/5 ring-1 ring-primary/20",
      )}
    >
      <p className="text-sm font-semibold text-foreground">
        Unit {unlock.unitNumber}
      </p>
      {unlock.buildingName ? (
        <p className="mt-0.5 truncate text-xs text-muted">{unlock.buildingName}</p>
      ) : null}
      <p className="mt-1 text-[11px] text-muted">
        <UnlockCountdown
          expiresAt={unlock.expiresAt}
          locksUnit={unlock.locksUnit ?? true}
        />
      </p>
    </button>
  );
}
