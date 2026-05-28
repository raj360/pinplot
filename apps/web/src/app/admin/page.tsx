import { PERMISSIONS } from "@plotpin/shared-types";

export default function AdminPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold">Admin overview</h1>
      <p className="mt-2 text-sm text-muted">
        Manage buildings on behalf of landlords and verify listings. RBAC guard
        wiring — Sprint 2 continuation.
      </p>
      <ul className="mt-6 space-y-2 text-sm">
        <li>
          <code>{PERMISSIONS.BUILDINGS_MANAGE_ON_BEHALF}</code> — create/edit
          any building
        </li>
        <li>
          <code>{PERMISSIONS.ADMIN_MODERATE}</code> — verify before public map
        </li>
      </ul>
    </div>
  );
}
