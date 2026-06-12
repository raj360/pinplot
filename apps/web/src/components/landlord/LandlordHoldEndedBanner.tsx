"use client";

import Link from "next/link";
import { X } from "lucide-react";
import {
  dismissHoldAlert,
  holdAlertKey,
  type LandlordHoldAlert,
} from "@/lib/landlord/hold-alerts-storage";

export function LandlordHoldEndedBanner({
  alerts,
  onDismiss,
}: {
  alerts: LandlordHoldAlert[];
  onDismiss: (key: string) => void;
}) {
  if (alerts.length === 0) return null;

  return (
    <ul className="space-y-2">
      {alerts.map((alert) => {
        const key = holdAlertKey(alert);
        return (
          <li
            key={key}
            className="flex items-start justify-between gap-3 border border-lime-300 bg-lime-50/90 px-4 py-3 text-sm text-lime-950"
          >
            <div className="min-w-0">
              <p className="font-medium">
                Exclusive lock ended — Unit {alert.unitNumber}
              </p>
              <p className="mt-1 text-lime-900/90">
                {alert.buildingName} is visible on the map again. Update the unit
                if it is rented or still available.
              </p>
              <Link
                href={`/landlord/buildings/${alert.buildingId}`}
                className="mt-2 inline-block font-medium text-lime-800 underline underline-offset-2 hover:text-lime-950"
              >
                Manage units
              </Link>
            </div>
            <button
              type="button"
              aria-label="Dismiss"
              className="shrink-0 rounded-md p-1 text-lime-800 hover:bg-lime-100"
              onClick={() => {
                dismissHoldAlert(key);
                onDismiss(key);
              }}
            >
              <X className="size-4" aria-hidden />
            </button>
          </li>
        );
      })}
    </ul>
  );
}
