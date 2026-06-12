import { DashboardSection } from "@/components/layout/DashboardSection";
import TenantSavedClient from "./TenantSavedClient";

export default function TenantSavedPage() {
  return (
    <DashboardSection
      title="Saved listings"
      description="Bookmarks from Explore. Save places to compare before you unlock."
    >
      <TenantSavedClient />
    </DashboardSection>
  );
}
