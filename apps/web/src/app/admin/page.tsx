import { Suspense } from "react";
import AdminOverviewClient from "./AdminOverviewClient";
import { AdminOverviewSkeleton } from "@/components/admin/AdminPageSkeletons";

export default function AdminPage() {
  return (
    <Suspense fallback={<AdminOverviewSkeleton />}>
      <AdminOverviewClient />
    </Suspense>
  );
}
