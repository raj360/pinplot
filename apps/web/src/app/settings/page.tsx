"use client";

import { AppHeader } from "@/components/layout/AppHeader";
import { useAuth } from "@/lib/auth/use-auth";
import { getUserDisplayLabel } from "@/lib/auth/display-name";
import { LoadingState } from "@/components/ui/loading-state";

export default function SettingsPage() {
  const { user, profile, loading, isAuthenticated } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <AppHeader />
        <LoadingState label="Loading settings" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background">
        <AppHeader />
        <main className="mx-auto max-w-xl px-4 py-10">
          <p className="text-sm text-muted">
            Please{" "}
            <a href="/auth/login?next=/settings" className="text-primary">
              sign in
            </a>{" "}
            to manage your account settings.
          </p>
        </main>
      </div>
    );
  }

  const displayName = getUserDisplayLabel(user?.email, profile);

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <main className="mx-auto max-w-xl px-4 py-10">
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="mt-2 text-sm text-muted">
          Account preferences for {displayName}.
        </p>

        <section className="mt-8 space-y-4 border border-border bg-surface p-4">
          <div>
            <p className="text-xs uppercase tracking-wide text-muted">Email</p>
            <p className="mt-1 text-sm">{user?.email ?? "—"}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-muted">Role</p>
            <p className="mt-1 text-sm">{profile?.role ?? "TENANT"}</p>
          </div>
          <p className="text-xs text-muted">
            Profile editing and notification preferences are planned for a later
            sprint.
          </p>
        </section>
      </main>
    </div>
  );
}
