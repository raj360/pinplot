import { apiFetch } from "./client";

export type AdminUserSummary = {
  id: string;
  email: string | null;
  role: "TENANT" | "LANDLORD" | "ADMIN" | "SUPERADMIN";
  firstName: string | null;
  lastName: string | null;
  phone: string | null;
  countryCode: string | null;
  createdAt: string;
};

export async function fetchAdminUsers(query?: string) {
  const params = query?.trim()
    ? `?q=${encodeURIComponent(query.trim())}`
    : "";
  return apiFetch<AdminUserSummary[]>(`/admin/users${params}`);
}

export async function updateAdminUserRole(
  userId: string,
  role: AdminUserSummary["role"],
) {
  return apiFetch<AdminUserSummary>(`/admin/users/${userId}/role`, {
    method: "PATCH",
    body: JSON.stringify({ role }),
  });
}

export function adminUserDisplayName(user: AdminUserSummary): string {
  const name = [user.firstName, user.lastName].filter(Boolean).join(" ").trim();
  if (name) return name;
  return user.email ?? user.id.slice(0, 8);
}
