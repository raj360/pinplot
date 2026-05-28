"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { APP_NAME } from "@plotpin/shared-types";
import { useAuth } from "@/lib/auth/use-auth";
import {
  getUserDisplayLabel,
  getUserInitials,
} from "@/lib/auth/display-name";
import {
  headerInnerClass,
  headerSidebarNavClass,
  headerSidebarShellClass,
  sidebarColumnClass,
  type HeaderVariant,
} from "@/lib/layout/shell";
import { UserMenu } from "@/components/layout/UserMenu";

type AppHeaderProps = {
  /** standard = max-w-5xl, wide = explore map, sidebar = admin grid */
  variant?: HeaderVariant;
  centerLabel?: string;
  backHref?: string;
  backLabel?: string;
};

export function AppHeader({
  variant = "standard",
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

  const brand = (
    <div className="flex min-w-0 items-center gap-3">
      {backHref ? (
        <Link href={backHref} className="shrink-0 text-sm hover:underline">
          {backLabel ?? "← Back"}
        </Link>
      ) : null}
      <Link href="/" className="shrink-0 text-base font-semibold tracking-tight">
        {centerLabel ?? APP_NAME}
      </Link>
    </div>
  );

  const nav = (
    <nav className="flex shrink-0 items-center gap-3 text-sm">
      <Link href="/explore" className="hover:underline">
        Explore
      </Link>

      {loading ? null : isAuthenticated ? (
        <>
          {variant !== "sidebar" && showLandlord ? (
            <Link href="/landlord/dashboard" className="hidden hover:underline sm:inline">
              My buildings
            </Link>
          ) : null}
          {variant !== "sidebar" && isAdmin ? (
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
  );

  return (
    <header className="border-b border-border bg-primary text-primary-foreground">
      {variant === "sidebar" ? (
        <div className={headerSidebarShellClass()}>
          <div className={sidebarColumnClass("flex items-center")}>{brand}</div>
          <div className={headerSidebarNavClass()}>{nav}</div>
        </div>
      ) : (
        <div className={headerInnerClass(variant)}>
          {brand}
          {nav}
        </div>
      )}
    </header>
  );
}
