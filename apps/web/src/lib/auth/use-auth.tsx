"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import { fetchMyProfile, type UserProfile } from "@/lib/api/profiles";

type AuthContextValue = {
  user: User | null;
  profile: UserProfile | null;
  /** Session bootstrap only — never blocked on profile/API fetch. */
  loading: boolean;
  /** True while /profiles/me is in flight for the signed-in user. */
  profileLoading: boolean;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  isAuthenticated: boolean;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [profileLoading, setProfileLoading] = useState(false);
  const lastAppliedUserIdRef = useRef<string | null | undefined>(undefined);

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
      const nextId = sessionUser?.id ?? null;
      if (
        lastAppliedUserIdRef.current !== undefined &&
        lastAppliedUserIdRef.current === nextId
      ) {
        return;
      }
      lastAppliedUserIdRef.current = nextId;

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
    lastAppliedUserIdRef.current = null;
    setUser(null);
    setProfile(null);
    setProfileLoading(false);
    setLoading(false);
  }, []);

  const value: AuthContextValue = {
    user,
    profile,
    loading,
    profileLoading,
    signOut,
    refreshProfile: loadProfile,
    isAuthenticated: Boolean(user),
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
