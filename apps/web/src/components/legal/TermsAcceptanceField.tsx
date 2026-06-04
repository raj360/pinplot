"use client";

import Link from "next/link";
import { cn } from "@/lib/utils/cn";

export function TermsAcceptanceField({
  checked,
  onCheckedChange,
  ownershipAttestation = false,
  onOwnershipChange,
  className,
}: {
  checked: boolean;
  onCheckedChange: (value: boolean) => void;
  ownershipAttestation?: boolean;
  onOwnershipChange?: (value: boolean) => void;
  className?: string;
}) {
  return (
    <div className={cn("space-y-3 text-sm", className)}>
      {onOwnershipChange ? (
        <label className="flex cursor-pointer items-start gap-2">
          <input
            type="checkbox"
            className="mt-0.5"
            checked={ownershipAttestation}
            onChange={(e) => onOwnershipChange(e.target.checked)}
          />
          <span>
            I confirm I own this property or have written authority from the
            owner to list it on PlotPin.
          </span>
        </label>
      ) : null}
      <label className="flex cursor-pointer items-start gap-2">
        <input
          type="checkbox"
          className="mt-0.5"
          checked={checked}
          onChange={(e) => onCheckedChange(e.target.checked)}
        />
        <span>
          I agree to the{" "}
          <Link href="/terms" className="text-primary hover:underline" target="_blank">
            Terms of Service
          </Link>{" "}
          and{" "}
          <Link href="/privacy" className="text-primary hover:underline" target="_blank">
            Privacy Policy
          </Link>
          .
        </span>
      </label>
    </div>
  );
}
