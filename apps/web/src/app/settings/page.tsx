"use client";

import { useState } from "react";
import { AppHeader } from "@/components/layout/AppHeader";
import { ProfileCompletionForm } from "@/components/profile/ProfileCompletionForm";
import { ViewerCountrySettings } from "@/components/settings/ViewerCountrySettings";
import { SettingsPageSkeleton } from "@/components/settings/SettingsPageSkeleton";
import { useAuth } from "@/lib/auth/use-auth";
import { getUserDisplayLabel } from "@/lib/auth/display-name";
import { PageMain } from "@/components/layout/PageShell";

export default function SettingsPage() {
  const { user, profile, loading, profileLoading, isAuthenticated } = useAuth();
  const [saved, setSaved] = useState(false);

  const profilePending =
    isAuthenticated && profileLoading && profile === null;

  if (loading || profilePending) {
    return (
      <div className="min-h-screen bg-panel">
        <AppHeader />
        <SettingsPageSkeleton />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-panel">
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
    <div className="min-h-screen bg-panel">
      <AppHeader />
      <PageMain>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold">Settings</h1>
            <p className="mt-1 text-sm text-muted">{displayName}</p>
          </div>
          <span className="border border-border bg-background px-2.5 py-1 text-xs font-medium uppercase tracking-wide text-muted">
            {profile?.role ?? "TENANT"}
          </span>
        </div>

        <section className="mt-6 max-w-lg divide-y divide-border border border-border bg-surface">
          <div className="p-4">
            <h2 className="text-sm font-semibold">Profile</h2>
            <p className="mt-1 text-xs text-muted">
              {profile?.role === "LANDLORD" ||
              profile?.role === "ADMIN" ||
              profile?.role === "SUPERADMIN"
                ? "Your contact details are shown to tenants after they unlock a unit."
                : "Your name and phone for landlords and account recovery."}
            </p>
            <div className="mt-3">
              <ProfileCompletionForm
                profile={profile}
                email={user?.email}
                submitLabel="Save changes"
                showVerification
                compact
                onSuccess={() => setSaved(true)}
              />
              {saved ? (
                <p className="mt-2 text-sm text-lime-700" role="status">
                  Profile saved.
                </p>
              ) : null}
            </div>
          </div>

          <div className="p-4">
            <h2 className="text-sm font-semibold">Display country</h2>
            <p className="mt-1 text-xs text-muted">
              Currency hints on Explore and map defaults when GPS is off.
            </p>
            <div className="mt-3">
              <ViewerCountrySettings compact />
            </div>
          </div>
        </section>
      </PageMain>
    </div>
  );
}
