"use client";

import Link from "next/link";
import { useState } from "react";
import { Menu } from "lucide-react";
import { useRouter } from "next/navigation";
import { MobileNavDrawer } from "@/components/layout/MobileNavDrawer";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth/use-auth";
import { getUserDisplayLabel } from "@/lib/auth/display-name";
import { buildAppNavSections } from "@/lib/navigation/app-nav";

type AppMobileNavProps = {
  /** Highlight which area the user is in — used under admin/landlord shells. */
  activeSectionTitle?: string;
};

export function AppMobileNav({ activeSectionTitle }: AppMobileNavProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const { user, profile, loading, profileLoading, signOut, isAuthenticated } =
    useAuth();

  const displayName = getUserDisplayLabel(user?.email, profile);
  const isAdmin =
    profile?.role === "ADMIN" || profile?.role === "SUPERADMIN";
  const showLandlord = profile?.role === "LANDLORD" || isAdmin;
  const navPending =
    loading || (isAuthenticated && profileLoading && profile === null);

  const sections = buildAppNavSections({
    isAuthenticated,
    showLandlord,
    isAdmin,
  });

  async function handleSignOut() {
    setOpen(false);
    await signOut();
    router.push("/explore");
    router.refresh();
  }

  const footer = navPending ? null : isAuthenticated ? (
    <Button
      type="button"
      variant="outline"
      className="w-full"
      onClick={() => void handleSignOut()}
    >
      Sign out
    </Button>
  ) : (
    <Link
      href="/auth/login"
      className="block w-full border border-primary bg-primary px-4 py-2.5 text-center text-sm font-medium text-primary-foreground"
      onClick={() => setOpen(false)}
    >
      Sign in
    </Link>
  );

  return (
    <>
      <button
        type="button"
        className="inline-flex size-9 items-center justify-center border border-primary-foreground/30 bg-primary-foreground/10 text-primary-foreground md:hidden"
        aria-label="Open navigation menu"
        aria-expanded={open}
        onClick={() => setOpen(true)}
      >
        <Menu className="size-5" aria-hidden />
      </button>

      <MobileNavDrawer
        open={open}
        onClose={() => setOpen(false)}
        title={activeSectionTitle ?? "Menu"}
        subtitle={isAuthenticated ? displayName : "Browse PlotPin"}
        sections={sections}
        footer={footer}
      />
    </>
  );
}
