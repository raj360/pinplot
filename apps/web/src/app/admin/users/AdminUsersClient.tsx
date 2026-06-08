"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { DashboardSection } from "@/components/layout/DashboardSection";
import { Button } from "@/components/ui/button";
import {
  adminUserDisplayName,
  fetchAdminUsers,
  updateAdminUserRole,
  type AdminUserSummary,
} from "@/lib/api/admin-users";
import { getAccessToken } from "@/lib/api/client";
import { Spinner } from "@/components/ui/spinner";

const ROLE_OPTIONS: AdminUserSummary["role"][] = [
  "TENANT",
  "LANDLORD",
  "ADMIN",
  "SUPERADMIN",
];

export default function AdminUsersClient() {
  const router = useRouter();
  const [users, setUsers] = useState<AdminUserSummary[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async (search?: string) => {
    setUsers(await fetchAdminUsers(search));
  }, []);

  useEffect(() => {
    let cancelled = false;

    getAccessToken().then(async (token) => {
      if (cancelled) return;
      if (!token) {
        router.replace("/auth/login?next=/admin/users");
        return;
      }
      try {
        await load();
      } catch {
        setError("Could not load users.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [load, router]);

  async function handleSearch(event: React.FormEvent) {
    event.preventDefault();
    setSearching(true);
    setError(null);
    try {
      await load(query.trim() || undefined);
    } catch {
      setError("Search failed.");
    } finally {
      setSearching(false);
    }
  }

  async function handleRoleChange(userId: string, role: AdminUserSummary["role"]) {
    setBusyId(userId);
    setError(null);
    try {
      const updated = await updateAdminUserRole(userId, role);
      setUsers((prev) =>
        prev.map((user) => (user.id === userId ? updated : user)),
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not update role.");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <DashboardSection
      title="Users"
      description="Search profiles and promote landlords or admins."
    >
      <form onSubmit={handleSearch} className="mb-4 flex flex-wrap gap-2">
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search email, name, or phone"
          className="min-w-[min(100%,16rem)] flex-1 border border-border bg-surface px-3 py-2 text-sm"
        />
        <Button type="submit" variant="outline" loading={searching}>
          Search
        </Button>
      </form>

      {error ? <p className="mb-4 text-sm text-red-600">{error}</p> : null}

      {loading ? (
        <div className="flex items-center gap-2 text-sm text-muted">
          <Spinner className="size-4" label="Loading users" />
          Loading…
        </div>
      ) : users.length === 0 ? (
        <p className="text-sm text-muted">No users found.</p>
      ) : (
        <ul className="space-y-3">
          {users.map((user) => (
            <li
              key={user.id}
              className="flex flex-col gap-3 border border-border bg-surface p-4 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="min-w-0">
                <p className="font-medium">{adminUserDisplayName(user)}</p>
                <p className="truncate text-sm text-muted">
                  {user.email ?? "No email"}
                </p>
                {user.phone ? (
                  <p className="text-xs text-muted">{user.phone}</p>
                ) : null}
              </div>
              <div className="flex items-center gap-2">
                {busyId === user.id ? (
                  <Spinner className="size-4" label="Updating role" />
                ) : null}
                <select
                  value={user.role}
                  disabled={busyId === user.id}
                  onChange={(event) =>
                    void handleRoleChange(
                      user.id,
                      event.target.value as AdminUserSummary["role"],
                    )
                  }
                  className="border border-border bg-background px-2 py-1.5 text-sm"
                  aria-label={`Role for ${adminUserDisplayName(user)}`}
                >
                  {ROLE_OPTIONS.map((role) => (
                    <option key={role} value={role}>
                      {role}
                    </option>
                  ))}
                </select>
              </div>
            </li>
          ))}
        </ul>
      )}
    </DashboardSection>
  );
}
