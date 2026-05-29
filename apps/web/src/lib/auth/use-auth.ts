"use client";

import { useCallback, useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import { fetchMyProfile, type UserProfile } from "@/lib/api/profiles";

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  /** Session bootstrap only — never blocked on profile/API fetch. */
  const [loading, setLoading] = useState(true);
  /** True while /profiles/me is in flight for the signed-in user. */
  const [profileLoading, setProfileLoading] = useState(false);

  const loadProfile = useCallback(async () => {
    setProfileLoading(true);
    try {
      setProfile(await fetchMyProfile());
    } catch {
      setProfile(null);
    } finally {
      setProfileLoading(false);
    }
  }, []);

  useEffect(() => {
    const supabase = createClient();
    let cancelled = false;

    function applySession(sessionUser: User | null) {
      setUser(sessionUser);
      setLoading(false);

      if (sessionUser) {
        // Defer — awaiting inside onAuthStateChange can deadlock getSession().
        window.setTimeout(() => {
          if (!cancelled) void loadProfile();
        }, 0);
      } else {
        setProfile(null);
        setProfileLoading(false);
      }
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!cancelled) applySession(session?.user ?? null);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (cancelled) return;
      applySession(session?.user ?? null);
    });

    const onProfileUpdated = () => {
      if (!cancelled) void loadProfile();
    };
    window.addEventListener("plotpin:profile-updated", onProfileUpdated);

    return () => {
      cancelled = true;
      subscription.unsubscribe();
      window.removeEventListener("plotpin:profile-updated", onProfileUpdated);
    };
  }, [loadProfile]);

  const signOut = useCallback(async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
    setProfileLoading(false);
    setLoading(false);
  }, []);

  return {
    user,
    profile,
    loading,
    profileLoading,
    signOut,
    refreshProfile: loadProfile,
    isAuthenticated: Boolean(user),
  };
}
