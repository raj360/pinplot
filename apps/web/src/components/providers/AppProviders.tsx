"use client";

import { AuthProvider } from "@/lib/auth/use-auth";
import { ProfileCompletionGate } from "@/components/profile/ProfileCompletionGate";
import { NavigationProgress } from "@/components/layout/NavigationProgress";
import { ViewerContextProvider } from "@/components/providers/ViewerContextProvider";

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <ViewerContextProvider>
        <NavigationProgress />
        <ProfileCompletionGate>{children}</ProfileCompletionGate>
      </ViewerContextProvider>
    </AuthProvider>
  );
}
