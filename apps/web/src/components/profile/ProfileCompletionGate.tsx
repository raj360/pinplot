"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { ProfileCompletionModal } from "@/components/profile/ProfileCompletionModal";
import { isProfilePromptSnoozed } from "@/lib/api/profiles";
import { isProfileIncomplete } from "@/lib/auth/profile-complete";
import { useAuth } from "@/lib/auth/use-auth";

const SKIP_PATH_PREFIXES = ["/auth/login", "/auth/callback"];

export function ProfileCompletionGate({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user, profile, loading, profileLoading, isAuthenticated } = useAuth();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (loading || profileLoading || !isAuthenticated) {
      setOpen(false);
      return;
    }

    if (pathname.startsWith("/auth/complete-profile")) {
      setOpen(false);
      return;
    }

    if (SKIP_PATH_PREFIXES.some((prefix) => pathname.startsWith(prefix))) {
      setOpen(false);
      return;
    }

    if (isProfilePromptSnoozed()) {
      setOpen(false);
      return;
    }

    setOpen(isProfileIncomplete(profile));
  }, [loading, profileLoading, isAuthenticated, profile, pathname]);

  return (
    <>
      {children}
      <ProfileCompletionModal
        open={open}
        profile={profile}
        email={user?.email}
        onClose={() => setOpen(false)}
        onComplete={() => setOpen(false)}
      />
    </>
  );
}
