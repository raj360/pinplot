import { apiFetch } from "@/lib/api/client";

export type AppNotification = {
  id: string;
  type: string;
  title: string;
  body: string;
  ctaUrl: string | null;
  payload: Record<string, unknown>;
  readAt: string | null;
  dismissedAt: string | null;
  createdAt: string;
};

export async function fetchNotifications(options?: {
  limit?: number;
  unreadOnly?: boolean;
  undismissedOnly?: boolean;
  types?: string[];
}) {
  const params = new URLSearchParams();
  if (options?.limit != null) params.set("limit", String(options.limit));
  if (options?.unreadOnly) params.set("unreadOnly", "true");
  if (options?.undismissedOnly === false) params.set("undismissedOnly", "false");
  if (options?.types?.length) params.set("types", options.types.join(","));

  const query = params.toString();
  return apiFetch<AppNotification[]>(
    `/notifications/mine${query ? `?${query}` : ""}`,
  );
}

export async function fetchNotificationUnreadCount() {
  return apiFetch<number>("/notifications/unread-count");
}

export async function markNotificationRead(id: string) {
  return apiFetch<AppNotification>(`/notifications/${id}/read`, {
    method: "PATCH",
  });
}

export async function dismissNotification(id: string) {
  return apiFetch<AppNotification>(`/notifications/${id}/dismiss`, {
    method: "PATCH",
  });
}

export async function markAllNotificationsRead() {
  return apiFetch<number>("/notifications/mark-all-read", { method: "POST" });
}
