"use client";

import Link from "next/link";
import { KeyRound, LogOut, Settings } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils/cn";

type UserMenuProps = {
  initials: string;
  displayName: string;
  onSignOut: () => void | Promise<void>;
};

export function UserMenu({ initials, displayName, onSignOut }: UserMenuProps) {
  const [open, setOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    function onPointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  async function handleSignOut() {
    setSigningOut(true);
    try {
      await onSignOut();
    } finally {
      setSigningOut(false);
      setOpen(false);
    }
  }

  const itemClass =
    "flex w-full items-center gap-3 px-4 py-2 text-left text-sm text-foreground hover:bg-background";

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        className="user-avatar flex size-8 shrink-0 items-center justify-center rounded-full border-2 border-primary-foreground/40 bg-primary-foreground/15 text-[11px] font-semibold text-primary-foreground"
        aria-label={`Account menu for ${displayName}`}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
      >
        {initials}
      </button>

      {open ? (
        <div
          role="menu"
          className="absolute right-0 top-[calc(100%+0.375rem)] z-[70] min-w-[220px] border border-border bg-surface py-1 text-foreground shadow-lg"
        >
          <Link
            href="/tenant/unlocks"
            role="menuitem"
            className={itemClass}
            onClick={() => setOpen(false)}
          >
            <KeyRound className="size-[18px] shrink-0 text-muted" aria-hidden />
            My unlocks
          </Link>
          <Link
            href="/settings"
            role="menuitem"
            className={itemClass}
            onClick={() => setOpen(false)}
          >
            <Settings className="size-[18px] shrink-0 text-muted" aria-hidden />
            Settings
          </Link>
          <button
            type="button"
            role="menuitem"
            className={cn(itemClass, "disabled:opacity-60")}
            disabled={signingOut}
            onClick={handleSignOut}
          >
            <LogOut className="size-[18px] shrink-0 text-muted" aria-hidden />
            {signingOut ? "Signing out…" : "Sign out"}
          </button>
        </div>
      ) : null}
    </div>
  );
}
