"use client";

import { useEffect } from "react";
import { ProfileCompletionForm } from "@/components/profile/ProfileCompletionForm";
import {
  clearProfilePromptSnooze,
  snoozeProfilePrompt,
} from "@/lib/api/profiles";
import type { UserProfile } from "@/lib/api/profiles";

export function ProfileCompletionModal({
  open,
  profile,
  email,
  onClose,
  onComplete,
}: {
  open: boolean;
  profile: UserProfile | null;
  email?: string;
  onClose: () => void;
  onComplete: () => void;
}) {
  useEffect(() => {
    if (!open) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };

    document.addEventListener("keydown", onKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [open, onClose]);

  if (!open) return null;

  function handleSkip() {
    snoozeProfilePrompt();
    onClose();
  }

  return (
    <div
      className="fixed inset-0 z-[70] flex items-end justify-center p-0 sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="profile-completion-title"
    >
      <button
        type="button"
        className="absolute inset-0 bg-black/45"
        onClick={handleSkip}
        aria-label="Close profile prompt"
      />

      <div className="relative z-10 w-full max-w-md overflow-hidden bg-surface shadow-2xl sm:rounded-lg">
        <div className="border-b border-border px-4 py-3">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-primary">
            Complete your profile
          </p>
          <h2 id="profile-completion-title" className="text-lg font-bold">
            Add your display name and phone
          </h2>
        </div>

        <div className="p-4">
          <ProfileCompletionForm
            profile={profile}
            email={email}
            showSkip
            onSkip={handleSkip}
            onSuccess={() => {
              clearProfilePromptSnooze();
              onComplete();
            }}
          />
          <p className="mt-3 text-xs text-muted">
            Remind me later hides this for 7 days. You can always update details
            in Settings.
          </p>
        </div>
      </div>
    </div>
  );
}
