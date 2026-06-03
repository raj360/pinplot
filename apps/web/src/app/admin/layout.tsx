import { SidebarAppShell } from "@/components/layout/SidebarAppShell";

const ADMIN_NAV = [
  { href: "/admin", label: "Overview", exact: true },
  { href: "/admin/buildings", label: "Buildings" },
  { href: "/admin/featured", label: "Featured" },
  { href: "/admin/coupons", label: "Coupons" },
  { href: "/admin/users", label: "Users" },
] as const;

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
