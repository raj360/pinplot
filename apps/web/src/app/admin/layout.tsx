import { SidebarAppShell } from "@/components/layout/SidebarAppShell";
import { ADMIN_NAV } from "@/lib/navigation/app-nav";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SidebarAppShell sectionLabel="Admin" navItems={[...ADMIN_NAV]}>
      {children}
    </SidebarAppShell>
  );
}
