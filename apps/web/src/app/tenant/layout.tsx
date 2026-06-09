import type { ReactNode } from "react";
import { AppHeader } from "@/components/layout/AppHeader";
import { PageMain } from "@/components/layout/PageShell";

export default function TenantLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <AppHeader />
      <PageMain className="flex-1 bg-panel">{children}</PageMain>
    </div>
  );
}
