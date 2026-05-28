import { SidebarAppShell } from "@/components/layout/SidebarAppShell";

const TENANT_NAV = [
  { href: "/explore", label: "Explore map", exact: true },
  { href: "/tenant/unlocks", label: "My unlocks", exact: true },
] as const;

export default function TenantUnlocksLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SidebarAppShell sectionLabel="Tenant" navItems={[...TENANT_NAV]}>
      {children}
    </SidebarAppShell>
  );
}
