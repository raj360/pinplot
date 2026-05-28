import Link from "next/link";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen">
      <aside className="w-56 border-r border-border bg-surface p-4">
        <Link href="/" className="font-semibold text-primary">
          PlotPin Admin
        </Link>
        <nav className="mt-6 flex flex-col gap-2 text-sm">
          <Link href="/admin">Overview</Link>
          <Link href="/admin/buildings">Buildings</Link>
          <Link href="/admin/users">Users</Link>
        </nav>
      </aside>
      <div className="flex-1 bg-background p-6">{children}</div>
    </div>
  );
}
