import { SidebarAppShell } from "@/components/layout/SidebarAppShell";
import { LandlordSidebarFooter } from "./LandlordSidebarFooter";

const LANDLORD_NAV = [
  { href: "/landlord/dashboard", label: "Buildings", exact: true },
  { href: "/landlord/new", label: "Add building", exact: true },
] as const;

export default function LandlordLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SidebarAppShell
      sectionLabel="Landlord"
      navItems={[...LANDLORD_NAV]}
      sidebarFooter={<LandlordSidebarFooter />}
    >
      {children}
    </SidebarAppShell>
  );
}
