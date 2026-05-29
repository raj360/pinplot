"use client";

import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useEffect } from "react";
import { ProfileCompletionForm } from "@/components/profile/ProfileCompletionForm";
import { useAuth } from "@/lib/auth/use-auth";
import { LoadingState } from "@/components/ui/loading-state";
import { isProfileIncomplete } from "@/lib/auth/profile-complete";

export function CompleteProfileClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") ?? "/explore";
  const safeNext = next.startsWith("/") ? next : `/${next}`;
  const { user, profile, loading, profileLoading, isAuthenticated } = useAuth();

  const profileReady = !loading && !profileLoading;

  useEffect(() => {
    if (!profileReady) return;
    if (!isAuthenticated) {
      router.replace(
        `/auth/login?next=${encodeURIComponent(`/auth/complete-profile?next=${encodeURIComponent(safeNext)}`)}`,
      );
      return;
    }
    if (!isProfileIncomplete(profile)) {
      router.replace(safeNext);
    }
  }, [profileReady, isAuthenticated, profile, router, safeNext]);

  if (!profileReady) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-4">
        <LoadingState label="Loading profile" compact />
      </div>
    );
  }

  if (!isAuthenticated || !isProfileIncomplete(profile)) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-4">
        <LoadingState label="Loading profile" compact />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-md border border-border bg-surface p-6">
        <p className="text-xs font-semibold uppercase tracking-wide text-primary">
          Step 2 · Profile
        </p>
        <h1 className="mt-1 text-xl font-bold">Complete your profile</h1>
        <p className="mt-1 text-sm text-muted">
          You&apos;re signed in — add a few details so PlotPin can display your
          name and phone correctly.
        </p>

        <div className="mt-6">
          <ProfileCompletionForm
            profile={profile}
            email={user?.email}
            submitLabel="Continue"
            onSuccess={() => {
              router.push(safeNext);
              router.refresh();
            }}
          />
        </div>

        <Link
          href={safeNext}
          className="mt-4 block text-center text-sm text-muted hover:text-foreground"
        >
          Skip for now
        </Link>
      </div>
    </div>
  );
}
