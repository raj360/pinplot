import type { ReactNode } from "react";
import { SidebarAppShell } from "@/components/layout/SidebarAppShell";
import { TENANT_NAV } from "@/lib/navigation/app-nav";

export default function TenantLayout({ children }: { children: ReactNode }) {
  return (
    <SidebarAppShell sectionLabel="Tenant" navItems={[...TENANT_NAV]}>
      {children}
    </SidebarAppShell>
  );
}
