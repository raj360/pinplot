"use client";

import { ProfileCompletionGate } from "@/components/profile/ProfileCompletionGate";

export function AppProviders({ children }: { children: React.ReactNode }) {
  return <ProfileCompletionGate>{children}</ProfileCompletionGate>;
}
