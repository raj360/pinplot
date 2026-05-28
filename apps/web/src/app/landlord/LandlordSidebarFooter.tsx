"use client";

import Link from "next/link";
import { useAuth } from "@/lib/auth/use-auth";

export function LandlordSidebarFooter() {
  const { profile } = useAuth();
  const isAdmin =
    profile?.role === "ADMIN" || profile?.role === "SUPERADMIN";

  if (!isAdmin) {
    return (
      <Link href="/explore" className="text-sm text-muted hover:text-primary">
        Browse map
      </Link>
    );
  }

  return (
    <div className="flex flex-col gap-2 text-sm">
      <Link href="/explore" className="text-muted hover:text-primary">
        Browse map
      </Link>
      <Link href="/admin" className="text-muted hover:text-primary">
        Admin
      </Link>
    </div>
  );
}
