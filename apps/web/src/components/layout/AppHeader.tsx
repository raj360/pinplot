"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { APP_NAME } from "@plotpin/shared-types";
import { useAuth } from "@/lib/auth/use-auth";
import {
  getUserDisplayLabel,
  getUserInitials,
} from "@/lib/auth/display-name";
import { UserMenu } from "@/components/layout/UserMenu";

type AppHeaderProps = {
  /** Match explore layout width (1600px) vs default marketing width. */
  wide?: boolean;
  /** Optional center label (e.g. building detail back nav). */
  centerLabel?: string;
  backHref?: string;
  backLabel?: string;
};

export function AppHeader({
  wide = false,
  centerLabel,
  backHref,
  backLabel,
}: AppHeaderProps) {
  const router = useRouter();
  const { user, profile, loading, signOut, isAuthenticated } = useAuth();

  const initials = getUserInitials(user?.email, profile);
  const displayName = getUserDisplayLabel(user?.email, profile);
  const isAdmin =
    profile?.role === "ADMIN" || profile?.role === "SUPERADMIN";
  const showLandlord =
    profile?.role === "LANDLORD" || isAdmin;

  async function handleSignOut() {
    await signOut();
    router.push("/explore");
    router.refresh();
  }

  const widthClass = wide ? "max-w-[1600px]" : "max-w-7xl";

  return (
    <header className="border-b border-border bg-primary text-primary-foreground">
      <div
        className={`mx-auto flex h-12 ${widthClass} items-center justify-between gap-4 px-4`}
      >
        <div className="flex min-w-0 items-center gap-4">
          {backHref ? (
            <Link href={backHref} className="shrink-0 text-sm hover:underline">
              {backLabel ?? "← Back"}
            </Link>
          ) : null}
          <Link href="/" className="shrink-0 text-base font-semibold tracking-tight">
            {centerLabel ?? APP_NAME}
          </Link>
        </div>

        <nav className="flex shrink-0 items-center gap-3 text-sm">
          <Link href="/explore" className="hover:underline">
            Explore
          </Link>

          {loading ? null : isAuthenticated ? (
            <>
              {showLandlord ? (
                <Link href="/landlord/dashboard" className="hidden hover:underline sm:inline">
                  My buildings
                </Link>
              ) : null}
              {isAdmin ? (
                <Link href="/admin" className="hidden hover:underline sm:inline">
                  Admin
                </Link>
              ) : null}
              <UserMenu
                initials={initials}
                displayName={displayName}
                onSignOut={handleSignOut}
              />
            </>
          ) : !loading ? (
            <Link
              href="/auth/login"
              className="border border-primary-foreground/30 bg-primary-foreground/10 px-2.5 py-1 text-sm"
            >
              Sign in
            </Link>
          ) : null}
        </nav>
      </div>
    </header>
  );
}
