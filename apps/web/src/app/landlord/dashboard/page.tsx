import { Suspense } from "react";
import LandlordDashboardClient from "./LandlordDashboardClient";
import { LandlordDashboardSkeleton } from "@/components/landlord/LandlordPageSkeletons";
import { DashboardSection } from "@/components/layout/DashboardSection";

export default function LandlordDashboardPage() {
  return (
    <Suspense
      fallback={
        <DashboardSection title="Your buildings">
          <LandlordDashboardSkeleton />
        </DashboardSection>
      }
    >
      <LandlordDashboardClient />
    </Suspense>
  );
}
