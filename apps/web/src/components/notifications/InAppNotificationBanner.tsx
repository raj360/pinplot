"use client";

import Link from "next/link";
import { X } from "lucide-react";
import type { AppNotification } from "@/lib/api/notifications";
import { dismissNotification } from "@/lib/api/notifications";

export function InAppNotificationBanner({
  notifications,
  onDismiss,
}: {
  notifications: AppNotification[];
  onDismiss: (id: string) => void;
}) {
  if (notifications.length === 0) return null;

  return (
    <ul className="space-y-2">
      {notifications.map((notification) => (
        <li
          key={notification.id}
          className="flex items-start justify-between gap-3 rounded-[var(--radius-DEFAULT)] border border-lime-300 bg-lime-50/90 px-4 py-3 text-sm text-lime-950"
        >
          <div className="min-w-0">
            <p className="font-medium">{notification.title}</p>
            <p className="mt-1 text-lime-900/90">{notification.body}</p>
            {notification.ctaUrl ? (
              <Link
                href={notification.ctaUrl}
                className="mt-2 inline-block font-medium text-lime-800 underline underline-offset-2 hover:text-lime-950"
              >
                Manage units
              </Link>
            ) : null}
          </div>
          <button
            type="button"
            aria-label="Dismiss"
            className="shrink-0 rounded-md p-1 text-lime-800 hover:bg-lime-100"
            onClick={() => {
              void dismissNotification(notification.id).then(() => {
                onDismiss(notification.id);
              });
            }}
          >
            <X className="size-4" aria-hidden />
          </button>
        </li>
      ))}
    </ul>
  );
}
