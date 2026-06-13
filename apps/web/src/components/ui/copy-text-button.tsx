"use client";

import { useState } from "react";
import { cn } from "@/lib/utils/cn";

export function CopyTextButton({
  text,
  label = "Copy",
  copiedLabel = "Copied",
  className,
  onCopy,
}: {
  text: string;
  label?: string;
  copiedLabel?: string;
  className?: string;
  onCopy?: () => void;
}) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      onCopy?.();
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard unavailable */
    }
  }

  return (
    <button
      type="button"
      onClick={() => void handleCopy()}
      className={cn(
        "shrink-0 border border-border bg-background px-2.5 py-1 text-xs font-medium text-foreground hover:bg-surface",
        className,
      )}
    >
      {copied ? copiedLabel : label}
    </button>
  );
}
