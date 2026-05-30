import { PERMISSIONS } from "@plotpin/shared-types";
import { DashboardSection } from "@/components/layout/DashboardSection";

export default function AdminPage() {
  return (
    <DashboardSection
      title="Admin overview"
      description="Manage buildings on behalf of landlords and verify listings."
    >
      <ul className="space-y-2 text-sm">
        <li className="border border-border bg-surface px-4 py-3">
          <code>{PERMISSIONS.BUILDINGS_MANAGE_ON_BEHALF}</code> — create/edit
          any building
        </li>
        <li className="border border-border bg-surface px-4 py-3">
          <code>{PERMISSIONS.ADMIN_MODERATE}</code> — verify before public map
        </li>
      </ul>
    </DashboardSection>
  );
}
