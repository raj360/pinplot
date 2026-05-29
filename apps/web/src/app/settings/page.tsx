"use client";

import { useState } from "react";
import { AppHeader } from "@/components/layout/AppHeader";
import { ProfileCompletionForm } from "@/components/profile/ProfileCompletionForm";
import { useAuth } from "@/lib/auth/use-auth";
import { getUserDisplayLabel } from "@/lib/auth/display-name";
import { LoadingState } from "@/components/ui/loading-state";
import { PageMain } from "@/components/layout/PageShell";

export default function SettingsPage() {
  const { user, profile, loading, isAuthenticated } = useAuth();
  const [saved, setSaved] = useState(false);

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
        <PageMain>
          <p className="text-sm text-muted">
            Please{" "}
            <a href="/auth/login?next=/settings" className="text-primary">
              sign in
            </a>{" "}
            to manage your account settings.
          </p>
        </PageMain>
      </div>
    );
  }

  const displayName = getUserDisplayLabel(user?.email, profile);

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <PageMain>
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="mt-2 text-sm text-muted">
          Account preferences for {displayName}.
        </p>

        <section className="mt-8 max-w-lg space-y-6">
          <div className="border border-border bg-surface p-4">
            <h2 className="font-semibold">Profile</h2>
            <p className="mt-1 text-sm text-muted">
              Your display name and phone appear in the header and when
              landlords or tenants need to reach you.
            </p>
            <div className="mt-4">
              <ProfileCompletionForm
                profile={profile}
                email={user?.email}
                submitLabel="Save changes"
                showVerification
                onSuccess={() => setSaved(true)}
              />
              {saved ? (
                <p className="mt-3 text-sm text-lime-700">Profile saved.</p>
              ) : null}
            </div>
          </div>

          <div className="border border-border bg-surface p-4">
            <div>
              <p className="text-xs uppercase tracking-wide text-muted">Role</p>
              <p className="mt-1 text-sm">{profile?.role ?? "TENANT"}</p>
            </div>
            <p className="mt-3 text-xs text-muted">
              Notification preferences are planned for a later sprint.
            </p>
          </div>
        </section>
      </PageMain>
    </div>
  );
}
