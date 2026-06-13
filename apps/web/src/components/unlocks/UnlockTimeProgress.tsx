"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils/cn";

function getProgress(unlockedAt: string, expiresAt: string | null) {
  if (!expiresAt) return { percent: 100, expired: false };
  const start = new Date(unlockedAt).getTime();
  const end = new Date(expiresAt).getTime();
  const now = Date.now();
  const total = end - start;
  if (total <= 0) return { percent: 0, expired: now >= end };
  const remaining = Math.max(0, end - now);
  return {
    percent: Math.min(100, Math.max(0, (remaining / total) * 100)),
    expired: remaining <= 0,
  };
}

export function UnlockTimeProgress({
  unlockedAt,
  expiresAt,
  className,
}: {
  unlockedAt: string;
  expiresAt: string | null;
  className?: string;
}) {
  const [progress, setProgress] = useState(() =>
    getProgress(unlockedAt, expiresAt),
  );

  useEffect(() => {
    const tick = () => setProgress(getProgress(unlockedAt, expiresAt));
    tick();
    const id = window.setInterval(tick, 30_000);
    return () => window.clearInterval(id);
  }, [unlockedAt, expiresAt]);

  if (!expiresAt) return null;

  return (
    <div className={cn("mt-2", className)}>
      <div
        className="h-1.5 w-full overflow-hidden rounded-full bg-primary-foreground/25"
        role="progressbar"
        aria-valuenow={Math.round(progress.percent)}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="Exclusive access time remaining"
      >
        <div
          className={cn(
            "h-full rounded-full transition-[width] duration-500",
            progress.expired ? "bg-amber-300" : "bg-primary-foreground",
          )}
          style={{ width: `${progress.percent}%` }}
        />
      </div>
    </div>
  );
}
