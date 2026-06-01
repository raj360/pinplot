import { Suspense } from "react";
import AdminBuildingsClient from "./AdminBuildingsClient";
import { AdminPendingBuildingsSkeleton } from "@/components/admin/AdminPageSkeletons";
import { DashboardSection } from "@/components/layout/DashboardSection";

export default function AdminBuildingsPage() {
  return (
    <Suspense
      fallback={
        <DashboardSection title="Pending buildings">
          <AdminPendingBuildingsSkeleton />
        </DashboardSection>
      }
    >
      <AdminBuildingsClient />
    </Suspense>
  );
}
