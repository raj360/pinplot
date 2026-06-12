"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Bell } from "lucide-react";
import {
  dismissNotification,
  fetchNotificationUnreadCount,
  fetchNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  type AppNotification,
} from "@/lib/api/notifications";
import { cn } from "@/lib/utils/cn";
import { NotificationBellListSkeleton } from "@/components/notifications/NotificationSkeletons";

type NotificationBellProps = {
  /** When false, render the bell without fetching (auth still resolving). */
  ready?: boolean;
};

export function NotificationBell({ ready = true }: NotificationBellProps) {
  const [open, setOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [items, setItems] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ready) return;

    let cancelled = false;

    async function refreshUnread() {
      try {
        const count = await fetchNotificationUnreadCount();
        if (!cancelled) setUnreadCount(count);
      } catch {
        /* ignore when logged out */
      }
    }

    void refreshUnread();
    const id = window.setInterval(() => void refreshUnread(), 60_000);
    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, [ready]);

  useEffect(() => {
    if (!open) return;

    function onPointerDown(event: MouseEvent) {
      if (!panelRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, [open]);

  async function handleToggle() {
    if (!ready) return;

    const nextOpen = !open;
    setOpen(nextOpen);

    if (!nextOpen) return;

    setLoading(true);
    try {
      const data = await fetchNotifications({ limit: 20, undismissedOnly: true });
      setItems(data);
      try {
        setUnreadCount(await fetchNotificationUnreadCount());
      } catch {
        /* ignore */
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleOpenItem(notification: AppNotification) {
    if (!notification.readAt) {
      await markNotificationRead(notification.id);
      try {
        setUnreadCount(await fetchNotificationUnreadCount());
      } catch {
        /* ignore */
      }
    }
    setOpen(false);
  }

  async function handleDismiss(id: string, event: React.MouseEvent) {
    event.preventDefault();
    event.stopPropagation();
    await dismissNotification(id);
    setItems((prev) => prev.filter((item) => item.id !== id));
    try {
      setUnreadCount(await fetchNotificationUnreadCount());
    } catch {
      /* ignore */
    }
  }

  async function handleMarkAllRead() {
    await markAllNotificationsRead();
    setItems((prev) =>
      prev.map((item) => ({
        ...item,
        readAt: item.readAt ?? new Date().toISOString(),
      })),
    );
    setUnreadCount(0);
  }

  return (
    <div
      ref={panelRef}
      className="relative flex size-7 shrink-0 items-center justify-center"
    >
      <button
        type="button"
        aria-label={
          unreadCount > 0
            ? `Notifications, ${unreadCount} unread`
            : "Notifications"
        }
        aria-expanded={open}
        aria-busy={!ready}
        disabled={!ready}
        onClick={() => void handleToggle()}
        className={cn(
          "relative inline-flex items-center justify-center p-1 text-primary-foreground transition-opacity",
          ready ? "hover:opacity-80" : "opacity-70",
        )}
      >
        <Bell className="size-5" aria-hidden strokeWidth={1.75} />
        {ready && unreadCount > 0 ? (
          <span className="notification-badge absolute -right-1 -top-1 flex h-[1.1rem] min-w-[1.1rem] items-center justify-center rounded-full bg-amber-400 px-1 text-[10px] font-bold leading-none text-amber-950">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        ) : null}
      </button>

      {open && ready ? (
        <div className="absolute right-0 top-full z-[80] mt-2 w-[min(22rem,calc(100vw-2rem))] overflow-hidden rounded-lg border border-border bg-surface shadow-lg">
          <div className="flex items-center justify-between border-b border-border px-3 py-2">
            <p className="text-sm font-semibold text-foreground">Notifications</p>
            {unreadCount > 0 ? (
              <button
                type="button"
                onClick={() => void handleMarkAllRead()}
                className="text-xs font-medium text-primary hover:underline"
              >
                Mark all read
              </button>
            ) : null}
          </div>

          <ul className="max-h-80 overflow-y-auto" aria-busy={loading}>
            {loading ? (
              <NotificationBellListSkeleton rows={unreadCount > 0 ? unreadCount : 2} />
            ) : items.length === 0 ? (
              <li className="px-3 py-6 text-center text-sm text-muted">
                No notifications yet.
              </li>
            ) : (
              items.map((item) => (
                <li key={item.id} className="border-b border-border last:border-b-0">
                  {item.ctaUrl ? (
                    <Link
                      href={item.ctaUrl}
                      onClick={() => void handleOpenItem(item)}
                      className={cn(
                        "block px-3 py-3 hover:bg-background",
                        !item.readAt && "bg-primary/5",
                      )}
                    >
                      <NotificationRow
                        item={item}
                        onDismiss={(event) => void handleDismiss(item.id, event)}
                      />
                    </Link>
                  ) : (
                    <div
                      className={cn(
                        "px-3 py-3",
                        !item.readAt && "bg-primary/5",
                      )}
                    >
                      <NotificationRow
                        item={item}
                        onDismiss={(event) => void handleDismiss(item.id, event)}
                      />
                    </div>
                  )}
                </li>
              ))
            )}
          </ul>
        </div>
      ) : null}
    </div>
  );
}

function NotificationRow({
  item,
  onDismiss,
}: {
  item: AppNotification;
  onDismiss: (event: React.MouseEvent) => void;
}) {
  return (
    <div className="flex items-start justify-between gap-2">
      <div className="min-w-0">
        <p className="text-sm font-medium text-foreground">{item.title}</p>
        <p className="mt-0.5 text-xs leading-relaxed text-muted">{item.body}</p>
        <p className="mt-1 text-[11px] text-muted">
          {new Date(item.createdAt).toLocaleString()}
        </p>
      </div>
      <button
        type="button"
        aria-label="Dismiss notification"
        onClick={onDismiss}
        className="shrink-0 rounded p-1 text-xs text-muted hover:bg-background hover:text-foreground"
      >
        ×
      </button>
    </div>
  );
}
