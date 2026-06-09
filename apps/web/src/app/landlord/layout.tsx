import { SidebarAppShell } from "@/components/layout/SidebarAppShell";
import { LANDLORD_NAV } from "@/lib/navigation/app-nav";
import { LandlordSidebarFooter } from "./LandlordSidebarFooter";

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
