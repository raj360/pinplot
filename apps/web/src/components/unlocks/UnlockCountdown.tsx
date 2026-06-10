"use client";

import { useEffect, useState } from "react";

type Remaining = {
  expired: boolean;
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
};

function getRemaining(expiresAt: string | null): Remaining | null {
  if (!expiresAt) return null;
  const ms = new Date(expiresAt).getTime() - Date.now();
  if (ms <= 0) {
    return { expired: true, days: 0, hours: 0, minutes: 0, seconds: 0 };
  }
  return {
    expired: false,
    days: Math.floor(ms / 86_400_000),
    hours: Math.floor((ms % 86_400_000) / 3_600_000),
    minutes: Math.floor((ms % 3_600_000) / 60_000),
    seconds: Math.floor((ms % 60_000) / 1_000),
  };
}

function formatRemaining(remaining: Remaining) {
  if (remaining.expired) return "Access expiring soon";
  if (remaining.days > 0) {
    return `${remaining.days}d ${remaining.hours}h ${remaining.minutes}m`;
  }
  if (remaining.hours > 0) {
    return `${remaining.hours}h ${String(remaining.minutes).padStart(2, "0")}m ${String(remaining.seconds).padStart(2, "0")}s`;
  }
  return `${remaining.minutes}m ${String(remaining.seconds).padStart(2, "0")}s`;
}

export function UnlockCountdown({
  expiresAt,
  locksUnit = true,
  className = "",
}: {
  expiresAt: string | null;
  locksUnit?: boolean;
  className?: string;
}) {
  const [remaining, setRemaining] = useState<Remaining | null>(() =>
    getRemaining(expiresAt),
  );

  useEffect(() => {
    const tick = () => setRemaining(getRemaining(expiresAt));
    tick();
    const id = window.setInterval(tick, 1_000);
    return () => window.clearInterval(id);
  }, [expiresAt]);

  if (!expiresAt) {
    return (
      <span className={className}>
        {locksUnit ? "Exclusive access active" : "Contact access active"}
      </span>
    );
  }

  if (!remaining) return null;

  return (
    <span className={className}>
      <span className="font-mono tabular-nums tracking-tight">
        {formatRemaining(remaining)}
      </span>
      {!remaining.expired ? (
        <span className="opacity-90">
          {locksUnit ? " exclusive access left" : " contact access left"}
        </span>
      ) : null}
    </span>
  );
}
