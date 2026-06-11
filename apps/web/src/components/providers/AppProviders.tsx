"use client";

import { AuthProvider } from "@/lib/auth/use-auth";
import { ProfileCompletionGate } from "@/components/profile/ProfileCompletionGate";
import { NavigationProgress } from "@/components/layout/NavigationProgress";
import { ViewerContextProvider } from "@/components/providers/ViewerContextProvider";
import { SavedBuildingsProvider } from "@/components/saved/SavedBuildingsProvider";

export function AppProviders({
  children,
  initialCountryCode,
}: {
  children: React.ReactNode;
  initialCountryCode?: string | null;
}) {
  return (
    <AuthProvider>
      <ViewerContextProvider initialCountryCode={initialCountryCode}>
        <SavedBuildingsProvider>
          <NavigationProgress />
          <ProfileCompletionGate>{children}</ProfileCompletionGate>
        </SavedBuildingsProvider>
      </ViewerContextProvider>
    </AuthProvider>
  );
}
