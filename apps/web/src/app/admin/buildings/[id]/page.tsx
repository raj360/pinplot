import { Suspense } from "react";
import AdminEditBuildingClient from "@/app/admin/buildings/[id]/AdminEditBuildingClient";
import { AdminEditBuildingSkeleton } from "@/components/admin/AdminPageSkeletons";
import { DashboardSection } from "@/components/layout/DashboardSection";

export default async function AdminEditBuildingPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <Suspense
      fallback={
        <DashboardSection title="Edit pending building">
          <AdminEditBuildingSkeleton />
        </DashboardSection>
      }
    >
      <AdminEditBuildingClient buildingId={id} />
    </Suspense>
  );
}
