import Link from "next/link";

export default function AdminUsersPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold">Users</h1>
      <p className="mt-2 text-sm text-muted">
        User management (roles, verification, bans) is planned for a later
        sprint. Promote admins manually in Supabase for now:
      </p>
      <pre className="mt-4 overflow-x-auto border border-border bg-surface p-4 text-xs">
        {`UPDATE profiles SET role = 'ADMIN' WHERE id = 'your-user-uuid';`}
      </pre>
      <Link href="/admin/buildings" className="mt-6 inline-block text-sm text-primary">
        ← Back to verify buildings
      </Link>
    </div>
  );
}
