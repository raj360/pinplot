"use client";

import { AuthProvider } from "@/lib/auth/use-auth";
import { ProfileCompletionGate } from "@/components/profile/ProfileCompletionGate";

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <ProfileCompletionGate>{children}</ProfileCompletionGate>
    </AuthProvider>
  );
}
